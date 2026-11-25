import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.database import get_database
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.models.schemas import RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.models.business_config import get_business_config

router = APIRouter(prefix="/auth", tags=["Authentication"])

def is_super_admin_user(user: dict) -> bool:
    if not user:
        return False
    return (
        user.get("is_super_admin") is True
        or user.get("role") == "super_admin"
        or user.get("email", "").lower().strip() == "admin@gmail.com"
    )

@router.post("/register")
def register(payload: RegisterRequest):
    db = get_database()
    email_clean = payload.email.lower().strip()
    
    if db.users.find_one({"email": email_clean}):
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    business_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    # Retrieve business category config
    category_config = get_business_config(payload.business_category)

    # Create Business record
    business_doc = {
        "id": business_id,
        "name": payload.business_name,
        "category": payload.business_category,
        "category_name": category_config["name"],
        "phone": payload.phone,
        "email": email_clean,
        "address": payload.address or "",
        "city": "",
        "state": "",
        "gstin": payload.gstin or "",
        "currency": "₹",
        "created_at": now_iso
    }
    db.businesses.insert_one(business_doc)

    # Initialize Business Settings
    settings_doc = {
        "business_id": business_id,
        "business": {
            "name": payload.business_name,
            "category": payload.business_category,
            "category_name": category_config["name"],
            "tagline": f"Premier {category_config['name']}",
            "logo_url": "",
            "phone": payload.phone,
            "email": email_clean,
            "address": payload.address or "",
            "city": "",
            "state": "",
            "pincode": "",
            "gstin": payload.gstin or "",
            "currency": "₹",
            "timezone": "Asia/Kolkata"
        },
        "billing": {
            "invoice_prefix": "LAX-2026-",
            "next_sequence": 1001,
            "pricing_mode": "inclusive",
            "default_gst_rate": 5.0,
            "default_discount": 0.0,
            "default_paper_size": "80mm",
            "default_payment_method": "Cash",
            "enable_rounding": True,
            "invoice_footer": "Thank you for doing business with us! Visit again."
        },
        "appearance": {
            "theme": "indigo",
            "mode": "light",
            "sidebar_collapsed": False
        },
        "created_at": now_iso
    }
    db.business_settings.insert_one(settings_doc)

    # Create Owner User
    hashed_pwd = get_password_hash(payload.password)
    user_doc = {
        "id": user_id,
        "business_id": business_id,
        "name": payload.name,
        "email": email_clean,
        "phone": payload.phone,
        "hashed_password": hashed_pwd,
        "role": "admin",
        "created_at": now_iso
    }
    db.users.insert_one(user_doc)

    # Generate JWT
    token = create_access_token({"sub": user_id, "business_id": business_id, "role": "admin"})

    business_doc.pop("_id", None)
    user_doc.pop("_id", None)
    user_doc.pop("hashed_password", None)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_doc,
        "business": business_doc,
        "category_config": category_config
    }

@router.post("/login")
def login(payload: LoginRequest, request: Request):
    db = get_database()
    identifier = payload.identifier.strip().lower()
    ip_addr = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "Unknown Browser/App")
    now_iso = datetime.now(timezone.utc).isoformat()

    user = db.users.find_one({"$or": [{"email": identifier}, {"phone": payload.identifier.strip()}]})
    if not user:
        # Record failed login attempt
        db.auth_audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "email": identifier,
            "name": "Unknown",
            "role": "unknown",
            "business_id": "",
            "business_name": "Unknown",
            "business_category": "Unknown",
            "action": "LOGIN_FAILED",
            "status": "FAILED",
            "reason": "Account not found",
            "ip_address": ip_addr,
            "user_agent": ua,
            "timestamp": now_iso
        })
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(payload.password, user.get("hashed_password", "")):
        # Record failed password attempt
        biz = db.businesses.find_one({"id": user.get("business_id", "")}) or {}
        db.auth_audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user.get("id"),
            "email": user.get("email", identifier),
            "name": user.get("name", "Unknown"),
            "role": user.get("role", "staff"),
            "business_id": user.get("business_id", ""),
            "business_name": biz.get("name", "Unknown Business"),
            "business_category": biz.get("category_name", biz.get("category", "General")),
            "action": "LOGIN_FAILED",
            "status": "FAILED",
            "reason": "Incorrect password",
            "ip_address": ip_addr,
            "user_agent": ua,
            "timestamp": now_iso
        })
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    business_id = user.get("business_id", "")
    business = db.businesses.find_one({"id": business_id}) or {}
    category_id = business.get("category", "retail_store")
    category_config = get_business_config(category_id)

    is_super = is_super_admin_user(user)

    token = create_access_token({
        "sub": user["id"],
        "business_id": business_id,
        "role": "super_admin" if is_super else user.get("role", "admin"),
        "is_super_admin": is_super
    })

    # Record successful login audit log
    db.auth_audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user.get("id"),
        "email": user.get("email", identifier),
        "name": user.get("name", ""),
        "role": "super_admin" if is_super else user.get("role", "admin"),
        "business_id": business_id,
        "business_name": business.get("name", "Universal Store"),
        "business_category": business.get("category_name", business.get("category", "General")),
        "action": "LOGIN",
        "status": "SUCCESS",
        "ip_address": ip_addr,
        "user_agent": ua,
        "timestamp": now_iso
    })

    user_clean = dict(user)
    user_clean.pop("_id", None)
    user_clean.pop("hashed_password", None)
    user_clean["is_super_admin"] = is_super
    if is_super:
        user_clean["role"] = "super_admin"

    business_clean = dict(business)
    business_clean.pop("_id", None)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_clean,
        "business": business_clean,
        "category_config": category_config
    }

@router.post("/logout")
def logout(request: Request, current_user: dict = Depends(get_current_user)):
    db = get_database()
    now_iso = datetime.now(timezone.utc).isoformat()
    ip_addr = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "Unknown Browser/App")

    biz = db.businesses.find_one({"id": current_user.get("business_id", "")}) or {}
    is_super = is_super_admin_user(current_user)

    db.auth_audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user.get("id"),
        "email": current_user.get("email"),
        "name": current_user.get("name"),
        "role": "super_admin" if is_super else current_user.get("role", "staff"),
        "business_id": current_user.get("business_id"),
        "business_name": biz.get("name", "Universal Store"),
        "business_category": biz.get("category_name", biz.get("category", "General")),
        "action": "LOGOUT",
        "status": "SUCCESS",
        "ip_address": ip_addr,
        "user_agent": ua,
        "timestamp": now_iso
    })

    return {"message": "Logged out successfully"}

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    db = get_database()
    business = db.businesses.find_one({"id": current_user["business_id"]}) or {}
    business.pop("_id", None)
    category_config = get_business_config(business.get("category", "retail_store"))
    settings = db.business_settings.find_one({"business_id": current_user["business_id"]}) or {}
    settings.pop("_id", None)

    user_clean = dict(current_user)
    is_super = is_super_admin_user(user_clean)
    user_clean["is_super_admin"] = is_super
    if is_super:
        user_clean["role"] = "super_admin"

    return {
        "user": user_clean,
        "business": business,
        "settings": settings,
        "category_config": category_config
    }

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    db = get_database()
    user = db.users.find_one({"email": payload.email.lower().strip()})
    if not user:
        # Don't reveal account existence for security, return mock success token
        return {"message": "If the account exists, a reset instructions token has been generated.", "token": "MOCK-RESET-884920"}

    reset_token = f"RESET-{uuid.uuid4().hex[:6].upper()}"
    db.users.update_one({"id": user["id"]}, {"$set": {"reset_token": reset_token, "reset_token_created_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Password reset token generated successfully.", "token": reset_token}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    db = get_database()
    user = db.users.find_one({"email": payload.email.lower().strip(), "reset_token": payload.token.strip()})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token or email.")

    hashed_pwd = get_password_hash(payload.new_password)
    db.users.update_one({"id": user["id"]}, {"$set": {"hashed_password": hashed_pwd}, "$unset": {"reset_token": "", "reset_token_created_at": ""}})
    return {"message": "Password has been successfully updated. You may now sign in."}

@router.post("/oauth-callback")
def oauth_callback(provider: str, email: str, name: str):
    db = get_database()
    email_clean = email.lower().strip()
    user = db.users.find_one({"email": email_clean})

    if user:
        business = db.businesses.find_one({"id": user["business_id"]}) or {}
        business.pop("_id", None)
        token = create_access_token({"sub": user["id"], "business_id": user["business_id"], "role": user.get("role", "admin")})
        user_clean = dict(user)
        user_clean.pop("_id", None)
        user_clean.pop("hashed_password", None)
        return {"access_token": token, "user": user_clean, "business": business}

    # Register new user via OAuth
    business_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    category_id = "retail_store"
    category_config = get_business_config(category_id)

    business_doc = {
        "id": business_id,
        "name": f"{name}'s Store",
        "category": category_id,
        "category_name": category_config["name"],
        "phone": "",
        "email": email_clean,
        "currency": "₹",
        "created_at": now_iso
    }
    db.businesses.insert_one(business_doc)

    user_doc = {
        "id": user_id,
        "business_id": business_id,
        "name": name,
        "email": email_clean,
        "phone": "",
        "role": "admin",
        "oauth_provider": provider,
        "created_at": now_iso
    }
    db.users.insert_one(user_doc)

    token = create_access_token({"sub": user_id, "business_id": business_id, "role": "admin"})
    user_doc.pop("_id", None)
    business_doc.pop("_id", None)

    return {"access_token": token, "user": user_doc, "business": business_doc, "category_config": category_config}

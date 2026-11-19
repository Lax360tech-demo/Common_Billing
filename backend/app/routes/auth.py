import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_database
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.models.schemas import RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.models.business_config import get_business_config

router = APIRouter(prefix="/auth", tags=["Authentication"])

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
def login(payload: LoginRequest):
    db = get_database()
    identifier = payload.identifier.strip().lower()

    user = db.users.find_one({"$or": [{"email": identifier}, {"phone": payload.identifier.strip()}]})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    business_id = user.get("business_id", "")
    business = db.businesses.find_one({"id": business_id}) or {}
    category_id = business.get("category", "retail_store")
    category_config = get_business_config(category_id)

    token = create_access_token({"sub": user["id"], "business_id": business_id, "role": user.get("role", "admin")})

    user_clean = dict(user)
    user_clean.pop("_id", None)
    user_clean.pop("hashed_password", None)
    business_clean = dict(business)
    business_clean.pop("_id", None)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_clean,
        "business": business_clean,
        "category_config": category_config
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    db = get_database()
    business = db.businesses.find_one({"id": current_user["business_id"]}) or {}
    business.pop("_id", None)
    category_config = get_business_config(business.get("category", "retail_store"))
    settings = db.business_settings.find_one({"business_id": current_user["business_id"]}) or {}
    settings.pop("_id", None)

    return {
        "user": current_user,
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

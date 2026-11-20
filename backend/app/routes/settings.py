import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_database
from app.core.security import get_current_user, get_password_hash
from app.models.schemas import BusinessSettingsUpdateRequest
from app.models.business_config import get_business_config

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
def get_settings(current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    settings_doc = db.business_settings.find_one({"business_id": business_id})
    if not settings_doc:
        business = db.businesses.find_one({"id": business_id}) or {}
        cat_cfg = get_business_config(business.get("category", "retail_store"))
        settings_doc = {
            "business_id": business_id,
            "business": {
                "name": business.get("name", "Lax360 Store"),
                "category": business.get("category", "retail_store"),
                "category_name": cat_cfg["name"],
                "currency": "₹"
            },
            "billing": {
                "invoice_prefix": "LAX-2026-",
                "next_sequence": 1001,
                "pricing_mode": "inclusive",
                "default_gst_rate": 5.0,
                "default_paper_size": "80mm"
            },
            "appearance": {
                "theme": "indigo",
                "mode": "light"
            }
        }
        db.business_settings.insert_one(settings_doc)

    settings_doc.pop("_id", None)
    return settings_doc

@router.put("")
def update_settings(payload: BusinessSettingsUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]

    settings_doc = db.business_settings.find_one({"business_id": business_id}) or {}
    business_part = settings_doc.get("business", {})
    billing_part = settings_doc.get("billing", {})
    appearance_part = settings_doc.get("appearance", {})

    data = payload.model_dump(exclude_unset=True)

    # Business profile updates
    for field in ["business_name", "tagline", "logo_url", "phone", "email", "address", "city", "state", "pincode", "gstin", "currency", "timezone"]:
        if field in data and data[field] is not None:
            clean_field = "name" if field == "business_name" else field
            business_part[clean_field] = data[field]

    # Category update (if user changes business category)
    if "business_category" in data and data["business_category"]:
        cat_cfg = get_business_config(data["business_category"])
        business_part["category"] = data["business_category"]
        business_part["category_name"] = cat_cfg["name"]
        db.businesses.update_one({"id": business_id}, {"$set": {"category": data["business_category"], "category_name": cat_cfg["name"]}})

    # Also update businesses table name
    if "business_name" in data and data["business_name"]:
        db.businesses.update_one({"id": business_id}, {"$set": {"name": data["business_name"]}})

    # Billing updates
    for field in ["invoice_prefix", "next_sequence", "tax_mode", "default_gst_rate", "default_discount", "invoice_footer", "default_paper_size", "default_payment_method"]:
        if field in data and data[field] is not None:
            clean_field = "pricing_mode" if field == "tax_mode" else field
            billing_part[clean_field] = data[field]

    # Appearance updates
    if "theme" in data and data["theme"]:
        appearance_part["theme"] = data["theme"]

    db.business_settings.update_one(
        {"business_id": business_id},
        {
            "$set": {
                "business": business_part,
                "billing": billing_part,
                "appearance": appearance_part,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )

    updated = db.business_settings.find_one({"business_id": business_id})
    updated.pop("_id", None)
    return updated

@router.get("/users")
def list_business_users(current_user: dict = Depends(get_current_user)):
    db = get_database()
    users = list(db.users.find({"business_id": current_user["business_id"]}))
    for u in users:
        u.pop("_id", None)
        u.pop("hashed_password", None)
    return {"users": users}

@router.post("/users")
def add_business_user(user_data: dict, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    email = user_data.get("email", "").lower().strip()
    if db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "business_id": business_id,
        "name": user_data.get("name", "Staff"),
        "email": email,
        "phone": user_data.get("phone", ""),
        "role": user_data.get("role", "cashier"), # admin, manager, cashier
        "hashed_password": get_password_hash(user_data.get("password", "staff123")),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.users.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("hashed_password", None)
    return doc

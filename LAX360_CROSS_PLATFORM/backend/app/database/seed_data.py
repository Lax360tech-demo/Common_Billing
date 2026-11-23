import json
import os
from datetime import datetime, timezone
from app.core.security import get_password_hash

DEFAULT_USER = {
    "_id": "6afe8823f89f056877145cb8",
    "id": "6afe8823f89f056877145cb8",
    "email": "admin@gmail.com",
    "name": "Admin Store Manager",
    "phone": "9876543210",
    "role": "owner",
    "password_hash": get_password_hash("admin"),
    "store_id": "6afe8821f89f056877145cb7",
    "store_name": "Lady Avenue Showroom",
    "created_at": datetime.now(timezone.utc).isoformat()
}

DEFAULT_SETTINGS = {
    "_id": "6afe8823f89f056877145cb9",
    "id": "6afe8823f89f056877145cb9",
    "store_id": "6afe8821f89f056877145cb7",
    "store": {
        "storeName": "Lady Avenue Showroom",
        "tagline": "Authentic Textile & Apparel Store",
        "address": "124, Usman Road, T. Nagar",
        "city": "Salem",
        "state": "Tamil Nadu",
        "stateCode": "33",
        "pincode": "600017",
        "phone": "9876543210",
        "email": "admin@gmail.com",
        "gstin": "33AABCS8899K1ZM",
        "pan": ""
    },
    "billing": {
        "invoicePrefix": "TEX-2026-",
        "nextSequence": 1001,
        "defaultGSTRate": 5.0,
        "pricingMode": "inclusive",
        "defaultPaperSize": "80mm",
        "defaultPaymentMethod": "Cash",
        "enableRounding": True,
        "cashierName": "Admin Manager",
        "enableAutoCoupons": True,
        "autoCouponThreshold": 2000.0,
        "autoCouponDiscount": 100.0,
        "autoCouponMinPurchase": 1000.0,
        "termsAndConditions": "1. Goods once sold can be exchanged within 7 days with original bill.\n2. Cut-length fabrics & pure silk sarees are non-returnable.\nThank you for shopping with us!"
    },
    "appearance": {
        "theme": "default",
        "mode": "light"
    },
    "created_at": datetime.now(timezone.utc).isoformat()
}

DEFAULT_COUPONS = [
    {
        "_id": "cpn-welcome",
        "id": "cpn-welcome",
        "store_id": "6afe8821f89f056877145cb7",
        "code": "SILK10",
        "name": "Silk Welcome Discount",
        "description": "Flat 10% off on all pure silk sarees and apparel.",
        "discount_type": "percent",
        "discount_value": 10.0,
        "min_purchase": 1500.0,
        "min_bill_amount": 1500.0,
        "max_discount": 1000.0,
        "max_discount_amount": 1000.0,
        "start_date": "2026-01-01",
        "expiry_date": "2026-12-31",
        "valid_from": "2026-01-01",
        "valid_until": "2026-12-31",
        "usage_limit": 500,
        "max_uses": 500,
        "times_used": 0,
        "active": True,
        "is_active": True,
        "applicable_categories": ["Sarees", "Men's Ethnic"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "_id": "cpn-festive500",
        "id": "cpn-festive500",
        "store_id": "6afe8821f89f056877145cb7",
        "code": "FESTIVE500",
        "name": "Grand Festive Voucher",
        "description": "Flat ₹500 off on minimum shopping of ₹5,000.",
        "discount_type": "fixed",
        "discount_value": 500.0,
        "min_purchase": 5000.0,
        "min_bill_amount": 5000.0,
        "max_discount": 500.0,
        "max_discount_amount": 500.0,
        "start_date": "2026-01-01",
        "expiry_date": "2026-12-31",
        "valid_from": "2026-01-01",
        "valid_until": "2026-12-31",
        "usage_limit": 200,
        "max_uses": 200,
        "times_used": 0,
        "active": True,
        "is_active": True,
        "applicable_categories": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

DEFAULT_FESTIVALS = [
    {
        "_id": "fest-deepavali",
        "id": "fest-deepavali",
        "store_id": "6afe8821f89f056877145cb7",
        "festival_name": "Deepavali Silk Carnival",
        "description": "Celebrate Deepavali with exclusive festive price reductions across our silk collections.",
        "discount_type": "percent",
        "discount_value": 15.0,
        "min_bill_amount": 3000.0,
        "max_discount": 1500.0,
        "start_date": "2026-10-01",
        "end_date": "2026-11-30",
        "applicable_categories": ["Sarees", "Dhotis & Veshtis", "Salwar Sets"],
        "priority": 1,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

def load_seed_products():
    json_path = os.path.join(os.path.dirname(__file__), "seed_products.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            products = json.load(f)
            for p in products:
                p["store_id"] = "6afe8821f89f056877145cb7"
                p["_id"] = p.get("id")
                if "created_at" not in p:
                    p["created_at"] = datetime.now(timezone.utc).isoformat()
                if "updated_at" not in p:
                    p["updated_at"] = datetime.now(timezone.utc).isoformat()
            return products
    return []

async def seed_initial_data(db_manager):
    users_col = db_manager.get_collection("users")
    settings_col = db_manager.get_collection("settings")
    products_col = db_manager.get_collection("products")
    coupons_col = db_manager.get_collection("coupons")
    festivals_col = db_manager.get_collection("festival_offers")

    # Check user
    admin_user = await users_col.find_one({"email": "admin@gmail.com"})
    if not admin_user:
        await users_col.insert_one(DEFAULT_USER)
        print("[Seed] Created default admin user (admin@gmail.com / admin)")

    # Check settings
    current_settings = await settings_col.find_one({"store_id": "6afe8821f89f056877145cb7"})
    if not current_settings:
        await settings_col.insert_one(DEFAULT_SETTINGS)
        print("[Seed] Created default store settings")

    # Check products
    prod_count = await products_col.count_documents({"store_id": "6afe8821f89f056877145cb7"})
    if prod_count == 0:
        seed_prods = load_seed_products()
        for p in seed_prods:
            await products_col.insert_one(p)
        print(f"[Seed] Loaded {len(seed_prods)} authentic textile products into catalog")

    # Check coupons
    coupon_count = await coupons_col.count_documents({"store_id": "6afe8821f89f056877145cb7"})
    if coupon_count == 0:
        for c in DEFAULT_COUPONS:
            await coupons_col.insert_one(c)
        print(f"[Seed] Loaded initial promotional coupons")

    # Check festival offers
    fest_count = await festivals_col.count_documents({"store_id": "6afe8821f89f056877145cb7"})
    if fest_count == 0:
        for f in DEFAULT_FESTIVALS:
            await festivals_col.insert_one(f)
        print(f"[Seed] Loaded initial festival promotional campaigns")

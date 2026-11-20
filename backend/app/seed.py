import logging
import uuid
from datetime import datetime, timezone, timedelta
from app.core.database import get_database
from app.core.security import get_password_hash
from app.models.business_config import get_business_config

logger = logging.getLogger("lax360.seed")

def seed_database():
    db = get_database()
    admin_email = "admin@gmail.com"

    existing_user = db.users.find_one({"email": admin_email})
    if existing_user:
        logger.info("Admin user already exists. Seeding skipped.")
        return

    logger.info("Seeding initial Lax360 demo business, admin user, catalog, and transactions...")
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    business_id = "lax360-default-business-001"
    admin_user_id = "lax360-admin-user-001"

    category_id = "retail_store"
    cat_cfg = get_business_config(category_id)

    # 1. Create Business
    db.businesses.insert_one({
        "id": business_id,
        "name": "Lax360 Enterprise Store",
        "category": category_id,
        "category_name": cat_cfg["name"],
        "phone": "+91 98765 43210",
        "email": admin_email,
        "address": "42, Tech Park Boulevard, Sector 5",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560100",
        "gstin": "29AABCL3601K1ZM",
        "currency": "₹",
        "created_at": now_iso
    })

    # 2. Create Business Settings
    db.business_settings.insert_one({
        "business_id": business_id,
        "business": {
            "name": "Lax360 Enterprise Store",
            "category": category_id,
            "category_name": cat_cfg["name"],
            "tagline": "Universal POS & Retail Management",
            "logo_url": "",
            "phone": "+91 98765 43210",
            "email": admin_email,
            "address": "42, Tech Park Boulevard, Sector 5",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560100",
            "gstin": "29AABCL3601K1ZM",
            "currency": "₹",
            "timezone": "Asia/Kolkata"
        },
        "billing": {
            "invoice_prefix": "LAX-2026-",
            "next_sequence": 1001,
            "pricing_mode": "inclusive",
            "default_gst_rate": 18.0,
            "default_discount": 0.0,
            "default_paper_size": "80mm",
            "default_payment_method": "Cash",
            "enable_rounding": True,
            "invoice_footer": "Thank you for shopping with Lax360 Billing! For warranty & support, visit lax360.com."
        },
        "appearance": {
            "theme": "indigo",
            "mode": "light",
            "sidebar_collapsed": False
        },
        "created_at": now_iso
    })

    # 3. Create Admin User
    db.users.insert_one({
        "id": admin_user_id,
        "business_id": business_id,
        "name": "Lax360 Admin",
        "email": admin_email,
        "phone": "+91 98765 43210",
        "hashed_password": get_password_hash("admin"),
        "role": "admin",
        "created_at": now_iso
    })

    # 4. Seed Diverse Universal Products
    demo_products = [
        {
            "id": "prod-101",
            "business_id": business_id,
            "name": "Wireless Bluetooth Ergonomic Mouse",
            "code": "PRD-1001",
            "barcode": "8901001001",
            "category": "Electronics & Gadgets",
            "brand": "LogiPro",
            "description": "Rechargeable multi-device Bluetooth mouse with silent clicks",
            "purchase_price": 650.0,
            "selling_price": 1299.0,
            "mrp": 1599.0,
            "tax_rate": 18.0,
            "unit": "pcs",
            "stock": 45.0,
            "min_stock_level": 8.0,
            "hsn": "8471",
            "attributes": {"brand": "LogiPro", "model": "M350 Silent", "color": "Graphite Grey"},
            "created_at": now_iso
        },
        {
            "id": "prod-102",
            "business_id": business_id,
            "name": "Fast Charger 65W GaN Dual Port",
            "code": "PRD-1002",
            "barcode": "8901001002",
            "category": "Electronics & Gadgets",
            "brand": "AnkerTech",
            "description": "Type-C Power Delivery 65W ultra-compact laptop & phone charger",
            "purchase_price": 950.0,
            "selling_price": 1899.0,
            "mrp": 2499.0,
            "tax_rate": 18.0,
            "unit": "pcs",
            "stock": 30.0,
            "min_stock_level": 5.0,
            "hsn": "8504",
            "attributes": {"brand": "AnkerTech", "model": "GaN-65", "color": "Arctic White"},
            "created_at": now_iso
        },
        {
            "id": "prod-103",
            "business_id": business_id,
            "name": "Organic Roasted Almonds 500g Pack",
            "code": "PRD-1003",
            "barcode": "8901001003",
            "category": "Grocery & Pantry",
            "brand": "Naturals",
            "description": "California premium jumbo roasted and lightly salted almonds",
            "purchase_price": 380.0,
            "selling_price": 549.0,
            "mrp": 650.0,
            "tax_rate": 5.0,
            "unit": "pack",
            "stock": 80.0,
            "min_stock_level": 15.0,
            "hsn": "0802",
            "attributes": {"net_weight": "500g", "batch_number": "NAT-990", "expiry_date": "2027-12-31"},
            "created_at": now_iso
        },
        {
            "id": "prod-104",
            "business_id": business_id,
            "name": "Premium Cotton Oxford Casual Shirt",
            "code": "PRD-1004",
            "barcode": "8901001004",
            "category": "Apparel & Fashion",
            "brand": "LaxStyle",
            "description": "100% Breathable combed cotton slim-fit button-down casual shirt",
            "purchase_price": 600.0,
            "selling_price": 1499.0,
            "mrp": 1999.0,
            "tax_rate": 5.0,
            "unit": "pcs",
            "stock": 28.0,
            "min_stock_level": 6.0,
            "hsn": "6205",
            "attributes": {"size": "L (40)", "color": "Sky Blue", "fabric": "100% Oxford Cotton"},
            "created_at": now_iso
        },
        {
            "id": "prod-105",
            "business_id": business_id,
            "name": "Hardbound Executive Journal Notebook (200 Pgs)",
            "code": "PRD-1005",
            "barcode": "8901001005",
            "category": "Stationery & Office",
            "brand": "Classica",
            "description": "A5 ruled notebook with ribbon marker and expandable pocket",
            "purchase_price": 110.0,
            "selling_price": 299.0,
            "mrp": 399.0,
            "tax_rate": 12.0,
            "unit": "pcs",
            "stock": 55.0,
            "min_stock_level": 10.0,
            "hsn": "4820",
            "attributes": {"brand": "Classica", "grade": "100 GSM Ivory Paper"},
            "created_at": now_iso
        },
        {
            "id": "prod-106",
            "business_id": business_id,
            "name": "Stainless Steel Thermal Water Flask 1L",
            "code": "PRD-1006",
            "barcode": "8901001006",
            "category": "Home & Kitchen",
            "brand": "ThermaPro",
            "description": "Double-wall vacuum insulated flask, keeps hot 18h & cold 24h",
            "purchase_price": 420.0,
            "selling_price": 899.0,
            "mrp": 1199.0,
            "tax_rate": 18.0,
            "unit": "pcs",
            "stock": 4.0, # Low stock alert trigger
            "min_stock_level": 10.0,
            "hsn": "7323",
            "attributes": {"brand": "ThermaPro", "color": "Matte Black", "model": "TP-1000"},
            "created_at": now_iso
        }
    ]
    db.products.insert_many(demo_products)

    # 5. Seed Customers
    demo_customers = [
        {
            "id": "cust-201",
            "business_id": business_id,
            "name": "Rahul Sharma",
            "phone": "9845012345",
            "email": "rahul.sharma@example.com",
            "address": "Flat 302, Green Glen Layout, Bellandur, Bengaluru",
            "gstin": "29ABCDE1234F1Z5",
            "total_purchases": 5496.0,
            "outstanding_balance": 0.0,
            "last_visit": now.strftime("%Y-%m-%d"),
            "created_at": now_iso
        },
        {
            "id": "cust-202",
            "business_id": business_id,
            "name": "Priya Nair",
            "phone": "9900112233",
            "email": "priya.nair@example.com",
            "address": "18, 4th Cross, Koramangala 4th Block, Bengaluru",
            "gstin": "",
            "total_purchases": 2798.0,
            "outstanding_balance": 500.0,
            "last_visit": (now - timedelta(days=2)).strftime("%Y-%m-%d"),
            "created_at": now_iso
        }
    ]
    db.customers.insert_many(demo_customers)

    # 6. Seed Suppliers
    demo_suppliers = [
        {
            "id": "sup-301",
            "business_id": business_id,
            "name": "Apex Wholesale Distributors Pvt Ltd",
            "contact_person": "Vikas Malhotra",
            "phone": "9123456780",
            "email": "orders@apexdistributors.com",
            "address": "Plot 88, Peenya Industrial Area 2nd Stage, Bengaluru",
            "gstin": "29AAACA9988P1Z8",
            "total_purchases": 45000.0,
            "outstanding_payables": 12500.0,
            "last_purchase_date": (now - timedelta(days=5)).strftime("%Y-%m-%d"),
            "created_at": now_iso
        },
        {
            "id": "sup-302",
            "business_id": business_id,
            "name": "Sunburst Consumer Products Corp",
            "contact_person": "Anita Joseph",
            "phone": "9887766554",
            "email": "sales@sunburstcorp.in",
            "address": "22, Wholesale Market Complex, Yeshwanthpur, Bengaluru",
            "gstin": "29BBAAA1122Q1ZV",
            "total_purchases": 32000.0,
            "outstanding_payables": 0.0,
            "last_purchase_date": (now - timedelta(days=12)).strftime("%Y-%m-%d"),
            "created_at": now_iso
        }
    ]
    db.suppliers.insert_many(demo_suppliers)

    # 7. Seed Purchases
    po_doc = {
        "id": "po-401",
        "business_id": business_id,
        "purchase_number": "PO-2026-0001",
        "supplier_id": "sup-301",
        "supplier_name": "Apex Wholesale Distributors Pvt Ltd",
        "supplier_invoice_no": "INV-APEX-8901",
        "purchase_date": (now - timedelta(days=5)).strftime("%Y-%m-%d"),
        "items": [
            {
                "product_id": "prod-101",
                "name": "Wireless Bluetooth Ergonomic Mouse",
                "quantity": 25.0,
                "unit": "pcs",
                "unit_cost": 650.0,
                "tax_rate": 18.0,
                "tax_amount": 2925.0,
                "line_total": 19175.0
            },
            {
                "product_id": "prod-102",
                "name": "Fast Charger 65W GaN Dual Port",
                "quantity": 15.0,
                "unit": "pcs",
                "unit_cost": 950.0,
                "tax_rate": 18.0,
                "tax_amount": 2565.0,
                "line_total": 16815.0
            }
        ],
        "taxable_amount": 30500.0,
        "tax_amount": 5490.0,
        "total_amount": 35990.0,
        "paid_amount": 23490.0,
        "balance_due": 12500.0,
        "payment_method": "Bank Transfer",
        "payment_status": "Partial",
        "notes": "Delivered in good condition via SafeExpress cargo",
        "created_at": (now - timedelta(days=5)).isoformat()
    }
    db.purchases.insert_one(po_doc)

    # 8. Seed Expenses
    demo_expenses = [
        {
            "id": "exp-501",
            "business_id": business_id,
            "category": "Rent",
            "description": "Store Monthly Commercial Lease",
            "amount": 25000.0,
            "date": now.strftime("%Y-%m-01"),
            "payment_method": "Bank Transfer",
            "reference": "TXN-RENT-FEB26",
            "created_by": "Lax360 Admin",
            "created_at": now_iso
        },
        {
            "id": "exp-502",
            "business_id": business_id,
            "category": "Utilities",
            "description": "Electricity & High-speed Broadband",
            "amount": 4200.0,
            "date": (now - timedelta(days=4)).strftime("%Y-%m-%d"),
            "payment_method": "UPI",
            "reference": "BESCOM-99218",
            "created_by": "Lax360 Admin",
            "created_at": now_iso
        }
    ]
    db.expenses.insert_many(demo_expenses)

    # 9. Seed Invoices for Dashboard Trends
    demo_invoices = [
        {
            "id": "inv-601",
            "business_id": business_id,
            "invoice_number": "LAX-2026-1001",
            "date": now.strftime("%Y-%m-%d"),
            "time": "11:20:45",
            "cashier_name": "Lax360 Admin",
            "business_info": {
                "name": "Lax360 Enterprise Store",
                "category": "Retail Store",
                "address": "42, Tech Park Boulevard, Sector 5",
                "phone": "+91 98765 43210",
                "gstin": "29AABCL3601K1ZM",
                "currency": "₹"
            },
            "customer": {
                "name": "Rahul Sharma",
                "phone": "9845012345",
                "gstin": "29ABCDE1234F1Z5",
                "address": "Flat 302, Green Glen Layout, Bengaluru"
            },
            "items": [
                {
                    "product_id": "prod-101",
                    "name": "Wireless Bluetooth Ergonomic Mouse",
                    "code": "PRD-1001",
                    "unit": "pcs",
                    "quantity": 2.0,
                    "unit_price": 1299.0,
                    "discount_percent": 0.0,
                    "discount_amount": 0.0,
                    "tax_rate": 18.0,
                    "taxable_amount": 2201.69,
                    "tax_amount": 396.31,
                    "cgst": 198.15,
                    "sgst": 198.15,
                    "igst": 0.0,
                    "line_total": 2598.0
                },
                {
                    "product_id": "prod-103",
                    "name": "Organic Roasted Almonds 500g Pack",
                    "code": "PRD-1003",
                    "unit": "pack",
                    "quantity": 1.0,
                    "unit_price": 549.0,
                    "discount_percent": 0.0,
                    "discount_amount": 0.0,
                    "tax_rate": 5.0,
                    "taxable_amount": 522.86,
                    "tax_amount": 26.14,
                    "cgst": 13.07,
                    "sgst": 13.07,
                    "igst": 0.0,
                    "line_total": 549.0
                }
            ],
            "item_count": 2,
            "total_quantity": 3.0,
            "subtotal": 2724.55,
            "tax_amount": 422.45,
            "cgst": 211.22,
            "sgst": 211.22,
            "igst": 0.0,
            "discount_amount": 0.0,
            "round_off": 0.0,
            "grand_total": 3147.0,
            "paid_amount": 3147.0,
            "balance_due": 0.0,
            "payment_method": "UPI",
            "payment_status": "Paid",
            "status": "completed",
            "notes": "Thank you for visiting!",
            "created_at": now.isoformat()
        },
        {
            "id": "inv-602",
            "business_id": business_id,
            "invoice_number": "LAX-2026-1002",
            "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
            "time": "15:40:12",
            "cashier_name": "Lax360 Admin",
            "business_info": {
                "name": "Lax360 Enterprise Store",
                "category": "Retail Store",
                "address": "42, Tech Park Boulevard, Sector 5",
                "phone": "+91 98765 43210",
                "gstin": "29AABCL3601K1ZM",
                "currency": "₹"
            },
            "customer": {
                "name": "Priya Nair",
                "phone": "9900112233",
                "gstin": "",
                "address": "18, 4th Cross, Koramangala 4th Block, Bengaluru"
            },
            "items": [
                {
                    "product_id": "prod-104",
                    "name": "Premium Cotton Oxford Casual Shirt",
                    "code": "PRD-1004",
                    "unit": "pcs",
                    "quantity": 1.0,
                    "unit_price": 1499.0,
                    "discount_percent": 0.0,
                    "discount_amount": 0.0,
                    "tax_rate": 5.0,
                    "taxable_amount": 1427.62,
                    "tax_amount": 71.38,
                    "cgst": 35.69,
                    "sgst": 35.69,
                    "igst": 0.0,
                    "line_total": 1499.0
                },
                {
                    "product_id": "prod-105",
                    "name": "Hardbound Executive Journal Notebook (200 Pgs)",
                    "code": "PRD-1005",
                    "unit": "pcs",
                    "quantity": 2.0,
                    "unit_price": 299.0,
                    "discount_percent": 0.0,
                    "discount_amount": 0.0,
                    "tax_rate": 12.0,
                    "taxable_amount": 533.93,
                    "tax_amount": 64.07,
                    "cgst": 32.04,
                    "sgst": 32.04,
                    "igst": 0.0,
                    "line_total": 598.0
                }
            ],
            "item_count": 2,
            "total_quantity": 3.0,
            "subtotal": 1961.55,
            "tax_amount": 135.45,
            "cgst": 67.73,
            "sgst": 67.73,
            "igst": 0.0,
            "discount_amount": 0.0,
            "round_off": 0.0,
            "grand_total": 2097.0,
            "paid_amount": 1597.0,
            "balance_due": 500.0,
            "payment_method": "Cash",
            "payment_status": "Partial",
            "status": "completed",
            "notes": "Balance ₹500 to be settled on next visit",
            "created_at": (now - timedelta(days=1)).isoformat()
        }
    ]
    db.invoices.insert_many(demo_invoices)

    logger.info("Database seeding completed successfully.")

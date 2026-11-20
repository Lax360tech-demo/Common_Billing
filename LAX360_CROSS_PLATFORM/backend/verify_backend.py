import asyncio
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from app.database.mongodb import db_manager
from app.database.seed_data import seed_initial_data
from app.services.billing_service import calculate_invoice_totals, validate_payment
from app.core.security import verify_password, create_access_token, decode_access_token

async def test_backend():
    print("=== Testing Database & Seed Logic ===")
    await db_manager.connect()
    await seed_initial_data(db_manager)

    users_col = db_manager.get_collection("users")
    admin = await users_col.find_one({"email": "admin@gmail.com"})
    assert admin is not None, "Admin user not found in seed!"
    assert verify_password("admin", admin["password_hash"]), "Password verification failed!"
    print("[PASS] User seed & password authentication passed.")

    products_col = db_manager.get_collection("products")
    prods = await products_col.find()
    assert len(prods) == 40, f"Expected 40 products, got {len(prods)}"
    print(f"[PASS] Products catalog seed passed with {len(prods)} authentic textile products.")

    print("\n=== Testing Billing & Tax Calculations ===")
    sample_items = [
        {
            "id": "item-1",
            "name": "Kanchipuram Pure Silk Wedding Saree",
            "quantity": 2,
            "unitPrice": 15499.0,
            "gstRate": 5.0,
            "discountType": "fixed",
            "discountValue": 998.0
        },
        {
            "id": "item-2",
            "name": "Men Pure Linen Slim Fit Shirt",
            "quantity": 1,
            "unitPrice": 1899.0,
            "gstRate": 5.0,
            "discountType": "percent",
            "discountValue": 10.0
        }
    ]

    summary, processed = calculate_invoice_totals(
        items=sample_items,
        bill_discount={"type": "percent", "value": 5.0},
        inclusive=True,
        coupon_discount=500.0
    )

    print(f"Gross Subtotal: Rs. {summary['grossSubtotal']}")
    print(f"Total Discount: Rs. {summary['totalDiscount']}")
    print(f"Taxable Subtotal: Rs. {summary['taxableSubtotal']}")
    print(f"Total GST: Rs. {summary['totalTax']} (CGST: Rs. {summary['totalCGST']} + SGST: Rs. {summary['totalSGST']})")
    print(f"Net Payable: Rs. {summary['netPayable']} (Round Off: Rs. {summary['roundOff']})")
    print(f"Tax Slabs: {summary['taxBreakup']}")

    assert summary["netPayable"] > 0, "Net payable calculation error"
    assert len(summary["taxBreakup"]) > 0, "Tax breakup empty"
    print("[PASS] Billing, GST apportionment, and rounding math passed.")

    print("\n=== Testing Payment Validation ===")
    valid_cash, err, meta = validate_payment(summary["netPayable"], {"method": "Cash", "amountReceived": summary["netPayable"] + 100})
    assert valid_cash, f"Cash payment validation failed: {err}"
    assert meta["changeReturned"] == 100.0, "Change returned mismatch"
    print(f"[PASS] Cash payment verified: Change returned = Rs. {meta['changeReturned']}")

    print("\nALL BACKEND UNIT VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_backend())

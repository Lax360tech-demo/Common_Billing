import asyncio
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_e2e_test():
    print("==================================================")
    print("  LAX360 COMPREHENSIVE END-TO-END TEST SUITE")
    print("==================================================")

    # 1. Healthcheck
    res = client.get("/api/health")
    assert res.status_code == 200, f"Healthcheck failed: {res.text}"
    print(f"[1/8] Healthcheck: PASS (Status {res.status_code}, {res.json()['service']})")

    # 2. Login
    res = client.post("/api/v1/auth/login", json={"identifier": "admin@gmail.com", "password": "admin"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_data = res.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[2/8] Authentication: PASS (Token issued for '{token_data['user']['name']}')")

    # 3. Product Catalog
    res = client.get("/api/v1/products", headers=headers)
    assert res.status_code == 200, f"Get products failed: {res.text}"
    prods = res.json()
    assert len(prods) == 40, f"Expected 40 products, got {len(prods)}"
    print(f"[3/8] Product Catalog: PASS ({len(prods)} authentic textile products loaded)")

    # 4. Settings
    res = client.get("/api/v1/settings", headers=headers)
    assert res.status_code == 200, f"Get settings failed: {res.text}"
    settings = res.json()
    assert settings["store"]["storeName"] == "Lady Avenue Showroom", "Store name mismatch"
    print(f"[4/8] Store Profile & Billing Config: PASS (Store: '{settings['store']['storeName']}')")

    # 5. Customer Creation
    res = client.post(
        "/api/v1/customers",
        headers=headers,
        json={"name": "Kavitha Raman", "phone": "9841234567", "city": "Salem", "state": "Tamil Nadu"}
    )
    assert res.status_code == 200, f"Create customer failed: {res.text}"
    customer = res.json()
    print(f"[5/8] Customer Directory: PASS (Registered '{customer['name']}', Phone: {customer['phone']})")

    # 6. Invoice Creation with GST & Loyalty Auto-Coupon
    invoice_payload = {
        "customer": customer,
        "items": [
            {
                "id": "item-silk",
                "productId": prods[0]["id"],
                "name": prods[0]["name"],
                "size": "Free Size",
                "color": "Maroon Gold",
                "quantity": 1,
                "unitPrice": prods[0]["price"],
                "gstRate": 5.0,
                "discountType": "fixed",
                "discountValue": 0.0
            }
        ],
        "billDiscount": {"type": "fixed", "value": 0.0},
        "coupon_code": "SILK10",
        "payment": {
            "method": "Cash",
            "amountReceived": 20000.0
        },
        "notes": "Wedding gift purchase"
    }

    res = client.post("/api/v1/invoices", headers=headers, json=invoice_payload)
    assert res.status_code == 200, f"Create invoice failed: {res.text}"
    invoice = res.json()
    inv_num = invoice["invoiceNumber"]
    net = invoice["summary"]["netPayable"]
    cgst = invoice["summary"]["totalCGST"]
    sgst = invoice["summary"]["totalSGST"]
    change = invoice["payment"]["changeReturned"]
    has_auto_coupon = invoice.get("generated_coupon") is not None

    print(f"[6/8] POS Invoice Creation: PASS")
    print(f"      Invoice #: {inv_num}")
    print(f"      Net Payable: Rs. {net}")
    print(f"      CGST: Rs. {cgst} | SGST: Rs. {sgst}")
    print(f"      Change Returned: Rs. {change}")
    print(f"      Loyalty Auto-Coupon Generated: {has_auto_coupon}")

    # 7. Dashboard Metrics
    res = client.get("/api/v1/dashboard/metrics", headers=headers)
    assert res.status_code == 200, f"Dashboard metrics failed: {res.text}"
    metrics = res.json()
    assert metrics["todaySales"] >= net, "Today sales calculation error"
    print(f"[7/8] Overview Dashboard Metrics: PASS (Today Net: Rs. {metrics['todaySales']}, Bills: {metrics['todayInvoiceCount']})")

    # 8. Sales & GST Tax Reports
    res = client.get("/api/v1/reports/sales?period=today", headers=headers)
    assert res.status_code == 200, f"Sales report failed: {res.text}"
    report = res.json()
    assert len(report["gstBreakdown"]) > 0, "No GST slabs in report"
    print(f"[8/8] Sales & GST Reports: PASS (Taxable Turnover: Rs. {report['taxableSubtotal']}, GST: Rs. {report['totalTax']})")

    print("\n==================================================")
    print("  ALL 8 MODULES PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_test()

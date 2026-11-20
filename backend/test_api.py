import sys
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import db_manager
from app.seed import seed_database

class TestLax360Backend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        db_manager.connect()
        # Ensure default seed data is populated
        try:
            seed_database()
        except Exception as e:
            print("Seed note:", e)

        cls.client = TestClient(app)
        # Login admin once to populate auth_headers for all tests
        login_res = cls.client.post("/auth/login", json={"identifier": "admin@gmail.com", "password": "admin"})
        if login_res.status_code == 200:
            token = login_res.json()["access_token"]
            cls.auth_headers = {"Authorization": f"Bearer {token}"}
        else:
            cls.auth_headers = {}

    def test_01_root_and_health(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["app"], "Lax360 Billing")
        print("[PASS] Root endpoint OK")

    def test_02_business_categories(self):
        res = self.client.get("/business-categories")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        categories = data.get("categories", [])
        self.assertGreaterEqual(len(categories), 15)
        cat_ids = [c["id"] for c in categories]
        self.assertIn("retail_store", cat_ids)
        self.assertIn("supermarket", cat_ids)
        self.assertIn("grocery_store", cat_ids)
        self.assertIn("textile_clothing", cat_ids)
        self.assertIn("electronics_store", cat_ids)
        self.assertIn("hardware_store", cat_ids)
        self.assertIn("medical_pharmacy", cat_ids)
        self.assertIn("restaurant_cafe", cat_ids)
        self.assertIn("wholesale_business", cat_ids)
        self.assertIn("mobile_accessories", cat_ids)
        self.assertIn("stationery_shop", cat_ids)
        self.assertIn("footwear_store", cat_ids)
        self.assertIn("jewellery_store", cat_ids)
        self.assertIn("general_trading", cat_ids)
        self.assertIn("other_business", cat_ids)
        print("[PASS] All 15 Business Categories Verified")

    def test_03_login_default_admin(self):
        res = self.client.post("/auth/login", json={"identifier": "admin@gmail.com", "password": "admin"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "admin@gmail.com")
        print("[PASS] Admin Login & Token generation OK")

    def test_04_register_new_business(self):
        import uuid
        test_email = f"pharmacy_{uuid.uuid4().hex[:6]}@lax360test.com"
        reg_payload = {
            "name": "Dr. Sharma",
            "email": test_email,
            "phone": "9988776655",
            "password": "pass1234",
            "business_name": "Lax360 Care Pharmacy",
            "business_category": "medical_pharmacy",
            "address": "12, Health Plaza, MG Road",
            "gstin": "29AABCU9922K1ZM"
        }
        res = self.client.post("/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["business"]["category"], "medical_pharmacy")
        self.assertEqual(data["category_config"]["id"], "medical_pharmacy")
        print("[PASS] Registration with Category Configuration OK")

    def test_05_dashboard_metrics(self):
        res = self.client.get("/dashboard/metrics?period=all", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_sales", data)
        self.assertIn("sales_trend", data)
        self.assertIn("payment_breakdown", data)
        print(f"[PASS] Dashboard Metrics OK (Total Sales: Rs.{data['total_sales']})")

    def test_06_products_crud_and_barcode(self):
        prod_payload = {
            "name": "Wireless Mechanical Gaming Keyboard",
            "category": "Electronics & Gadgets",
            "brand": "RazerTech",
            "purchase_price": 2200.0,
            "selling_price": 4499.0,
            "tax_rate": 18.0,
            "unit": "pcs",
            "stock": 20.0,
            "min_stock_level": 5.0,
            "attributes": {"brand": "RazerTech", "model": "BlackWidow V4", "color": "Chroma RGB"}
        }
        create_res = self.client.post("/products", json=prod_payload, headers=self.auth_headers)
        self.assertEqual(create_res.status_code, 200)
        prod = create_res.json()
        self.assertIn("barcode", prod)
        TestLax360Backend.created_product_id = prod["id"]

        lookup_res = self.client.get(f"/products/barcode/{prod['barcode']}", headers=self.auth_headers)
        self.assertEqual(lookup_res.status_code, 200)
        self.assertEqual(lookup_res.json()["name"], prod["name"])
        print("[PASS] Product Creation and Barcode Lookup OK")

    def test_07_purchase_entry_auto_stock_replenishment(self):
        p_res = self.client.get(f"/products/{self.created_product_id}", headers=self.auth_headers)
        initial_stock = p_res.json()["stock"]

        sup_res = self.client.get("/suppliers", headers=self.auth_headers)
        suppliers = sup_res.json()["items"]
        self.assertGreater(len(suppliers), 0)
        supplier_id = suppliers[0]["id"]

        po_payload = {
            "supplier_id": supplier_id,
            "supplier_invoice_no": "TEST-PO-881",
            "purchase_date": "2026-11-18",
            "items": [
                {
                    "product_id": self.created_product_id,
                    "name": "Wireless Mechanical Gaming Keyboard",
                    "quantity": 10.0,
                    "unit_cost": 2100.0,
                    "tax_rate": 18.0,
                    "unit": "pcs"
                }
            ],
            "paid_amount": 20000.0,
            "payment_method": "Bank Transfer"
        }
        po_res = self.client.post("/purchases", json=po_payload, headers=self.auth_headers)
        self.assertEqual(po_res.status_code, 200)

        updated_p_res = self.client.get(f"/products/{self.created_product_id}", headers=self.auth_headers)
        new_stock = updated_p_res.json()["stock"]
        self.assertEqual(new_stock, initial_stock + 10.0)
        print(f"[PASS] Purchase Inward Auto-Stock Increment OK ({initial_stock} -> {new_stock})")

    def test_08_invoice_creation_auto_stock_decrement(self):
        p_res = self.client.get(f"/products/{self.created_product_id}", headers=self.auth_headers)
        stock_before_sale = p_res.json()["stock"]

        sale_payload = {
            "customer": {
                "name": "Kiran Kumar",
                "phone": "9811223344",
                "address": "Jayanagar 4th Block, Bengaluru"
            },
            "items": [
                {
                    "product_id": self.created_product_id,
                    "name": "Wireless Mechanical Gaming Keyboard",
                    "unit": "pcs",
                    "unit_price": 4499.0,
                    "quantity": 2.0,
                    "discount_percent": 5.0,
                    "tax_rate": 18.0
                }
            ],
            "pricing_mode": "inclusive",
            "paid_amount": 8548.10,
            "payment_method": "UPI"
        }
        inv_res = self.client.post("/invoices", json=sale_payload, headers=self.auth_headers)
        self.assertEqual(inv_res.status_code, 200)
        inv = inv_res.json()
        self.assertIn("invoice_number", inv)
        self.assertTrue(inv["invoice_number"].startswith("LAX-2026-"))
        self.assertEqual(inv["payment_status"], "Paid")

        updated_p_res = self.client.get(f"/products/{self.created_product_id}", headers=self.auth_headers)
        stock_after_sale = updated_p_res.json()["stock"]
        self.assertEqual(stock_after_sale, stock_before_sale - 2.0)
        print(f"[PASS] POS Invoice Generation & Auto-Stock Decrement OK ({stock_before_sale} -> {stock_after_sale})")

    def test_09_reports_and_excel_export(self):
        rep_res = self.client.get("/reports/summary?period=month", headers=self.auth_headers)
        self.assertEqual(rep_res.status_code, 200)
        data = rep_res.json()
        self.assertIn("sales", data)
        self.assertIn("profit_and_loss", data)
        self.assertIn("gst_summary", data)

        excel_res = self.client.get("/reports/export/excel", headers=self.auth_headers)
        self.assertEqual(excel_res.status_code, 200)
        self.assertIn(b"PK", excel_res.content[:10])
        print("[PASS] Reports Summary and Excel Export (.xlsx) OK")

    def test_10_settings_update(self):
        settings_res = self.client.get("/settings", headers=self.auth_headers)
        self.assertEqual(settings_res.status_code, 200)

        update_payload = {
            "business_name": "Lax360 Supermarket & Retail",
            "theme": "emerald",
            "invoice_prefix": "LAX-2026-"
        }
        put_res = self.client.put("/settings", json=update_payload, headers=self.auth_headers)
        self.assertEqual(put_res.status_code, 200)
        updated_data = put_res.json()
        self.assertEqual(updated_data["business"]["name"], "Lax360 Supermarket & Retail")
        self.assertEqual(updated_data["appearance"]["theme"], "emerald")
        print("[PASS] Settings and Theme Configuration OK")

if __name__ == "__main__":
    unittest.main()

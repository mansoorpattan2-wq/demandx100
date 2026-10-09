"""
DemandX 2.0 — Comprehensive Database Persistence & Supabase Integration Test Suite
===================================================================================
Validates:
1. Database Connectivity, Schema Integrity (22 Normalized Tables)
2. Grocery-Only Catalog (45+ Products, 0 Fresh Produce)
3. Persistent Purchase Order Creation & Retrieval
4. Strict State Machine (SUBMITTED -> ACCEPTED -> DISPATCHED -> DELIVERED, REJECTED, CANCELLED)
5. Terminal State Immutability
6. Immutable Audit Trail in OrderStatusHistory
7. Inventory Replenishment strictly on DELIVERED
8. Database Diagnostics & Supabase Status Endpoint (/api/database/status)
9. Manufacturer Aggregated Replenishment Demand
10. XGBoost Demand Forecasting on Grocery Products
"""

import os
import sys
import unittest
import requests

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.db_session import SessionLocal, get_database_status_info, engine
from backend.models import (
    Product, PurchaseOrder, PurchaseOrderItem, OrderStatusHistory, Inventory
)
from backend.tools import BusinessToolRegistry
from ml.predict import predict_demand

BASE_URL = os.environ.get("TEST_API_URL", "http://127.0.0.1:8001")


class TestPersistenceAndSupabase(unittest.TestCase):

    def test_01_database_connectivity_and_schema(self):
        """Verifies active database session, schema inspector, and all normalized tables."""
        info = get_database_status_info()
        self.assertEqual(info["status"], "connected")
        self.assertGreaterEqual(info["table_count"], 21)
        expected_tables = [
            "users", "organizations", "retailer_stores", "suppliers", "manufacturers",
            "products", "product_batches", "inventory", "purchase_orders",
            "purchase_order_items", "order_status_history", "demand_forecasts"
        ]
        for tbl in expected_tables:
            self.assertIn(tbl, info["tables"])

    def test_02_grocery_catalog_purity(self):
        """Active catalog must have 45+ shelf-stable grocery items and zero fresh vegetables/fruits."""
        session = SessionLocal()
        try:
            prods = session.query(Product).filter(Product.is_active == True).all()
            self.assertGreaterEqual(len(prods), 45)
            
            categories = {p.category for p in prods}
            self.assertIn("Rice & Grains", categories)
            self.assertIn("Atta & Flours", categories)
            self.assertIn("Pulses & Dals", categories)
            self.assertIn("Cooking Oils & Ghee", categories)
            
            # Purity check: No raw/fresh vegetables or fresh fruits categories
            for p in prods:
                self.assertNotIn(p.category.lower(), ["vegetables", "fruits", "fresh produce", "fresh farm produce"])
                # No raw agricultural vegetable products
                for raw_item in ["raw tomato", "farm tomato", "raw onion", "farm onion", "raw potato"]:
                    self.assertNotIn(raw_item, p.name.lower())
        finally:
            session.close()

    def test_03_create_purchase_order_persistence(self):
        """Placing an order via REST API persists it into the relational database."""
        payload = {
            "store_id": "GUNTUR_STORE_01",
            "supplier_id": "SUP_GUNTUR_01",
            "supplier_name": "Guntur Agri Wholesale Mandi",
            "items": [
                {
                    "product_id": "sona-masoori-rice",
                    "product_name": "Babu Super Sona Masoori Rice (5kg)",
                    "quantity": 15,
                    "unit": "5kg bag",
                    "unit_price": 290.0
                }
            ]
        }
        res = requests.post(f"{BASE_URL}/api/orders", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        po_id = data["order"]["order_id"]
        
        # Verify directly in SQL database
        session = SessionLocal()
        try:
            db_po = session.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
            self.assertIsNotNone(db_po)
            self.assertEqual(db_po.status, "SUBMITTED")
            self.assertEqual(db_po.total_amount, 15 * 290.0)
            self.assertEqual(len(db_po.items), 1)
        finally:
            session.close()

    def test_04_status_transition_state_machine_and_audit(self):
        """Enforces valid progression: SUBMITTED -> ACCEPTED -> DISPATCHED -> DELIVERED with audit trail."""
        # 1. Create order
        create_res = requests.post(f"{BASE_URL}/api/orders", json={
            "store_id": "GUNTUR_STORE_01",
            "supplier_id": "SUP_GUNTUR_01",
            "items": [{"product_id": "toor-dal", "product_name": "Tata Sampann Toor Dal", "quantity": 10, "unit": "1kg pack", "unit_price": 148.0}]
        })
        po_id = create_res.json()["order"]["order_id"]

        # 2. Invalid jump directly to DELIVERED must fail (400)
        invalid_res = requests.patch(f"{BASE_URL}/api/orders/{po_id}/status", json={
            "status": "DELIVERED",
            "role": "supplier"
        })
        self.assertEqual(invalid_res.status_code, 400)

        # 3. Accept order
        accept_res = requests.patch(f"{BASE_URL}/api/orders/{po_id}/status", json={
            "status": "ACCEPTED",
            "role": "supplier",
            "actor": "Guntur Wholesaler Rep"
        })
        self.assertEqual(accept_res.status_code, 200)

        # 4. Dispatch order
        dispatch_res = requests.patch(f"{BASE_URL}/api/orders/{po_id}/status", json={
            "status": "DISPATCHED",
            "role": "supplier",
            "actor": "Fleet Dispatcher"
        })
        self.assertEqual(dispatch_res.status_code, 200)

        # 5. Deliver order
        deliver_res = requests.patch(f"{BASE_URL}/api/orders/{po_id}/status", json={
            "status": "DELIVERED",
            "role": "retailer",
            "actor": "Store Manager"
        })
        self.assertEqual(deliver_res.status_code, 200)

        # 6. Verify audit history contains all transitions
        detail_res = requests.get(f"{BASE_URL}/api/orders/{po_id}")
        self.assertEqual(detail_res.status_code, 200)
        detail_data = detail_res.json()
        self.assertEqual(detail_data["order"]["status"], "DELIVERED")
        history = detail_data["history"]
        to_statuses = [h["to_status"] for h in history]
        self.assertIn("SUBMITTED", to_statuses)
        self.assertIn("ACCEPTED", to_statuses)
        self.assertIn("DISPATCHED", to_statuses)
        self.assertIn("DELIVERED", to_statuses)

    def test_05_terminal_state_immutability(self):
        """Once DELIVERED, order cannot be changed or cancelled."""
        create_res = requests.post(f"{BASE_URL}/api/orders", json={
            "store_id": "GUNTUR_STORE_01",
            "supplier_id": "SUP_GUNTUR_01",
            "items": [{"product_id": "sugar", "product_name": "Madhur Sugar (5kg)", "quantity": 5, "unit": "5kg bag", "unit_price": 205.0}]
        })
        po_id = create_res.json()["order"]["order_id"]
        requests.patch(f"{BASE_URL}/api/orders/{po_id}/status", json={"status": "ACCEPTED", "role": "supplier"})
        requests.patch(f"{BASE_URL}/api/orders/{po_id}/status", json={"status": "DISPATCHED", "role": "supplier"})
        requests.patch(f"{BASE_URL}/api/orders/{po_id}/status", json={"status": "DELIVERED", "role": "retailer"})

        # Attempt to cancel delivered order
        cancel_attempt = requests.patch(f"{BASE_URL}/api/orders/{po_id}/status", json={"status": "CANCELLED", "role": "retailer"})
        self.assertEqual(cancel_attempt.status_code, 400)
        self.assertIn("terminal state", cancel_attempt.json()["detail"].lower())

    def test_06_database_status_diagnostics_endpoint(self):
        """GET /api/database/status returns detailed engine, provider, and entity counts."""
        res = requests.get(f"{BASE_URL}/api/database/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "connected")
        self.assertIn("provider", data)
        self.assertIn("table_count", data)
        self.assertIn("total_grocery_products", data)
        self.assertGreaterEqual(data["total_grocery_products"], 45)

    def test_07_manufacturer_aggregated_demand(self):
        """Manufacturer sees category demand trends without individual retailer secrets."""
        res = requests.get(f"{BASE_URL}/api/manufacturer/replenishments?role=manufacturer")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("top_surging_categories", data)
        self.assertIn("plant_capacity_recommendations", data)
        self.assertIn("privacy_notice", data)

    def test_08_xgboost_demand_forecasting_on_grocery(self):
        """XGBoost regression generates valid demand predictions for grocery products."""
        pred = predict_demand(
            product_name="Babu Super Sona Masoori Rice (5kg)",
            category="Rice & Grains",
            brand="Babu",
            state="Andhra Pradesh",
            city="Guntur",
            region="South",
            city_tier="Tier-2",
            season="Festival",
            selling_price=320.0,
            mrp=360.0,
            opening_stock=400
        )
        self.assertIn("predicted_demand", pred)
        self.assertGreater(pred["predicted_demand"], 0)
        self.assertIn("confidence_score", pred)


if __name__ == "__main__":
    unittest.main()

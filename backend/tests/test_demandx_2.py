"""
DemandX 2.0 — Automated Integration & Unit Test Suite
=====================================================
Uses Python standard library `unittest` and `requests`.
Tests against live backend service and core business modules:
- XGBoost inference integration (R² = 0.9626)
- Role-based authorization & tenant isolation
- Live store inventory retrieval & risk scoring
- Reorder safety stock calculation & draft confirmation workflow
- RAG vector search, document indexing, chunking & citation provenance
- Multilingual intent handling (Telugu native & Romanized, Hindi native & Romanized, English)
- In-prompt explicit language switching
- REST API endpoints on http://127.0.0.1:8001
"""

import os
import sys
import unittest
import requests

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
ML_DIR = os.path.join(BASE_DIR, 'ml')
if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)

from backend.database import db
from backend.tools import BusinessToolRegistry
from backend.rag import rag_engine
from backend.llm_orchestrator import orchestrator, detect_language, classify_intent

BASE_URL = os.environ.get("TEST_API_URL", "http://127.0.0.1:8001")


class TestDemandXEnterpriseCore(unittest.TestCase):

    def test_01_health_endpoint(self):
        res = requests.get(f"{BASE_URL}/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("XGBoost Regressor", data["model"])
        self.assertGreater(data["r2"], 0.95)
        self.assertEqual(data["rag_engine"], "Active (TF-IDF & Cosine Similarity)")
        self.assertEqual(data["jarvis_assistant"], "Online (Multilingual: EN, TE, HI)")

    def test_02_xgboost_direct_prediction(self):
        payload = {
            "Product_Name": "Fresh Farm Tomato",
            "Category": "Vegetables",
            "Brand": "Agri Direct",
            "State": "Andhra Pradesh",
            "City": "Guntur",
            "Region": "South",
            "City_Tier": "Tier-2",
            "Season": "Monsoon",
            "Selling_Price_INR": 24.0,
            "MRP_INR": 32.0,
            "Opening_Stock": 100
        }
        res = requests.post(f"{BASE_URL}/api/predict-demand", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertGreater(data["predicted_demand"], 0)
        self.assertIn(data["demand_level"], ["LOW", "MEDIUM", "HIGH"])
        self.assertGreaterEqual(data["recommended_stock"], data["predicted_demand"])

    def test_03_inventory_summary_retailer_auth(self):
        # Retailer allowed
        ret_res = BusinessToolRegistry.get_inventory_summary(role="retailer", store_id="GUNTUR_STORE_01")
        self.assertTrue(ret_res.success)
        self.assertGreaterEqual(ret_res.data["total_skus"], 5)
        self.assertEqual(ret_res.data["store_id"], "GUNTUR_STORE_01")

        # Customer unauthorized
        cust_res = BusinessToolRegistry.get_inventory_summary(role="customer", store_id="GUNTUR_STORE_01")
        self.assertFalse(cust_res.success)
        self.assertIn("Unauthorized", cust_res.error)

    def test_04_product_stock_lookup(self):
        res = BusinessToolRegistry.get_product_stock("rice", role="retailer", store_id="GUNTUR_STORE_01")
        self.assertTrue(res.success)
        self.assertIn("Basmati Rice", res.data["name"])
        self.assertGreater(res.data["current_stock"], 0)

    def test_05_stockout_risks_calculation(self):
        res = BusinessToolRegistry.get_stockout_risks(role="retailer", store_id="GUNTUR_STORE_01")
        self.assertTrue(res.success)
        self.assertGreater(len(res.data["risks"]), 0)
        for r in res.data["risks"]:
            self.assertIn("risk_score", r)
            self.assertIn("days_of_supply", r)

    def test_06_reorder_draft_and_explicit_confirmation(self):
        # 1. Draft creation
        draft_res = BusinessToolRegistry.create_reorder_draft(
            product_query="tomato",
            quantity=80,
            role="retailer",
            store_id="GUNTUR_STORE_01"
        )
        self.assertTrue(draft_res.success)
        draft = draft_res.data
        self.assertEqual(draft["status"], "DRAFT")
        draft_id = draft["draft_id"]

        # 2. Confirmation with valid tenant
        conf_res = BusinessToolRegistry.confirm_reorder_draft(
            draft_id=draft_id,
            role="retailer",
            store_id="GUNTUR_STORE_01"
        )
        self.assertTrue(conf_res.success)
        order = conf_res.data
        self.assertEqual(order["status"], "SUBMITTED")
        self.assertEqual(order["items"][0]["qty"], 80)

        # 3. Cross-tenant confirmation attempt must fail
        draft_res2 = BusinessToolRegistry.create_reorder_draft(
            product_query="onion",
            quantity=50,
            role="retailer",
            store_id="GUNTUR_STORE_01"
        )
        with self.assertRaises(PermissionError):
            db.confirm_draft(draft_res2.data["draft_id"], store_id="OTHER_STORE_99")

    def test_07_rag_seed_documents_and_citations(self):
        results = rag_engine.retrieve(query="return policy for damaged packaged oil", role="retailer")
        self.assertGreater(len(results), 0)
        top = results[0]
        self.assertIn("FMCG Return", top.title)
        self.assertIn("48 hours", top.content)
        self.assertTrue(top.citation.startswith("[FMCG Return"))

    def test_08_rag_role_pre_filtering(self):
        rag_engine.ingest_document(
            document_id="TEST-MFR-01",
            title="Confidential Factory Machine Blueprint",
            category="Manufacturing",
            source="Mfr Internal",
            content="Top secret manufacturing formula for Fortune refinery.",
            permitted_roles=["manufacturer", "admin"],
            tenant_id="GLOBAL"
        )

        retailer_search = rag_engine.retrieve(query="Factory Machine Blueprint", role="retailer")
        titles_ret = [r.title for r in retailer_search]
        self.assertNotIn("Confidential Factory Machine Blueprint", titles_ret)

        mfr_search = rag_engine.retrieve(query="Factory Machine Blueprint", role="manufacturer")
        titles_mfr = [r.title for r in mfr_search]
        self.assertIn("Confidential Factory Machine Blueprint", titles_mfr)

        rag_engine.delete_document("TEST-MFR-01")

    def test_09_multilingual_language_detection(self):
        self.assertEqual(detect_language("Rice stock entha undi?"), "te")
        self.assertEqual(detect_language("నా దగ్గర ఏ వస్తువుల స్టాక్ తక్కువగా ఉంది?"), "te")
        self.assertEqual(detect_language("मेरे पास किन उत्पादों का स्टॉक कम है?"), "hi")
        self.assertEqual(detect_language("Kal kitna stock order karna chahiye?"), "hi")
        self.assertEqual(detect_language("What products are running low?"), "en")
        # In-prompt explicit switch
        self.assertEqual(detect_language("Tell me in Hindi please"), "hi")
        self.assertEqual(detect_language("Telugu lo cheppu"), "te")

    def test_10_telugu_native_low_stock(self):
        # User Case A: Telugu native low stock
        res = requests.post(f"{BASE_URL}/api/assistant/chat", json={
            "query": "నా దగ్గర ఏ వస్తువుల స్టాక్ తక్కువగా ఉంది?",
            "preferred_lang": "te",
            "role": "retailer",
            "store_id": "GUNTUR_STORE_01"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["language"], "te")
        self.assertEqual(data["intent"], "LOW_STOCK")
        self.assertIn("get_low_stock_products", data["tools_executed"])
        # Check native Telugu script presence
        self.assertTrue(any(0x0C00 <= ord(c) <= 0x0C7F for c in data["reply"]))

    def test_11_hindi_native_low_stock(self):
        # User Case B: Hindi native low stock
        res = requests.post(f"{BASE_URL}/api/assistant/chat", json={
            "query": "मेरे पास किन उत्पादों का स्टॉक कम है?",
            "preferred_lang": "hi",
            "role": "retailer",
            "store_id": "GUNTUR_STORE_01"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["language"], "hi")
        self.assertEqual(data["intent"], "LOW_STOCK")
        self.assertIn("get_low_stock_products", data["tools_executed"])
        # Check Devanagari script presence
        self.assertTrue(any(0x0900 <= ord(c) <= 0x097F for c in data["reply"]))

    def test_12_telugu_xgboost_forecast(self):
        # User Case H: Forecast in Telugu with XGBoost
        res = requests.post(f"{BASE_URL}/api/assistant/chat", json={
            "query": "టమోటా రేపు డిమాండ్ ఎంత ఉంటుంది?",
            "preferred_lang": "te",
            "role": "retailer",
            "store_id": "GUNTUR_STORE_01"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["language"], "te")
        self.assertEqual(data["intent"], "FORECAST")
        self.assertIn("get_demand_forecast", data["tools_executed"])
        self.assertIsNotNone(data["forecast_card"])
        self.assertGreater(data["forecast_card"]["predicted_daily_demand"], 0)

    def test_13_hindi_xgboost_forecast(self):
        # User Case H: Forecast in Hindi with XGBoost
        res = requests.post(f"{BASE_URL}/api/assistant/chat", json={
            "query": "टमाटर की कल की मांग क्या होगी?",
            "preferred_lang": "hi",
            "role": "retailer",
            "store_id": "GUNTUR_STORE_01"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["language"], "hi")
        self.assertEqual(data["intent"], "FORECAST")
        self.assertIn("get_demand_forecast", data["tools_executed"])
        self.assertIsNotNone(data["forecast_card"])

    def test_14_multilingual_reorder_suggestions(self):
        # User Case G: Reorder recommendation in Telugu
        res = requests.post(f"{BASE_URL}/api/assistant/chat", json={
            "query": "నేను ఎంత స్టాక్ మళ్లీ ఆర్డర్ చేయాలి?",
            "preferred_lang": "te",
            "role": "retailer",
            "store_id": "GUNTUR_STORE_01"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["language"], "te")
        self.assertEqual(data["intent"], "REORDER_SUGGESTION")
        self.assertIn("calculate_reorder_suggestions", data["tools_executed"])

    def test_15_chat_to_reorder_confirmation(self):
        # Reorder draft to PO confirmation
        chat_res = requests.post(f"{BASE_URL}/api/assistant/chat", json={
            "query": "Prepare a reorder draft for 150 tomato",
            "role": "retailer",
            "store_id": "GUNTUR_STORE_01"
        })
        self.assertEqual(chat_res.status_code, 200)
        chat_data = chat_res.json()
        self.assertIsNotNone(chat_data["reorder_draft"])
        draft_id = chat_data["reorder_draft"]["draft_id"]

        confirm_res = requests.post(f"{BASE_URL}/api/assistant/reorder/confirm", json={
            "draft_id": draft_id,
            "role": "retailer",
            "store_id": "GUNTUR_STORE_01"
        })
        self.assertEqual(confirm_res.status_code, 200)
        conf_data = confirm_res.json()
        self.assertTrue(conf_data["success"])
        self.assertIn("order_id", conf_data["order"])


if __name__ == "__main__":
    unittest.main()

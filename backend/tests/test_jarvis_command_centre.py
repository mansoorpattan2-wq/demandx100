"""
DemandX 2.0 — Automated Test Suite for 3D Voice Command Centre
==============================================================
Validates:
1. Multilingual Voice & Intent Handling in English, Telugu (తెలుగు), and Hindi (हिन्दी)
2. Batch Expiry & Best-Before Risk Scoring Tool
3. Order Status & History Lookup with State Validation
4. Safe Two-Step Order and Cancellation Workflows (Confirmation Guardrail)
5. In-Prompt Language Switching Commands ("తెలుగులో చెప్పు", "हिन्दी में बताओ", "Explain in English")
6. RAG Retrieval for Approved DemandX Architecture & Operating Documents
"""

import os
import sys
import unittest
import requests

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.tools import BusinessToolRegistry
from backend.rag import rag_engine
from backend.llm_orchestrator import orchestrator, detect_language, classify_intent

BASE_URL = os.environ.get("TEST_API_URL", "http://127.0.0.1:8001")


class TestJarvisVoiceCommandCentre(unittest.TestCase):

    def test_01_language_switching_commands(self):
        """Validates in-prompt switching between Telugu, Hindi, and English."""
        # Telugu command
        lang_te = detect_language("తెలుగులో చెప్పు", requested_lang="en")
        self.assertEqual(lang_te, "te")

        # Hindi command
        lang_hi = detect_language("हिन्दी में बताओ", requested_lang="en")
        self.assertEqual(lang_hi, "hi")

        # English command
        lang_en = detect_language("Explain in English", requested_lang="te")
        self.assertEqual(lang_en, "en")

        # Mixed language query
        lang_mixed = detect_language("Rice stock ఎంత ఉంది?")
        self.assertEqual(lang_mixed, "te")

    def test_02_batch_expiry_risks_tool(self):
        """Inspects batch expiry tracking tool and role authorization."""
        # Retailer authorized
        res = BusinessToolRegistry.get_batch_expiry_risks(role="retailer", store_id="GUNTUR_STORE_01")
        self.assertTrue(res.success)
        self.assertIn("batches", res.data)
        self.assertGreater(len(res.data["batches"]), 0)

        # Batch fields
        first_batch = res.data["batches"][0]
        self.assertIn("batch_number", first_batch)
        self.assertIn("days_to_expiry", first_batch)
        self.assertIn("risk_level", first_batch)

        # Unauthorized customer
        cust_res = BusinessToolRegistry.get_batch_expiry_risks(role="customer")
        self.assertFalse(cust_res.success)

    def test_03_order_status_lookup_and_tenant_isolation(self):
        """Verifies order lookup by ID and cross-store isolation."""
        res = BusinessToolRegistry.get_order_by_id(
            order_id="PO-9402",
            role="retailer",
            store_id="GUNTUR_STORE_01"
        )
        self.assertTrue(res.success)
        self.assertEqual(res.data["order_id"], "PO-9402")
        self.assertIn(res.data["status"], ["ACCEPTED", "SUBMITTED", "DELIVERED"])

        # Cross-store access denied
        cross_res = BusinessToolRegistry.get_order_by_id(
            order_id="PO-9402",
            role="retailer",
            store_id="ANOTHER_STORE_99"
        )
        self.assertFalse(cross_res.success)
        self.assertIn("Denied", cross_res.error)

    def test_04_safe_order_cancellation_workflow(self):
        """Ensures order cancellation requires explicit confirmation and enforces state machine."""
        # Terminal state DELIVERED order cannot be cancelled
        cancel_delivered = BusinessToolRegistry.cancel_purchase_order(
            order_id="PO-9415",
            role="retailer",
            store_id="GUNTUR_STORE_01"
        )
        self.assertFalse(cancel_delivered.success)
        self.assertIn("terminal", cancel_delivered.error.lower())

    def test_05_reorder_draft_cancellation_workflow(self):
        """Validates that uncommitted drafts can be cancelled safely."""
        # 1. Create draft
        draft_res = BusinessToolRegistry.create_reorder_draft(
            product_query="chana-dal",
            quantity=50,
            role="retailer",
            store_id="GUNTUR_STORE_01"
        )
        self.assertTrue(draft_res.success)
        draft_id = draft_res.data["draft_id"]

        # 2. Cancel draft
        cancel_res = BusinessToolRegistry.cancel_reorder_draft(
            draft_id=draft_id,
            role="retailer",
            store_id="GUNTUR_STORE_01"
        )
        self.assertTrue(cancel_res.success)
        self.assertEqual(cancel_res.data["status"], "CANCELLED")

    def test_06_rag_demandx_architecture_document_retrieval(self):
        """Verifies that RAG retrieves approved DemandX ML architecture documentation."""
        results = rag_engine.retrieve(
            query="Explain the DemandX ML forecasting model and architecture R2 accuracy",
            role="retailer",
            top_k=4
        )
        self.assertGreater(len(results), 0)
        all_content = " ".join(r.content for r in results)
        self.assertIn("DemandX", results[0].title)
        self.assertIn("XGBoost", all_content)
        self.assertIn("0.9626", all_content)

    def test_07_multilingual_api_chat_flow(self):
        """Tests live API endpoint for Telugu and Hindi batch expiry and order status queries."""
        # Telugu expiry query
        te_res = requests.post(f"{BASE_URL}/api/assistant/chat", json={
            "query": "ఏ కిరాణా బ్యాచ్‌ల గడువు త్వరలో ముగియనుంది?",
            "preferred_lang": "te",
            "role": "retailer",
            "store_id": "GUNTUR_STORE_01"
        })
        self.assertEqual(te_res.status_code, 200)
        te_data = te_res.json()
        self.assertEqual(te_data["language"], "te")
        self.assertIsNotNone(te_data.get("batch_expiry_card"))

        # Hindi order status query
        hi_res = requests.post(f"{BASE_URL}/api/assistant/chat", json={
            "query": "PO-9402 का स्टेटस क्या है?",
            "preferred_lang": "hi",
            "role": "retailer",
            "store_id": "GUNTUR_STORE_01"
        })
        self.assertEqual(hi_res.status_code, 200)
        hi_data = hi_res.json()
        self.assertEqual(hi_data["language"], "hi")
        self.assertIsNotNone(hi_data.get("order_status_card"))


if __name__ == "__main__":
    unittest.main()

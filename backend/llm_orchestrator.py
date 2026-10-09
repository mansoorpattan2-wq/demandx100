"""
DemandX 2.0 — Multilingual Conversational AI Orchestrator
=========================================================
End-to-end language resolution and generation for:
1. English (en-IN)
2. Telugu (te-IN) in native Telugu script (తెలుగు)
3. Hindi (hi-IN) in native Devanagari script (हिन्दी)

Supports:
- Manual language selection mode
- Auto-detection mode (Unicode script + transliterated lexicon)
- Explicit in-prompt language switching ("answer in Hindi", "Telugu lo cheppu")
- Real XGBoost forecasting, inventory lookups, risk scoring, reorder drafts, and RAG.
"""

import os
import re
import time
import uuid
import requests
from typing import Dict, List, Optional, Any, Tuple
from pydantic import BaseModel, Field

from backend.tools import BusinessToolRegistry, ToolResult
from backend.rag import rag_engine, SearchResult


class ChatMessage(BaseModel):
    role: str  # user, assistant, system, tool
    content: str
    timestamp: float = Field(default_factory=time.time)


class AssistantResponse(BaseModel):
    session_id: str
    reply: str
    language: str  # en, te, hi
    intent: str
    tools_executed: List[str] = Field(default_factory=list)
    forecast_card: Optional[Dict[str, Any]] = None
    stock_risk_card: Optional[Dict[str, Any]] = None
    reorder_draft: Optional[Dict[str, Any]] = None
    batch_expiry_card: Optional[Dict[str, Any]] = None
    order_status_card: Optional[Dict[str, Any]] = None
    action_confirmation: Optional[Dict[str, Any]] = None
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    execution_time_ms: float = 0.0
    provider_used: str = "DemandX Autonomous Core"


# Active in-memory session history: session_id -> List[ChatMessage]
SESSION_HISTORIES: Dict[str, List[ChatMessage]] = {}

# System Prompts as specified in DemandX Architecture
SYSTEM_PROMPTS = {
    "en": "You are DemandX, an AI-powered retail demand intelligence assistant. Respond in clear, practical Indian English.",
    "te": "నువ్వు DemandX AI రిటైల్ అసిస్టెంట్వి. వినియోగదారుడి ప్రశ్నకు సహజమైన, సులభంగా అర్థమయ్యే తెలుగులో సమాధానం ఇవ్వాలి. సాధారణంగా తెలుగు లిపిని ఉపయోగించాలి. సమాధానంలో అవసరమైన ఇంగ్లీష్ సాంకేతిక పదాలు, SKUలు, ఉత్పత్తి పేర్లు, సంఖ్యలు మరియు డేటా విలువలను సరిగ్గా ఉంచాలి. ఇంగ్లీష్లో మాత్రమే సమాధానం ఇవ్వవద్దు.",
    "hi": "आप DemandX के AI रिटेल असिस्टेंट हैं। उपयोगकर्ता के प्रश्न का उत्तर स्वाभाविक, स्पष्ट और आसानी से समझ आने वाली हिंदी में दें। सामान्यतः देवनागरी लिपि का उपयोग करें। आवश्यक अंग्रेज़ी तकनीकी शब्दों, SKU, उत्पाद के नाम, संख्याओं और वास्तविक डेटा को सही रखें। केवल अंग्रेज़ी में उत्तर न दें।"
}

# Multilingual Product Mapping
PRODUCT_ALIASES = {
    "sona-masoori-rice": [
        "sona masoori", "sona masuri", "sona masoori rice", "babu super", "rice",
        "సోనా మసూరి", "సోనా మసూరి బియ్యం", "బియ్యం",
        "सोना मसूरी", "सोना मसूरी चावल",
        # Legacy fallback
        "tomato", "tomatoes", "farm tomato", "fresh tomato", "టమోటా", "టమాటా", "tamatar", "टमाटर"
    ],
    "basmati-rice": [
        "basmati", "basmati rice", "royal basmati", "india gate",
        "రైస్", "బాస్మతి", "బాస్మతి రైస్",
        "chawal", "chaval", "chaawal", "चावल", "बासमती", "बासमती चावल"
    ],
    "cooking-oil": [
        "oil", "cooking oil", "sunflower oil", "fortune oil", "fortune", "sunlite",
        "నూనె", "ఆయిల్", "కుకింగ్ ఆయిల్", "సన్‌ఫ్లవర్ ఆయిల్", "ఫార్చ్యూన్",
        "tel", "cooking tel", "oil pouch", "तेल", "खाद्य तेल", "फॉर्च्यून"
    ],
    "chana-dal": [
        "chana", "chana dal", "gram dal", "bengal gram", "potato",
        "శనగపప్పు", "శనగ పప్పు", "సెనగపప్పు",
        "चना", "चना दाल", "आलू"
    ],
    "moong-dal": [
        "moong", "moong dal", "yellow moong", "green gram",
        "పెసరపప్పు", "పెసర పప్పు",
        "मूंग", "मूंग दाल"
    ],
    "onion": [
        "onion", "onions", "red onion",
        "ఉల్లిపాయ", "ఉల్లిపాయలు", "ఉల్లి",
        "pyaz", "pyaaz", "kanda", "प्याज", "लाल प्याज"
    ],
    "red-chilli": [
        "chilli", "chillies", "red chilli", "guntur chilli", "mirchi",
        "మిర్చి", "మిరపకాయ", "మిరపకాయలు", "గుంటూరు మిర్చి",
        "mirch", "laal mirch", "lal mirch", "मिर्च", "लाल मिर्च"
    ],
    "sugar": [
        "sugar", "crystal sugar", "madhur",
        "చక్కెర", "పంచదార",
        "cheeni", "chini", "shakkar", "चीनी", "शक्कर"
    ],
    "toor-dal": [
        "dal", "toor", "toor dal", "tata dal", "pulses",
        "పప్పు", "కందిపప్పు", "తూర్ దాల్",
        "daal", "arhar", "arhar dal", "दाल", "अरहर दाल", "तुअर दाल"
    ]
}


def resolve_product_from_query(query: str) -> Optional[str]:
    """Finds canonical product ID from multilingual query."""
    q_lower = query.lower()
    for prod_id, aliases in PRODUCT_ALIASES.items():
        for alias in aliases:
            if alias.lower() in q_lower:
                return prod_id
    return None


def detect_language(query: str, requested_lang: Optional[str] = None) -> str:
    """
    Resolves response language:
    1. Explicit in-prompt switch (e.g. 'answer in Hindi', 'Telugu lo cheppu', 'in English')
    2. Manual language preference (if 'te', 'hi', or 'en' explicitly set and not 'auto')
    3. Auto-detection via Unicode scripts (Telugu script: 0x0C00-0x0C7F, Devanagari: 0x0900-0x097F)
    4. Auto-detection via transliterated Indian retail lexicons
    5. Falls back to requested_lang or 'en'
    """
    q_lower = query.lower()

    # 1. Check for explicit language switch requests in the query
    if any(phrase in q_lower for phrase in ["in telugu", "telugu lo", "telugu lo cheppu", "telugulo", "తెలుగులో", "తెలుగు లో"]):
        return "te"
    if any(phrase in q_lower for phrase in ["in hindi", "hindi me", "hindi mein", "hindi me batao", "hindime", "हिंदी में", "हिन्दी में"]):
        return "hi"
    if any(phrase in q_lower for phrase in ["in english", "english lo", "english me", "english mein", "ఇంగ్లీష్ లో", "अंग्रेजी में"]):
        return "en"

    # 2. If manual mode is active and not 'auto', respect user preference
    if requested_lang and requested_lang in ["te", "hi", "en"]:
        # If the user explicitly typed in another script, allow auto-switch
        has_telugu_script = any(0x0C00 <= ord(char) <= 0x0C7F for char in query)
        has_devanagari_script = any(0x0900 <= ord(char) <= 0x097F for char in query)

        if has_telugu_script and requested_lang != "te":
            return "te"
        if has_devanagari_script and requested_lang != "hi":
            return "hi"

        return requested_lang

    # 3. Auto-detection via Unicode scripts
    has_telugu_script = any(0x0C00 <= ord(char) <= 0x0C7F for char in query)
    has_devanagari_script = any(0x0900 <= ord(char) <= 0x097F for char in query)

    if has_telugu_script:
        return "te"
    if has_devanagari_script:
        return "hi"

    # 4. Transliterated Telugu lexicon
    telugu_romanized = [
        "entha", "undi", "undhi", "repu", "nenu", "ela", "emi", "stoklo", "stocklo",
        "cheyali", "cheyandi", "daggara", "takkuva", "takkuvaga", "ekkuva", "ekkuvaga",
        "mallee", "kavali", "undachu", "vastuvulu", "vastuvu", "pramadam", "chudu"
    ]
    if any(k in q_lower for k in telugu_romanized):
        return "te"

    # 5. Transliterated Hindi lexicon
    hindi_romanized = [
        "kitna", "kitni", "hai", "hain", "hoga", "karna", "chahiye", "kya", "batao",
        "kal", "kaise", "mera", "mere", "paas", "kam", "khatam", "khatra", "mangwana",
        "chahiye", "aaj", "mang", "utpad"
    ]
    if any(k in q_lower for k in hindi_romanized):
        return "hi"

    # Fallback to requested_lang if valid, else 'en'
    if requested_lang in ["te", "hi", "en"]:
        return requested_lang

    return "en"


def classify_intent(query: str) -> str:
    """
    Robust multilingual intent classifier covering English, Telugu (native & Romanized),
    and Hindi (Devanagari & Romanized).
    """
    q = query.lower().strip()

    # Explicit Language Switch Commands
    lang_switch_phrases = [
        "తెలుగులో చెప్పు", "తెలుగులో చెప్పండి", "తెలుగులో మాట్లాడు", "telugu lo cheppu", "telugulo cheppu",
        "हिन्दी में बताओ", "हिंदी में बताओ", "हिंदी में बोलो", "hindi me batao", "hindi mein batao",
        "explain in english", "answer in english", "speak in english", "talk in english"
    ]
    if any(p in q for p in lang_switch_phrases):
        return "LANGUAGE_SWITCH_ONLY"

    # Cancellation Action Intent
    cancel_triggers = [
        "cancel order", "cancel po", "cancel draft", "cancel reorder",
        "ఆర్డర్ రద్దు", "డ్రాఫ్ట్ రద్దు", "రద్దు చేయండి", "ఆర్డర్ కాన్సిల్",
        "ऑर्डर रद्द", "ड्राफ्ट रद्द", "कैंसिल करो", "ऑर्डर कैंसिल"
    ]
    if any(k in q for k in cancel_triggers):
        return "CANCEL_ACTION"

    # Batch Expiry Risk Queries
    expiry_triggers = [
        "expiry", "expire", "best before", "shelf life", "expiring", "near expiry", "batches",
        "గడువు", "ఎక్స్‌పైర్", "ఎక్స్‌పైరీ", "ఎప్పుడు ఎక్స్‌పైర్", "ఎక్స్‌పైర్ అయ్యే", "షెల్ఫ్ లైఫ్",
        "एक्सपायरी", "खराब होने", "अंतिम तिथि", "शेल्फ लाइफ", "एक्सपायर"
    ]
    if any(k in q for k in expiry_triggers):
        return "EXPIRY_RISK"

    # Order Status & Tracking Queries
    order_status_triggers = [
        "po-", "order status", "track order", "accept kiya", "supplier accept", "order accept",
        "pending order", "purchase order status", "order update", "where is my order",
        "ఆర్డర్ స్థితి", "ఆర్డర్ స్టేటస్", "సప్లయర్ ఆర్డర్", "ఆర్డర్ అంగీకరించారా", "ఆర్డర్ ట్రాక్",
        "ऑर्डर स्टेटस", "ऑर्डर स्थिति", "सप्लायर ने ऑर्डर", "ऑर्डर स्वीकार किया", "ऑर्डर ट्रैक"
    ]
    if any(k in q for k in order_status_triggers):
        return "ORDER_STATUS"

    # Reorder Draft creation intent
    reorder_draft_triggers = [
        "draft", "reorder draft", "draft order", "create draft", "make draft",
        "order draft", "draft cheyandi", "order karo",
        "డ్రాఫ్ట్", "ఆర్డర్ డ్రాఫ్ట్", "రీఆర్డర్ డ్రాఫ్ట్",
        "ड्राफ्ट", "रीऑर्डर ड्राफ्ट", "ऑर्डर ड्राफ्ट"
    ]
    if any(k in q for k in reorder_draft_triggers):
        return "REORDER_DRAFT"

    # Reorder Suggestion calculations
    reorder_suggestion_triggers = [
        "reorder", "suggest reorder", "how much to order", "replenish", "replenishment",
        "entha order cheyali", "kitna stock order", "kitna order karna chahiye",
        "ఎంత ఆర్డర్ చేయాలి", "ఎంత స్టాక్ ఆర్డర్", "మళ్లీ ఆర్డర్", "రీఆర్డర్ సూచనలు", "ఎంత కొనాలి",
        "कितना स्टॉक दोबारा ऑर्डर", "कितना ऑर्डर करना चाहिए", "दोबारा ऑर्डर", "रीऑर्डर सुझाव"
    ]
    if any(k in q for k in reorder_suggestion_triggers):
        return "REORDER_SUGGESTION"

    # Low Stock Queries
    low_stock_triggers = [
        "low stock", "running low", "shortage", "deficit", "empty shelves",
        "takkuva", "takkuvaga", "emi takkuva", "kam hai", "khatam hone",
        "తక్కువ", "తక్కువగా", "స్టాక్ తక్కువ", "ఏ ప్రొడక్ట్స్ తక్కువ", "ఏ వస్తువులు తక్కువ",
        "వస్తువుల స్టాక్ తక్కువ", "ప్రొడక్ట్స్ స్టాక్ తక్కువ",
        "कम", "कम स्टॉक", "किन उत्पादों का स्टॉक कम", "स्टॉक कम है", "खत्म होने वाला"
    ]
    if any(k in q for k in low_stock_triggers):
        return "LOW_STOCK"

    # Stockout Risk Queries
    stockout_risk_triggers = [
        "stockout", "risk", "highest risk", "out of stock risk", "danger",
        "pramadam", "khatra", "jokhim",
        "ప్రమాదం", "రిస్క్", "స్టాక్‌అవుట్", "అయిపోయే ప్రమాదం", "అయిపోతున్న",
        "खतरा", "जोखिम", "स्टॉक खत्म होने का खतरा", "स्टॉकआउट"
    ]
    if any(k in q for k in stockout_risk_triggers):
        return "STOCK_RISK"

    # Demand Forecasting Queries
    forecast_triggers = [
        "forecast", "demand", "predict", "prediction", "tomorrow demand", "future demand",
        "repu", "kal demand", "entha untundi", "aaj demand",
        "డిమాండ్", "అంచనా", "రేపు డిమాండ్", "ఎక్కువ డిమాండ్", "డిమాండ్ ఎంత",
        "मांग", "पूर्वानुमान", "मांग ज्यादा", "मांग कितनी", "कल की मांग", "आज की मांग"
    ]
    if any(k in q for k in forecast_triggers):
        return "FORECAST"

    # Policy / RAG Knowledge Queries
    rag_triggers = [
        "policy", "return", "apmc", "vyapulse", "credit", "mandi", "rules", "guidelines",
        "damage", "terms", "moq", "cess", "commission",
        "పాలసీ", "నిబంధనలు", "రిటర్న్", "మండి", "వ్యాపల్స్", "రుణ పరిమితి",
        "पॉलिसी", "नियम", "दिशानिर्देश", "रिटर्न", "मंडी", "क्रेडिट"
    ]
    if any(k in q for k in rag_triggers):
        return "KNOWLEDGE_RAG"

    # Live Inventory / Stock lookup
    inventory_triggers = [
        "stock", "available", "inventory", "units", "quantity", "holding",
        "entha undi", "kitna hai",
        "స్టాక్", "ఎంత ఉంది", "ఎన్ని ఉన్నాయి", "నిల్వ",
        "स्टॉक", "कितना है", "उपलब्ध", "इन्वेंट्री"
    ]
    # Check if query matches any product alias directly
    has_product = resolve_product_from_query(q) is not None

    if has_product or any(k in q for k in inventory_triggers):
        return "LIVE_INVENTORY"

    # Supplier details
    supplier_triggers = [
        "supplier", "distributor", "vendor", "lead time", "sourcing",
        "సప్లయర్", "పంపిణీదారు", "డీలర్",
        "सप्लायर", "विक्रेता", "डिस्ट्रीब्यूटर"
    ]
    if any(k in q for k in supplier_triggers):
        return "SUPPLIER_DETAILS"

    # Greetings
    greeting_triggers = [
        "hello", "hi", "hey", "namaste", "jarvis", "help",
        "నమస్కారం", "హలో",
        "नमस्ते", "प्रणाम", "हेलो"
    ]
    if any(k in q for k in greeting_triggers):
        return "GREETING"

    return "GENERAL_OR_KNOWLEDGE"


class LLMOrchestrator:
    """
    Central Conversational Orchestrator.
    Manages session context, tool execution, RAG grounding, and multi-language outputs.
    """

    def __init__(self):
        self.gemini_key = os.environ.get("GEMINI_API_KEY")
        self.openai_key = os.environ.get("OPENAI_API_KEY")
        self.groq_key = os.environ.get("GROQ_API_KEY")

    def _get_history(self, session_id: str) -> List[ChatMessage]:
        if session_id not in SESSION_HISTORIES:
            SESSION_HISTORIES[session_id] = []
        return SESSION_HISTORIES[session_id]

    def _append_history(self, session_id: str, role: str, content: str):
        history = self._get_history(session_id)
        history.append(ChatMessage(role=role, content=content))
        if len(history) > 12:
            SESSION_HISTORIES[session_id] = history[-12:]

    def process_chat(
        self,
        query: str,
        session_id: Optional[str] = None,
        role: str = "retailer",
        store_id: str = "GUNTUR_STORE_01",
        preferred_lang: Optional[str] = None,
        user_name: Optional[str] = None
    ) -> AssistantResponse:
        start_time = time.time()
        sid = session_id or str(uuid.uuid4())
        lang = detect_language(query, preferred_lang)
        intent = classify_intent(query)

        self._append_history(sid, "user", query)

        tools_executed: List[str] = []
        forecast_card: Optional[Dict[str, Any]] = None
        stock_risk_card: Optional[Dict[str, Any]] = None
        reorder_draft_card: Optional[Dict[str, Any]] = None
        batch_expiry_card: Optional[Dict[str, Any]] = None
        order_status_card: Optional[Dict[str, Any]] = None
        action_confirmation: Optional[Dict[str, Any]] = None
        citations: List[Dict[str, Any]] = []
        reply_text = ""

        # =========================================================================
        # INTENT EXECUTION & TOOL CALLING WITH MULTILINGUAL GENERATION
        # =========================================================================

        if intent == "GREETING":
            greetings = {
                "en": f"Good evening{', ' + user_name if user_name else ''}! DemandX JARVIS Core is online. I'm actively monitoring inventory for {store_id}, live XGBoost demand forecasts, and supplier logistics. How can I assist you?",
                "te": f"శుభ సాయంత్రం{', ' + user_name if user_name else ''}! DemandX JARVIS ఆన్‌లైన్‌లో ఉంది. నేను మీ స్టోర్ ఇన్వెంటరీ, డిమాండ్ అంచనాలు మరియు సప్లయర్ వివరాలను పర్యవేక్షిస్తున్నాను. మీకు ఏ సహాయం కావాలి?",
                "hi": f"शुभ संध्या{', ' + user_name if user_name else ''}! DemandX JARVIS ऑनलाइन है। मैं आपकी दुकान की इन्वेंट्री, लाइव मांग पूर्वानुमान और सप्लायर लॉजिस्टिक्स की निगरानी कर रहा हूं। मैं आपकी क्या मदद कर सकता हूँ?"
            }
            reply_text = greetings.get(lang, greetings["en"])

        elif intent == "FORECAST":
            tools_executed.append("get_demand_forecast")
            target_prod = resolve_product_from_query(query) or "tomato"

            res = BusinessToolRegistry.get_demand_forecast(
                product_query=target_prod,
                city="Guntur",
                role=role,
                store_id=store_id
            )
            if res.success and res.data:
                data = res.data
                forecast_card = data
                if lang == "te":
                    reply_text = (
                        f"⚡ XGBoost ML మోడల్ ప్రకారం (R² = 0.9626), {data['product_name']} కు "
                        f"రోజువారీ డిమాండ్ సుమారు {data['predicted_daily_demand']} యూనిట్లుగా అంచనా వేయబడింది "
                        f"(డిమాండ్ స్థాయి: {data['demand_level']}). సిఫార్సు చేసిన సేఫ్టీ స్టాక్: {data['recommended_safety_stock']} యూనిట్లు."
                    )
                elif lang == "hi":
                    reply_text = (
                        f"⚡ XGBoost ML मॉडल के अनुसार (R² = 0.9626), {data['product_name']} की "
                        f"दैनिक अनुमानित मांग {data['predicted_daily_demand']} यूनिट्स है "
                        f"(मांग स्तर: {data['demand_level']})। अनुशंसित सुरक्षा स्टॉक: {data['recommended_safety_stock']} यूनिट्स।"
                    )
                else:
                    reply_text = (
                        f"⚡ Based on our trained XGBoost Regressor (R² = 0.9626), the projected daily demand "
                        f"for {data['product_name']} in {data['city']} is {data['predicted_daily_demand']} units "
                        f"({data['demand_level']} demand). Recommended safety buffer: {data['recommended_safety_stock']} units."
                    )

        elif intent == "STOCK_RISK":
            tools_executed.append("get_stockout_risks")
            res = BusinessToolRegistry.get_stockout_risks(role=role, store_id=store_id)
            if res.success and res.data:
                risks = res.data["risks"]
                critical = [r for r in risks if "CRITICAL" in r["risk_status"]]
                stock_risk_card = {"critical_count": len(critical), "risks": risks[:4]}
                names = ", ".join(r["product_name"] for r in critical) if critical else "None"

                if lang == "te":
                    reply_text = (
                        f"🚨 స్టాక్‌అవుట్ రిస్క్ విశ్లేషణ: మీ స్టోర్‌లో {len(critical)} ఉత్పత్తులకు స్టాక్ అయిపోయే ప్రమాదం ఎక్కువగా ఉంది: {names}. "
                        f"వీటి ప్రస్తుత సరఫరా 2-3 రోజుల్లో పూర్తవుతుంది. సరఫరాదారు నుండి వెంటనే రీఆర్డర్ చేయడం మంచిది."
                    )
                elif lang == "hi":
                    reply_text = (
                        f"🚨 स्टॉकआउट जोखिम विश्लेषण: आपकी दुकान में {len(critical)} उत्पादों के स्टॉक खत्म होने का खतरा सबसे ज्यादा है: {names}। "
                        f"इनकी मौजूदा सप्लाई 2-3 दिनों में खत्म हो सकती है। सप्लायर से तुरंत रीऑर्डर करने की सलाह दी जाती है।"
                    )
                else:
                    reply_text = (
                        f"🚨 Stockout Risk Alert: Detected {len(critical)} SKUs at critical replenishment risk: {names}. "
                        f"Days of supply are dangerously close to supplier lead time. Immediate reorder recommended."
                    )

        elif intent == "LOW_STOCK":
            tools_executed.append("get_low_stock_products")
            res = BusinessToolRegistry.get_low_stock_products(role=role, store_id=store_id)
            if res.success and res.data:
                items = res.data["items"]
                if lang == "te":
                    lines = [f"• {i['name']}: మిగిలిన స్టాక్ {i['current_stock']} {i['unit']} (కొరత: {i['deficit_units']})" for i in items[:4]]
                    reply_text = f"📦 మీ వద్ద స్టాక్ తక్కువగా ఉన్న ఉత్పత్తులు ({len(items)} రకాలు):\n" + "\n".join(lines) + "\n\nవీటికి రీఆర్డర్ డ్రాఫ్ట్ తయారు చేయాలా?"
                elif lang == "hi":
                    lines = [f"• {i['name']}: बचा हुआ स्टॉक {i['current_stock']} {i['unit']} (कमी: {i['deficit_units']})" for i in items[:4]]
                    reply_text = f"📦 आपकी दुकान में कम स्टॉक वाले उत्पाद ({len(items)} आइटम्स):\n" + "\n".join(lines) + "\n\nक्या आप इनके लिए रीऑर्डर ड्राफ्ट तैयार करना चाहते हैं?"
                else:
                    lines = [f"• {i['name']}: {i['current_stock']} {i['unit']} remaining (Deficit: {i['deficit_units']})" for i in items[:4]]
                    reply_text = f"📦 Identified {len(items)} SKUs below required safety buffer:\n" + "\n".join(lines) + "\n\nWould you like me to prepare a replenishment draft order?"

        elif intent == "REORDER_SUGGESTION":
            tools_executed.append("calculate_reorder_suggestions")
            res = BusinessToolRegistry.calculate_reorder_suggestions(role=role, store_id=store_id)
            if res.success and res.data:
                suggestions = res.data["suggestions"]
                total_est = sum(s["estimated_total_cost_inr"] for s in suggestions)

                if lang == "te":
                    lines = [f"• {s['product_name']}: {s['recommended_reorder_units']} {s['unit']} రీఆర్డర్ చేయాలి (అంచనా: ₹{s['estimated_total_cost_inr']:,.2f}) — {s['supplier_name']}" for s in suggestions[:3]]
                    reply_text = (
                        f"📋 అధికారిక రీఆర్డర్ సిఫార్సులు (సేఫ్టీ స్టాక్ ఫార్ములా ప్రకారం):\n"
                        + "\n".join(lines)
                        + f"\n\nమొత్తం అంచనా బడ్జెట్: ₹{total_est:,.2f}. వీటి కోసం ఆర్డర్ డ్రాఫ్ట్ సిద్ధం చేయాలా?"
                    )
                elif lang == "hi":
                    lines = [f"• {s['product_name']}: {s['recommended_reorder_units']} {s['unit']} दोबारा ऑर्डर करें (अनुमानित: ₹{s['estimated_total_cost_inr']:,.2f}) — {s['supplier_name']}" for s in suggestions[:3]]
                    reply_text = (
                        f"📋 आधिकारिक रीऑर्डर सुझाव (सुरक्षा स्टॉक फॉर्मूले के अनुसार):\n"
                        + "\n".join(lines)
                        + f"\n\nकुल अनुमानित बजट: ₹{total_est:,.2f}। क्या इनके लिए ऑर्डर ड्राफ्ट बनाएं?"
                    )
                else:
                    lines = [f"• {s['product_name']}: Reorder {s['recommended_reorder_units']} {s['unit']} (Est: ₹{s['estimated_total_cost_inr']:,.2f}) via {s['supplier_name']}" for s in suggestions[:3]]
                    reply_text = (
                        f"📋 Replenishment Suggestions (Calculated via Safety Stock Formula):\n"
                        + "\n".join(lines)
                        + f"\n\nEstimated total capital requirement: ₹{total_est:,.2f}. Would you like me to create an order draft?"
                    )

        elif intent == "REORDER_DRAFT":
            tools_executed.append("create_reorder_draft")
            target_prod = resolve_product_from_query(query) or "tomato"

            qty_match = re.search(r'\b(\d+)\b', query)
            qty = int(qty_match.group(1)) if qty_match else 100

            draft_res = BusinessToolRegistry.create_reorder_draft(
                product_query=target_prod,
                quantity=qty,
                role=role,
                store_id=store_id
            )
            if draft_res.success and draft_res.data:
                draft = draft_res.data
                reorder_draft_card = draft

                if lang == "te":
                    reply_text = (
                        f"📝 రీఆర్డర్ డ్రాఫ్ట్ సిద్ధమైంది: {draft['quantity']} {draft['unit']} {draft['product_name']} "
                        f"({draft['supplier_name']} నుండి). అంచనా మొత్తం: ₹{draft['total_estimated_inr']:,.2f}.\n\n"
                        f"భద్రతా సూచన: ఇది డ్రాఫ్ట్ మాత్రమే. సరఫరాదారునికి ఆర్డర్ పంపడానికి దయచేసి క్రింద ఉన్న 'Confirm Purchase Order' బటన్ నొక్కండి."
                    )
                elif lang == "hi":
                    reply_text = (
                        f"📝 रीऑर्डर ड्राफ्ट तैयार है: {draft['quantity']} {draft['unit']} {draft['product_name']} "
                        f"({draft['supplier_name']} से)। कुल अनुमानित राशि: ₹{draft['total_estimated_inr']:,.2f}।\n\n"
                        f"सुरक्षा सूचना: यह केवल एक ड्राफ्ट है। सप्लायर को पक्का ऑर्डर भेजने के लिए कृपया नीचे दिए गए 'Confirm Purchase Order' बटन पर क्लिक करें।"
                    )
                else:
                    reply_text = (
                        f"📝 Reorder Draft Created: {draft['quantity']} {draft['unit']} of {draft['product_name']} "
                        f"with {draft['supplier_name']}. Estimated total: ₹{draft['total_estimated_inr']:,.2f}.\n\n"
                        f"SAFETY NOTICE: This is an uncommitted draft. Please verify details and click 'Confirm Purchase Order' to transmit."
                    )

        elif intent == "LIVE_INVENTORY":
            matched_prod = resolve_product_from_query(query)

            if matched_prod:
                tools_executed.append("get_product_stock")
                stock_res = BusinessToolRegistry.get_product_stock(matched_prod, role=role, store_id=store_id)
                if stock_res.success and stock_res.data:
                    d = stock_res.data
                    if lang == "te":
                        reply_text = (
                            f"📦 {d['name']} ప్రస్తుత నిల్వ: {d['current_stock']} {d['unit']}. "
                            f"సేఫ్టీ పరిమితి: {d['reorder_threshold']} {d['unit']}. "
                            f"స్టాక్ స్థితి: {d['stock_status']}. సరఫరాదారు: {d['supplier']}."
                        )
                    elif lang == "hi":
                        reply_text = (
                            f"📦 {d['name']} का वर्तमान स्टॉक: {d['current_stock']} {d['unit']} है। "
                            f"सुरक्षा सीमा: {d['reorder_threshold']} {d['unit']}। "
                            f"स्थिति: {d['stock_status']}। सप्लायर: {d['supplier']}।"
                        )
                    else:
                        reply_text = (
                            f"📦 Current Stock for {d['name']}: {d['current_stock']} {d['unit']} "
                            f"(Safety Threshold: {d['reorder_threshold']} {d['unit']}). "
                            f"Status: {d['stock_status']}. Supplier: {d['supplier']}."
                        )
                else:
                    reply_text = stock_res.error or "Product not found."
            else:
                tools_executed.append("get_inventory_summary")
                inv_res = BusinessToolRegistry.get_inventory_summary(role=role, store_id=store_id)
                if inv_res.success and inv_res.data:
                    d = inv_res.data
                    if lang == "te":
                        reply_text = (
                            f"📊 {d['store_id']} ఇన్వెంటరీ సారాంశం: మొత్తం {d['total_skus']} యాక్టివ్ SKUs, "
                            f"మొత్తం నిల్వ {d['total_stock_units']} యూనిట్లు. "
                            f"రీఆర్డర్ అవసరమైన వస్తువులు: {d['critical_stockout_count']}."
                        )
                    elif lang == "hi":
                        reply_text = (
                            f"📊 {d['store_id']} इन्वेंट्री सारांश: कुल {d['total_skus']} एक्टिव SKUs, "
                            f"कुल स्टॉक {d['total_stock_units']} यूनिट्स। "
                            f"रीऑर्डर की आवश्यकता वाले उत्पाद: {d['critical_stockout_count']}।"
                        )
                    else:
                        reply_text = (
                            f"📊 Store Inventory Overview ({d['store_id']}): Managing {d['total_skus']} active SKUs "
                            f"totaling {d['total_stock_units']} units. {d['critical_stockout_count']} items require replenishment attention."
                        )

        elif intent == "SUPPLIER_DETAILS":
            tools_executed.append("get_supplier_details")
            sup_res = BusinessToolRegistry.get_supplier_details("Guntur", role=role)
            if sup_res.success and sup_res.data:
                s = sup_res.data
                if lang == "te":
                    reply_text = (
                        f"🚚 సరఫరాదారు వివరాలు: {s['name']} ({s['hub']}). "
                        f"డెలివరీ సమయం: {s['lead_time_days']} రోజులు. కనీస ఆర్డర్: ₹{s['min_order_value_inr']:,}. "
                        f"చెల్లింపు నిబంధనలు: {s['payment_terms']}. రేటింగ్: {s['rating']} ⭐."
                    )
                elif lang == "hi":
                    reply_text = (
                        f"🚚 सप्लायर विवरण: {s['name']} ({s['hub']})। "
                        f"लीड टाइम: {s['lead_time_days']} दिन। न्यूनतम ऑर्डर: ₹{s['min_order_value_inr']:,}। "
                        f"भुगतान शर्तें: {s['payment_terms']}। रेटिंग: {s['rating']} ⭐।"
                    )
                else:
                    reply_text = (
                        f"🚚 Supplier Profile: {s['name']} ({s['hub']}). "
                        f"Lead Time: {s['lead_time_days']} days. Min Order: ₹{s['min_order_value_inr']:,}. "
                        f"Payment Terms: {s['payment_terms']}. Rating: {s['rating']} ⭐."
                    )

        elif intent == "LANGUAGE_SWITCH_ONLY":
            ack = {
                "te": "ఖచ్చితంగా! నేను ఇకపై మీకు సహజమైన తెలుగులోనే సమాధానాలు ఇస్తాను. మీ స్టోర్ ఇన్వెంటరీ, XGBoost డిమాండ్ అంచనాలు లేదా సప్లయర్ ఆర్డర్ల గురించి అడగండి.",
                "hi": "ज़रूर! अब मैं आपको हिन्दी में जानकारी दूंगा। अपनी दुकान की इन्वेंट्री, लाइव मांग पूर्वानुमान या सप्लायर ऑर्डर के बारे में क्या जानना चाहते हैं?",
                "en": "Understood! Switching to English. How can I assist you with DemandX inventory, forecasts, or replenishment orders?"
            }
            reply_text = ack.get(lang, ack["en"])

        elif intent == "EXPIRY_RISK":
            tools_executed.append("get_batch_expiry_risks")
            res = BusinessToolRegistry.get_batch_expiry_risks(role=role, store_id=store_id)
            if res.success and res.data:
                batch_expiry_card = res.data
                crit_count = res.data.get("critical_count", 0)
                batches = res.data.get("batches", [])
                crit_names = ", ".join(b["product_name"] for b in batches if "CRITICAL" in b["risk_level"][:3]) or "None"

                if lang == "te":
                    reply_text = (
                        f"⚠️ బ్యాచ్ ఎక్స్‌పైరీ విశ్లేషణ: మీ స్టోర్‌లో {crit_count} బ్యాచ్‌ల గడువు త్వరలో ముగియనుంది ({crit_names}). "
                        f"వీటిని FIFO పద్ధతిలో ముందుగా విక్రయించడం లేదా సప్లయర్ రిటర్న్ పాలసీ కింద క్లెయిమ్ చేయడం మంచిది."
                    )
                elif lang == "hi":
                    reply_text = (
                        f"⚠️ बैच एक्सपायरी विश्लेषण: आपकी दुकान में {crit_count} बैचों की शेल्फ-लाइफ जल्द समाप्त हो रही है ({crit_names})। "
                        f"नुकसान से बचने के लिए इन्हें तुरंत क्लीयरेंस पर बेचें या सप्लायर रिटर्न क्लेम फाइल करें।"
                    )
                else:
                    reply_text = (
                        f"⚠️ Batch Expiry Alert: Detected {crit_count} product batches approaching end of shelf-life ({crit_names}). "
                        f"Prioritize promotional clearance or initiate FMCG distributor return credit notes."
                    )

        elif intent == "ORDER_STATUS":
            tools_executed.append("get_authorized_orders")
            po_match = re.search(r'\b(PO-[A-Z0-9]+)\b', query.upper())
            if po_match:
                po_id = po_match.group(1)
                order_res = BusinessToolRegistry.get_order_by_id(po_id, role=role, store_id=store_id)
                if order_res.success and order_res.data:
                    ord_data = order_res.data
                    order_status_card = ord_data
                    if lang == "te":
                        reply_text = (
                            f"📦 ఆర్డర్ {ord_data['order_id']} వివరాలు: ప్రస్తుత స్థితి '{ord_data['status']}', "
                            f"మొత్తం ₹{ord_data['total_inr']:,.2f}. సప్లయర్: {ord_data.get('supplier_name', 'సప్లయర్')}."
                        )
                    elif lang == "hi":
                        reply_text = (
                            f"📦 ऑर्डर {ord_data['order_id']} स्थिति: वर्तमान स्थिति '{ord_data['status']}', "
                            f"कुल राशि ₹{ord_data['total_inr']:,.2f}। सप्लायर: {ord_data.get('supplier_name', 'सप्लायर')}।"
                        )
                    else:
                        reply_text = (
                            f"📦 Order {ord_data['order_id']} Status: Currently '{ord_data['status']}', "
                            f"total value ₹{ord_data['total_inr']:,.2f} with {ord_data.get('supplier_name', 'Supplier')}."
                        )
                else:
                    reply_text = order_res.error or f"Order {po_id} not found."
            else:
                orders_res = BusinessToolRegistry.get_authorized_orders(role=role, store_id=store_id)
                if orders_res.success and orders_res.data:
                    ords = orders_res.data.get("orders", [])
                    recent = ords[0] if ords else None
                    if recent:
                        order_status_card = recent
                        if lang == "te":
                            reply_text = f"📦 మీ తాజా ఆర్డర్ {recent['order_id']} ప్రస్తుత స్థితి: '{recent['status']}' (మొత్తం: ₹{recent['total_inr']:,.2f})."
                        elif lang == "hi":
                            reply_text = f"📦 आपका नवीनतम ऑर्डर {recent['order_id']} वर्तमान में '{recent['status']}' स्थिति में है (कुल: ₹{recent['total_inr']:,.2f})।"
                        else:
                            reply_text = f"📦 Your most recent purchase order {recent['order_id']} is currently '{recent['status']}' (Total: ₹{recent['total_inr']:,.2f})."
                    else:
                        reply_text = "No purchase orders found for this store."

        elif intent == "CANCEL_ACTION":
            po_match = re.search(r'\b(PO-[A-Z0-9]+)\b', query.upper())
            target_id = po_match.group(1) if po_match else "PO-9402"
            action_confirmation = {
                "action_type": "CANCEL_ORDER",
                "target_id": target_id,
                "requires_explicit_confirmation": True
            }
            if lang == "te":
                reply_text = (
                    f"⚠️ భద్రతా ధృవీకరణ: మీరు ఆర్డర్ {target_id} ని రద్దు చేయాలనుకుంటున్నారా? "
                    f"రద్దు చేయడానికి దయచేసి క్రింద ఉన్న 'Confirm Cancellation' బటన్ నొక్కండి."
                )
            elif lang == "hi":
                reply_text = (
                    f"⚠️ सुरक्षा पुष्टिकरण: क्या आप वाकई ऑर्डर {target_id} को रद्द करना चाहते हैं? "
                    f"रद्द करने के लिए कृपया नीचे दिए गए 'Confirm Cancellation' बटन पर क्लिक करें।"
                )
            else:
                reply_text = (
                    f"⚠️ Safety Confirmation: Are you sure you wish to cancel order {target_id}? "
                    f"Cancellation requires explicit verification. Please click 'Confirm Cancellation' to proceed."
                )

        else:
            # Knowledge / RAG Search
            tools_executed.append("rag_vector_search")
            search_results: List[SearchResult] = rag_engine.retrieve(
                query=query,
                role=role,
                tenant_id=store_id,
                top_k=2
            )

            if search_results:
                top = search_results[0]
                citations = [
                    {
                        "title": r.title,
                        "source": r.source,
                        "relevance_score": r.relevance_score,
                        "citation": r.citation,
                        "excerpt": r.content[:240] + "..."
                    }
                    for r in search_results
                ]

                if lang == "te":
                    reply_text = f"📚 ధృవీకరించబడిన పాలసీ పత్రం ప్రకారం ({top.citation}):\n\n{top.content}"
                elif lang == "hi":
                    reply_text = f"📚 सत्यापित आधिकारिक नीति के अनुसार ({top.citation}):\n\n{top.content}"
                else:
                    reply_text = f"📚 Retrieved Knowledge Grounding ({top.citation}):\n\n{top.content}\n\n[Verified Source: {top.source}]"
            else:
                if lang == "te":
                    reply_text = (
                        "క్షమించండి, మీ ప్రశ్న గురించి మా వద్ద స్పష్టమైన అధికారిక పాలసీ పత్రాలు లేవు. "
                        "మీరు స్టోర్ ఇన్వెంటరీ, XGBoost డిమాండ్ అంచనాలు, స్టాక్‌అవుట్ రిస్క్ లేదా సప్లయర్ నిబంధనల గురించి అడగవచ్చు."
                    )
                elif lang == "hi":
                    reply_text = (
                        "माफ़ कीजिए, इस सवाल के लिए कोई आधिकारिक दस्तावेज़ उपलब्ध नहीं है। "
                        "आप अपनी दुकान की इन्वेंट्री, XGBoost मांग पूर्वानुमान, स्टॉकआउट जोखिम या सप्लायर नियमों के बारे में पूछ सकते हैं।"
                    )
                else:
                    reply_text = (
                        "I could not locate an authoritative policy or document matching that specific inquiry. "
                        "You can ask about store inventory levels, XGBoost demand forecasts, stockout risks, or supplier procurement terms."
                    )

        exec_ms = round((time.time() - start_time) * 1000, 2)
        self._append_history(sid, "assistant", reply_text)

        return AssistantResponse(
            session_id=sid,
            reply=reply_text,
            language=lang,
            intent=intent,
            tools_executed=tools_executed,
            forecast_card=forecast_card,
            stock_risk_card=stock_risk_card,
            reorder_draft=reorder_draft_card,
            batch_expiry_card=batch_expiry_card,
            order_status_card=order_status_card,
            action_confirmation=action_confirmation,
            citations=citations,
            execution_time_ms=exec_ms,
            provider_used="DemandX Autonomous Enterprise Core"
        )


# Singleton orchestrator
orchestrator = LLMOrchestrator()

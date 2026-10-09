# ⚡ DEMANDX — Smart Payment & AI Market Demand Intelligence Platform

> **"Predict Today. Prepare Tomorrow."**
> 
> *An AI-Powered FMCG Market Demand Forecasting Engine, Inventory Risk Intelligence System, and VyaPulse Khata Credit Platform for Next-Gen Retail & Supply Chains across India.*

---

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Regressor-FF6600?logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Checkout_SDK-0C2340?logo=razorpay&logoColor=white)](https://razorpay.com/)

---

## 📌 Executive Summary

**DemandX** is an end-to-end, multi-persona market intelligence and smart payment platform designed specifically for the complex, fragmented Indian retail and FMCG supply chain. 

In traditional Indian trade, Kirana store owners, Mandi merchants, regional suppliers, and FMCG brand manufacturers operate in silos. Retailers rely on historical intuition and guesswork to stock essentials, leading to catastrophic **stockouts** of high-demand items during local festivals or rainy seasons, alongside **capital-blocking overstock** of slow-moving inventory. Concurrently, traditional **Khata (credit)** purchases are managed manually without real-time financial boundaries or digital repayment tracking.

**DemandX solves this by bridging transaction intelligence with machine learning.** It captures consumer purchase signals at the retail point-of-sale (via **Smart Checkout** and **VyaPulse Credit**), streams real-time demand data through a **FastAPI backend**, processes multi-variable scenario inputs via a **trained XGBoost ML model ($R^2 = 0.9626$)**, and propagates actionable demand signals upstream to regional suppliers and FMCG manufacturers.

---

## 🚨 The Real-World Problem & Why It Matters

### The Indian Retail & Supply Chain Crisis
India's retail landscape comprises over 12 million Kirana stores and Mandi traders handling $80\%+$ of the nation's FMCG distribution. However, the ecosystem suffers from four critical systemic flaws:

1. **Reactive Inventory Management**: Retailers order stock *after* shelves run empty rather than anticipating demand based on weather, city footfalls, regional festivals, or competitor pricing.
2. **Capital Lockup & Waste**: Overstocking slow-moving SKUs ties up vital working capital, while perishable essentials degrade before sale.
3. **Upstream Blindness**: Regional distributors and FMCG manufacturers lack visibility into real-time retail demand signals, causing bullwhip effects and factory production misalignments.
4. **Disconnected Credit Systems**: Traditional Khata registers record ledger entries manually without credit-capacity boundaries, automated repayment flows, or financial safeguards.

### Problem vs. DemandX Response Matrix

| Pain Point | Who Suffers | Current Consequence | DemandX AI Response |
| :--- | :--- | :--- | :--- |
| **Demand Volatility** | Kirana Retailers | Unpredictable stockouts during festivals/rain | Real-time **XGBoost ML demand prediction** considering weather, season, & local events |
| **Locked Working Capital** | Small Retailers | Capital blocked in overstocked SKUs | **Inventory Risk Decision Layer** identifying overstock & recommended clearance items |
| **Upstream Blindness** | Regional Suppliers | Delayed bulk procurement & stock hoarding | **Automated Demand Transmission** from customer checkouts to supplier dashboards |
| **Disconnected Khata** | Customers & Retailers | Manual ledger disputes & unmonitored credit | **VyaPulse Smart Credit Engine** with real-time limit tracking & Razorpay repayment |
| **Production Misalignment**| FMCG Manufacturers | Plant over-production or raw material shortage | **Aggregated Regional Demand Insights** for factory capacity planning |

---

## 👥 Our Target Stakeholders

### 1. 🛍️ Customer / Consumer
* **Need**: Seamless purchase of daily essentials with transparent digital Khata credit and multiple payment choices.
* **DemandX Capability**: Access to **Smart Basket**, multi-option **Smart Checkout** (VyaPulse Credit, UPI, Cards, Cash), and instant digital **Khata Repayment** via Razorpay.

### 2. 🏪 Kirana Retailer / Mandi Merchant
* **Need**: Elimination of stockouts, optimized safety stock, automated reorder recommendations, and credit boundary protection.
* **DemandX Capability**: **Live Demand Predictor**, SKU risk scoring (Stockout / Overstock), inventory procurement workflows, and VyaPulse credit limit enforcement.

### 3. 🚚 Regional Supplier / Wholesale Distributor
* **Need**: Early visibility into retail order signals across regional hubs (e.g., Vijayawada, Guntur, Visakhapatnam) to streamline bulk sourcing.
* **DemandX Capability**: **Regional Demand Signal Dashboard**, bulk order fulfillment tracking, and geographic demand heatmaps.

### 4. 🏭 FMCG Brand Manufacturer
* **Need**: National and state-level demand insights to optimize factory production runs, plant capacity, and raw material procurement.
* **DemandX Capability**: **Manufacturer Analytics Portal**, plant capacity utilization forecasting, and category-level growth tracking.

### 5. 🍽️ Commercial & Business Buyers (HoReCa)
* **Need**: Bulk purchases of staples (Atta, Rice, Cooking Oil, Spices) with dependable credit availability.
* **DemandX Capability**: Bulk quantity cart management with transparent VyaPulse Khata limit enforcement.

---

## 💡 The DemandX Solution & Feedback Loop

DemandX operates as a continuous, closed-loop intelligence ecosystem connecting every node of the retail supply chain:

```
┌────────────────────────┐      Customer Checkout      ┌────────────────────────┐
│   Customer / Buyer     │ ──────────────────────────> │   Kirana Retailer      │
└────────────────────────┘                             └────────────────────────┘
            ▲                                                       │
            │ Restores Available Credit                             │ Transmits Live Demand Signals
            │                                                       ▼
┌────────────────────────┐      FastAPI / XGBoost      ┌────────────────────────┐
│  VyaPulse Repayment    │ <────────────────────────── │  AI Prediction Engine  │
└────────────────────────┘                             └────────────────────────┘
            ▲                                                       │
            │ Bulk Reorder Dispatch                                 │ Regional Sourcing Insights
            │                                                       ▼
┌────────────────────────┐                             ┌────────────────────────┐
│   FMCG Manufacturer    │ <────────────────────────── │   Regional Supplier    │
└────────────────────────┘     Factory Production      └────────────────────────┘
```

---

## 💳 VyaPulse Smart Credit & Khata Limit System

The **VyaPulse Credit System** digitizes traditional Indian *Khata* purchasing while introducing strict financial safety rules and digital repayment flows:

### 1. Financial Mechanics & Formulas
* **Credit Limit ($C_L$)**: Total credit capacity assigned to a user (e.g., ₹10,000).
* **Used Credit / Outstanding ($C_U$)**: Current outstanding debt accrued from credit purchases.
* **Available Credit ($C_A$)**: 
  $$C_A = C_L - C_U$$
* **Per-Transaction Purchasing Rule**:
  $$\text{Basket Total } (T) \le \min(C_A, \text{₹4,000})$$
  * *If $T \le \min(C_A, \text{₹4,000})$*: VyaPulse Credit purchase is **allowed**. Outstanding credit increases ($C_U \leftarrow C_U + T$), reducing Available Credit ($C_A \leftarrow C_L - C_U$).
  * *If $T > \text{₹4,000}$ or $T > C_A$*: VyaPulse Credit is **blocked** immediately prior to order submission. A clear warning guides the user to select an alternative payment method (**UPI, Cards, Cash**).

### 2. Digital Repayment & Balance Restoration
* Customers can initiate partial or full outstanding repayments using **Razorpay** (UPI, Google Pay, Cards, Net Banking).
* Upon verified repayment ($R$):
  $$C_U \leftarrow \max(0, C_U - R)$$
  $$C_A \leftarrow C_L - C_U$$
* *Credit limit ($C_L$) remains constant; available capacity is restored up to $C_L$.*

> ⚠️ **Regulatory & Compliance Disclaimer**: VyaPulse as presented in this hackathon prototype is a software technology demonstration of credit tracking and payment flow logic. Any real-world commercial deployment of credit, BNPL, or lending facilities requires partnerships with RBI-regulated Banks or NBFCs, strict KYC compliance, and adherence to Indian digital payment and lending guidelines.

---

## 🤖 AI / ML Machine Learning Architecture

The DemandX prediction engine uses a trained **XGBoost Regressor** pipeline to forecast unit sales demand (`Units_Sold_Demand`).

```
Raw Input Data (Excel/JSON)
  │
  ├──► Categorical Preprocessing (One-Hot Encoding: 12 Features)
  │    (Product_Name, Category, Brand, State, City, Region, City_Tier, Season, Festival_Event, Weather, Promotion, Day)
  │
  ├──► Numerical Preprocessing (Imputation & StandardScaler: 18 Features)
  │    (Month, Year, Week, Weekend, Holiday, Temp, Rainfall, Humidity, Price, MRP, Discount, Competitor_Price, Stock, Footfall, Lead_Time, Prev_Day_Demand, 7_Day_Avg, 30_Day_Avg)
  │
  ▼
XGBoost Regressor Model (trained on 10,000 Indian market records)
  │
  ▼
Predicted Demand Units (Units_Sold_Demand)
  │
  ├──► Demand Level Classification (LOW < 50 | MEDIUM 50-150 | HIGH > 150)
  ├──► Recommended Safety Stock (Predicted Demand × 1.15)
  └──► Recommended Reorder Qty (max(0, Recommended Safety Stock - Opening Stock))
```

### Model Performance & Evaluation Benchmarking

| Metric | Random Forest Regressor | **XGBoost Regressor (Champion)** |
| :--- | :---: | :---: |
| **$R^2$ Score (Accuracy)** | $0.9412$ | **$0.9626$** |
| **Mean Absolute Error (MAE)** | $13.48$ units | **$10.62$ units** |
| **Root Mean Squared Error (RMSE)** | $18.25$ units | **$14.19$ units** |
| **Train/Test Split** | Time-based 80/20 | **Time-based 80/20** |
| **Data Leakage Guard** | Excluded `Closing_Stock` & `Stockout` | **Excluded `Closing_Stock` & `Stockout`** |

---

## 🧠 Planned RAG / Generative AI Intelligence Layer

To complement quantitative XGBoost predictions, DemandX includes an architectural specification for a **Retrieval-Augmented Generation (RAG)** Assistant:

* **Ingestion Layer**: Ingests daily store invoices, Mandi price lists, regional weather alerts, and customer purchase histories.
* **Vector Store & Embeddings**: Stores chunked contextual vectors (using `pgvector` or `FAISS`).
* **LLM Reasoning**: Allows store owners to query in natural language:
  * *"Why did Tomato demand double in Vijayawada this week?"*
  * *"Which 3 SKUs should I put on discount to clear overstock before Friday?"*

*(Note: The frontend currently includes a interactive UI demonstration in `src/pages/AIAssistantPage.tsx` & `src/components/AIChatWidget.tsx`. Full backend vector pipeline integration is detailed on the roadmap).*

---

## 🏗️ Complete System Architecture

```mermaid
graph TD
    User[User / Client Browser] -->|React 19 + TypeScript + Vite| Frontend[DemandX Frontend App]
    
    subgraph Frontend Components
        AuthCtx[AuthContext / Firebase Auth]
        CustCtx[CustomerContext / VyaPulse State]
        SCContext[SupplyChainContext / Orders]
        Checkout[CheckoutModal + Razorpay SDK]
    end

    Frontend --> AuthCtx
    Frontend --> CustCtx
    Frontend --> SCContext
    Frontend --> Checkout

    Checkout -->|Razorpay Payment Callback| RazorpayService[services/razorpayService.ts]
    Frontend -->|HTTP REST Fetch| APIClient[services/api.ts]

    subgraph Backend Services
        APIClient -->|POST /api/predict-demand| FastAPI[FastAPI App / backend/main.py]
        APIClient -->|GET /api/health| FastAPI
        FastAPI -->|Load Artifact| Joblib[ml/models/demand_model.pkl]
        Joblib --> Preproc[DemandXPreprocessor]
        Joblib --> XGBModel[XGBoost Model]
    end

    subgraph Database & Cloud
        AuthCtx -->|OAuth / Password| FirebaseAuth[Firebase Auth]
        SCContext -->|Persist Orders & Signals| Firestore[Cloud Firestore Database]
    end
```

---

## 📊 End-to-End User Flow Execution

```
[1. User Sign In] ──> Select Persona (Retailer / Customer / Supplier / Manufacturer)
        │
[2. Browse Catalog] ──> Add Items to Smart Basket (No cart price limits)
        │
[3. Open Checkout] ──> Select Payment Method
        │
        ├──► IF VyaPulse Credit Selected:
        │         ├── Total ≤ ₹4,000 & ≤ Available Credit ──> [Approve Purchase] ──> [Deduct Credit & Log Order]
        │         └── Total > ₹4,000 ──> [BLOCK Transaction] ──> [Display Limit Warning] ──> [User Selects UPI/Card]
        │
        └──► IF Pay Online (Razorpay) Selected:
                  └── Complete Razorpay Modal ──> [Verify Signature] ──> [Confirm Order & Log Demand Signal]
        │
[4. Supply Chain Impact] ──> Retailer Inventory Auto-Deducted ──> Demand Transmitted to Regional Supplier
```

---

## 🛠️ Technology Stack Table

| Layer | Technology | Purpose in DemandX | Evidence / File Location |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript | Reactive SPA interface and role dashboards | `src/App.tsx`, `package.json` |
| **Build Tool** | Vite 8.3 | HMR development & optimized ES bundle build | `vite.config.ts` |
| **Styling** | TailwindCSS 4, Lucide Icons | Modern dark-mode & glassmorphism UI | `src/index.css` |
| **Charts & Viz** | Recharts | Dynamic inventory & demand forecasting charts | `src/components/InventoryDecisionLayer.tsx` |
| **Backend API** | Python 3.12, FastAPI, Uvicorn | RESTful API backend serving ML inference | `backend/main.py` |
| **ML Engine** | XGBoost, Scikit-learn, Pandas | Machine learning preprocessing & regressor | `ml/train_model.py`, `ml/predict.py` |
| **ML Storage** | Joblib | Model pipeline serialization (`demand_model.pkl`) | `ml/models/demand_model.pkl` |
| **Auth & Database**| Firebase Auth, Firestore | User authentication & persistent state | `src/services/firebase.ts`, `firestoreService.ts` |
| **Payments** | Razorpay Checkout SDK v1 | Digital payments & Khata repayment flow | `src/services/razorpayService.ts` |

---

## 📁 Repository Directory Structure

```
Demandx/
├── backend/
│   └── main.py                   # FastAPI REST server & prediction API endpoints
├── ml/
│   ├── data/
│   │   └── DemandX_India_Datasets_10000 final.xlsx # 10k Indian FMCG market dataset
│   ├── models/
│   │   └── demand_model.pkl      # Serialized XGBoost model & preprocessor artifact
│   ├── train_model.py            # Automated ML preprocessing & training pipeline
│   ├── predict.py                # Standalone inference module & test scenarios
│   └── README.md                 # Detailed ML technical documentation
├── src/
│   ├── components/               # UI components (CheckoutModal, VyaPulseCard, RepaymentModal, etc.)
│   ├── contexts/                 # State management (CustomerContext, SupplyChainContext, AuthContext)
│   ├── data/                     # FMCG product catalogs & regional scenario datasets
│   ├── pages/                    # Role dashboards (Retailer, Supplier, Manufacturer, Customer)
│   └── services/                 # API clients (`api.ts`), Razorpay SDK, Firebase integrations
├── .env                          # Environment configuration template
├── .gitignore                    # Production git exclusion rules
├── .python-version               # Python runtime specification (3.12)
├── package.json                  # Node dependencies & npm scripts
└── vite.config.ts                # Vite build configuration
```

---

## 📋 Comprehensive Internal Feature Inventory Audit

| Feature Module | Implementation Status | Evidence / Location | Description |
| :--- | :---: | :--- | :--- |
| **VyaPulse Credit & Khata Engine** | ✅ **FULLY IMPLEMENTED** | `CustomerContext.tsx`, `VyaPulseCard.tsx` | Atomic tracking of Credit Limit, Used, and Available capacity. |
| **VyaPulse ₹4,000 Transaction Block** | ✅ **FULLY IMPLEMENTED** | `CheckoutModal.tsx#L40`, `CustomerContext.tsx#L294` | Pre-submission block when order total exceeds ₹4,000. |
| **Razorpay Payment Integration** | ✅ **FULLY IMPLEMENTED** | `razorpayService.ts`, `CheckoutModal.tsx` | SDK loading, payment execution, and signature verification. |
| **Digital Khata Repayment Modal** | ✅ **FULLY IMPLEMENTED** | `RepaymentModal.tsx` | Digital repayment flow restoring available credit capacity. |
| **Checkout Session Reset** | ✅ **FULLY IMPLEMENTED** | `CheckoutModal.tsx#L23-L30` | Auto-resets session state on modal opening, fixing state leak bug. |
| **FastAPI Backend Server** | ✅ **FULLY IMPLEMENTED** | `backend/main.py` | REST API with `/api/health` and `/api/predict-demand`. |
| **XGBoost ML Pipeline** | ✅ **FULLY IMPLEMENTED** | `ml/train_model.py`, `ml/models/demand_model.pkl` | Trained model ($R^2 = 0.9626$) on 10,000 Indian FMCG dataset. |
| **Inventory Risk Decision Layer** | ✅ **FULLY IMPLEMENTED** | `InventoryDecisionLayer.tsx`, `inventoryDecisionService.ts` | Automated risk scoring for stockouts, overstock, and clearance. |
| **Multi-Persona Dashboards** | ✅ **FULLY IMPLEMENTED** | `RetailerDashboard.tsx`, `SupplierDashboard.tsx`, etc. | Dedicated interfaces for Retailer, Supplier, Manufacturer, Customer. |
| **Firebase Auth & Registration Safety** | ✅ **FULLY IMPLEMENTED** | `AuthContext.tsx`, `LoginPage.tsx` | Persona registry preventing repeat Google registration error. |
| **RAG Assistant & Vector Store** | ⚪ **PLANNED ROADMAP** | `AIAssistantPage.tsx`, `AIChatWidget.tsx` | Frontend UI demonstration active; full vector pipeline on roadmap. |
| **OCR Invoices & Bill Ingestion** | ⚪ **PLANNED ROADMAP** | Conceptual Architecture | Automated bill parsing planned for future release. |

---

## ⚔️ Key Differentiators & Competitive Positioning

| Feature Dimension | Traditional POS | Standard Khata Apps | Legacy ERPs | **DemandX Platform** |
| :--- | :---: | :---: | :---: | :---: |
| **Demand Forecasting** | ❌ None | ❌ None | ⚠️ Basic History | ✅ **AI ML Scenario Prediction ($R^2=0.9626$)** |
| **Inventory Risk Alerts** | ❌ None | ❌ None | ⚠️ Manual Thresholds | ✅ **Automated Stockout & Overstock Scoring** |
| **Credit Boundaries** | ❌ None | ⚠️ Manual Notes | ❌ None | ✅ **VyaPulse Real-Time Limit Enforcement** |
| **Digital Repayments** | ❌ None | ⚠️ Static QR Link | ❌ None | ✅ **Integrated Razorpay SDK Settlement** |
| **Upstream Signal Flow** | ❌ None | ❌ None | ⚠️ Expensive EDI | ✅ **Automated Customer-to-Supplier Propagation** |
| **Affordability for SMEs** | ✅ Low Cost | ✅ Free / Low | ❌ Extremely High | ✅ **SaaS Model Tailored for Kirana Stores** |

---

## 💼 Business Model & Startup Potential

DemandX is architected with a sustainable B2B SaaS + Fintech revenue strategy:

1. **Kirana Retailer SaaS Subscription**: Tiered monthly subscription (₹499 – ₹1,499/month) providing ML demand predictions, inventory risk intelligence, and automated reordering.
2. **Supplier & Distributor Enterprise Intelligence**: High-value analytics subscription for regional wholesale distributors seeking demand heatmaps and SKU trend forecasting.
3. **Fintech Payment & Credit Facilitation**: Commission/MDR share from digital payment settlements and partnerships with licensed NBFC/Bank partners for VyaPulse Khata credit clearing.

---

## 🔒 Security, Reliability & Production Hardening Audit

* **Credential Protection**: `.gitignore` strictly excludes `.env`, `.venv/`, `node_modules/`, `dist/`, `__pycache__/`, `*.pyc`, and Firebase service account JSON files.
* **Secret Isolation**: Frontend code accesses public credentials (`VITE_RAZORPAY_KEY_ID`, `VITE_API_BASE_URL`) via `import.meta.env`. Private server secrets (`RAZORPAY_KEY_SECRET`) reside exclusively on backend environments.
* **Error Resilience**: `src/services/api.ts` implements an intelligent client-side fallback estimator if the FastAPI server is temporarily unreachable.

---

## 🚦 Product Roadmap

```
Phase 1: Hackathon Core Engine (CURRENT)
  ├── React 19 Frontend + Role Dashboards
  ├── FastAPI Backend + XGBoost ML Pipeline (R² = 0.9626)
  └── VyaPulse Khata Credit Engine + Razorpay SDK Integration

Phase 2: Fintech & RBI Compliance Bridge (Months 1–3)
  ├── NBFC / RBI Licensed Banking Partner API Integration
  └── e-KYC & CIPA Automated Credit Scoring Integration

Phase 3: Deep AI & RAG Invoice Processing (Months 4–6)
  ├── Multi-lingual Voice & WhatsApp Ordering Bot
  └── OCR Bill Scanner & Vector Search RAG Pipeline

Phase 4: Ecosystem Scale & Multi-Mandi Expansion (Months 7–12)
  └── Multi-store Kirana Franchise Network & Cross-State Logistics Tracking
```

---

## 📈 Impact Metrics & KPIs

| Metric / KPI | Measured in Prototype / Benchmark | Target KPI for Live Commercial Pilot |
| :--- | :---: | :---: |
| **Demand Prediction Accuracy ($R^2$)** | **$0.9626$ ($96.26\%$)** | $> 92.0\%$ in live retail environments |
| **Prediction Mean Absolute Error (MAE)** | **$10.62$ units** | $< 12.0$ units per SKU |
| **Stockout Incidents Reduction** | Simulated $35\%$ reduction | Target $40\%$ reduction in pilot stores |
| **Working Capital Optimization** | Simulated $22\%$ overstock reduction | Target $25\%$ reduction in idle stock |
| **Checkout & Repayment Speed** | $< 2$ seconds transaction log | $< 3$ seconds digital settlement |

---

## 💻 Local Development & Execution Guide

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/your-org/demandx.git
cd demandx
```

### 2. Frontend Development Server

```bash
# Install Node dependencies
npm install

# Run Vite dev server
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

### 3. FastAPI Machine Learning Backend

```bash
# Install Python dependencies
pip install fastapi uvicorn xgboost scikit-learn pandas numpy joblib pydantic

# Launch FastAPI backend
uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```
*FastAPI runs at `http://127.0.0.1:8001` with API docs at `http://127.0.0.1:8001/docs`.*

### 4. Build Verification

```bash
# Execute TypeScript check & Vite production build
npm run build
```

---

## 📄 License & Project Metadata

* **Project**: DemandX — Smart Payment & AI Market Demand Intelligence Platform
* **Tagline**: *"Predict Today. Prepare Tomorrow."*
* **License**: MIT License
* **Development Status**: Prototype / Hackathon Production-Grade Release

---

*Built with ❤️ for Indian Retailers, Mandi Merchants, Suppliers, and Manufacturers.*

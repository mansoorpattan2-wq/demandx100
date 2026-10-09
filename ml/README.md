# DemandX Machine Learning Pipeline 🔮✨

AI-powered Market Demand Intelligence pipeline for **DemandX** ("Predict Today. Prepare Tomorrow."). This module predicts item demand (`Units_Sold_Demand`) for FMCG, staples, cooking oil, dairy, and grocery commodities across Indian states, cities, and supply chain hubs.

---

## 📁 Directory Architecture

```
ml/
├── data/
│   └── DemandX_India_Datasets_10000 final.xlsx  # Source Excel Dataset
├── models/
│   └── demand_model.pkl                          # Saved Model & Preprocessing Pipeline
├── train_model.py                                # Model Training & Evaluation Pipeline
├── predict.py                                    # Reusable Inference Module & Predictor
├── requirements.txt                              # Python Dependencies
└── README.md                                     # Pipeline Documentation
```

---

## 🛠️ 1. How to Install Dependencies

Ensure Python 3.9+ is installed on your environment, then run:

```bash
# Install required Python packages
python -m pip install -r ml/requirements.txt
```

### Dependencies Included:
- `pandas` & `openpyxl`: Excel dataset processing & feature extraction
- `numpy`: Matrix operations & metric computations
- `scikit-learn`: Feature scaling & evaluation metrics
- `xgboost`: Extreme Gradient Boosting machine learning engine
- `joblib`: Model artifact serialization

---

## 🚀 2. How to Train the Model

To execute the complete training pipeline, run:

```bash
python ml/train_model.py
```

### What `train_model.py` Does:
1. **Data Loading & Inspection**: Reads the `Demand_Model` sheet from `ml/data/*.xlsx`.
2. **Data Leakage Guard**: Explicitly drops `Closing_Stock`, `Stockout`, and `Recommended_Reorder_Qty` to prevent lookahead data leakage.
3. **Time-Based Train/Test Split**: Chronologically sorts data by `Date` and performs an 80/20 time-based split (8,000 historical rows for training, 2,000 recent rows for evaluation).
4. **Automated Preprocessing**:
   - One-Hot Encodes 12 categorical features (`Product_Name`, `Category`, `Brand`, `State`, `City`, `Region`, `City_Tier`, `Season`, `Festival_Event`, `Weather`, `Promotion`, `Day`).
   - Imputes & StandardScales 18 numerical features (`Month`, `Year`, `Week`, `Weekend`, `Holiday`, `Temperature_C`, `Rainfall_mm`, `Humidity_pct`, `Selling_Price_INR`, `MRP_INR`, `Discount_pct`, `Competitor_Price_INR`, `Opening_Stock`, `Customer_Footfall`, `Lead_Time_Days`, `Prev_Day_Demand`, `7_Day_Avg_Demand`, `30_Day_Avg_Demand`).
5. **Model Benchmarking**: Trains and evaluates:
   - **Random Forest Regressor**
   - **XGBoost Regressor**
6. **Evaluation Metrics**: Computes **MAE**, **RMSE**, and **R² Score**.
7. **Champion Selection & Saving**: Automatically selects the best-performing model (XGBoost with **R² = 0.9626**, **MAE = 10.62 units**) and serializes the complete pipeline.

---

## 💾 3. Where the Trained Model is Saved

The serialized model artifact is saved at:

```
ml/models/demand_model.pkl
```

### Saved Artifact Contents:
- `preprocessor`: Trained `DemandXPreprocessor` object containing One-Hot feature maps and numerical scalers.
- `model`: Trained champion XGBoost model booster object.
- `model_name`: `"XGBoost Regressor"`
- `best_metrics`: MAE, RMSE, and R² validation scores.
- `categorical_features` & `numerical_features`: Feature schemas.
- `trained_at`: Timestamp of training execution.

---

## 🔮 4. How to Make a Sample Prediction

### Option A: Run Standalone Demo
Run the prediction script directly to see sample predictions across Indian cities:

```bash
python ml/predict.py
```

### Option B: Use as Python Module in Code

```python
from ml.predict import predict_demand

# Define scenario dictionary
sample_input = {
    "Product_Name": "Fortune Sunflower Oil 1L",
    "Category": "Cooking Oil",
    "Brand": "Adani Wilmar",
    "State": "Karnataka",
    "City": "Bengaluru",
    "Region": "South",
    "City_Tier": "Metro",
    "Season": "Monsoon",
    "Festival_Event": "None",
    "Weather": "Rainy",
    "Promotion": "Yes",
    "Day": "Friday",
    "Month": 7,
    "Year": 2026,
    "Week": 28,
    "Weekend": 0,
    "Holiday": 0,
    "Temperature_C": 24.5,
    "Rainfall_mm": 12.5,
    "Humidity_pct": 85,
    "Selling_Price_INR": 145.0,
    "MRP_INR": 155.0,
    "Discount_pct": 6,
    "Competitor_Price_INR": 150.0,
    "Opening_Stock": 200,
    "Customer_Footfall": 850,
    "Lead_Time_Days": 4,
    "Prev_Day_Demand": 62,
    "7_Day_Avg_Demand": 58.4,
    "30_Day_Avg_Demand": 54.2
}

# Predict predicted demand units
predicted_units = predict_demand(sample_input)
print(f"Predicted Market Demand: {predicted_units} units")
```

---

## 🔌 5. Connecting Model to DemandX Backend / REST API

The ML pipeline is designed for backend integration (e.g. FastAPI / Flask / Node.js Express microservice).

### Architecture Flow:
```
[Frontend Dashboard / UI] ──(HTTP POST /api/predict)──> [Backend REST API]
                                                            │
                                                     Calls predict_demand()
                                                            │
                                                            ▼
[Predicted Demand Units] <──(JSON Response { demand })─── [ml/models/demand_model.pkl]
```

### Example FastAPI Backend Endpoint (`server.py`):

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ml.predict import predict_demand

app = FastAPI(title="DemandX Intelligence API")

class DemandPredictionRequest(BaseModel):
    Product_Name: str
    Category: str
    Brand: str
    State: str
    City: str
    Region: str
    City_Tier: str
    Season: str
    Festival_Event: str = "None"
    Weather: str = "Clear"
    Promotion: str = "No"
    Day: str = "Monday"
    Month: int = 1
    Year: int = 2026
    Selling_Price_INR: float
    MRP_INR: float
    Discount_pct: float = 0
    Customer_Footfall: int = 500
    Prev_Day_Demand: float = 50.0

@app.post("/api/predict")
def predict(request: DemandPredictionRequest):
    try:
        input_dict = request.dict()
        predicted_demand = predict_demand(input_dict)
        return {
            "status": "success",
            "predicted_demand_units": predicted_demand,
            "product": request.Product_Name,
            "city": request.City
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---
*DemandX ML Intelligence Engine — Predict Today. Prepare Tomorrow.* ✨

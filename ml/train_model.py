"""
DemandX Machine Learning Training Pipeline
==========================================
Predicts market demand (Units_Sold_Demand) for FMCG & grocery commodities in India.

Features & Guidelines:
1. Excel Sheet: 'Demand_Model' sheet from DemandX_India_Datasets_10000.xlsx.
2. Leakage Protection: Excludes 'Closing_Stock', 'Stockout', 'Recommended_Reorder_Qty'.
3. Time-Based Split: Sorts data chronologically (80% past train, 20% recent test).
4. Preprocessing: Automated categorical One-Hot Encoding & numerical scaling with default imputer.
5. Candidate Models: Random Forest Regressor & XGBoost Regressor.
6. Serialization: Saves model artifact & pipeline to ml/models/demand_model.pkl via joblib.
"""

import os
import sys
import glob
import time
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import xgboost as xgb

# Register current module as 'train_model' for pickle/joblib serialization compatibility
sys.modules['train_model'] = sys.modules[__name__]

# Force UTF-8 output stdout encoding for Windows console compatibility
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


# =====================================================================
# METRIC FUNCTIONS
# =====================================================================
def calc_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Calculates Mean Absolute Error."""
    return float(np.mean(np.abs(y_true - y_pred)))


def calc_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Calculates Root Mean Squared Error."""
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def calc_r2(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Calculates R² Coefficient of Determination."""
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    return float(1.0 - (ss_res / ss_tot)) if ss_tot != 0 else 0.0


# =====================================================================
# REUSABLE PREPROCESSOR CLASS
# =====================================================================
class DemandXPreprocessor:
    """
    Preprocessing pipeline for categorical and numerical features.
    Saves category vocabularies, numerical medians, means, and standard deviations.
    Guarantees seamless single-dict or DataFrame prediction formatting.
    """
    __module__ = 'train_model'

    def __init__(self, cat_cols: list, num_cols: list):
        self.cat_cols = cat_cols
        self.num_cols = num_cols
        self.categories_ = {}
        self.num_medians_ = {}
        self.num_means_ = {}
        self.num_stds_ = {}
        self.feature_names_ = []

    def fit(self, df: pd.DataFrame):
        """Fits vocabulary and statistics from training dataset."""
        # Fit categorical vocabulary
        for c in self.cat_cols:
            if c in df.columns:
                unique_vals = sorted(df[c].dropna().astype(str).unique().tolist())
            else:
                unique_vals = []
            if 'None' not in unique_vals:
                unique_vals.append('None')
            self.categories_[c] = unique_vals

        # Fit numerical statistics
        for c in self.num_cols:
            if c in df.columns and not df[c].dropna().empty:
                med = float(df[c].median())
                mean = float(df[c].mean())
                std = float(df[c].std()) if df[c].std() != 0 else 1.0
            else:
                med, mean, std = 0.0, 0.0, 1.0
            self.num_medians_[c] = med
            self.num_means_[c] = mean
            self.num_stds_[c] = std

        # Build combined feature names
        self.feature_names_ = []
        for c in self.cat_cols:
            for val in self.categories_[c]:
                self.feature_names_.append(f"{c}_{val}")
        self.feature_names_.extend(self.num_cols)
        return self

    def transform(self, data) -> np.ndarray:
        """Transforms input DataFrame or dict into standardized numpy feature matrix."""
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        encoded_blocks = []

        # 1. One-Hot Encode Categoricals
        for c in self.cat_cols:
            if c in df.columns:
                col_vals = df[c].fillna('None').astype(str).values
            else:
                col_vals = np.array(['None'] * len(df))

            cat_list = self.categories_[c]
            val_to_idx = {v: i for i, v in enumerate(cat_list)}
            ohe = np.zeros((len(df), len(cat_list)), dtype=np.float32)

            for row_i, v in enumerate(col_vals):
                idx = val_to_idx.get(v, val_to_idx.get('None', 0))
                ohe[row_i, idx] = 1.0
            encoded_blocks.append(ohe)

        # 2. Impute & Scale Numericals
        num_matrix = np.zeros((len(df), len(self.num_cols)), dtype=np.float32)
        for idx_c, c in enumerate(self.num_cols):
            if c in df.columns:
                series = pd.to_numeric(df[c], errors='coerce').fillna(self.num_medians_[c]).values
            else:
                series = np.full(len(df), self.num_medians_[c], dtype=np.float32)

            mean_val = self.num_means_[c]
            std_val = self.num_stds_[c] if self.num_stds_[c] != 0 else 1.0
            scaled = (series - mean_val) / std_val
            num_matrix[:, idx_c] = scaled

        encoded_blocks.append(num_matrix)
        return np.hstack(encoded_blocks)


# =====================================================================
# DATASET LOADER & TRAIN/TEST SPLIT
# =====================================================================
def get_dataset_path() -> str:
    """Finds the DemandX Excel dataset in ml/data/."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, 'data')
    excel_files = glob.glob(os.path.join(data_dir, '*.xlsx'))
    
    if not excel_files:
        raise FileNotFoundError(
            f"No Excel file found in {data_dir}. "
            "Please ensure DemandX_India_Datasets_10000.xlsx is located inside ml/data/."
        )

    for f in excel_files:
        if 'DemandX_India_Datasets_10000' in os.path.basename(f):
            return f
    return excel_files[0]


def load_dataset(dataset_path: str):
    """Loads dataset from 'Demand_Model' sheet and prepares time-based split."""
    print(f"[*] Loading dataset file: {dataset_path}")
    xls = pd.ExcelFile(dataset_path)

    if 'Demand_Model' not in xls.sheet_names:
        raise ValueError(f"'Demand_Model' sheet missing. Available sheets: {xls.sheet_names}")

    df = pd.read_excel(xls, sheet_name='Demand_Model')
    print(f"[*] Dataset loaded. Shape: {df.shape[0]} rows x {df.shape[1]} columns")

    target_col = 'Units_Sold_Demand'
    leakage_cols = ['Closing_Stock', 'Stockout', 'Recommended_Reorder_Qty']

    if target_col not in df.columns:
        raise KeyError(f"Target column '{target_col}' not found in dataset.")

    # Guard against data leakage
    df = df.drop(columns=[c for c in leakage_cols if c in df.columns], errors='ignore')

    # Time-based sorting by Date
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date').reset_index(drop=True)

    cat_cols = [
        'Product_Name', 'Category', 'Brand', 'State', 'City', 'Region',
        'City_Tier', 'Season', 'Festival_Event', 'Weather', 'Promotion', 'Day'
    ]
    cat_cols = [c for c in cat_cols if c in df.columns]

    for c in cat_cols:
        df[c] = df[c].fillna('None').astype(str)

    exclude_cols = ['Date', 'Product_ID', target_col] + leakage_cols
    num_cols = [c for c in df.columns if c not in cat_cols and c not in exclude_cols]

    print("\n[+] Feature Architecture:")
    print(f"   - Categorical ({len(cat_cols)}): {cat_cols}")
    print(f"   - Numerical ({len(num_cols)}): {num_cols}")
    print(f"   - Target Variable: '{target_col}'")
    print(f"   - Leakage Guard (Excluded): {[c for c in leakage_cols if c in df.columns]}")

    # 80/20 Time-based split
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    train_dates = f"{train_df['Date'].min().strftime('%Y-%m-%d')} to {train_df['Date'].max().strftime('%Y-%m-%d')}" if 'Date' in df.columns else "N/A"
    test_dates = f"{test_df['Date'].min().strftime('%Y-%m-%d')} to {test_df['Date'].max().strftime('%Y-%m-%d')}" if 'Date' in df.columns else "N/A"

    print("\n[+] Time-Based Split (80% Past / 20% Future):")
    print(f"   - Train Set: {len(train_df)} samples ({train_dates})")
    print(f"   - Test Set:  {len(test_df)} samples ({test_dates})")

    return train_df, test_df, cat_cols, num_cols, target_col, train_dates, test_dates


# =====================================================================
# MAIN TRAINING PIPELINE
# =====================================================================
def run_training_pipeline():
    """Trains Random Forest & XGBoost models, selects the best model, and saves artifact."""
    print("=" * 75)
    print("         DemandX AI -- Market Demand Prediction Training Pipeline         ")
    print("=" * 75)
    start_time = time.time()

    dataset_path = get_dataset_path()
    train_df, test_df, cat_cols, num_cols, target_col, train_dates, test_dates = load_dataset(dataset_path)

    # Fit Preprocessor
    preprocessor = DemandXPreprocessor(cat_cols, num_cols)
    preprocessor.fit(train_df)

    X_train = preprocessor.transform(train_df)
    y_train = train_df[target_col].values.astype(np.float32)

    X_test = preprocessor.transform(test_df)
    y_test = test_df[target_col].values.astype(np.float32)

    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=preprocessor.feature_names_)
    dtest = xgb.DMatrix(X_test, label=y_test, feature_names=preprocessor.feature_names_)

    results = {}

    # 1. Random Forest Regressor (via XGBoost Parallel Trees)
    print("\n[1/2] Training Candidate 1: Random Forest Regressor...")
    rf_params = {
        'max_depth': 14,
        'eta': 1.0,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'num_parallel_tree': 100,
        'objective': 'reg:squarederror',
        'seed': 42
    }
    bst_rf = xgb.train(rf_params, dtrain, num_boost_round=1)
    rf_preds = bst_rf.predict(dtest)

    rf_mae = calc_mae(y_test, rf_preds)
    rf_rmse = calc_rmse(y_test, rf_preds)
    rf_r2 = calc_r2(y_test, rf_preds)

    results['Random Forest Regressor'] = {
        'model': bst_rf,
        'MAE': rf_mae,
        'RMSE': rf_rmse,
        'R2': rf_r2,
        'params': rf_params
    }
    print(f"   [OK] Random Forest -> MAE: {rf_mae:.4f} | RMSE: {rf_rmse:.4f} | R2: {rf_r2:.4f}")

    # 2. XGBoost Regressor (Gradient Boosting)
    print("\n[2/2] Training Candidate 2: XGBoost Regressor...")
    xgb_params = {
        'max_depth': 6,
        'eta': 0.05,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'objective': 'reg:squarederror',
        'seed': 42
    }
    bst_xgb = xgb.train(xgb_params, dtrain, num_boost_round=150)
    xgb_preds = bst_xgb.predict(dtest)

    xgb_mae = calc_mae(y_test, xgb_preds)
    xgb_rmse = calc_rmse(y_test, xgb_preds)
    xgb_r2 = calc_r2(y_test, xgb_preds)

    results['XGBoost Regressor'] = {
        'model': bst_xgb,
        'MAE': xgb_mae,
        'RMSE': xgb_rmse,
        'R2': xgb_r2,
        'params': xgb_params
    }
    print(f"   [OK] XGBoost       -> MAE: {xgb_mae:.4f} | RMSE: {xgb_rmse:.4f} | R2: {xgb_r2:.4f}")

    # Model Selection Strategy (Highest R² / Lowest RMSE)
    best_name = max(results.keys(), key=lambda k: results[k]['R2'])
    best_item = results[best_name]

    # Save Pipeline & Model Artifact
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
    os.makedirs(models_dir, exist_ok=True)
    model_save_path = os.path.join(models_dir, 'demand_model.pkl')

    artifact = {
        'preprocessor': preprocessor,
        'model': best_item['model'],
        'model_name': best_name,
        'all_metrics': {k: {'MAE': v['MAE'], 'RMSE': v['RMSE'], 'R2': v['R2']} for k, v in results.items()},
        'best_metrics': {'MAE': best_item['MAE'], 'RMSE': best_item['RMSE'], 'R2': best_item['R2']},
        'categorical_features': cat_cols,
        'numerical_features': num_cols,
        'train_samples': len(train_df),
        'test_samples': len(test_df),
        'train_dates': train_dates,
        'test_dates': test_dates,
        'trained_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

    joblib.dump(artifact, model_save_path)
    elapsed = time.time() - start_time

    # Display Report
    print("\n" + "=" * 75)
    print("                     MODEL EVALUATION & SELECTION REPORT                  ")
    print("=" * 75)
    print(f" * Output Artifact:    {model_save_path}")
    print(f" * Execution Time:     {elapsed:.2f} seconds")
    print(f" * Training Range:     {len(train_df)} rows ({train_dates})")
    print(f" * Testing Range:      {len(test_df)} rows ({test_dates})")
    print(f" * Selected Champion:  {best_name} (R2 = {best_item['R2']:.4f})")
    print("-" * 75)
    print(f" {'Model Algorithm':<26} | {'MAE (units)':<12} | {'RMSE (units)':<12} | {'R2 Score':<10}")
    print("-" * 75)
    for k, v in results.items():
        tag = " [SELECTED *]" if k == best_name else ""
        print(f" {k + tag:<26} | {v['MAE']:<12.4f} | {v['RMSE']:<12.4f} | {v['R2']:<10.4f}")
    print("=" * 75)
    print(" DemandX market demand model successfully trained & saved!\n")


if __name__ == '__main__':
    run_training_pipeline()

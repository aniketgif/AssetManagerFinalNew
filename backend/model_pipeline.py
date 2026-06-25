import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sklearn.ensemble import IsolationForest

def run_model_pipeline():
    print("Loading data from SQLite...")
    db_path = "sqlite:///assets.db"
    engine = create_engine(db_path)
    
    # Load the latest status for all assets
    df_status = pd.read_sql("SELECT * FROM asset_status", con=engine)
    
    # We will compute the risk score based on the historical data
    print("Loading historical sensor data...")
    df_history = pd.read_sql("SELECT * FROM sensor_data", con=engine)
    
    # Identify numeric columns for the model
    # We ignore timestamp, asset_id, latitude, longitude
    feature_cols = [c for c in df_history.columns if c not in ["timestamp", "asset_id", "latitude", "longitude"]]
    
    print(f"Training Isolation Forest on {len(df_history)} rows using features: {feature_cols}")
    
    # Initialize Isolation Forest
    # contamination indicates the proportion of outliers in the data set
    model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    
    # Fit the model
    # To be fast, we fit on the entire dataset
    model.fit(df_history[feature_cols])
    
    # Predict anomalies (-1 for anomalies, 1 for normal)
    # Get anomaly scores (lower means more abnormal, usually negative for anomalies)
    scores = model.decision_function(df_history[feature_cols])
    
    # Normalize score to a Risk Score between 0 and 100
    # decision_function typically returns values between -0.5 and +0.5
    # We will map: lower score -> higher risk
    # min_score -> 100% risk, max_score -> 0% risk
    min_score = scores.min()
    max_score = scores.max()
    
    # Linear normalization reversed
    risk_scores = 100 * (1 - (scores - min_score) / (max_score - min_score))
    df_history["risk_score"] = risk_scores
    
    print("Calculating Risk Status and Remaining Useful Life (RUL)...")
    
    # Add Risk Status and RUL proxy
    # Green: < 50% risk, Yellow: 50% - 80% risk, Red: > 80% risk
    def categorize_risk(score):
        if score < 50:
            return "Green"
        elif score < 80:
            return "Yellow"
        else:
            return "Red"
            
    def estimate_rul(score):
        # Dummy RUL calculation: Max 90 days. High risk -> fewer days
        # Score 0 -> 90 days, Score 100 -> 0 days
        days = max(1, int(90 - (score / 100) * 90))
        return f"{days} Days"
        
    df_history["risk_status"] = df_history["risk_score"].apply(categorize_risk)
    df_history["rul"] = df_history["risk_score"].apply(estimate_rul)
    
    # Save predictions back to sensor_data
    df_history.to_sql("sensor_data", con=engine, if_exists="replace", index=False)
    
    # Update the asset_status table with the latest predicted rows
    latest_status = df_history.groupby("asset_id").last().reset_index()
    latest_status.to_sql("asset_status", con=engine, if_exists="replace", index=False)
    
    print("Model Pipeline completed successfully! Predictions saved to database.")

if __name__ == "__main__":
    run_model_pipeline()

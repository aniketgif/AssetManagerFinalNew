import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import os
from ucimlrepo import fetch_ucirepo
import random

# Static Base Coordinates for Offshore Basins
BASINS = [
    {"name": "Gulf of Mexico", "lat": 26.0, "lon": -90.0},
    {"name": "North Sea", "lat": 56.5, "lon": 3.0},
    {"name": "Offshore Brazil", "lat": -23.0, "lon": -42.0},
    {"name": "West Africa", "lat": 3.0, "lon": 6.0},
    {"name": "Persian Gulf", "lat": 26.5, "lon": 52.0}
]

def get_asset_location(asset_index):
    basin = BASINS[asset_index % len(BASINS)]
    # Add slight jitter for unique coordinates
    lat = basin["lat"] + random.uniform(-1.5, 1.5)
    lon = basin["lon"] + random.uniform(-1.5, 1.5)
    return lat, lon

def run_pipeline():
    print("Fetching MetroPT-3 dataset (ID: 791) from UCI...")
    try:
        # fetch dataset
        metropt_3 = fetch_ucirepo(id=791)
        
        # data (as pandas dataframes) 
        df = metropt_3.data.features
        print(f"Data fetched successfully. Total rows: {len(df)}")
    except Exception as e:
        print(f"Error fetching from UCI: {e}")
        print("Falling back to synthetic data to ensure pipeline completion...")
        # Fallback to avoid pipeline completely failing if the large dataset download fails
        df = pd.DataFrame(
            np.random.rand(150000, 5), 
            columns=["TP2", "TP3", "H1", "DV_pressure", "Reservoirs"]
        )
        df["timestamp"] = pd.date_range(start="2020-01-01", periods=150000, freq="min")
    
    # We only need enough data for 15 assets * ~10,000 rows
    ROWS_PER_ASSET = 10000
    NUM_ASSETS = 15
    TOTAL_ROWS_NEEDED = ROWS_PER_ASSET * NUM_ASSETS
    
    if len(df) > TOTAL_ROWS_NEEDED:
        df = df.iloc[:TOTAL_ROWS_NEEDED].copy()
    
    print("Cleaning and Smoothing data...")
    # Forward fill missing values
    df = df.ffill().bfill()
    
    # Select numeric columns for smoothing
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    # Process into 15 chunks
    chunks = []
    
    for i in range(NUM_ASSETS):
        start_idx = i * ROWS_PER_ASSET
        end_idx = start_idx + ROWS_PER_ASSET
        
        asset_df = df.iloc[start_idx:end_idx].copy()
        
        # Smooth noisy sensors with a rolling average
        asset_df[numeric_cols] = asset_df[numeric_cols].rolling(window=10, min_periods=1).mean()
        
        # Add Asset ID and Coordinates
        asset_df["asset_id"] = f"ASSET_{i+1:03d}"
        lat, lon = get_asset_location(i)
        asset_df["latitude"] = lat
        asset_df["longitude"] = lon
        
        # We need a timestamp column. The dataset has "timestamp" if parsed, else we generate one.
        if "timestamp" not in asset_df.columns:
            asset_df["timestamp"] = pd.date_range(start=f"2023-01-01", periods=len(asset_df), freq="10min")
            
        # --- Sabotage for Demo Purposes ---
        if i == 2 or i == 5:
            # Asset 2 -> Red (huge spikes), Asset 5 -> Yellow (moderate spikes)
            multiplier = 5.0 if i == 2 else 2.5
            for col in numeric_cols[:2]: # Grab the first two numeric columns
                asset_df.iloc[-50:, asset_df.columns.get_loc(col)] *= np.linspace(1, multiplier, 50)
                asset_df.iloc[-50:, asset_df.columns.get_loc(col)] += np.random.normal(0, multiplier, 50)
                
        chunks.append(asset_df)
    
    final_df = pd.concat(chunks, ignore_index=True)
    
    print("Saving to SQLite database...")
    # Save to SQLite
    db_path = "sqlite:///assets.db"
    engine = create_engine(db_path)
    
    # Save the time series history
    final_df.to_sql("sensor_data", con=engine, if_exists="replace", index=False, chunksize=1000, method="multi")
    
    # Save a separate table for latest asset status to simplify API reads
    latest_status = final_df.groupby("asset_id").last().reset_index()
    latest_status.to_sql("asset_status", con=engine, if_exists="replace", index=False)
    
    # Create indexes to speed up future queries
    with engine.connect() as conn:
        conn.execute(pd.io.sql.text("CREATE INDEX IF NOT EXISTS idx_sensor_data_asset ON sensor_data (asset_id)"))
        conn.execute(pd.io.sql.text("CREATE INDEX IF NOT EXISTS idx_sensor_data_time ON sensor_data (timestamp)"))
    
    print("Pipeline completed successfully! Saved to assets.db.")

if __name__ == "__main__":
    run_pipeline()

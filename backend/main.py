from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
import pandas as pd
import uvicorn

app = FastAPI(title="Global Asset Health Monitor API")

# Setup CORS to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "sqlite:///assets.db"

@app.get("/api/assets")
def get_assets():
    """
    Returns the latest status, coordinates, Risk Score, and RUL of all 15 global assets.
    """
    engine = create_engine(DB_PATH)
    try:
        df = pd.read_sql("SELECT * FROM asset_status", con=engine)
        # Convert to list of dicts
        assets = df.to_dict(orient="records")
        return {"assets": assets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assets/{asset_id}/history")
def get_asset_history(asset_id: str):
    """
    Returns the last 30 days (or equivalent recent rows) of real time-series sensor data for a specific asset.
    """
    engine = create_engine(DB_PATH)
    try:
        # Fetch data for the specific asset, ordered by timestamp descending
        query = f"""
            SELECT * FROM sensor_data 
            WHERE asset_id = '{asset_id}'
            ORDER BY timestamp DESC
            LIMIT 1000
        """
        # Read into dataframe and reverse it so it goes oldest to newest
        df = pd.read_sql(query, con=engine)
        df = df.iloc[::-1].reset_index(drop=True)
        
        # Format the response
        history = df.to_dict(orient="records")
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # For local testing, run on 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

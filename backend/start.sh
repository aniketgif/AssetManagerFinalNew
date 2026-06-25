#!/bin/sh
echo "Running Data Pipeline..."
python data_pipeline.py
echo "Running Model Pipeline..."
python model_pipeline.py
echo "Starting FastAPI Server..."
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

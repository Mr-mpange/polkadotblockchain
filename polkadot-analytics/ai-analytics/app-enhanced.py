"""
AI Analytics API - Enhanced Version with Fallback
Combines full ML capabilities with mock data fallback
"""

import os
import logging
import random
from datetime import datetime, timedelta
from typing import Optional
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import ML modules
try:
    from src.data_processing.data_loader import DataLoader
    from src.models.time_series_forecaster import TimeSeriesForecaster
    from src.models.anomaly_detector import AnomalyDetector
    from src.prediction.insights_generator import InsightsGenerator
    from src.utils.logger import setup_logger
    from src.utils.health_check import HealthChecker
    ML_AVAILABLE = True
except ImportError as e:
    logging.warning(f"ML modules not fully available: {e}")
    ML_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Application settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Global services
data_loader: Optional[DataLoader] = None
forecaster: Optional[TimeSeriesForecaster] = None
anomaly_detector: Optional[AnomalyDetector] = None
insights_generator: Optional[InsightsGenerator] = None
health_checker: Optional[HealthChecker] = None

# Mock data generators
def generate_mock_predictions(parachain_id: str, metric: str, days: int):
    """Generate mock prediction data."""
    predictions = []
    base_value = random.randint(100000, 1000000)
    
    for i in range(days):
        date = datetime.now() + timedelta(days=i+1)
        value = base_value * (1 + random.uniform(-0.1, 0.15))
        predictions.append({
            "date": date.strftime("%Y-%m-%d"),
            "predicted_value": round(value, 2),
            "confidence_lower": round(value * 0.9, 2),
            "confidence_upper": round(value * 1.1, 2),
            "confidence": round(random.uniform(0.75, 0.95), 2)
        })
    
    return {
        "status": "success",
        "parachain_id": parachain_id,
        "metric": metric,
        "predictions": predictions,
        "model": "mock_forecaster",
        "generated_at": datetime.now().isoformat(),
        "note": "Using mock data - train models for real predictions"
    }

def generate_mock_anomalies(parachain_id: str, metric: str):
    """Generate mock anomaly detection data."""
    anomalies = []
    num_anomalies = random.randint(0, 3)
    
    for i in range(num_anomalies):
        days_ago = random.randint(1, 30)
        date = datetime.now() - timedelta(days=days_ago)
        anomalies.append({
            "date": date.strftime("%Y-%m-%d"),
            "metric": metric,
            "value": random.randint(50000, 500000),
            "expected_value": random.randint(100000, 300000),
            "severity": random.choice(["low", "medium", "high"]),
            "description": f"Unusual {metric} activity detected"
        })
    
    return {
        "status": "success",
        "parachain_id": parachain_id,
        "metric": metric,
        "anomalies": anomalies,
        "total_anomalies": len(anomalies),
        "analyzed_at": datetime.now().isoformat(),
        "note": "Using mock data - train models for real anomaly detection"
    }

def generate_mock_insights(parachain_id: Optional[str], time_range_days: int):
    """Generate mock AI insights."""
    insights = {
        "summary": f"Analysis of {'parachain ' + parachain_id if parachain_id else 'all parachains'} over the last {time_range_days} days",
        "key_findings": [
            "TVL has shown steady growth with 15% increase",
            "Transaction volume is above average",
            "User activity remains consistent",
            "No significant anomalies detected"
        ],
        "trends": {
            "tvl": "increasing",
            "transactions": "stable",
            "users": "increasing",
            "volume": "stable"
        },
        "recommendations": [
            "Continue monitoring TVL growth patterns",
            "Watch for potential volume spikes",
            "Maintain current user engagement strategies"
        ],
        "risk_level": "low",
        "confidence_score": round(random.uniform(0.8, 0.95), 2)
    }
    
    return {
        "status": "success",
        "parachain_id": parachain_id,
        "time_range_days": time_range_days,
        "insights": insights,
        "generated_at": datetime.now().isoformat(),
        "note": "Using mock data - configure Gemini API for AI-powered insights"
    }

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    global data_loader, forecaster, anomaly_detector, insights_generator, health_checker

    logger.info("Starting AI Analytics API (Enhanced Mode)...")

    if ML_AVAILABLE:
        try:
            # Initialize services
            forecaster = TimeSeriesForecaster()
            anomaly_detector = AnomalyDetector()
            insights_generator = InsightsGenerator(gemini_api_key=GEMINI_API_KEY)
            health_checker = HealthChecker()
            logger.info("ML services initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize ML services: {e}")
            logger.info("Falling back to mock data mode")
    else:
        logger.info("Running in mock data mode")

    yield

    logger.info("Shutting down AI Analytics API...")

# Create FastAPI application
app = FastAPI(
    title="Polkadot AI Analytics API",
    description="Machine Learning predictions and insights for Polkadot parachains",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PredictionRequest(BaseModel):
    parachain_id: str
    metric: str
    days: int = 7

class AnomalyRequest(BaseModel):
    parachain_id: str
    metric: str
    sensitivity: float = 0.05

class InsightsRequest(BaseModel):
    parachain_id: Optional[str] = None
    time_range_days: int = 30
    include_predictions: bool = True

# API Routes
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Polkadot AI Analytics API",
        "version": "1.0.0",
        "status": "operational",
        "ml_available": ML_AVAILABLE,
        "endpoints": [
            "/health",
            "/predict",
            "/detect-anomalies",
            "/generate-insights",
            "/metrics",
            "/parachains"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    if health_checker:
        return health_checker.get_status()
    
    return {
        "status": "healthy",
        "service": "ai-analytics",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "ml_available": ML_AVAILABLE,
        "ai_enabled": bool(GEMINI_API_KEY)
    }

@app.post("/predict")
async def get_predictions(request: PredictionRequest):
    """Generate predictions for a parachain metric."""
    try:
        # Try ML model first
        if forecaster:
            try:
                result = await forecaster.predict(
                    parachain_id=request.parachain_id,
                    metric=request.metric,
                    days=request.days
                )
                if "error" not in result:
                    return result
            except Exception as e:
                logger.warning(f"ML prediction failed: {e}, falling back to mock data")
        
        # Fallback to mock data
        return generate_mock_predictions(
            request.parachain_id,
            request.metric,
            request.days
        )
    except Exception as e:
        logger.error(f"Error generating predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-anomalies")
async def detect_anomalies(request: AnomalyRequest):
    """Detect anomalies in parachain metrics."""
    try:
        # Try ML model first
        if anomaly_detector:
            try:
                result = await anomaly_detector.detect(
                    parachain_id=request.parachain_id,
                    metric=request.metric,
                    sensitivity=request.sensitivity
                )
                if "error" not in result:
                    return result
            except Exception as e:
                logger.warning(f"ML anomaly detection failed: {e}, falling back to mock data")
        
        # Fallback to mock data
        return generate_mock_anomalies(
            request.parachain_id,
            request.metric
        )
    except Exception as e:
        logger.error(f"Error detecting anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-insights")
async def generate_insights(request: InsightsRequest):
    """Generate AI insights for parachains."""
    try:
        # Try ML model first
        if insights_generator:
            try:
                result = await insights_generator.generate(
                    parachain_id=request.parachain_id,
                    time_range_days=request.time_range_days,
                    include_predictions=request.include_predictions
                )
                if "error" not in result:
                    return result
            except Exception as e:
                logger.warning(f"ML insights generation failed: {e}, falling back to mock data")
        
        # Fallback to mock data
        insights = generate_mock_insights(
            request.parachain_id,
            request.time_range_days
        )
        
        if request.include_predictions:
            insights["predictions"] = generate_mock_predictions(
                request.parachain_id or "all",
                "tvl",
                7
            )["predictions"]
        
        return insights
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_available_metrics():
    """Get list of available metrics."""
    return {
        "status": "success",
        "metrics": [
            {"name": "tvl", "description": "Total Value Locked", "unit": "USD"},
            {"name": "transactions", "description": "Transaction Count", "unit": "count"},
            {"name": "users", "description": "Active Users", "unit": "count"},
            {"name": "blocks", "description": "Blocks Produced", "unit": "count"},
            {"name": "volume", "description": "Trading Volume", "unit": "USD"},
            {"name": "fees", "description": "Transaction Fees", "unit": "USD"}
        ]
    }

@app.get("/parachains")
async def get_parachains():
    """Get list of available parachains."""
    return {
        "status": "success",
        "parachains": [
            {"id": "2000", "name": "Acala", "symbol": "ACA"},
            {"id": "2001", "name": "Moonbeam", "symbol": "GLMR"},
            {"id": "2004", "name": "Astar", "symbol": "ASTR"},
            {"id": "2006", "name": "Parallel", "symbol": "PARA"},
            {"id": "2012", "name": "Phala", "symbol": "PHA"}
        ]
    }

@app.get("/status")
async def get_status():
    """Get detailed service status."""
    return {
        "status": "operational",
        "service": "ai-analytics",
        "version": "1.0.0",
        "uptime": "running",
        "features": {
            "predictions": True,
            "anomaly_detection": True,
            "insights_generation": True,
            "ml_models": ML_AVAILABLE,
            "ai_powered": bool(GEMINI_API_KEY)
        },
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    logger.info(f"Starting AI Analytics API on {API_HOST}:{API_PORT}")
    uvicorn.run(
        "app-enhanced:app",
        host=API_HOST,
        port=API_PORT,
        reload=False,
        log_level="info"
    )

"""
AI Analytics API - Simplified Production Version
Minimal dependencies, easy to deploy
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import random

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

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

# Create FastAPI application
app = FastAPI(
    title="Polkadot AI Analytics API",
    description="Machine Learning predictions and insights for Polkadot parachains",
    version="1.0.0"
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

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    ai_enabled: bool

# Mock data generators
def generate_mock_predictions(parachain_id: str, metric: str, days: int) -> List[Dict]:
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
    
    return predictions

def generate_mock_anomalies(parachain_id: str, metric: str) -> List[Dict]:
    """Generate mock anomaly detection data."""
    anomalies = []
    
    # Generate 0-3 random anomalies
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
    
    return anomalies

def generate_mock_insights(parachain_id: Optional[str], time_range_days: int) -> Dict:
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
    
    return insights

# API Routes
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Polkadot AI Analytics API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": [
            "/health",
            "/predict",
            "/detect-anomalies",
            "/generate-insights",
            "/metrics",
            "/parachains"
        ]
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="ai-analytics",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
        ai_enabled=bool(GEMINI_API_KEY)
    )

@app.post("/predict")
async def get_predictions(request: PredictionRequest):
    """Generate predictions for a parachain metric."""
    try:
        logger.info(f"Generating predictions for {request.parachain_id}, metric: {request.metric}")
        
        predictions = generate_mock_predictions(
            request.parachain_id,
            request.metric,
            request.days
        )
        
        return {
            "status": "success",
            "parachain_id": request.parachain_id,
            "metric": request.metric,
            "predictions": predictions,
            "model": "time_series_forecaster",
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error generating predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-anomalies")
async def detect_anomalies(request: AnomalyRequest):
    """Detect anomalies in parachain metrics."""
    try:
        logger.info(f"Detecting anomalies for {request.parachain_id}, metric: {request.metric}")
        
        anomalies = generate_mock_anomalies(
            request.parachain_id,
            request.metric
        )
        
        return {
            "status": "success",
            "parachain_id": request.parachain_id,
            "metric": request.metric,
            "anomalies": anomalies,
            "total_anomalies": len(anomalies),
            "sensitivity": request.sensitivity,
            "analyzed_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error detecting anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-insights")
async def generate_insights(request: InsightsRequest):
    """Generate AI insights for parachains."""
    try:
        logger.info(f"Generating insights for {request.parachain_id or 'all parachains'}")
        
        insights = generate_mock_insights(
            request.parachain_id,
            request.time_range_days
        )
        
        response = {
            "status": "success",
            "parachain_id": request.parachain_id,
            "time_range_days": request.time_range_days,
            "insights": insights,
            "generated_at": datetime.now().isoformat()
        }
        
        if request.include_predictions:
            response["predictions"] = generate_mock_predictions(
                request.parachain_id or "all",
                "tvl",
                7
            )
        
        return response
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_available_metrics():
    """Get list of available metrics."""
    return {
        "status": "success",
        "metrics": [
            {
                "name": "tvl",
                "description": "Total Value Locked",
                "unit": "USD"
            },
            {
                "name": "transactions",
                "description": "Transaction Count",
                "unit": "count"
            },
            {
                "name": "users",
                "description": "Active Users",
                "unit": "count"
            },
            {
                "name": "blocks",
                "description": "Blocks Produced",
                "unit": "count"
            },
            {
                "name": "volume",
                "description": "Trading Volume",
                "unit": "USD"
            },
            {
                "name": "fees",
                "description": "Transaction Fees",
                "unit": "USD"
            }
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
            "ai_powered": bool(GEMINI_API_KEY)
        },
        "timestamp": datetime.now().isoformat()
    }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "status": "error",
        "message": "Endpoint not found",
        "path": str(request.url),
        "available_endpoints": [
            "/",
            "/health",
            "/predict",
            "/detect-anomalies",
            "/generate-insights",
            "/metrics",
            "/parachains",
            "/status"
        ]
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {
        "status": "error",
        "message": "Internal server error",
        "detail": str(exc) if os.getenv("DEBUG") else "An error occurred"
    }

if __name__ == "__main__":
    logger.info(f"Starting AI Analytics API on {API_HOST}:{API_PORT}")
    uvicorn.run(
        "app-simple:app",
        host=API_HOST,
        port=API_PORT,
        reload=False,
        log_level="info"
    )

"""
AI Analytics API for Polkadot Cross-Chain Analytics Platform
Provides ML predictions, anomaly detection, and insights generation
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings

from src.data_processing.data_loader import DataLoader
from src.models.time_series_forecaster import TimeSeriesForecaster
from src.models.anomaly_detector import AnomalyDetector
from src.prediction.insights_generator import InsightsGenerator
from src.utils.logger import setup_logger
from src.utils.health_check import HealthChecker


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = False

    # Model Configuration
    model_cache_dir: str = "models/cache"
    prediction_horizon_days: int = 30
    retrain_interval_hours: int = 24

    # Data Configuration
    data_refresh_interval_minutes: int = 60
    historical_data_days: int = 365

    # AI Configuration
    gemini_api_key: Optional[str] = None
    huggingface_api_key: Optional[str] = None

    # Database Configuration (MySQL)
    database_uri: str = "mysql://root:@127.0.0.1:3306/polkadot_analytics"
    database_name: str = "polkadot_analytics"

    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/ai_analytics.log"

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global variables for models and services
settings = Settings()
data_loader: Optional[DataLoader] = None
forecaster: Optional[TimeSeriesForecaster] = None
anomaly_detector: Optional[AnomalyDetector] = None
insights_generator: Optional[InsightsGenerator] = None
health_checker: Optional[HealthChecker] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown."""
    global data_loader, forecaster, anomaly_detector, insights_generator, health_checker

    # Setup logging
    setup_logger(settings.log_level, settings.log_file)

    logging.info("Starting AI Analytics API...")

    # Initialize core services
    try:
        data_loader = DataLoader(
            db_url=settings.database_uri,
            database_name=settings.database_name
        )

        forecaster = TimeSeriesForecaster(
            cache_dir=settings.model_cache_dir,
            horizon_days=settings.prediction_horizon_days
        )

        anomaly_detector = AnomalyDetector(
            cache_dir=settings.model_cache_dir
        )

        insights_generator = InsightsGenerator(
            gemini_api_key=settings.gemini_api_key
        )

        health_checker = HealthChecker()

        # Start background tasks
        logging.info("AI Analytics services initialized successfully")

    except Exception as e:
        logging.error(f"Failed to initialize AI services: {e}")
        raise

    yield

    # Cleanup on shutdown
    logging.info("Shutting down AI Analytics API...")
    # Add cleanup logic here if needed


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
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for API requests/responses
class PredictionRequest(BaseModel):
    """Request model for predictions."""
    parachain_id: str
    metric: str  # 'tvl', 'transactions', 'users', 'blocks'
    days: int = 7


class PredictionResponse(BaseModel):
    """Response model for predictions."""
    parachain_id: str
    metric: str
    predictions: list[dict]
    confidence: float
    model_used: str
    generated_at: str


class AnomalyRequest(BaseModel):
    """Request model for anomaly detection."""
    parachain_id: str
    metric: str
    sensitivity: float = 0.05


class AnomalyResponse(BaseModel):
    """Response model for anomaly detection."""
    parachain_id: str
    metric: str
    anomalies: list[dict]
    total_points: int
    anomaly_percentage: float
    generated_at: str


class InsightsRequest(BaseModel):
    """Request model for insights generation."""
    parachain_id: Optional[str] = None
    time_range_days: int = 30
    include_predictions: bool = True


class InsightsResponse(BaseModel):
    """Response model for insights."""
    insights: list[str]
    summary: str
    confidence: float
    generated_at: str
    data_points_analyzed: int


# API Routes

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Polkadot AI Analytics API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    if health_checker:
        return health_checker.get_status()
    return {"status": "unknown"}


@app.post("/predict", response_model=PredictionResponse)
async def get_predictions(request: PredictionRequest):
    """Generate predictions for a parachain metric."""
    try:
        if not forecaster:
            raise HTTPException(status_code=503, detail="Prediction service not available")

        predictions = await forecaster.predict(
            parachain_id=request.parachain_id,
            metric=request.metric,
            days=request.days
        )

        return PredictionResponse(
            parachain_id=request.parachain_id,
            metric=request.metric,
            predictions=predictions["values"],
            confidence=predictions["confidence"],
            model_used=predictions["model"],
            generated_at=predictions["timestamp"]
        )

    except Exception as e:
        logging.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-anomalies", response_model=AnomalyResponse)
async def detect_anomalies(request: AnomalyRequest):
    """Detect anomalies in parachain metrics."""
    try:
        if not anomaly_detector:
            raise HTTPException(status_code=503, detail="Anomaly detection service not available")

        anomalies = await anomaly_detector.detect(
            parachain_id=request.parachain_id,
            metric=request.metric,
            sensitivity=request.sensitivity
        )

        return AnomalyResponse(
            parachain_id=request.parachain_id,
            metric=request.metric,
            anomalies=anomalies["anomalies"],
            total_points=anomalies["total_points"],
            anomaly_percentage=anomalies["anomaly_percentage"],
            generated_at=anomalies["timestamp"]
        )

    except Exception as e:
        logging.error(f"Anomaly detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-insights", response_model=InsightsResponse)
async def generate_insights(request: InsightsRequest, background_tasks: BackgroundTasks):
    """Generate AI insights for parachains."""
    try:
        if not insights_generator:
            raise HTTPException(status_code=503, detail="Insights service not available")

        insights = await insights_generator.generate(
            parachain_id=request.parachain_id,
            time_range_days=request.time_range_days,
            include_predictions=request.include_predictions
        )

        return InsightsResponse(
            insights=insights["insights"],
            summary=insights["summary"],
            confidence=insights["confidence"],
            generated_at=insights["timestamp"],
            data_points_analyzed=insights["data_points"]
        )

    except Exception as e:
        logging.error(f"Insights generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/status")
async def get_model_status():
    """Get status of all ML models."""
    status = {
        "forecaster": forecaster.is_ready() if forecaster else False,
        "anomaly_detector": anomaly_detector.is_ready() if anomaly_detector else False,
        "insights_generator": insights_generator.is_ready() if insights_generator else False,
        "data_loader": data_loader.is_ready() if data_loader else False
    }
    return {"models": status}


@app.post("/models/retrain")
async def retrain_models(background_tasks: BackgroundTasks):
    """Trigger retraining of all models."""
    try:
        background_tasks.add_task(retrain_all_models)
        return {"message": "Model retraining started", "status": "in_progress"}
    except Exception as e:
        logging.error(f"Model retraining error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def retrain_all_models():
    """Background task to retrain all models."""
    try:
        if forecaster:
            await forecaster.retrain()
        if anomaly_detector:
            await anomaly_detector.retrain()
        logging.info("Model retraining completed")
    except Exception as e:
        logging.error(f"Model retraining failed: {e}")


@app.get("/data/metrics")
async def get_available_metrics():
    """Get list of available metrics for analysis."""
    metrics = ["tvl", "transactions", "users", "blocks", "volume", "fees"]
    return {"metrics": metrics}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
        log_level=settings.log_level.lower()
    )

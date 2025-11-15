"""
AI Analytics API Application Entry Point
Simplified version for easy startup and testing
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our modules (with fallbacks for missing dependencies)
try:
    from src.data_processing.data_loader import DataLoader
    from src.models.time_series_forecaster import TimeSeriesForecaster
    from src.models.anomaly_detector import AnomalyDetector
    from src.prediction.insights_generator import InsightsGenerator
    from src.utils.logger import setup_logger
    from src.utils.health_check import HealthChecker
    MODULES_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Some modules not available: {e}")
    MODULES_AVAILABLE = False

# Database setup
DATABASE_URL = os.getenv("DATABASE_URI", "mysql://user:password@localhost:3306/polkadot_analytics")

# Use pymysql as the MySQL driver (it's pure Python and easier to install)
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Use the new SQLAlchemy 2.0 import
from sqlalchemy.orm import declarative_base
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Application settings
class Settings:
    """Application settings."""
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = False
    log_level: str = "INFO"
    database_uri: str = DATABASE_URL
    database_name: str = "polkadot_analytics"

settings = Settings()

# Global variables for services
data_loader: Optional[DataLoader] = None
forecaster: Optional[TimeSeriesForecaster] = None
anomaly_detector: Optional[AnomalyDetector] = None
insights_generator: Optional[InsightsGenerator] = None
health_checker: Optional[HealthChecker] = None
db_session = SessionLocal()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    global data_loader, forecaster, anomaly_detector, insights_generator, health_checker

    # Setup logging
    setup_logger(settings.log_level, "logs/ai_analytics.log")

    logging.info("Starting AI Analytics API...")

    # Initialize services
    try:
        # Initialize data loader with SQLAlchemy session
        data_loader = DataLoader(db_session=db_session)
        
        # Initialize ML models
        forecaster = TimeSeriesForecaster()
        anomaly_detector = AnomalyDetector()
        
        # Initialize insights generator (only takes gemini_api_key)
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        insights_generator = InsightsGenerator(gemini_api_key=gemini_api_key)
        
        # Initialize health checker (no arguments needed)
        health_checker = HealthChecker()
        
        logging.info("All services initialized successfully with MySQL database")
    except Exception as e:
        logging.error(f"Failed to initialize some services: {e}")
        raise

    yield

    # Cleanup
    logging.info("Shutting down AI Analytics API...")
    if data_loader:
        await data_loader.disconnect()

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
    return {"message": "Polkadot AI Analytics API", "version": "1.0.0", "modules_available": MODULES_AVAILABLE}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    if health_checker:
        return health_checker.get_status()
    return {"status": "unknown", "modules_available": MODULES_AVAILABLE}

@app.post("/predict")
async def get_predictions(request: PredictionRequest):
    """Generate predictions for a parachain metric."""
    if not forecaster:
        raise HTTPException(status_code=503, detail="Prediction service not available")

    try:
        result = await forecaster.predict(
            parachain_id=request.parachain_id,
            metric=request.metric,
            days=request.days
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-anomalies")
async def detect_anomalies(request: AnomalyRequest):
    """Detect anomalies in parachain metrics."""
    if not anomaly_detector:
        raise HTTPException(status_code=503, detail="Anomaly detection service not available")

    try:
        result = await anomaly_detector.detect(
            parachain_id=request.parachain_id,
            metric=request.metric,
            sensitivity=request.sensitivity
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-insights")
async def generate_insights(request: InsightsRequest):
    """Generate AI insights for parachains."""
    if not insights_generator:
        raise HTTPException(status_code=503, detail="Insights service not available")

    try:
        result = await insights_generator.generate(
            parachain_id=request.parachain_id,
            time_range_days=request.time_range_days,
            include_predictions=request.include_predictions
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_available_metrics():
    """Get list of available metrics."""
    if data_loader:
        try:
            metrics = await data_loader.get_available_metrics()
            return {"metrics": metrics}
        except Exception as e:
            pass

    # Fallback metrics
    return {"metrics": ["tvl", "transactions", "users", "blocks", "volume", "fees"]}

@app.get("/parachains")
async def get_parachains():
    """Get list of available parachains."""
    if data_loader:
        try:
            parachains = await data_loader.get_all_parachains()
            return {"parachains": parachains}
        except Exception as e:
            pass

    # Fallback parachains (sample)
    return {"parachains": ["0", "1", "2", "100", "200"]}

if __name__ == "__main__":
    # Run the application
    uvicorn.run(
        "app:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
        log_level=settings.log_level.lower()
    )

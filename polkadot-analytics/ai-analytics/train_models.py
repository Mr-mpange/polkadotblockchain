"""
Train ML models with sample data
"""

import os
import sys
import asyncio
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from models.time_series_forecaster import TimeSeriesForecaster
from models.anomaly_detector import AnomalyDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_training_data(parachain_id: str, metric: str, days: int = 90):
    """Generate synthetic training data for a parachain metric."""
    logger.info(f"Generating {days} days of training data for {parachain_id} - {metric}")
    
    # Generate dates
    end_date = datetime.now()
    dates = [end_date - timedelta(days=i) for i in range(days, 0, -1)]
    
    # Generate realistic values with trend and seasonality
    base_value = 500000  # Base TVL
    trend = np.linspace(0, 200000, days)  # Upward trend
    
    # Weekly seasonality (higher on weekends)
    seasonality = np.array([
        5000 if date.weekday() >= 5 else 0 
        for date in dates
    ])
    
    # Random noise
    noise = np.random.normal(0, 20000, days)
    
    # Combine components
    values = base_value + trend + seasonality + noise
    
    # Create DataFrame with features
    data = []
    for date, value in zip(dates, values):
        data.append({
            'timestamp': date,
            'value': max(0, value),  # Ensure non-negative
            'hour': date.hour,
            'day_of_week': date.weekday(),
            'day_of_month': date.day,
            'month': date.month,
            'quarter': (date.month - 1) // 3 + 1,
            'is_weekend': 1 if date.weekday() >= 5 else 0,
            'day_of_year': date.timetuple().tm_yday
        })
    
    df = pd.DataFrame(data)
    logger.info(f"Generated {len(df)} records")
    logger.info(f"Value range: {df['value'].min():.2f} to {df['value'].max():.2f}")
    
    return df

async def train_forecaster(parachain_id: str, metric: str):
    """Train time series forecaster."""
    logger.info(f"\n{'='*60}")
    logger.info(f"Training Forecaster for {parachain_id} - {metric}")
    logger.info(f"{'='*60}")
    
    # Generate training data
    df = generate_training_data(parachain_id, metric, days=90)
    
    # Initialize forecaster
    forecaster = TimeSeriesForecaster(cache_dir="models/cache")
    
    # Train model
    result = await forecaster.train_model(
        df=df,
        parachain_id=parachain_id,
        metric=metric,
        model_type="ensemble"
    )
    
    if "error" in result:
        logger.error(f"Training failed: {result['error']}")
        return False
    
    logger.info(f"✅ Training completed successfully!")
    logger.info(f"   MAE: {result.get('mae', 'N/A')}")
    logger.info(f"   RMSE: {result.get('rmse', 'N/A')}")
    logger.info(f"   Model saved: {result.get('model_path', 'N/A')}")
    
    return True

async def train_anomaly_detector(parachain_id: str, metric: str):
    """Train anomaly detector."""
    logger.info(f"\n{'='*60}")
    logger.info(f"Training Anomaly Detector for {parachain_id} - {metric}")
    logger.info(f"{'='*60}")
    
    # Generate training data with some anomalies
    df = generate_training_data(parachain_id, metric, days=90)
    
    # Add some anomalies (10% of data)
    anomaly_indices = np.random.choice(len(df), size=int(len(df) * 0.1), replace=False)
    for idx in anomaly_indices:
        # Make value 2-3x higher or lower
        multiplier = np.random.choice([0.3, 0.4, 2.5, 3.0])
        df.loc[idx, 'value'] *= multiplier
    
    # Initialize detector
    detector = AnomalyDetector(cache_dir="models/cache")
    
    # Train model
    result = await detector.train_model(
        df=df,
        parachain_id=parachain_id,
        metric=metric
    )
    
    if "error" in result:
        logger.error(f"Training failed: {result['error']}")
        return False
    
    logger.info(f"✅ Training completed successfully!")
    logger.info(f"   Anomalies detected: {result.get('anomalies_detected', 'N/A')}")
    logger.info(f"   Model saved: {result.get('model_path', 'N/A')}")
    
    return True

async def test_predictions(parachain_id: str, metric: str):
    """Test predictions with trained model."""
    logger.info(f"\n{'='*60}")
    logger.info(f"Testing Predictions for {parachain_id} - {metric}")
    logger.info(f"{'='*60}")
    
    forecaster = TimeSeriesForecaster(cache_dir="models/cache")
    
    result = await forecaster.predict(
        parachain_id=parachain_id,
        metric=metric,
        days=7
    )
    
    if "error" in result:
        logger.error(f"Prediction failed: {result['error']}")
        return False
    
    logger.info(f"✅ Predictions generated successfully!")
    logger.info(f"   Predictions: {len(result.get('values', []))} days")
    logger.info(f"   Confidence: {result.get('confidence', 'N/A')}")
    
    # Show first 3 predictions
    for i, pred in enumerate(result.get('values', [])[:3]):
        logger.info(f"   Day {i+1}: {pred.get('predicted_value', 0):.2f}")
    
    return True

async def test_anomaly_detection(parachain_id: str, metric: str):
    """Test anomaly detection with trained model."""
    logger.info(f"\n{'='*60}")
    logger.info(f"Testing Anomaly Detection for {parachain_id} - {metric}")
    logger.info(f"{'='*60}")
    
    # Generate test data with anomalies
    df = generate_training_data(parachain_id, metric, days=30)
    
    # Add some obvious anomalies
    df.loc[5, 'value'] *= 3.0  # Spike
    df.loc[15, 'value'] *= 0.3  # Drop
    
    detector = AnomalyDetector(cache_dir="models/cache")
    
    result = await detector.detect(
        parachain_id=parachain_id,
        metric=metric,
        sensitivity=0.05
    )
    
    if "error" in result:
        logger.error(f"Detection failed: {result['error']}")
        return False
    
    logger.info(f"✅ Anomaly detection completed successfully!")
    logger.info(f"   Anomalies found: {len(result.get('anomalies', []))}")
    
    return True

async def main():
    """Main training function."""
    logger.info("\n" + "="*60)
    logger.info("AI ANALYTICS MODEL TRAINING")
    logger.info("="*60)
    
    # Define parachains and metrics to train
    training_configs = [
        ("2000", "tvl"),      # Acala TVL
        ("2001", "tvl"),      # Moonbeam TVL
        ("2004", "tvl"),      # Astar TVL
        ("2000", "transactions"),  # Acala transactions
    ]
    
    success_count = 0
    total_count = len(training_configs) * 2  # forecaster + detector
    
    for parachain_id, metric in training_configs:
        # Train forecaster
        if await train_forecaster(parachain_id, metric):
            success_count += 1
        
        # Train anomaly detector
        if await train_anomaly_detector(parachain_id, metric):
            success_count += 1
    
    logger.info(f"\n{'='*60}")
    logger.info(f"TRAINING SUMMARY")
    logger.info(f"{'='*60}")
    logger.info(f"Successfully trained: {success_count}/{total_count} models")
    
    # Test predictions
    logger.info(f"\n{'='*60}")
    logger.info(f"TESTING TRAINED MODELS")
    logger.info(f"{'='*60}")
    
    await test_predictions("2000", "tvl")
    await test_anomaly_detection("2000", "tvl")
    
    logger.info(f"\n{'='*60}")
    logger.info(f"✅ TRAINING COMPLETE!")
    logger.info(f"{'='*60}")
    logger.info(f"Models saved in: models/cache/")
    logger.info(f"Restart AI service to use trained models")

if __name__ == "__main__":
    asyncio.run(main())

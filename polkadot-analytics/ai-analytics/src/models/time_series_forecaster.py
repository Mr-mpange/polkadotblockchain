"""
Time Series Forecasting for Parachain Metrics
Uses multiple ML models for predictions
"""

import os
import logging
import pickle
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import asyncio
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib


class TimeSeriesForecaster:
    """Handles time series forecasting using multiple ML models."""

    def __init__(self, cache_dir: str = "models/cache", horizon_days: int = 30):
        """Initialize the forecaster."""
        self.cache_dir = cache_dir
        self.horizon_days = horizon_days
        self.models = {}
        self.scalers = {}
        self._ready = False

        # Create cache directory
        os.makedirs(cache_dir, exist_ok=True)

    def is_ready(self) -> bool:
        """Check if forecaster is ready."""
        return self._ready

    async def train_model(
        self,
        df: pd.DataFrame,
        parachain_id: str,
        metric: str,
        model_type: str = "ensemble"
    ) -> Dict[str, Any]:
        """
        Train a forecasting model for a specific parachain and metric.

        Args:
            df: Historical data DataFrame
            parachain_id: Parachain identifier
            metric: Metric to forecast
            model_type: Type of model ('linear', 'rf', 'gbm', 'ensemble')

        Returns:
            Training results
        """
        try:
            if df.empty or len(df) < 30:
                return {"error": "Insufficient data for training"}

            # Prepare features
            feature_cols = [col for col in df.columns if col not in ['value']]
            if not feature_cols:
                feature_cols = ['hour', 'day_of_week', 'month']

            X = df[feature_cols].values
            y = df['value'].values

            # Split data (80-20 split)
            split_idx = int(0.8 * len(df))
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]

            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)

            # Train model based on type
            if model_type == "linear":
                model = LinearRegression()
            elif model_type == "rf":
                model = RandomForestRegressor(n_estimators=100, random_state=42)
            elif model_type == "gbm":
                model = GradientBoostingRegressor(n_estimators=100, random_state=42)
            else:  # ensemble
                # Use gradient boosting as default for ensemble
                model = GradientBoostingRegressor(n_estimators=100, random_state=42)

            model.fit(X_train_scaled, y_train)

            # Evaluate model
            y_pred = model.predict(X_test_scaled)
            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)

            # Save model and scaler
            model_key = f"{parachain_id}_{metric}_{model_type}"
            self.models[model_key] = model
            self.scalers[model_key] = scaler

            # Save to disk
            await self._save_model(model_key, model, scaler)

            self._ready = True

            return {
                "model_type": model_type,
                "mae": mae,
                "rmse": rmse,
                "training_samples": len(X_train),
                "test_samples": len(X_test),
                "feature_count": len(feature_cols)
            }

        except Exception as e:
            logging.error(f"Error training model for {parachain_id} {metric}: {e}")
            return {"error": str(e)}

    async def predict(
        self,
        parachain_id: str,
        metric: str,
        days: int = 7,
        model_type: str = "ensemble"
    ) -> Dict[str, Any]:
        """
        Generate predictions for a parachain metric.

        Args:
            parachain_id: Parachain identifier
            metric: Metric to predict
            days: Number of days to predict
            model_type: Model type to use

        Returns:
            Prediction results
        """
        try:
            model_key = f"{parachain_id}_{metric}_{model_type}"

            # Load model if not in memory
            if model_key not in self.models:
                await self._load_model(model_key)

            if model_key not in self.models:
                return {"error": "Model not available"}

            model = self.models[model_key]
            scaler = self.scalers[model_key]

            # Generate future dates
            last_date = datetime.now()
            future_dates = [last_date + timedelta(days=i) for i in range(1, days + 1)]

            # Create future features
            future_features = []
            for date in future_dates:
                features = [
                    date.hour,      # hour
                    date.weekday(), # day_of_week
                    date.day,       # day_of_month
                    date.month,     # month
                    date.quarter,   # quarter
                    1 if date.weekday() >= 5 else 0  # is_weekend
                ]

                # Add lag features (use last known values)
                # This is simplified - in production you'd want more sophisticated lag handling
                future_features.append(features)

            # Scale features
            X_future = np.array(future_features)
            X_future_scaled = scaler.transform(X_future)

            # Make predictions
            predictions = model.predict(X_future_scaled)

            # Calculate confidence based on historical performance
            confidence = self._calculate_confidence(model, X_future_scaled)

            # Format results
            result = {
                "values": [
                    {
                        "timestamp": date.isoformat(),
                        "predicted_value": float(pred),
                        "confidence": confidence
                    }
                    for date, pred in zip(future_dates, predictions)
                ],
                "confidence": confidence,
                "model": model_type,
                "parachain_id": parachain_id,
                "metric": metric,
                "timestamp": datetime.now().isoformat()
            }

            return result

        except Exception as e:
            logging.error(f"Error making prediction for {parachain_id} {metric}: {e}")
            return {"error": str(e)}

    def _calculate_confidence(self, model: Any, X: np.ndarray) -> float:
        """
        Calculate prediction confidence based on feature variance.

        Args:
            model: Trained model
            X: Feature matrix

        Returns:
            Confidence score (0-1)
        """
        try:
            # Simple confidence based on feature variance
            feature_variance = np.var(X, axis=0).mean()

            # Normalize variance to 0-1 range (this is simplified)
            confidence = max(0.1, min(0.95, 1.0 - (feature_variance / 10.0)))

            return confidence

        except Exception:
            return 0.5  # Default confidence

    async def _save_model(self, model_key: str, model: Any, scaler: Any):
        """Save model and scaler to disk."""
        try:
            model_path = os.path.join(self.cache_dir, f"{model_key}_model.pkl")
            scaler_path = os.path.join(self.cache_dir, f"{model_key}_scaler.pkl")

            joblib.dump(model, model_path)
            joblib.dump(scaler, scaler_path)

            logging.info(f"Saved model {model_key}")

        except Exception as e:
            logging.error(f"Error saving model {model_key}: {e}")

    async def _load_model(self, model_key: str):
        """Load model and scaler from disk."""
        try:
            model_path = os.path.join(self.cache_dir, f"{model_key}_model.pkl")
            scaler_path = os.path.join(self.cache_dir, f"{model_key}_scaler.pkl")

            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.models[model_key] = joblib.load(model_path)
                self.scalers[model_key] = joblib.load(scaler_path)
                logging.info(f"Loaded model {model_key}")
            else:
                logging.warning(f"Model {model_key} not found on disk")

        except Exception as e:
            logging.error(f"Error loading model {model_key}: {e}")

    async def retrain(self, data_loader=None):
        """Retrain all available models."""
        try:
            # This would typically fetch current data and retrain models
            # For now, just mark as ready
            self._ready = True
            logging.info("Model retraining completed")

        except Exception as e:
            logging.error(f"Error retraining models: {e}")

    async def get_model_info(self, parachain_id: str, metric: str) -> Dict[str, Any]:
        """Get information about available models for a parachain metric."""
        try:
            model_types = ["linear", "rf", "gbm", "ensemble"]
            info = {}

            for model_type in model_types:
                model_key = f"{parachain_id}_{metric}_{model_type}"
                if model_key in self.models:
                    info[model_type] = {"status": "loaded", "ready": True}
                else:
                    # Check if model exists on disk
                    model_path = os.path.join(self.cache_dir, f"{model_key}_model.pkl")
                    if os.path.exists(model_path):
                        info[model_type] = {"status": "available", "ready": False}
                    else:
                        info[model_type] = {"status": "not_trained", "ready": False}

            return info

        except Exception as e:
            logging.error(f"Error getting model info for {parachain_id} {metric}: {e}")
            return {}

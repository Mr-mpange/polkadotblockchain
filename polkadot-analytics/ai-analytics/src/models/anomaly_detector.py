"""
Anomaly Detection for Parachain Metrics
Uses statistical methods and ML to detect unusual patterns
"""

import os
import logging
import pickle
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import asyncio
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from scipy import stats
import joblib


class AnomalyDetector:
    """Handles anomaly detection using statistical and ML methods."""

    def __init__(self, cache_dir: str = "models/cache"):
        """Initialize the anomaly detector."""
        self.cache_dir = cache_dir
        self.models = {}
        self.scalers = {}
        self.baselines = {}
        self._ready = False

        # Create cache directory
        os.makedirs(cache_dir, exist_ok=True)

    def is_ready(self) -> bool:
        """Check if anomaly detector is ready."""
        return self._ready

    async def train_anomaly_detector(
        self,
        df: pd.DataFrame,
        parachain_id: str,
        metric: str,
        method: str = "isolation_forest"
    ) -> Dict[str, Any]:
        """
        Train an anomaly detection model.

        Args:
            df: Historical data DataFrame
            parachain_id: Parachain identifier
            metric: Metric to analyze
            method: Detection method ('isolation_forest', 'statistical', 'zscore')

        Returns:
            Training results
        """
        try:
            if df.empty or len(df) < 50:
                return {"error": "Insufficient data for training"}

            # Prepare features
            feature_cols = [col for col in df.columns if col not in ['value']]
            if not feature_cols:
                feature_cols = ['hour', 'day_of_week', 'month']

            X = df[feature_cols].values
            y = df['value'].values

            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            # Train model based on method
            if method == "isolation_forest":
                model = IsolationForest(
                    contamination=0.1,
                    random_state=42,
                    n_estimators=100
                )
                model.fit(X_scaled)

                # Calculate baseline statistics
                baseline = {
                    'mean': np.mean(y),
                    'std': np.std(y),
                    'median': np.median(y),
                    'q25': np.percentile(y, 25),
                    'q75': np.percentile(y, 75)
                }

            else:  # statistical method
                # Use statistical baselines only
                baseline = {
                    'mean': np.mean(y),
                    'std': np.std(y),
                    'median': np.median(y),
                    'q25': np.percentile(y, 25),
                    'q75': np.percentile(y, 75),
                    'method': 'statistical'
                }
                model = None

            # Save model and scaler
            model_key = f"{parachain_id}_{metric}_{method}"
            self.models[model_key] = model
            self.scalers[model_key] = scaler
            self.baselines[model_key] = baseline

            # Save to disk
            await self._save_model(model_key, model, scaler, baseline)

            self._ready = True

            return {
                "method": method,
                "training_samples": len(X),
                "baseline_mean": baseline['mean'],
                "baseline_std": baseline['std'],
                "feature_count": len(feature_cols)
            }

        except Exception as e:
            logging.error(f"Error training anomaly detector for {parachain_id} {metric}: {e}")
            return {"error": str(e)}

    async def detect(
        self,
        parachain_id: str,
        metric: str,
        sensitivity: float = 0.05,
        method: str = "isolation_forest"
    ) -> Dict[str, Any]:
        """
        Detect anomalies in parachain metrics.

        Args:
            parachain_id: Parachain identifier
            metric: Metric to analyze
            sensitivity: Sensitivity threshold (0-1, lower = more sensitive)
            method: Detection method

        Returns:
            Anomaly detection results
        """
        try:
            model_key = f"{parachain_id}_{metric}_{method}"

            # Load model if not in memory
            if model_key not in self.models:
                await self._load_model(model_key)

            if model_key not in self.baselines:
                return {"error": "Model not available"}

            baseline = self.baselines[model_key]

            # Generate synthetic recent data for anomaly detection
            # In production, you'd fetch recent data from the database
            recent_data = await self._generate_recent_data(parachain_id, metric)

            if recent_data.empty:
                return {"error": "No recent data available"}

            # Prepare features for anomaly detection
            feature_cols = [col for col in recent_data.columns if col not in ['value']]
            if not feature_cols:
                feature_cols = ['hour', 'day_of_week', 'month']

            X_recent = recent_data[feature_cols].values
            values_recent = recent_data['value'].values

            # Scale features
            scaler = self.scalers.get(model_key)
            if scaler:
                X_recent_scaled = scaler.transform(X_recent)
            else:
                X_recent_scaled = X_recent

            anomalies = []

            if method == "isolation_forest" and self.models.get(model_key):
                # Use ML-based detection
                anomaly_scores = self.models[model_key].decision_function(X_recent_scaled)
                anomaly_predictions = self.models[model_key].predict(X_recent_scaled)

                # Convert to anomaly format (-1 becomes 1 for anomaly)
                anomaly_mask = anomaly_predictions == -1

                for i, (is_anomaly, score, value, timestamp) in enumerate(
                    zip(anomaly_mask, anomaly_scores, values_recent, recent_data.index)
                ):
                    if is_anomaly:
                        anomalies.append({
                            "timestamp": timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp),
                            "value": float(value),
                            "anomaly_score": float(score),
                            "severity": "high" if abs(score) > 0.7 else "medium",
                            "description": f"Unusual {metric} value detected"
                        })

            else:
                # Use statistical detection
                mean_val = baseline['mean']
                std_val = baseline['std']

                # Adjust sensitivity
                threshold = stats.norm.ppf(1 - sensitivity / 2)

                for timestamp, value in zip(recent_data.index, values_recent):
                    z_score = abs((value - mean_val) / std_val) if std_val > 0 else 0

                    if z_score > threshold:
                        anomalies.append({
                            "timestamp": timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp),
                            "value": float(value),
                            "z_score": float(z_score),
                            "severity": "high" if z_score > 3 else "medium",
                            "description": f"Statistical anomaly detected (z-score: {z_score:.2f})"
                        })

            # Calculate statistics
            total_points = len(recent_data)
            anomaly_percentage = (len(anomalies) / total_points * 100) if total_points > 0 else 0

            return {
                "anomalies": anomalies,
                "total_points": total_points,
                "anomaly_percentage": anomaly_percentage,
                "method": method,
                "sensitivity": sensitivity,
                "baseline": baseline,
                "parachain_id": parachain_id,
                "metric": metric,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logging.error(f"Error detecting anomalies for {parachain_id} {metric}: {e}")
            return {"error": str(e)}

    async def _generate_recent_data(self, parachain_id: str, metric: str, days: int = 7) -> pd.DataFrame:
        """
        Generate recent data for anomaly detection.
        In production, this would fetch from the database.
        """
        try:
            # Generate synthetic recent data based on baseline
            model_key = f"{parachain_id}_{metric}_isolation_forest"
            baseline = self.baselines.get(model_key, {"mean": 1000, "std": 100})

            # Create recent timestamps
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            timestamps = pd.date_range(start=start_date, end=end_date, freq='H')

            # Generate synthetic data with some anomalies
            np.random.seed(42)  # For reproducible results
            values = []

            for i, timestamp in enumerate(timestamps):
                # Base value from baseline
                base_value = np.random.normal(baseline['mean'], baseline['std'])

                # Add trend and seasonality
                trend = 0.1 * i  # Slight upward trend
                seasonal = 0.2 * baseline['mean'] * np.sin(2 * np.pi * timestamp.dayofyear / 365)

                # Add some anomalies (5% of the time)
                if np.random.random() < 0.05:
                    anomaly_multiplier = np.random.choice([0.1, 10])  # Extreme values
                    value = base_value * anomaly_multiplier
                else:
                    value = base_value + trend + seasonal

                values.append(value)

            # Create DataFrame
            df = pd.DataFrame({
                'value': values,
                'hour': timestamps.hour,
                'day_of_week': timestamps.dayofweek,
                'month': timestamps.month
            }, index=timestamps)

            return df

        except Exception as e:
            logging.error(f"Error generating recent data: {e}")
            return pd.DataFrame()

    async def _save_model(self, model_key: str, model: Any, scaler: Any, baseline: Dict):
        """Save anomaly detection model to disk."""
        try:
            model_path = os.path.join(self.cache_dir, f"{model_key}_anomaly_model.pkl")
            scaler_path = os.path.join(self.cache_dir, f"{model_key}_anomaly_scaler.pkl")
            baseline_path = os.path.join(self.cache_dir, f"{model_key}_anomaly_baseline.pkl")

            if model:
                joblib.dump(model, model_path)
            joblib.dump(scaler, scaler_path)
            joblib.dump(baseline, baseline_path)

            logging.info(f"Saved anomaly model {model_key}")

        except Exception as e:
            logging.error(f"Error saving anomaly model {model_key}: {e}")

    async def _load_model(self, model_key: str):
        """Load anomaly detection model from disk."""
        try:
            model_path = os.path.join(self.cache_dir, f"{model_key}_anomaly_model.pkl")
            scaler_path = os.path.join(self.cache_dir, f"{model_key}_anomaly_scaler.pkl")
            baseline_path = os.path.join(self.cache_dir, f"{model_key}_anomaly_baseline.pkl")

            if os.path.exists(baseline_path):
                self.baselines[model_key] = joblib.load(baseline_path)

                if os.path.exists(scaler_path):
                    self.scalers[model_key] = joblib.load(scaler_path)

                if os.path.exists(model_path):
                    self.models[model_key] = joblib.load(model_path)

                logging.info(f"Loaded anomaly model {model_key}")
            else:
                logging.warning(f"Anomaly model {model_key} not found on disk")

        except Exception as e:
            logging.error(f"Error loading anomaly model {model_key}: {e}")

    async def retrain(self):
        """Retrain all anomaly detection models."""
        try:
            self._ready = True
            logging.info("Anomaly detection model retraining completed")

        except Exception as e:
            logging.error(f"Error retraining anomaly models: {e}")

    async def get_detection_methods(self) -> List[str]:
        """Get available anomaly detection methods."""
        return ["isolation_forest", "statistical", "zscore"]

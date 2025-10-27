"""
Data loading utilities for AI Analytics
Handles data fetching from MongoDB and preprocessing
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import pandas as pd
import numpy as np


class DataLoader:
    """Handles data loading and preprocessing for ML models."""

    def __init__(self, mongodb_uri: str, database_name: str):
        """Initialize the data loader."""
        self.mongodb_uri = mongodb_uri
        self.database_name = database_name
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self._ready = False

    async def connect(self):
        """Establish MongoDB connection."""
        try:
            self.client = AsyncIOMotorClient(self.mongodb_uri)
            self.db = self.client[self.database_name]

            # Test connection
            await self.client.admin.command('ping')
            self._ready = True
            logging.info(f"Connected to MongoDB: {self.database_name}")

        except Exception as e:
            logging.error(f"Failed to connect to MongoDB: {e}")
            self._ready = False
            raise

    async def disconnect(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            self._ready = False
            logging.info("Disconnected from MongoDB")

    def is_ready(self) -> bool:
        """Check if data loader is ready."""
        return self._ready

    async def get_parachain_data(
        self,
        parachain_id: str,
        metric: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 1000
    ) -> pd.DataFrame:
        """
        Fetch historical data for a parachain metric.

        Args:
            parachain_id: ID of the parachain
            metric: Metric type (tvl, transactions, users, blocks)
            start_date: Start date for data range
            end_date: End date for data range
            limit: Maximum number of records

        Returns:
            DataFrame with timestamp and metric values
        """
        if not self._ready:
            await self.connect()

        # Default to last 30 days if no dates provided
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        try:
            collection_name = f"{metric}_data"
            collection = self.db[collection_name]

            # Build query
            query = {
                "parachain_id": parachain_id,
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }

            # Fetch data
            cursor = collection.find(query).sort("timestamp", 1).limit(limit)
            data = await cursor.to_list(length=limit)

            if not data:
                logging.warning(f"No data found for {parachain_id} {metric}")
                return pd.DataFrame()

            # Convert to DataFrame
            df = pd.DataFrame(data)

            # Clean up data
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df = df.set_index('timestamp')

            if 'value' in df.columns:
                df['value'] = pd.to_numeric(df['value'], errors='coerce')
                df = df.dropna()

            logging.info(f"Fetched {len(df)} records for {parachain_id} {metric}")
            return df

        except Exception as e:
            logging.error(f"Error fetching data for {parachain_id} {metric}: {e}")
            return pd.DataFrame()

    async def get_all_parachains(self) -> List[str]:
        """Get list of all available parachain IDs."""
        if not self._ready:
            await self.connect()

        try:
            collection = self.db['parachains']
            cursor = collection.find({}, {"parachain_id": 1})
            parachains = await cursor.to_list(length=None)

            parachain_ids = [p['parachain_id'] for p in parachains if 'parachain_id' in p]
            return list(set(parachain_ids))

        except Exception as e:
            logging.error(f"Error fetching parachains: {e}")
            return []

    async def get_available_metrics(self) -> List[str]:
        """Get list of available metrics."""
        if not self._ready:
            await self.connect()

        try:
            # Get all collection names
            collections = await self.db.list_collection_names()

            # Filter for data collections (exclude system collections)
            metrics = []
            for collection in collections:
                if collection.endswith('_data') and collection != 'parachains_data':
                    metric = collection.replace('_data', '')
                    metrics.append(metric)

            return metrics

        except Exception as e:
            logging.error(f"Error fetching metrics: {e}")
            return ['tvl', 'transactions', 'users', 'blocks']

    async def preprocess_time_series(
        self,
        df: pd.DataFrame,
        fill_method: str = 'forward'
    ) -> pd.DataFrame:
        """
        Preprocess time series data for ML models.

        Args:
            df: Input DataFrame with time series data
            fill_method: Method to fill missing values ('forward', 'backward', 'interpolate')

        Returns:
            Preprocessed DataFrame
        """
        if df.empty:
            return df

        # Sort by timestamp
        df = df.sort_index()

        # Handle missing values
        if fill_method == 'forward':
            df = df.fillna(method='ffill')
        elif fill_method == 'backward':
            df = df.fillna(method='bfill')
        elif fill_method == 'interpolate':
            df = df.interpolate(method='linear')

        # Remove any remaining NaN values
        df = df.dropna()

        # Add time features
        if isinstance(df.index, pd.DatetimeIndex):
            df['hour'] = df.index.hour
            df['day_of_week'] = df.index.dayofweek
            df['day_of_month'] = df.index.day
            df['month'] = df.index.month
            df['quarter'] = df.index.quarter
            df['is_weekend'] = df.index.dayofweek >= 5

        # Add lag features
        for lag in [1, 7, 30]:
            df[f'lag_{lag}'] = df['value'].shift(lag)

        # Add rolling statistics
        df['rolling_mean_7'] = df['value'].rolling(window=7, min_periods=1).mean()
        df['rolling_std_7'] = df['value'].rolling(window=7, min_periods=1).std()
        df['rolling_mean_30'] = df['value'].rolling(window=30, min_periods=1).mean()

        # Remove rows with NaN values from lag features
        df = df.dropna()

        return df

    async def get_batch_data(
        self,
        parachain_ids: List[str],
        metrics: List[str],
        days: int = 30
    ) -> Dict[str, Dict[str, pd.DataFrame]]:
        """
        Fetch batch data for multiple parachains and metrics.

        Args:
            parachain_ids: List of parachain IDs
            metrics: List of metrics to fetch
            days: Number of days of historical data

        Returns:
            Nested dictionary with data for each parachain and metric
        """
        batch_data = {}

        for parachain_id in parachain_ids:
            batch_data[parachain_id] = {}

            for metric in metrics:
                df = await self.get_parachain_data(
                    parachain_id=parachain_id,
                    metric=metric,
                    start_date=datetime.now() - timedelta(days=days)
                )

                if not df.empty:
                    df_processed = await self.preprocess_time_series(df)
                    batch_data[parachain_id][metric] = df_processed

        return batch_data

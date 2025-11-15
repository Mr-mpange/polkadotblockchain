"""
Data loading utilities for AI Analytics
Handles data fetching from MySQL database using SQLAlchemy
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
import asyncio
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import QueuePool

# Import models
from ..models import Block, Transaction, Parachain, Metric, Base

class DataLoader:
    """Handles data loading and preprocessing for ML models using SQLAlchemy."""

    def __init__(self, db_session: Optional[Session] = None, db_url: Optional[str] = None):
        """Initialize the data loader with a SQLAlchemy session or connection URL."""
        self.db_session = db_session
        self.db_url = db_url or os.getenv("DATABASE_URI")
        self._engine = None
        self._async_engine = None
        self._session_factory = None
        self._async_session_factory = None
        self._ready = False

    async def connect(self):
        """Establish database connection and create session factory."""
        if self.db_session is None and not self.db_url:
            raise ValueError("Either db_session or db_url must be provided")

        try:
            if self.db_session is None:
                # Ensure we're using pymysql driver
                db_url = self.db_url
                if db_url.startswith('mysql://'):
                    db_url = db_url.replace('mysql://', 'mysql+pymysql://', 1)
                
                # Create sync engine
                self._engine = create_engine(
                    db_url,
                    poolclass=QueuePool,
                    pool_size=5,
                    max_overflow=10,
                    pool_timeout=30,
                    pool_recycle=3600
                )
                
                # Create async engine (use aiomysql for async)
                async_url = db_url.replace('mysql+pymysql://', 'mysql+aiomysql://')
                self._async_engine = create_async_engine(
                    async_url,
                    poolclass=QueuePool,
                    pool_size=5,
                    max_overflow=10,
                    pool_timeout=30,
                    pool_recycle=3600
                )
                
                # Create session factories
                self._session_factory = sessionmaker(
                    bind=self._engine,
                    autocommit=False,
                    autoflush=False
                )
                
                self._async_session_factory = sessionmaker(
                    bind=self._async_engine,
                    class_=AsyncSession,
                    expire_on_commit=False
                )
                
                # Test connection
                with self._engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                
                self._ready = True
                logging.info(f"Connected to database: {self.db_url}")
            else:
                self._ready = True
                logging.info("Using provided database session")

        except Exception as e:
            logging.error(f"Failed to connect to database: {e}")
            self._ready = False
            raise

    async def disconnect(self):
        """Close database connections."""
        if self._engine:
            self._engine.dispose()
        if self._async_engine:
            await self._async_engine.dispose()
            
        self._ready = False
        logging.info("Disconnected from database")

    def is_ready(self) -> bool:
        """Check if data loader is ready."""
        return self._ready
        
    def get_async_session(self) -> AsyncSession:
        """Get an async session for database operations."""
        if not self._async_session_factory:
            raise RuntimeError("Database connection not initialized. Call connect() first.")
        return self._async_session_factory()

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
        try:
            if not self._ready:
                await self.connect()

            async with self.get_async_session() as session:
                query = """
                    SELECT * FROM metrics 
                    WHERE parachain_id = :parachain_id AND metric = :metric
                """
                params = {"parachain_id": parachain_id, "metric": metric}
                
                if start_date:
                    query += " AND timestamp >= :start_date"
                    params["start_date"] = start_date
                if end_date:
                    query += " AND timestamp <= :end_date"
                    params["end_date"] = end_date
                    
                query += " ORDER BY timestamp ASC"
                
                result = await session.execute(text(query), params)
                data = [dict(row) for row in result.mappings()]
                
                if not data:
                    logging.warning(f"No data found for {parachain_id} {metric}")
                    return pd.DataFrame()
                    
                df = pd.DataFrame(data)
                
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
            async with self.get_async_session() as session:
                result = await session.execute(
                    text("SELECT DISTINCT parachain_id FROM parachains")
                )
                parachains = result.scalars().all()
                return list(set(parachains)) if parachains else []

        except Exception as e:
            logging.error(f"Error fetching parachains: {e}")
            return []

    async def get_available_metrics(self) -> List[str]:
        """Get list of available metrics."""
        if not self._ready:
            await self.connect()

        try:
            async with self.get_async_session() as session:
                # Get distinct metric types from the metrics table
                result = await session.execute(
                    text("SELECT DISTINCT metric FROM metrics")
                )
                metrics = result.scalars().all()
                return list(set(metrics)) if metrics else []

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

"""
Simple training script for AI models
Generates synthetic data and trains models
"""

import os
import sys
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import joblib

print("="*60)
print("AI MODEL TRAINING")
print("="*60)

# Create models directory
os.makedirs("models/cache", exist_ok=True)

def generate_training_data(parachain_id, metric, days=90):
    """Generate synthetic training data"""
    print(f"\nGenerating {days} days of data for {parachain_id} - {metric}")
    
    dates = []
    values = []
    
    base_value = 500000
    trend = np.linspace(0, 200000, days)
    
    for i in range(days):
        date = datetime.now() - timedelta(days=days-i)
        
        # Add trend + seasonality + noise
        seasonality = 5000 if date.weekday() >= 5 else 0
        noise = np.random.normal(0, 20000)
        value = base_value + trend[i] + seasonality + noise
        
        dates.append(date)
        values.append(max(0, value))
    
    # Create features
    data = []
    for date, value in zip(dates, values):
        data.append({
            'timestamp': date,
            'value': value,
            'hour': date.hour,
            'day_of_week': date.weekday(),
            'day_of_month': date.day,
            'month': date.month,
            'is_weekend': 1 if date.weekday() >= 5 else 0
        })
    
    df = pd.DataFrame(data)
    print(f"Generated {len(df)} records")
    print(f"Value range: ${df['value'].min():,.2f} to ${df['value'].max():,.2f}")
    
    return df

def train_model(df, parachain_id, metric):
    """Train a simple forecasting model"""
    print(f"\nTraining model for {parachain_id} - {metric}")
    
    # Prepare features
    feature_cols = ['hour', 'day_of_week', 'day_of_month', 'month', 'is_weekend']
    X = df[feature_cols].values
    y = df['value'].values
    
    # Split data
    split_idx = int(0.8 * len(df))
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    train_score = model.score(X_train_scaled, y_train)
    test_score = model.score(X_test_scaled, y_test)
    
    print(f"Train R² score: {train_score:.4f}")
    print(f"Test R² score: {test_score:.4f}")
    
    # Save model
    model_name = f"{parachain_id}_{metric}_ensemble"
    model_path = f"models/cache/{model_name}_model.pkl"
    scaler_path = f"models/cache/{model_name}_scaler.pkl"
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"✅ Model saved: {model_path}")
    print(f"✅ Scaler saved: {scaler_path}")
    
    return True

# Train models for different parachains
configs = [
    ("2000", "tvl"),      # Acala
    ("2001", "tvl"),      # Moonbeam
    ("2004", "tvl"),      # Astar
    ("2000", "transactions"),
]

success_count = 0
total_count = len(configs)

for parachain_id, metric in configs:
    try:
        # Generate data
        df = generate_training_data(parachain_id, metric, days=90)
        
        # Train model
        if train_model(df, parachain_id, metric):
            success_count += 1
    except Exception as e:
        print(f"❌ Error training {parachain_id} - {metric}: {e}")

print("\n" + "="*60)
print("TRAINING COMPLETE")
print("="*60)
print(f"Successfully trained: {success_count}/{total_count} models")
print(f"Models saved in: models/cache/")
print("\nRestart AI service to use trained models:")
print("  python app-enhanced.py")
print("="*60)

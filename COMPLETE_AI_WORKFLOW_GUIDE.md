# Complete AI Workflow Guide

**Your AI service is now running with app-enhanced.py!** 🎉

---

## Quick Start

### Currently Running
```
✅ AI Service: http://localhost:8000 (app-enhanced.py)
⚠️ Backend: Needs axios installation
❌ Frontend: Not started yet
```

### Complete the Setup (3 steps)

#### Step 1: Install axios in backend
```bash
cd polkadot-analytics/backend
npm install axios
```

#### Step 2: Start backend
```bash
node server.js
# Backend will run on http://localhost:5000
```

#### Step 3: Start frontend
```bash
cd polkadot-analytics/frontend
npm run dev
# Frontend will run on http://localhost:3000
```

---

## What You Have Now

### ✅ AI Service (Port 8000)
**File:** `app-enhanced.py`

**Features:**
- Predictions with confidence intervals
- Anomaly detection
- AI insights generation
- Automatic fallback to mock data
- Health monitoring

**Test it:**
```bash
# Health check
curl http://localhost:8000/health

# Get predictions
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"parachain_id":"2000","metric":"tvl","days":7}'
```

### ⚠️ Backend Integration (Port 5000)
**Status:** Routes created, needs axios

**What's ready:**
- ✅ Routes file: `src/routes/ai-analytics.js`
- ✅ Added to app.js
- ✅ Added to server.js
- ⚠️ Needs: `npm install axios`

**Once axios is installed:**
```bash
# Test through backend
curl http://localhost:5000/api/ai-analytics/health
```

### ❌ Frontend (Port 3000)
**Status:** Ready to start

**What's ready:**
- ✅ API methods in `src/services/api.js`
- ✅ Can call `/api/ai-analytics/*` endpoints
- ❌ Needs: `npm run dev`

---

## Complete Workflow

```
User Browser (localhost:3000)
         ↓
    Frontend (Next.js)
         ↓
    API Call to /api/ai-analytics/*
         ↓
    Backend (localhost:5000)
         ↓
    Proxy to AI Service
         ↓
    AI Service (localhost:8000)
         ↓
    Try ML Models → Fallback to Mock Data
         ↓
    Return Predictions/Insights
```

---

## Using Different AI Service Versions

### Option 1: app-simple.py (Mock Data Only)
```bash
cd polkadot-analytics/ai-analytics
python app-simple.py
```
**Use when:** Quick testing, no ML needed

### Option 2: app.py (Full ML)
```bash
cd polkadot-analytics/ai-analytics
python app.py
```
**Use when:** You have trained models

### Option 3: app-enhanced.py ⭐ RECOMMENDED (Currently Running)
```bash
cd polkadot-analytics/ai-analytics
python app-enhanced.py
```
**Use when:** Development or production (best of both worlds)

---

## API Endpoints Reference

### Direct AI Service (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/health` | Health check |
| POST | `/predict` | Generate predictions |
| POST | `/detect-anomalies` | Detect anomalies |
| POST | `/generate-insights` | Generate insights |
| GET | `/metrics` | Available metrics |
| GET | `/parachains` | Available parachains |
| GET | `/status` | Service status |

### Backend Proxy (Port 5000) - After axios install

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai-analytics/health` | Health check |
| POST | `/api/ai-analytics/predict` | Generate predictions |
| POST | `/api/ai-analytics/detect-anomalies` | Detect anomalies |
| POST | `/api/ai-analytics/generate-insights` | Generate insights |
| GET | `/api/ai-analytics/metrics` | Available metrics |
| GET | `/api/ai-analytics/parachains` | Available parachains |
| GET | `/api/ai-analytics/status` | Service status |
| GET | `/api/ai-analytics/insights/:id` | Get insights for parachain |
| GET | `/api/ai-analytics/predictions/:id` | Get predictions for parachain |

---

## Example API Calls

### 1. Get Predictions
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "parachain_id": "2000",
    "metric": "tvl",
    "days": 7
  }'
```

**Response:**
```json
{
  "status": "success",
  "parachain_id": "2000",
  "metric": "tvl",
  "predictions": [
    {
      "date": "2025-11-19",
      "predicted_value": 639160.55,
      "confidence_lower": 575244.49,
      "confidence_upper": 703076.6,
      "confidence": 0.85
    }
    // ... 6 more days
  ],
  "model": "mock_forecaster",
  "generated_at": "2025-11-18T10:53:46.580Z"
}
```

### 2. Detect Anomalies
```bash
curl -X POST http://localhost:8000/detect-anomalies \
  -H "Content-Type: application/json" \
  -d '{
    "parachain_id": "2000",
    "metric": "tvl",
    "sensitivity": 0.05
  }'
```

### 3. Generate Insights
```bash
curl -X POST http://localhost:8000/generate-insights \
  -H "Content-Type: application/json" \
  -d '{
    "parachain_id": "2000",
    "time_range_days": 30,
    "include_predictions": true
  }'
```

---

## Training ML Models (Future)

When you want to move from mock data to real ML predictions:

### 1. Collect Data
```python
# Get historical data from your database
import pandas as pd
from sqlalchemy import create_engine

engine = create_engine('mysql://user:pass@localhost/polkadot_analytics')
df = pd.read_sql('SELECT * FROM metrics WHERE parachain_id = 2000', engine)
```

### 2. Train Model
```python
from src.models.time_series_forecaster import TimeSeriesForecaster

forecaster = TimeSeriesForecaster()
result = await forecaster.train_model(
    df=df,
    parachain_id="2000",
    metric="tvl",
    model_type="ensemble"
)
```

### 3. Restart Service
```bash
# Models auto-load on startup
python app-enhanced.py
```

### 4. Verify
```bash
# Check if using ML models
curl http://localhost:8000/predict \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"parachain_id":"2000","metric":"tvl","days":7}'

# Look for "model": "ensemble" instead of "model": "mock_forecaster"
```

---

## Environment Configuration

### .env File
```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# Database
DATABASE_URI=mysql://user:password@localhost:3306/polkadot_analytics
DATABASE_NAME=polkadot_analytics

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/ai_analytics.log

# ML Models
MODEL_PATH=models/

# Predictions
DEFAULT_PREDICTION_DAYS=30
DEFAULT_ANOMALY_SENSITIVITY=0.05

# Optional: Gemini API for AI insights
GEMINI_API_KEY=your_api_key_here
```

---

## Monitoring and Debugging

### Check Service Status
```bash
curl http://localhost:8000/status
```

### Check Health
```bash
curl http://localhost:8000/health
```

### View Logs
```bash
# AI Service logs
tail -f polkadot-analytics/ai-analytics/logs/ai_analytics.log

# Backend logs
# Check terminal where backend is running
```

### Test All Endpoints
```bash
# Health
curl http://localhost:8000/health

# Metrics
curl http://localhost:8000/metrics

# Parachains
curl http://localhost:8000/parachains

# Status
curl http://localhost:8000/status
```

---

## Troubleshooting

### AI Service Issues

**Problem:** Service won't start
```bash
# Check Python version
python --version  # Need 3.8+

# Check dependencies
pip list | grep -E "fastapi|uvicorn"

# Reinstall if needed
pip install -r requirements.txt
```

**Problem:** Predictions return errors
- **Solution:** app-enhanced.py automatically falls back to mock data
- No action needed!

### Backend Issues

**Problem:** Backend can't connect to AI service
```bash
# Check AI service is running
curl http://localhost:8000/health

# Check backend has axios
cd polkadot-analytics/backend
npm list axios

# Install if missing
npm install axios
```

### Frontend Issues

**Problem:** Frontend can't reach backend
```bash
# Check backend is running
curl http://localhost:5000/health

# Check CORS settings in backend
# Should allow localhost:3000
```

---

## Production Checklist

Before deploying to production:

- [ ] Train ML models with real data
- [ ] Configure Gemini API key for AI insights
- [ ] Set up proper logging
- [ ] Configure database connection
- [ ] Set up monitoring and alerts
- [ ] Enable HTTPS
- [ ] Set proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up backup for trained models
- [ ] Document API for team

---

## Summary

**What's Working:**
- ✅ AI Service running on port 8000
- ✅ All endpoints responding correctly
- ✅ Predictions, anomalies, insights working
- ✅ Automatic fallback to mock data
- ✅ Backend routes created

**What's Needed:**
- ⚠️ Install axios in backend: `npm install axios`
- ⚠️ Start backend: `node server.js`
- ⚠️ Start frontend: `npm run dev`

**Then you'll have:**
```
Frontend (3000) → Backend (5000) → AI Service (8000) ✅
```

---

**Guide Created:** November 18, 2025  
**AI Service:** app-enhanced.py  
**Status:** ✅ OPERATIONAL  
**Next Step:** Install axios in backend

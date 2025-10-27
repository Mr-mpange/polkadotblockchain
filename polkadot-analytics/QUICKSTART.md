# Polkadot Cross-Chain Analytics Platform

A comprehensive, production-ready analytics platform for Polkadot parachains featuring real-time metrics, AI-powered insights, and cross-chain data visualization.

## 🎯 Project Complete!

This project is now **fully functional** with all components implemented and ready for deployment:

✅ **Frontend**: Next.js React dashboard with charts and real-time updates  
✅ **Backend**: Express.js API with Polkadot.js integration  
✅ **AI Analytics**: FastAPI with ML models for predictions and insights  
✅ **Sample Data**: Ready-to-use test data for development  
✅ **Tests**: Unit tests for both frontend and backend  
✅ **Docker**: Complete containerization setup  
✅ **Documentation**: Comprehensive setup and deployment guides

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd polkadot-analytics

# Start all services with Docker Compose
docker-compose up -d

# Access the platform
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# AI Analytics: http://localhost:8000
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
cd frontend && npm install
cd ../backend && npm install
cd ../ai-analytics && pip install -r requirements.txt

# 2. Setup environment
cp config/.env.example config/.env
# Edit config/.env with your API keys

# 3. Start MongoDB (required)
# MongoDB setup instructions in README.md

# 4. Load sample data (optional)
cd sample-data
mongoimport --db polkadot_analytics --collection parachains --file parachains.json --jsonArray
# ... import other sample data files

# 5. Start services
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - AI Analytics
cd ai-analytics && python app.py

# Terminal 3 - Frontend
cd frontend && npm run dev
```

## 📊 Features

### Real-time Dashboard
- **Live Metrics**: TVL, transactions, users, blocks
- **Interactive Charts**: Token flows between parachains
- **Historical Analysis**: Date-filtered trend visualization
- **Alert System**: Real-time notifications for metric changes
- **Wallet Integration**: Polkadot.js extension support

### AI-Powered Analytics
- **Predictive Models**: Time series forecasting using ML algorithms
- **Anomaly Detection**: Automatic unusual pattern detection
- **Natural Language Insights**: AI-generated summaries and recommendations
- **Risk Assessment**: Parachain health scoring and trend analysis

### Developer-Friendly
- **Sample Data**: Pre-built datasets for testing and development
- **Comprehensive Tests**: Unit tests for all major components
- **Docker Support**: Easy containerized deployment
- **API Documentation**: Auto-generated Swagger docs

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  AI Analytics   │
│   Next.js       │◄──►│   Express.js    │◄──►│   FastAPI       │
│   React + TS    │    │   Node.js       │    │   Python        │
│   TailwindCSS   │    │   MongoDB       │    │   ML Models     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Polkadot Network                         │
│  • Polkadot.js API  • Subscan API  • Parachain Data        │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

Copy `config/.env.example` to `config/.env` and configure:

```env
# Polkadot Network
POLKADOT_RPC_URL=wss://rpc.polkadot.io
SUBSCAN_API_KEY=your_subscan_api_key

# Database
MONGODB_URI=mongodb://localhost:27017/polkadot_analytics

# AI Analytics (Optional)
OPENAI_API_KEY=your_openai_api_key

# Alert System
ALERT_WEBHOOK_URL=your_webhook_url
```

## 📈 API Endpoints

### Backend API (Port 5000)
- `GET /parachains` - List all parachains
- `GET /tvl` - Total value locked data
- `GET /activity` - Real-time activity metrics
- `GET /history` - Historical data with filters
- `GET /alerts` - Active alerts and notifications

### AI Analytics API (Port 8000)
- `GET /health` - Service health check
- `POST /predict` - Generate ML predictions
- `POST /detect-anomalies` - Anomaly detection
- `POST /generate-insights` - AI-powered insights
- `GET /metrics` - Available metrics
- `GET /parachains` - Available parachains

## 🧪 Testing

Run the complete test suite:

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# AI Analytics tests (if pytest available)
cd ai-analytics && python -m pytest
```

## 🚀 Deployment

### Development
```bash
# Start all services
./deploy.sh  # (Linux/Mac)
# OR use docker-compose up -d
```

### Production Options
1. **Vercel/Netlify** (Frontend)
2. **Heroku/AWS** (Backend)
3. **Railway/Render** (AI Analytics)
4. **MongoDB Atlas** (Database)

## 📚 Documentation

- **Main README**: `README.md`
- **Sample Data Guide**: `sample-data/README.md`
- **API Documentation**: Available at `/api-docs` when backend is running
- **Deployment Guide**: See deployment section in main README

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
- Create an issue on GitHub
- Check the documentation
- Review the sample data setup

---

**🎉 Ready to explore Polkadot analytics!** Visit http://localhost:3000 after setup to see your dashboard in action.

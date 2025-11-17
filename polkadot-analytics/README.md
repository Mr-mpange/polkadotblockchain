Cross-Chain Analytics Platform for Polkadot
=============================================

A comprehensive analytics platform that provides real-time insights into Polkadot parachains,
including TVL, transaction volumes, user activity, and cross-chain flows.

## Project Structure

```
polkadot-analytics/
├── frontend/                 # React/Next.js frontend
├── backend/                  # Node.js/Express backend
├── ai-analytics/             # Python ML analytics
├── config/                   # Configuration files
├── sample-data/              # Sample data for testing
└── README.md                 # Main documentation
```

## Features

### Frontend
- **Real-time Dashboard**: Live parachain metrics (TVL, blocks, transactions, users)
- **Interactive Charts**: Token flow visualizations between parachains
- **Historical Analytics**: Date-filtered graphs and trend analysis
- **Alert System**: Real-time notifications for significant metric changes
- **Wallet Integration**: Polkadot.js extension support
- **Responsive Design**: Mobile and desktop optimized

### Backend
- **API Integration**: Polkadot.js and Subscan API connections
- **Data Aggregation**: Real-time parachain data collection and storage
- **RESTful API**: Comprehensive endpoints for all analytics data
- **Scheduled Tasks**: Automated data fetching and processing
- **Alert Engine**: Configurable threshold-based alerting

### AI Analytics (Optional)
- **Predictive Models**: Time series forecasting for parachain growth using Linear Regression, Random Forest, and Gradient Boosting
- **Anomaly Detection**: Automatic detection of unusual patterns using Isolation Forest and statistical methods
- **Insight Generation**: Natural language summaries of trends and patterns (with Google Gemini integration)
- **Risk Assessment**: Predictive analytics for parachain health and performance
- **Model Management**: Automatic model training, caching, and versioning

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, Chart.js, Polkadot.js
- **Backend**: Node.js, Express.js, MongoDB, Polkadot.js API
- **AI Analytics**: Python, FastAPI, Pandas, NumPy, Scikit-learn, Google Gemini API, Motor (Async MongoDB)
- **Deployment**: Docker, Vercel, Heroku, AWS

## Quick Start

1. **Clone and Setup**:
   ```bash
   git clone <repository-url>
   cd polkadot-analytics
   ```

2. **Install Dependencies**:
   ```bash
   # Frontend
   cd frontend && npm install

   # Backend
   cd ../backend && npm install

   # AI Analytics (optional)
   cd ../ai-analytics && pip install -r requirements.txt
   ```

3. **Configure Environment**:
   ```bash
   cp config/.env.example .env
   # Edit .env with your API keys and configurations
   ```

4. **Run Development Servers**:
   ```bash
   # Frontend (port 3000)
   cd frontend && npm run dev

   # Backend (port 5000)
   cd backend && npm run dev

   # AI Analytics (optional, port 8000)
   cd ai-analytics && python app.py
   ```
## Error Type
Console Error

## Error Message
API Request Error: {}


    at eval (src\services\api.js:59:19)
    at async ApiService.getDashboardData (src\services\api.js:126:24)

## Code Frame
  57 |         } else if (error.request) {
  58 |           // The request was made but no response was received
> 59 |           console.error('API Request Error:', {
     |                   ^
  60 |             message: 'No response received',
  61 |             url: error.config?.url,
  62 |             method: error.config?.method

Next.js version: 16.0.1 (Webpack)

5. **Access the Platform**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs
   - AI Analytics API: http://localhost:8000

6. **Load Sample Data (Optional)**:
   ```bash
   # Import sample data into MongoDB for testing
   cd sample-data
   mongoimport --db polkadot_analytics --collection parachains --file parachains.json --jsonArray
   mongoimport --db polkadot_analytics --collection tvl_data --file tvl_data.json --jsonArray
   mongoimport --db polkadot_analytics --collection transactions_data --file transactions_data.json --jsonArray
   mongoimport --db polkadot_analytics --collection blocks_data --file blocks_data.json --jsonArray
   ```

## API Endpoints

- `GET /parachains` - List all parachains with basic info
- `GET /parachains/:id/metrics` - Detailed metrics for a parachain
- `GET /tvl` - Total value locked across all parachains
- `GET /activity` - Real-time activity metrics
- `GET /history` - Historical data with date filters
- `GET /health` - AI Analytics health check
- `POST /predict` - Generate ML predictions for parachain metrics
- `POST /detect-anomalies` - Detect anomalies in parachain data
- `POST /generate-insights` - Generate AI-powered insights
- `GET /metrics` - Get available metrics for analysis
- `GET /parachains` - Get available parachains for analysis

## Configuration

Copy `config/.env.example` to `.env` and configure:

```env
# Polkadot API
POLKADOT_RPC_URL=wss://rpc.polkadot.io
SUBSCAN_API_KEY=your_subscan_api_key

# MySQL Database
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=polkadot_analytics

# AI Analytics (optional)
GEMINI_API_KEY=your_gemini_api_key

# Alert System
ALERT_WEBHOOK_URL=your_webhook_url
```

## Sample Data

For development and testing, the `sample-data/` directory contains synthetic data that mimics real Polkadot parachain metrics:

- **parachains.json**: Basic parachain information (Polkadot, Acala, Moonbeam, etc.)
- **tvl_data.json**: 5 days of TVL, transaction, and volume data
- **transactions_data.json**: User activity and transaction metrics
- **blocks_data.json**: Block production and validator data

See `sample-data/README.md` for detailed usage instructions.

## Deployment

### Frontend (Vercel/Netlify)
1. Connect repository to Vercel/Netlify
2. Set environment variables in deployment platform
3. Deploy automatically on git push

### Backend (Heroku/AWS)
1. Set environment variables in deployment platform
2. Configure MongoDB connection
3. Deploy with buildpack or Docker

### AI Analytics (Optional)
1. Deploy Python app to Heroku or AWS Lambda
2. Set up cron jobs for scheduled predictions

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation in each module's README

Cross-Chain Analytics Platform for Polkadot
=============================================

A comprehensive analytics platform that provides real-time insights into Polkadot parachains,
including TVL, transaction volumes, user activity, and cross-chain flows.

## Project Structure

```
polkadot-analytics/
├── frontend/                 # React/Next.js frontend
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Next.js pages/routes
│   │   ├── services/       # API services and utilities
│   │   ├── hooks/          # Custom React hooks
│   │   └── styles/         # Global styles and Tailwind
│   ├── package.json
│   └── README.md
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic and API integrations
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── README.md
├── ai-analytics/            # Python ML analytics
│   ├── models/             # Trained ML models
│   ├── notebooks/          # Jupyter notebooks for development
│   ├── src/
│   │   ├── data_processing/ # Data preprocessing
│   │   ├── models/         # ML model definitions
│   │   ├── prediction/     # Prediction services
│   │   └── utils/          # Utility functions
│   ├── requirements.txt
│   └── README.md
├── config/                  # Configuration files
│   ├── .env.example       # Environment variables template
│   └── deployment/         # Deployment configurations
└── README.md               # Main project documentation
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
- **Predictive Models**: Time series forecasting for parachain growth
- **Anomaly Detection**: Automatic detection of unusual patterns
- **Insight Generation**: Natural language summaries of trends
- **Risk Assessment**: Predictive analytics for parachain health

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, Chart.js, Polkadot.js
- **Backend**: Node.js, Express.js, MongoDB, Polkadot.js API
- **AI Analytics**: Python, Pandas, Scikit-learn, TensorFlow/PyTorch, Prophet
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

5. **Access the Platform**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## API Endpoints

- `GET /parachains` - List all parachains with basic info
- `GET /parachains/:id/metrics` - Detailed metrics for a parachain
- `GET /tvl` - Total value locked across all parachains
- `GET /activity` - Real-time activity metrics
- `GET /history` - Historical data with date filters
- `GET /alerts` - Active alerts and notifications

## Configuration

Copy `config/.env.example` to `.env` and configure:

```env
# Polkadot API
POLKADOT_RPC_URL=wss://rpc.polkadot.io
SUBSCAN_API_KEY=your_subscan_api_key

# Database
MONGODB_URI=mongodb://localhost:27017/polkadot_analytics

# AI Analytics (optional)
OPENAI_API_KEY=your_openai_api_key

# Alert System
ALERT_WEBHOOK_URL=your_webhook_url
```

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

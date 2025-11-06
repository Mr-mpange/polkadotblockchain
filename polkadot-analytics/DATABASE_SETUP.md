# Database Connection Setup Guide

This guide explains how all components of the Polkadot Analytics platform connect to their databases.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Polkadot Analytics                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │      │   Backend    │      │ AI Analytics │
│  (Next.js)   │      │ (Node.js)    │      │  (Python)    │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │ HTTP/API            │ Mongoose            │ PyMongo
       │                     │                     │
       └──────────┬──────────┴──────────┬──────────┘
                  │                     │
                  ▼                     ▼
          ┌───────────────┐     ┌─────────────┐
          │   Backend API │     │   MongoDB   │
          │  (REST/WS)    │     │  Database   │
          └───────────────┘     └─────────────┘
                                        │
                                ┌───────┴────────┐
                                │     Redis      │
                                │    (Cache)     │
                                └────────────────┘
```

## Database Connections

### 1. Backend → MongoDB

**Connection File**: `backend/src/config/database.js`

The backend connects to MongoDB using Mongoose ODM.

**Connection String**:
```
mongodb://localhost:27017/polkadot_analytics
```

**Environment Variables** (in `backend/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/polkadot_analytics
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=2
```

**Collections Used**:
- `parachains` - Parachain information
- `tvl_data` - Total Value Locked data
- `transactions` - Transaction records
- `user_activity` - User activity metrics
- `cross_chain_flows` - Cross-chain transfer data
- `alerts` - User alerts and notifications
- `users` - User accounts

### 2. AI Analytics → MongoDB

**Connection File**: `ai-analytics/src/data_processing/data_loader.py`

The AI Analytics service connects to MongoDB using PyMongo.

**Connection String**:
```
mongodb://localhost:27017
```

**Environment Variables** (in `ai-analytics/.env`):
```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=polkadot_analytics
```

**Collections Used**:
- `parachains` - For prediction and analysis
- `tvl_data` - For time series forecasting
- `transactions` - For anomaly detection
- `user_activity` - For insights generation

### 3. Frontend → Backend API

**Connection File**: `frontend/src/services/api.js`

The frontend doesn't connect directly to databases. Instead, it connects to the Backend API.

**Environment Variables** (in `frontend/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
```

**API Endpoints**:
- Backend API: `http://localhost:5000/api`
- AI Analytics API: `http://localhost:8000`

### 4. Redis Cache (Optional)

**Connection**: Backend uses Redis for caching and session storage.

**Environment Variables**:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Setup Instructions

### Option 1: Using Docker Compose (Recommended)

This is the easiest way to set up all services with their databases:

```bash
# 1. Create environment files
./setup-env.bat  # Windows
# or
./setup-env.sh   # Linux/Mac

# 2. Start all services
docker-compose up -d

# 3. Verify connections
docker-compose ps
```

Docker Compose will automatically:
- Start MongoDB on port 27017
- Start Redis on port 6379
- Start Backend on port 5000 (connected to MongoDB)
- Start Frontend on port 3000 (connected to Backend API)
- Start AI Analytics on port 8000 (connected to MongoDB)

### Option 2: Manual Setup

#### Step 1: Install MongoDB

**Windows**:
- Download from [MongoDB Official Site](https://www.mongodb.com/try/download/community)
- Install and start MongoDB service

**Linux**:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Mac**:
```bash
brew install mongodb-community
brew services start mongodb-community
```

#### Step 2: Create Environment Files

Run the setup script:

```bash
# Windows
setup-env.bat

# Linux/Mac
chmod +x setup-env.sh
./setup-env.sh
```

This will create:
- `backend/.env`
- `frontend/.env`
- `ai-analytics/.env`

#### Step 3: Configure Database Connections

Edit each `.env` file with your database credentials:

**backend/.env**:
```env
MONGODB_URI=mongodb://localhost:27017/polkadot_analytics
```

**ai-analytics/.env**:
```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=polkadot_analytics
```

**frontend/.env**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
```

#### Step 4: Initialize Database

Run the database setup script:

```bash
cd polkadot-analytics
node setup-database.js
```

This script will:
- Test MongoDB connection
- Create required collections
- Set up indexes for optimal performance
- Verify all connections

#### Step 5: Install Dependencies

**Backend**:
```bash
cd backend
npm install
```

**Frontend**:
```bash
cd frontend
npm install
```

**AI Analytics**:
```bash
cd ai-analytics
pip install -r requirements.txt
```

#### Step 6: Start Services

Open three separate terminals:

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - AI Analytics**:
```bash
cd ai-analytics
python app.py
```

## Verification

### Check Backend Connection

Visit: `http://localhost:5000/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-06T10:00:00.000Z",
  "uptime": 10.5,
  "version": "1.0.0"
}
```

### Check Frontend

Visit: `http://localhost:3000`

You should see the Polkadot Analytics dashboard.

### Check AI Analytics

Visit: `http://localhost:8000/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T10:00:00"
}
```

### Check MongoDB

Using MongoDB Compass or CLI:
```bash
mongo
> use polkadot_analytics
> show collections
```

You should see collections like `parachains`, `tvl_data`, etc.

## Connection Flow

### Data Write Flow

1. **Backend receives data** from Polkadot RPC
2. **Backend writes to MongoDB** using Mongoose models
3. **AI Analytics reads from MongoDB** for analysis
4. **AI Analytics writes predictions** back to MongoDB
5. **Frontend requests data** from Backend API
6. **Backend reads from MongoDB** and sends to Frontend

### Data Read Flow

1. **User accesses Frontend**
2. **Frontend calls Backend API** (`/api/parachains`, `/api/tvl`, etc.)
3. **Backend queries MongoDB** using Mongoose
4. **Backend returns data** to Frontend
5. **Frontend also calls AI Analytics** for predictions
6. **AI Analytics queries MongoDB** and returns ML insights

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/polkadot_analytics` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | Secret for JWT tokens | (generate secure key) |
| `POLKADOT_RPC_URL` | Polkadot RPC endpoint | `wss://rpc.polkadot.io` |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `NEXT_PUBLIC_AI_API_URL` | AI Analytics API URL | `http://localhost:8000` |

### AI Analytics (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `API_HOST` | API host | `0.0.0.0` |
| `API_PORT` | API port | `8000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database name | `polkadot_analytics` |

## Troubleshooting

### MongoDB Connection Errors

**Error**: `MongoNetworkError: connect ECONNREFUSED`

**Solution**:
- Ensure MongoDB is running: `sudo systemctl status mongodb`
- Check connection URI in `.env` files
- Verify port 27017 is not blocked

### Backend API Connection Errors

**Error**: `Network Error` in Frontend

**Solution**:
- Ensure Backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env`
- Verify CORS settings in `backend/src/app.js`

### AI Analytics Connection Errors

**Error**: `Failed to connect to MongoDB`

**Solution**:
- Check `MONGODB_URI` in `ai-analytics/.env`
- Ensure MongoDB is accessible
- Verify Python dependencies are installed

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for production MongoDB
3. **Enable authentication** in MongoDB for production
4. **Use environment-specific** connection strings
5. **Rotate JWT secrets** regularly
6. **Use SSL/TLS** for production database connections

## Production Configuration

For production deployment:

```env
# Backend
MONGODB_URI=mongodb://username:password@host:27017/polkadot_analytics?authSource=admin&ssl=true
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_AI_API_URL=https://ai.your-domain.com
```

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [FastAPI Configuration](https://fastapi.tiangolo.com/advanced/settings/)

## Support

If you encounter issues:
1. Check all services are running
2. Verify environment variables are set correctly
3. Review logs in each service
4. Run `node setup-database.js` to verify connections

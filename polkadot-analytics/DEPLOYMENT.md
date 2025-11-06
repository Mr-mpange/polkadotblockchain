# Deployment Guide - Polkadot Analytics Platform

Complete guide for deploying the Polkadot Analytics Platform to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Heroku/AWS)](#backend-deployment)
4. [AI Analytics Deployment](#ai-analytics-deployment)
5. [Database Setup (MongoDB Atlas)](#database-setup)
6. [Docker Deployment](#docker-deployment)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment](#post-deployment)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub/GitLab repository with your code
- ✅ Vercel account (for frontend)
- ✅ Heroku/AWS account (for backend)
- ✅ MongoDB Atlas account (for database)
- ✅ Domain name (optional)
- ✅ API keys (Subscan, CoinGecko, etc.)

---

## Frontend Deployment (Vercel)

### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow prompts to configure deployment
```

### Method 2: Vercel Dashboard

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Select the `frontend` directory as root

2. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Root Directory: frontend
   ```

3. **Set Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-api.herokuapp.com/api
   NEXT_PUBLIC_AI_API_URL=https://your-ai-api.herokuapp.com
   NEXT_PUBLIC_POLKADOT_RPC=wss://rpc.polkadot.io
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at: `https://your-project.vercel.app`

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

---

## Backend Deployment

### Option A: Heroku

#### 1. Install Heroku CLI

```bash
# Windows (with Chocolatey)
choco install heroku-cli

# Or download from heroku.com/cli
```

#### 2. Login and Create App

```bash
heroku login

cd backend
heroku create your-app-name
```

#### 3. Add MongoDB Add-on

```bash
# Option 1: Use MongoDB Atlas (recommended)
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/polkadot_analytics"

# Option 2: Use Heroku MongoDB add-on
heroku addons:create mongolab:sandbox
```

#### 4. Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=5000
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set ALLOWED_ORIGINS=https://your-frontend.vercel.app
heroku config:set POLKADOT_RPC_URL=wss://rpc.polkadot.io
heroku config:set SUBSCAN_API_KEY=your_subscan_key
heroku config:set COINGECKO_API_KEY=your_coingecko_key
```

#### 5. Create Procfile

```bash
# backend/Procfile
web: node src/app.js
```

#### 6. Deploy

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# View logs
heroku logs --tail
```

#### 7. Open Application

```bash
heroku open
# Or visit: https://your-app-name.herokuapp.com
```

### Option B: AWS EC2

#### 1. Launch EC2 Instance

- **AMI**: Ubuntu Server 22.04 LTS
- **Instance Type**: t2.small (minimum)
- **Security Group**: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 5000 (API)

#### 2. Connect and Setup

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### 3. Deploy Application

```bash
# Clone repository
git clone your-repo-url
cd polkadot-analytics/backend

# Install dependencies
npm install

# Create .env file
nano .env
# (paste your environment variables)

# Start with PM2
pm2 start src/app.js --name polkadot-api
pm2 save
pm2 startup
```

#### 4. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/polkadot-api

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/polkadot-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## AI Analytics Deployment

### Heroku Python Deployment

#### 1. Create requirements.txt

```bash
cd ai-analytics
pip freeze > requirements.txt
```

#### 2. Create Procfile

```bash
# ai-analytics/Procfile
web: uvicorn app:app --host 0.0.0.0 --port $PORT
```

#### 3. Deploy

```bash
heroku create your-ai-app-name
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set DATABASE_NAME="polkadot_analytics"
heroku config:set GOOGLE_API_KEY="your_gemini_key"

git push heroku main
```

### AWS Lambda + API Gateway (Serverless)

```bash
# Install Serverless Framework
npm install -g serverless

# Configure serverless.yml
# Deploy
serverless deploy
```

---

## Database Setup (MongoDB Atlas)

### 1. Create Cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster
3. Choose closest region
4. Create database user
5. Whitelist IP addresses (0.0.0.0/0 for all IPs)

### 2. Get Connection String

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/polkadot_analytics?retryWrites=true&w=majority
```

### 3. Import Sample Data

```bash
# Download MongoDB Database Tools
# https://www.mongodb.com/try/download/database-tools

# Import collections
mongoimport --uri "your-connection-string" --collection parachains --file sample-data/parachains.json --jsonArray
mongoimport --uri "your-connection-string" --collection tvl_data --file sample-data/tvl_data.json --jsonArray
```

### 4. Create Indexes

```javascript
// Connect via MongoDB Compass or Shell
use polkadot_analytics

db.parachains.createIndex({ parachain_id: 1 }, { unique: true })
db.tvl_data.createIndex({ parachain_id: 1, timestamp: -1 })
db.transactions.createIndex({ timestamp: -1 })
db.user_activity.createIndex({ parachain_id: 1, timestamp: -1 })
```

---

## Docker Deployment

### Build and Run

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - polkadot-network

  backend:
    build: ./backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongodb:27017/polkadot_analytics
    depends_on:
      - mongodb
    networks:
      - polkadot-network

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: https://api.your-domain.com
    depends_on:
      - backend
    networks:
      - polkadot-network

  ai-analytics:
    build: ./ai-analytics
    restart: always
    ports:
      - "8000:8000"
    environment:
      MONGODB_URI: mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongodb:27017
    depends_on:
      - mongodb
    networks:
      - polkadot-network

volumes:
  mongodb_data:

networks:
  polkadot-network:
    driver: bridge
```

---

## Environment Variables

### Frontend (.env.production)

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_AI_API_URL=https://ai.your-domain.com
NEXT_PUBLIC_POLKADOT_RPC=wss://rpc.polkadot.io
NEXT_PUBLIC_APP_NAME=Polkadot Analytics
```

### Backend (.env.production)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/polkadot_analytics
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=your-strong-secret-key
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
POLKADOT_RPC_URL=wss://rpc.polkadot.io
SUBSCAN_API_KEY=your_key
COINGECKO_API_KEY=your_key
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### AI Analytics (.env.production)

```env
API_HOST=0.0.0.0
API_PORT=8000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
DATABASE_NAME=polkadot_analytics
GOOGLE_API_KEY=your_gemini_api_key
LOG_LEVEL=INFO
MODEL_PATH=/app/models
```

---

## Post-Deployment

### 1. Verify All Services

```bash
# Test frontend
curl https://your-frontend.vercel.app

# Test backend API
curl https://your-backend.herokuapp.com/health

# Test AI analytics
curl https://your-ai-api.herokuapp.com/health
```

### 2. Setup Monitoring

#### Vercel Analytics
- Enable in Project Settings → Analytics

#### Heroku Logging
```bash
heroku logs --tail --app your-app-name
```

#### Set up Uptime Monitoring
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://www.pingdom.com)

### 3. Configure CORS

Ensure your backend allows requests from your frontend domain:

```javascript
// backend/src/app.js
const corsOptions = {
  origin: [
    'https://your-frontend.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
};
```

### 4. Setup CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          cd frontend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: your-app-name
          heroku_email: your-email@example.com
```

### 5. Performance Optimization

- **Enable caching** in Nginx/Heroku
- **Use CDN** for static assets
- **Enable compression** (gzip)
- **Database indexing** for common queries
- **Redis caching** for frequently accessed data

---

## Troubleshooting

### Common Issues

#### Build Fails on Vercel
```bash
# Clear cache and rebuild
vercel --force
```

#### Heroku App Crashes
```bash
# Check logs
heroku logs --tail
# Restart dynos
heroku restart
```

#### Database Connection Fails
- Verify connection string
- Check IP whitelist in MongoDB Atlas
- Ensure correct username/password

#### CORS Errors
- Update ALLOWED_ORIGINS in backend .env
- Verify frontend URL is correct

---

## Security Checklist

- ✅ Use environment variables for secrets
- ✅ Enable HTTPS/SSL certificates
- ✅ Set up rate limiting
- ✅ Enable MongoDB authentication
- ✅ Use strong JWT secrets
- ✅ Whitelist IPs in MongoDB Atlas
- ✅ Enable helmet.js security headers
- ✅ Keep dependencies updated
- ✅ Set up backup strategy
- ✅ Configure logging and monitoring

---

## Scaling Strategies

### Horizontal Scaling
- Use Heroku dynos scaling
- AWS Auto Scaling Groups
- Load balancer (Nginx/AWS ALB)

### Database Scaling
- MongoDB Atlas auto-scaling
- Read replicas
- Sharding for large datasets

### Caching
- Redis for API responses
- CDN for static assets
- Browser caching headers

---

## Backup Strategy

### Database Backups

```bash
# MongoDB Atlas: Enable automatic backups
# Manual backup
mongodump --uri="your-connection-string" --out=/backup/$(date +%Y%m%d)
```

### Application Backups

- Git repository (version control)
- Heroku releases (rollback capability)
- Regular environment variable backups

---

## Cost Estimation

### Free Tier Deployment

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | $0 |
| Heroku | Basic | $7/month |
| MongoDB Atlas | M0 | $0 |
| **Total** | | **~$7/month** |

### Production Deployment

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Heroku | Standard | $25-50/month |
| MongoDB Atlas | M10 | $57/month |
| Redis | Heroku | $15/month |
| **Total** | | **~$120-150/month** |

---

## Support

For deployment issues:
- Check logs first
- Review environment variables
- Verify API keys and secrets
- Test locally before deploying

**Your platform is now production-ready! 🚀**

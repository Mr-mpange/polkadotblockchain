# Quick Start Guide

## Prerequisites

- ✓ MySQL/XAMPP running on port 3306
- ✓ Node.js installed
- ✓ Python installed (for AI Analytics)

## One-Command Start

### Windows
```bash
start-all.bat
```

This will:
1. Verify database connection
2. Start backend on port 3001
3. Start frontend on port 3000
4. Start AI analytics on port 8000

## Manual Start

### 1. Verify Database
```bash
node test-db-connection.js
```

### 2. Start Backend
```bash
cd backend
npm run dev
```

### 3. Start Frontend (new terminal)
```bash
cd frontend
npm run dev
```

### 4. Start AI Analytics (new terminal)
```bash
cd ai-analytics
python app.py
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **AI Analytics**: http://localhost:8000

## Verify Everything Works

### Test Backend
```bash
curl http://localhost:3001/health
```

### Test AI Analytics
```bash
curl http://localhost:8000/health
```

### Test Frontend
Open browser: http://localhost:3000

## Troubleshooting

### MySQL Not Running
```
Error: ECONNREFUSED 127.0.0.1:3306
```
**Fix**: Start XAMPP MySQL service

### Port Already in Use
```
Error: Port 3001 is already in use
```
**Fix**: Kill the process or change the port in `backend/config/.env`

### Database Not Found
The backend will create it automatically on first run.

## Configuration Files

All configs are in:
- `backend/config/.env` - Backend settings
- `frontend/.env` - Frontend settings
- `ai-analytics/.env` - AI Analytics settings

## Need More Help?

See `DATABASE_CONFIG_FIXED.md` for detailed configuration info.

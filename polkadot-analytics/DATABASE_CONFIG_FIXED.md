# Database Configuration - FIXED ✓

## Summary

Your Polkadot Analytics platform is now properly configured to use **MySQL** (MariaDB 10.4.32) across all components.

## Current Status ✓

- **MySQL Server**: Running on 127.0.0.1:3306
- **Database**: `polkadot_analytics` (exists with 7 tables)
- **Backend**: Connected via Sequelize
- **AI Analytics**: Configured for MySQL
- **Frontend**: Connects to backend API

## Database Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Frontend   │      │   Backend   │      │ AI Analytics│
│  (Next.js)  │─────▶│  (Express)  │◀─────│  (FastAPI)  │
└─────────────┘      └──────┬──────┘      └──────┬──────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────────────────────┐
                     │   MySQL (MariaDB 10.4.32)    │
                     │   Database: polkadot_analytics│
                     └──────────────────────────────┘
```

## Configuration Files

### Backend (`backend/config/.env`)
```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=polkadot_analytics
```

### AI Analytics (`ai-analytics/.env`)
```env
DATABASE_URI=mysql://root:@127.0.0.1:3306/polkadot_analytics
DATABASE_NAME=polkadot_analytics
```

### Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Database Tables

Current tables in `polkadot_analytics`:
1. `accounts` - User accounts and wallet addresses
2. `blocks` - Blockchain blocks
3. `events` - Blockchain events
4. `extrinsics` - Blockchain extrinsics
5. `parachains` - Parachain information
6. `transactions` - Transaction records
7. `validators` - Validator information

## How to Start

### 1. Verify Database Connection
```bash
node test-db-connection.js
```

### 2. Start Backend
```bash
cd backend
npm run dev
```
Backend will run on: http://localhost:3001

### 3. Start Frontend
```bash
cd frontend
npm run dev
```
Frontend will run on: http://localhost:3000

### 4. Start AI Analytics
```bash
cd ai-analytics
python app.py
```
AI API will run on: http://localhost:8000

## Testing Endpoints

### Backend Health Check
```bash
curl http://localhost:3001/health
```

### AI Analytics Health Check
```bash
curl http://localhost:8000/health
```

### Frontend
Open browser: http://localhost:3000

## Common Issues & Solutions

### Issue: "ECONNREFUSED 127.0.0.1:3306"
**Solution**: Start MySQL/XAMPP
- Open XAMPP Control Panel
- Start MySQL service

### Issue: "Database does not exist"
**Solution**: The backend will create it automatically on first run
```bash
cd backend
npm run dev
```

### Issue: AI Analytics can't connect
**Solution**: Check the DATABASE_URI in `ai-analytics/.env`
```env
DATABASE_URI=mysql://root:@127.0.0.1:3306/polkadot_analytics
```

### Issue: Frontend can't reach backend
**Solution**: Make sure backend is running on port 3001
```bash
cd backend
npm run dev
```

## What Was Fixed

1. ✓ Updated AI Analytics from MongoDB to MySQL
2. ✓ Standardized all database configurations
3. ✓ Fixed environment variable inconsistencies
4. ✓ Created database verification script
5. ✓ Documented the correct architecture

## Docker Compose (Optional)

The `docker-compose.yml` file is configured for MongoDB and is **NOT currently used**. 
If you want to use Docker in the future, you'll need to update it to use MySQL instead.

## Production Considerations

For production deployment:

1. **Use strong passwords**:
```env
MYSQL_PASSWORD=your_strong_password_here
```

2. **Update connection strings**:
```env
DATABASE_URI=mysql://username:password@host:3306/polkadot_analytics
```

3. **Enable SSL/TLS** for database connections

4. **Use environment-specific configs** (dev, staging, prod)

5. **Set up database backups**

## Need Help?

Run the verification script anytime:
```bash
node test-db-connection.js
```

This will check:
- MySQL server status
- Database existence
- Table count
- Backend connection
- AI Analytics configuration

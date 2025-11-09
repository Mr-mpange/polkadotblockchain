require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./src/config/database');
const { logger } = require('./src/utils/logger');

// Create Express app
const app = express();
const port = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Health check route
app.get('/health', (req, res) => {
  logger.info('Health check endpoint hit');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Test endpoint is working!',
    timestamp: new Date().toISOString(),
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Dashboard route
app.get('/api/dashboard', (req, res) => {
  // Mock dashboard data - replace with actual data from your database
  const dashboardData = {
    status: 'success',
    data: {
      totalParachains: 25,
      activeParachains: 12,
      totalTVL: 2500000,
      recentActivity: [
        { id: 1, event: 'New block', timestamp: new Date().toISOString() },
        { id: 2, event: 'Parachain updated', timestamp: new Date().toISOString() }
      ]
    },
    timestamp: new Date().toISOString()
  };
  res.status(200).json(dashboardData);
});

// API Documentation (placeholder)
app.get('/api-docs', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API Documentation',
    timestamp: new Date().toISOString(),
    endpoints: [
      { method: 'GET', path: '/', description: 'API Root' },
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'GET', path: '/api/test', description: 'Test endpoint' },
      { method: 'GET', path: '/api/dashboard', description: 'Dashboard data' },
      { method: 'GET', path: '/api/parachains', description: 'List all parachains' }
    ]
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Polkadot Analytics API',
    status: 'running',
    timestamp: new Date().toISOString(),
    health: '/health',
    docs: '/api-docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start the server
const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Start the server
    app.listen(port, '0.0.0.0', () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n=== Server Running ===`);
      console.log(`Local:   http://localhost:${port}`);
      console.log(`Test endpoints:`);
      console.log(`- http://localhost:${port}/`);
      console.log(`- http://localhost:${port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

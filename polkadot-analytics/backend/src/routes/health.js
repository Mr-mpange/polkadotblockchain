const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    message: 'Server is running and healthy'
  });
});

// Root endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'Polkadot Analytics API',
    status: 'running',
    timestamp: new Date().toISOString(),
    docs: '/api-docs',
    health: '/health'
  });
});

module.exports = router;

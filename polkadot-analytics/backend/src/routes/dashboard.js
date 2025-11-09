const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock data
const mockData = {
  status: 'success',
  data: {
    total_parachains: 15,
    active_parachains: 12,
    total_tvl: 1250000000, // $1.25B
    recent_activity: [
      { id: 1, event: 'New block', timestamp: new Date().toISOString() },
      { id: 2, event: 'Parachain updated', timestamp: new Date().toISOString() }
    ]
  }
};

// GET /api/dashboard - Get dashboard summary data
router.get('/', async (req, res) => {
  try {
    logger.info('GET /api/dashboard');
    return res.status(200).json(mockData);
  } catch (error) {
    logger.error('Dashboard error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Dashboard service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
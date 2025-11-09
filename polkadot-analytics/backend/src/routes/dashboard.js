const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { logger } = require('../utils/logger');

// Debug middleware
router.use((req, res, next) => {
  logger.info(`Dashboard route hit: ${req.method} ${req.originalUrl}`);
  next();
});

// GET /api/dashboard - Get dashboard summary data
router.get('/', async (req, res, next) => {
  try {
    logger.info('Handling GET /api/dashboard');
    await getDashboardData(req, res, next);
  } catch (error) {
    logger.error('Error in dashboard route:', error);
    next(error);
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Dashboard route is working' });
});

module.exports = router;

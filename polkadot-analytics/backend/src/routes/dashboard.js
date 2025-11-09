const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');

// GET /api/dashboard - Get dashboard summary data
router.get('/', getDashboardData);

module.exports = router;

const express = require('express');
const router = express.Router();
const aiAnalyticsController = require('../controllers/aiAnalytics');

/**
 * @route   GET /api/ai-analytics/health
 * @desc    Check AI service health
 * @access  Public
 */
router.get('/health', aiAnalyticsController.getHealth);

/**
 * @route   GET /api/ai-analytics/insights/:parachainId
 * @desc    Get AI insights for a specific parachain
 * @access  Public
 */
router.get('/insights/:parachainId', aiAnalyticsController.getInsights);

/**
 * @route   GET /api/ai-analytics/predictions/:parachainId
 * @desc    Get predictions for a specific parachain
 * @access  Public
 */
router.get('/predictions/:parachainId', aiAnalyticsController.getPredictions);

module.exports = router;

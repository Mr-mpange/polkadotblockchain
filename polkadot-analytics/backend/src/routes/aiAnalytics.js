const express = require('express');
const router = express.Router();
const aiAnalyticsController = require('../controllers/aiAnalytics');

/**
 * @swagger
 * /api/ai-analytics/insights/{parachainId}:
 *   get:
 *     summary: Get AI-powered insights for a parachain
 *     description: Returns AI-generated insights based on parachain metrics and trends
 *     tags: [AI Analytics]
 *     parameters:
 *       - in: path
 *         name: parachainId
 *         required: true
 *         schema:
 *           type: string
 *         description: The parachain ID
 *     responses:
 *       200:
 *         description: AI insights generated successfully
 *       500:
 *         description: Server error
 */
router.get('/insights/:parachainId', aiAnalyticsController.getInsights);

/**
 * @swagger
 * /api/ai-analytics/predictions/{parachainId}:
 *   get:
 *     summary: Get AI predictions for a parachain
 *     description: Returns AI-generated predictions for TVL, transactions, and other metrics
 *     tags: [AI Analytics]
 *     parameters:
 *       - in: path
 *         name: parachainId
 *         required: true
 *         schema:
 *           type: string
 *         description: The parachain ID
 *     responses:
 *       200:
 *         description: Predictions generated successfully
 *       500:
 *         description: Server error
 */
router.get('/predictions/:parachainId', aiAnalyticsController.getPredictions);

/**
 * @swagger
 * /api/ai-analytics/health:
 *   get:
 *     summary: Check AI analytics service health
 *     description: Returns the health status of AI analytics models and services
 *     tags: [AI Analytics]
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/health', aiAnalyticsController.getHealth);

module.exports = router;

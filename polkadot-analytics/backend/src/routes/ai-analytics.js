const express = require('express');
const axios = require('axios');
const router = express.Router();

// AI Analytics Service Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_TIMEOUT = 30000; // 30 seconds

// Create axios instance for AI service
const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: AI_SERVICE_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request/response interceptors for logging
aiClient.interceptors.request.use(
  (config) => {
    console.log(`🤖 AI Service Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ AI Service Request Error:', error.message);
    return Promise.reject(error);
  }
);

aiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ AI Service Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ AI Service Response Error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * @route   GET /api/ai-analytics/health
 * @desc    Check AI service health
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const response = await aiClient.get('/health');
    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('Error checking AI service health:', error.message);
    res.status(503).json({
      status: 'error',
      message: 'AI service unavailable',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/ai-analytics/predict
 * @desc    Get predictions for a parachain metric
 * @access  Public
 */
router.post('/predict', async (req, res) => {
  try {
    const { parachain_id, metric, days = 7 } = req.body;

    if (!parachain_id || !metric) {
      return res.status(400).json({
        status: 'error',
        message: 'parachain_id and metric are required'
      });
    }

    const response = await aiClient.post('/predict', {
      parachain_id,
      metric,
      days
    });

    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('Error getting predictions:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get predictions',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/ai-analytics/detect-anomalies
 * @desc    Detect anomalies in parachain metrics
 * @access  Public
 */
router.post('/detect-anomalies', async (req, res) => {
  try {
    const { parachain_id, metric, sensitivity = 0.05 } = req.body;

    if (!parachain_id || !metric) {
      return res.status(400).json({
        status: 'error',
        message: 'parachain_id and metric are required'
      });
    }

    const response = await aiClient.post('/detect-anomalies', {
      parachain_id,
      metric,
      sensitivity
    });

    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to detect anomalies',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/ai-analytics/generate-insights
 * @desc    Generate AI insights for parachains
 * @access  Public
 */
router.post('/generate-insights', async (req, res) => {
  try {
    const { parachain_id, time_range_days = 30, include_predictions = true } = req.body;

    const response = await aiClient.post('/generate-insights', {
      parachain_id,
      time_range_days,
      include_predictions
    });

    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('Error generating insights:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate insights',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ai-analytics/metrics
 * @desc    Get available metrics for analysis
 * @access  Public
 */
router.get('/metrics', async (req, res) => {
  try {
    const response = await aiClient.get('/metrics');
    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('Error getting metrics:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get metrics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ai-analytics/parachains
 * @desc    Get available parachains from AI service
 * @access  Public
 */
router.get('/parachains', async (req, res) => {
  try {
    const response = await aiClient.get('/parachains');
    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('Error getting parachains:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get parachains',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ai-analytics/status
 * @desc    Get AI service status
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const response = await aiClient.get('/status');
    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('Error getting AI service status:', error.message);
    res.status(503).json({
      status: 'error',
      message: 'AI service unavailable',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ai-analytics/insights/:parachainId
 * @desc    Get AI insights for a specific parachain (convenience endpoint)
 * @access  Public
 */
router.get('/insights/:parachainId', async (req, res) => {
  try {
    const { parachainId } = req.params;
    const { days = 30 } = req.query;

    const response = await aiClient.post('/generate-insights', {
      parachain_id: parachainId,
      time_range_days: parseInt(days),
      include_predictions: true
    });

    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error(`Error getting insights for parachain ${req.params.parachainId}:`, error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get insights',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ai-analytics/predictions/:parachainId
 * @desc    Get predictions for a specific parachain (convenience endpoint)
 * @access  Public
 */
router.get('/predictions/:parachainId', async (req, res) => {
  try {
    const { parachainId } = req.params;
    const { metric = 'tvl', days = 7 } = req.query;

    const response = await aiClient.post('/predict', {
      parachain_id: parachainId,
      metric,
      days: parseInt(days)
    });

    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error(`Error getting predictions for parachain ${req.params.parachainId}:`, error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get predictions',
      error: error.message
    });
  }
});

module.exports = router;

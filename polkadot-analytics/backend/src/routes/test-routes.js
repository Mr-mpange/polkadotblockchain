const express = require('express');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ message: 'Test route is working!' });
});

// Health check
router.get('/health', (req, res) => {
  console.log('Health check hit!');
  res.json({ status: 'ok', message: 'Test routes are healthy' });
});

// Dashboard test route
router.get('/dashboard-test', (req, res) => {
  console.log('Dashboard test route hit!');
  res.json({ status: 'ok', message: 'Dashboard test route is working' });
});

module.exports = router;

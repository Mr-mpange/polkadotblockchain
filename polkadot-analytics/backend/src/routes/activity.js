const express = require('express');
const router = express.Router();
const { getActivity, getActivityHistory } = require('../controllers/activity');

// @route   GET /api/activity
// @desc    Get real-time activity metrics
// @access  Public
router.get('/', getActivity);

// @route   GET /api/activity/history
// @desc    Get historical activity data
// @access  Public
router.get('/history', getActivityHistory);

module.exports = router;

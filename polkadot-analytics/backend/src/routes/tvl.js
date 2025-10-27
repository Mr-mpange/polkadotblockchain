const express = require('express');
const router = express.Router();
const { getTVL, getTVLHistory } = require('../controllers/tvl');

// @route   GET /api/tvl
// @desc    Get total value locked across all parachains
// @access  Public
router.get('/', getTVL);

// @route   GET /api/tvl/history
// @desc    Get historical TVL data
// @access  Public
router.get('/history', getTVLHistory);

module.exports = router;

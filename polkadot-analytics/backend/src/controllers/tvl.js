const TVL = require('../models/TVL');
const { logger } = require('../utils/logger');

// @desc    Get total value locked across all parachains
// @route   GET /api/tvl
// @access  Public
const getTVL = async (req, res, next) => {
  try {
    const latestTVL = await TVL.findOne().sort({ timestamp: -1 });

    if (!latestTVL) {
      return res.status(404).json({
        success: false,
        error: 'No TVL data available'
      });
    }

    res.json({
      success: true,
      data: {
        totalValueLocked: latestTVL.totalValueLocked,
        timestamp: latestTVL.timestamp,
        parachains: latestTVL.parachains
      }
    });
  } catch (error) {
    logger.error('Error fetching TVL data:', error);
    next(error);
  }
};

// @desc    Get historical TVL data
// @route   GET /api/tvl/history
// @access  Public
const getTVLHistory = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const history = await TVL.find({
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      count: history.length,
      data: history.map(item => ({
        totalValueLocked: item.totalValueLocked,
        timestamp: item.timestamp,
        parachains: item.parachains
      }))
    });
  } catch (error) {
    logger.error('Error fetching TVL history:', error);
    next(error);
  }
};

module.exports = {
  getTVL,
  getTVLHistory
};

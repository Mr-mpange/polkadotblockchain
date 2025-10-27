const Activity = require('../models/Activity');
const { logger } = require('../utils/logger');

// @desc    Get real-time activity metrics
// @route   GET /api/activity
// @access  Public
const getActivity = async (req, res, next) => {
  try {
    const latestActivity = await Activity.findOne().sort({ timestamp: -1 });

    if (!latestActivity) {
      return res.status(404).json({
        success: false,
        error: 'No activity data available'
      });
    }

    res.json({
      success: true,
      data: {
        totalTransactions: latestActivity.totalTransactions,
        activeUsers: latestActivity.activeUsers,
        blocksProduced: latestActivity.blocksProduced,
        timestamp: latestActivity.timestamp,
        parachains: latestActivity.parachains
      }
    });
  } catch (error) {
    logger.error('Error fetching activity data:', error);
    next(error);
  }
};

// @desc    Get historical activity data
// @route   GET /api/activity/history
// @access  Public
const getActivityHistory = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const history = await Activity.find({
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      count: history.length,
      data: history.map(item => ({
        totalTransactions: item.totalTransactions,
        activeUsers: item.activeUsers,
        blocksProduced: item.blocksProduced,
        timestamp: item.timestamp,
        parachains: item.parachains
      }))
    });
  } catch (error) {
    logger.error('Error fetching activity history:', error);
    next(error);
  }
};

module.exports = {
  getActivity,
  getActivityHistory
};

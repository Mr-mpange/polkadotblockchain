const { Parachain, Metric } = require('../models');
const { Op } = require('sequelize');

/**
 * Get dashboard summary data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
exports.getDashboardData = async (req, res, next) => {
  try {
    const { period = '24h' } = req.query;
    
    // Calculate time range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 1);
    }

    // Get parachains count
    const totalParachains = await Parachain.count();
    const activeParachains = await Parachain.count({
      where: { is_active: true }
    });

    // Get latest metrics
    const metrics = await Metric.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate
        }
      },
      order: [['timestamp', 'DESC']],
      limit: 100
    });

    // Calculate TVL and other metrics
    const totalTVL = metrics.reduce((sum, metric) => {
      if (metric.metric_name === 'tvl' && metric.value_int) {
        return sum + parseFloat(metric.value_int);
      }
      return sum;
    }, 0);

    // Prepare response
    const response = {
      status: 'success',
      data: {
        summary: {
          total_parachains: totalParachains,
          active_parachains: activeParachains,
          total_tvl: totalTVL,
          period: period
        },
        metrics: metrics.map(m => ({
          timestamp: m.timestamp,
          metric_name: m.metric_name,
          value: m.value_int || m.value_float || m.value_str,
          parachain_id: m.parachain_id
        }))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

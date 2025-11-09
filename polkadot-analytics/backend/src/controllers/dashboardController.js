const { Parachain, TVL } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');

/**
 * Get dashboard summary data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
exports.getDashboardData = async (req, res, next) => {
  try {
    logger.info('Fetching dashboard data...');
    const { period = '24h' } = req.query;
    
    // Calculate time range based on period
    const now = new Date();
    let startDate = new Date();
    
    logger.info(`Period: ${period}`);
    
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

    logger.info(`Fetching data from ${startDate} to ${now}`);

    // Get parachains count
    const [totalParachains, activeParachains] = await Promise.all([
      Parachain.count(),
      Parachain.count({
        where: { is_active: true }
      })
    ]);

    logger.info(`Found ${totalParachains} parachains (${activeParachains} active)`);

    // Get latest TVL data
    const tvlData = await TVL.find({
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: -1 })
    .limit(100);

    logger.info(`Found ${tvlData.length} TVL records`);

    // Calculate total TVL
    const totalTVL = tvlData.reduce((sum, record) => {
      return sum + (parseFloat(record.totalValueLocked) || 0);
    }, 0);

    // Get top parachains by TVL
    const topParachains = await TVL.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: {
          _id: '$parachainId',
          parachainName: { $first: '$parachainName' },
          totalValueLocked: { $first: '$totalValueLocked' },
          totalValueLockedUSD: { $first: '$totalValueLockedUSD' },
          tokenCount: { $first: '$tokenCount' },
          protocolCount: { $first: '$protocolCount' },
          timestamp: { $first: '$timestamp' }
      }},
      { $sort: { totalValueLockedUSD: -1 } },
      { $limit: 5 }
    ]);

    // Prepare response
    const response = {
      status: 'success',
      data: {
        summary: {
          total_parachains: totalParachains,
          active_parachains: activeParachains,
          total_tvl: totalTVL,
          period: period,
          top_parachains: topParachains.map(p => ({
            id: p._id,
            name: p.parachainName,
            tvl: p.totalValueLocked,
            tvl_usd: p.totalValueLockedUSD,
            token_count: p.tokenCount,
            protocol_count: p.protocolCount,
            timestamp: p.timestamp
          }))
        },
        tvl_history: tvlData.map(tvl => ({
          timestamp: tvl.timestamp,
          parachain_id: tvl.parachainId,
          parachain_name: tvl.parachainName,
          total_value_locked: tvl.totalValueLocked,
          total_value_locked_usd: tvl.totalValueLockedUSD
        }))
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Error in getDashboardData:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

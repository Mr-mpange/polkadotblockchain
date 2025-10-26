const Parachain = require('../models/Parachain');
const TVL = require('../models/TVL');
const Activity = require('../models/Activity');
const { logger } = require('../utils/logger');
const polkadotService = require('../services/polkadotService');

// Get all parachains with filtering and pagination
const getAllParachains = async (req, res) => {
  try {
    const {
      status,
      category,
      relayChain,
      limit = 20,
      offset = 0,
      sortBy = 'parachainId',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (relayChain) filter.relayChain = relayChain;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const parachains = await Parachain.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    // Get total count for pagination
    const total = await Parachain.countDocuments(filter);

    // Get latest metrics for each parachain
    const parachainsWithMetrics = await Promise.all(
      parachains.map(async (parachain) => {
        try {
          const metrics = await parachain.getLatestMetrics();
          return {
            ...parachain,
            latestMetrics: metrics
          };
        } catch (error) {
          logger.error(`Failed to get metrics for parachain ${parachain.parachainId}:`, error);
          return {
            ...parachain,
            latestMetrics: null
          };
        }
      })
    );

    res.json({
      success: true,
      data: parachainsWithMetrics,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    logger.error('Error fetching parachains:', error);
    throw error;
  }
};

// Get parachain by ID
const getParachainById = async (req, res) => {
  try {
    const { id } = req.params;

    const parachain = await Parachain.findOne({ parachainId: parseInt(id) });

    if (!parachain) {
      return res.status(404).json({
        success: false,
        error: 'Parachain not found'
      });
    }

    // Get latest metrics
    const metrics = await parachain.getLatestMetrics();

    res.json({
      success: true,
      data: {
        ...parachain.toObject(),
        latestMetrics: metrics
      }
    });
  } catch (error) {
    logger.error(`Error fetching parachain ${req.params.id}:`, error);
    throw error;
  }
};

// Get comprehensive metrics for a parachain
const getParachainMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '24h' } = req.query;

    const parachain = await Parachain.findOne({ parachainId: parseInt(id) });

    if (!parachain) {
      return res.status(404).json({
        success: false,
        error: 'Parachain not found'
      });
    }

    // Calculate time range
    const now = new Date();
    const timeRanges = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };

    const startDate = timeRanges[period] || timeRanges['24h'];

    // Get TVL data
    const tvlData = await TVL.find({
      parachainId: parseInt(id),
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    // Get activity data
    const activityData = await Activity.find({
      parachainId: parseInt(id),
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    // Get current TVL and activity
    const currentTVL = await TVL.findOne({ parachainId: parseInt(id) })
      .sort({ timestamp: -1 });

    const currentActivity = await Activity.findOne({ parachainId: parseInt(id) })
      .sort({ timestamp: -1 });

    // Calculate health metrics
    const healthMetrics = await calculateHealthMetrics(parachain, currentTVL, currentActivity);

    res.json({
      success: true,
      data: {
        parachain: parachain.toObject(),
        tvl: {
          current: currentTVL ? currentTVL.totalValueLockedUSD : 0,
          change24h: currentTVL ? currentTVL.change24h : 0,
          history: tvlData.map(tvl => ({
            timestamp: tvl.timestamp,
            value: tvl.totalValueLockedUSD,
            change: tvl.changePercentage
          }))
        },
        activity: {
          transactions24h: currentActivity ? currentActivity.totalTransactions : 0,
          activeAccounts24h: currentActivity ? currentActivity.uniqueActiveAccounts : 0,
          blocksProduced24h: currentActivity ? currentActivity.blocksProduced : 0,
          history: activityData.map(activity => ({
            timestamp: activity.timestamp,
            transactions: activity.totalTransactions,
            activeAccounts: activity.uniqueActiveAccounts,
            blocks: activity.blocksProduced,
            volume: activity.transferVolumeUSD
          }))
        },
        health: healthMetrics,
        period
      }
    });
  } catch (error) {
    logger.error(`Error fetching metrics for parachain ${req.params.id}:`, error);
    throw error;
  }
};

// Get TVL data for a parachain
const getParachainTVL = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, groupBy = 'hour' } = req.query;

    const parachain = await Parachain.findOne({ parachainId: parseInt(id) });

    if (!parachain) {
      return res.status(404).json({
        success: false,
        error: 'Parachain not found'
      });
    }

    const query = { parachainId: parseInt(id) };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    let tvlData;
    if (groupBy === 'day') {
      tvlData = await TVL.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$date',
            totalValueLockedUSD: { $last: '$totalValueLockedUSD' },
            timestamp: { $last: '$timestamp' },
            tokenCount: { $last: '$tokenCount' },
            protocolCount: { $last: '$protocolCount' }
          }
        },
        { $sort: { timestamp: 1 } }
      ]);
    } else {
      tvlData = await TVL.find(query).sort({ timestamp: 1 });
    }

    const currentTVL = tvlData[tvlData.length - 1];
    const previousTVL = tvlData[tvlData.length - 2];

    const change24h = currentTVL && previousTVL ?
      ((currentTVL.totalValueLockedUSD - previousTVL.totalValueLockedUSD) / previousTVL.totalValueLockedUSD) * 100 : 0;

    res.json({
      success: true,
      data: {
        current: currentTVL ? currentTVL.totalValueLockedUSD : 0,
        change24h,
        history: tvlData.map(tvl => ({
          timestamp: tvl.timestamp,
          value: tvl.totalValueLockedUSD,
          tokenCount: tvl.tokenCount,
          protocolCount: tvl.protocolCount
        }))
      }
    });
  } catch (error) {
    logger.error(`Error fetching TVL data for parachain ${req.params.id}:`, error);
    throw error;
  }
};

// Get activity data for a parachain
const getParachainActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, groupBy = 'hour' } = req.query;

    const parachain = await Parachain.findOne({ parachainId: parseInt(id) });

    if (!parachain) {
      return res.status(404).json({
        success: false,
        error: 'Parachain not found'
      });
    }

    const query = { parachainId: parseInt(id) };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    let activityData;
    if (groupBy === 'day') {
      activityData = await Activity.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$date',
            totalTransactions: { $last: '$totalTransactions' },
            uniqueActiveAccounts: { $last: '$uniqueActiveAccounts' },
            blocksProduced: { $last: '$blocksProduced' },
            transferVolumeUSD: { $last: '$transferVolumeUSD' },
            xcmTransfers: { $last: '$xcmTransfers' },
            timestamp: { $last: '$timestamp' }
          }
        },
        { $sort: { timestamp: 1 } }
      ]);
    } else {
      activityData = await Activity.find(query).sort({ timestamp: 1 });
    }

    res.json({
      success: true,
      data: {
        transactions: activityData.map(activity => ({
          timestamp: activity.timestamp,
          count: activity.totalTransactions,
          volume: activity.transferVolumeUSD
        })),
        accounts: activityData.map(activity => ({
          timestamp: activity.timestamp,
          active: activity.uniqueActiveAccounts,
          new: activity.newAccounts
        })),
        blocks: activityData.map(activity => ({
          timestamp: activity.timestamp,
          produced: activity.blocksProduced,
          time: activity.averageBlockTime,
          utilization: activity.blockUtilization
        })),
        xcm: activityData.map(activity => ({
          timestamp: activity.timestamp,
          transfers: activity.xcmTransfers,
          volume: activity.xcmVolumeUSD
        }))
      }
    });
  } catch (error) {
    logger.error(`Error fetching activity data for parachain ${req.params.id}:`, error);
    throw error;
  }
};

// Update parachain information (Admin only)
const updateParachain = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user has admin permissions
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    const parachain = await Parachain.findOneAndUpdate(
      { parachainId: parseInt(id) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!parachain) {
      return res.status(404).json({
        success: false,
        error: 'Parachain not found'
      });
    }

    logger.info(`Parachain ${id} updated by user ${req.user._id}`);

    res.json({
      success: true,
      data: parachain
    });
  } catch (error) {
    logger.error(`Error updating parachain ${req.params.id}:`, error);
    throw error;
  }
};

// Helper function to calculate health metrics
const calculateHealthMetrics = async (parachain, currentTVL, currentActivity) => {
  try {
    // Get data from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [tvlHistory, activityHistory] = await Promise.all([
      TVL.find({
        parachainId: parachain.parachainId,
        timestamp: { $gte: sevenDaysAgo }
      }).sort({ timestamp: 1 }),
      Activity.find({
        parachainId: parachain.parachainId,
        timestamp: { $gte: sevenDaysAgo }
      }).sort({ timestamp: 1 })
    ]);

    // Calculate uptime based on data availability
    const expectedDataPoints = 7 * 24; // 7 days * 24 hours
    const actualDataPoints = tvlHistory.length + activityHistory.length;
    const uptime = (actualDataPoints / (expectedDataPoints * 2)) * 100; // Divide by 2 since we have 2 data types

    // Calculate activity score
    const activityScore = currentActivity ? currentActivity.activityScore : 0;

    // Determine overall status
    let status = 'healthy';
    if (uptime < 50) status = 'critical';
    else if (uptime < 75) status = 'degraded';
    else if (activityScore < 10) status = 'low_activity';

    return {
      status,
      uptime: Math.round(uptime * 100) / 100,
      activityScore,
      lastBlock: currentActivity ? currentActivity.blockNumber : null,
      dataPoints: {
        tvl: tvlHistory.length,
        activity: activityHistory.length,
        expected: expectedDataPoints * 2
      }
    };
  } catch (error) {
    logger.error(`Error calculating health metrics for parachain ${parachain.parachainId}:`, error);
    return {
      status: 'unknown',
      uptime: 0,
      activityScore: 0,
      error: error.message
    };
  }
};

module.exports = {
  getAllParachains,
  getParachainById,
  getParachainMetrics,
  getParachainTVL,
  getParachainActivity,
  updateParachain
};

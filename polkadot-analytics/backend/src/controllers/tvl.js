const { Parachain, Metric } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');

// @desc    Get total value locked across all parachains
// @route   GET /api/tvl
// @access  Public
exports.getTVL = async (req, res) => {
  try {
    logger.info('Fetching TVL data...');
    
    // Get all parachains with their current TVL
    const tvlData = await Parachain.findAll({
      attributes: [
        'id', 
        'name', 
        'total_stake',
        'token_symbol',
        'is_active'
      ],
      where: {
        is_active: true
      },
      order: [['total_stake', 'DESC']]
    });

    // Calculate total TVL across all parachains
    const totalTVL = tvlData.reduce((sum, chain) => {
      return sum + BigInt(chain.total_stake || 0);
    }, 0n);

    logger.info(`Successfully fetched TVL data for ${tvlData.length} parachains`);
    
    res.json({
      status: 'success',
      data: {
        total_tvl: totalTVL.toString(),
        chains: tvlData.map(chain => ({
          id: chain.id,
          name: chain.name,
          total_stake: chain.total_stake.toString(),
          token_symbol: chain.token_symbol || 'DOT',
          is_active: chain.is_active
        }))
      }
    });
  } catch (error) {
    logger.error('Error in getTVL:', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch TVL data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get historical TVL data
// @route   GET /api/tvl/history
// @access  Public
exports.getTVLHistory = async (req, res) => {
  try {
    const { days = 30, chainId } = req.query;
    logger.info(`Fetching TVL history for last ${days} days${chainId ? `, chainId: ${chainId}` : ''}`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Build where clause
    const where = {
      metric_name: 'tvl',
      timestamp: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Filter by chain if chainId is provided
    if (chainId) {
      where.parachain_id = chainId;
    }

    // Get TVL history
    const tvlHistory = await Metric.findAll({
      where,
      order: [['timestamp', 'ASC']],
      attributes: [
        'timestamp',
        'value_float',
        'value_int',
        'parachain_id'
      ],
      include: [{
        model: Parachain,
        attributes: ['name', 'token_symbol'],
        required: true
      }]
    });

    // Format the response
    const formattedData = tvlHistory.map(record => ({
      timestamp: record.timestamp,
      value: record.value_float || parseFloat(record.value_int) || 0,
      chain_id: record.parachain_id,
      chain_name: record.Parachain?.name,
      token_symbol: record.Parachain?.token_symbol || 'DOT'
    }));

    logger.info(`Successfully fetched ${formattedData.length} TVL records`);
    
    res.json({
      status: 'success',
      data: formattedData,
      meta: {
        start_date: startDate,
        end_date: endDate,
        record_count: formattedData.length
      }
    });
  } catch (error) {
    logger.error('Error in getTVLHistory:', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch TVL history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

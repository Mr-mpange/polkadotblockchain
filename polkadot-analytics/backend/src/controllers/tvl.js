const { Parachain, TVL, sequelize } = require('../models');
const { Op, literal } = require('sequelize');

// @desc    Get total value locked across all parachains
// @route   GET /api/tvl
// @access  Public
exports.getTVL = async (req, res) => {
  try {
    console.log('🔍 Fetching TVL data...');
    
    // Get the latest TVL data for each parachain
    const latestTVLs = await TVL.findAll({
      attributes: [
        'parachainId',
        [sequelize.fn('MAX', sequelize.col('total_value_locked')), 'total_stake'],
        [sequelize.literal('(SELECT name FROM parachains WHERE parachains.id = TVL.parachain_id)'), 'name'],
        [sequelize.literal('(SELECT token_symbol FROM parachains WHERE parachains.id = TVL.parachain_id)'), 'token_symbol'],
        [sequelize.literal('true'), 'is_active']
      ],
      group: ['parachainId'],
      raw: true
    });

    // Calculate total TVL across all parachains
    const totalTVL = latestTVLs.reduce((sum, chain) => {
      return sum + BigInt(chain.total_stake || '0');
    }, 0n);

    console.log(`✅ Successfully fetched TVL data for ${latestTVLs.length} parachains`);
    
    res.json({
      status: 'success',
      data: {
        total_tvl: totalTVL.toString(),
        chains: latestTVLs.map(chain => ({
          id: chain.parachainId,
          name: chain.name,
          total_stake: chain.total_stake || '0',
          token_symbol: chain.token_symbol || 'DOT',
          is_active: chain.is_active
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error in getTVL:', error);
    
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
    console.log(`Fetching TVL history for last ${days} days${chainId ? `, chainId: ${chainId}` : ''}`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Build where clause
    const where = {
      timestamp: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Filter by chain if chainId is provided
    if (chainId) {
      where.parachain_id = chainId;
    }

    // Get TVL history
    const tvlHistory = await TVL.findAll({
      where,
      order: [['timestamp', 'ASC']],
      attributes: [
        'id',
        'parachain_id',
        'total_value_locked',
        'token_count',
        'timestamp'
      ],
      include: [{
        model: Parachain,
        attributes: ['name', 'token_symbol'],
        required: false
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

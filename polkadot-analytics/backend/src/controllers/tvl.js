<<<<<<< HEAD
// Mock TVL data
const mockTVLData = [
  { id: '2000', name: 'Acala', total_stake: '500000000', token_symbol: 'ACA', is_active: true },
  { id: '2001', name: 'Moonbeam', total_stake: '750000000', token_symbol: 'GLMR', is_active: true },
  { id: '2004', name: 'Astar', total_stake: '250000000', token_symbol: 'ASTR', is_active: true }
];
=======
const { getInitializedModels } = require('../models');
const { Op, literal } = require('sequelize');
>>>>>>> 6ded7b1787120e48d8939e76daee962e2c980569

// Get models - they will be initialized after database connection
const getModels = () => {
  const models = getInitializedModels();
  return {
    Parachain: models.Parachain,
    TVL: models.TVL,
    sequelize: models.sequelize
  };
};

// @desc    Get total value locked across all parachains
// @route   GET /api/tvl
// @access  Public
exports.getTVL = async (req, res) => {
  try {
    console.log('🔍 Fetching TVL data...');
    
<<<<<<< HEAD
=======
    const { TVL, Parachain, sequelize } = getModels();
    
    if (!TVL) {
      console.error('❌ TVL model not initialized');
      return res.status(500).json({
        status: 'error',
        message: 'TVL model not available'
      });
    }
    
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

>>>>>>> 6ded7b1787120e48d8939e76daee962e2c980569
    // Calculate total TVL across all parachains
    const totalTVL = mockTVLData.reduce((sum, chain) => {
      return sum + BigInt(chain.total_stake || '0');
    }, 0n);

    console.log(`✅ Successfully fetched TVL data for ${mockTVLData.length} parachains`);
    
    res.json({
      status: 'success',
      data: {
        total_tvl: totalTVL.toString(),
        chains: mockTVLData
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
    const { TVL, Parachain } = getModels();
    
    if (!TVL) {
      console.error('❌ TVL model not initialized');
      return res.status(500).json({
        status: 'error',
        message: 'TVL model not available'
      });
    }
    
    const { days = 30, chainId } = req.query;
    console.log(`Fetching TVL history for last ${days} days${chainId ? `, chainId: ${chainId}` : ''}`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Generate mock historical data
    const formattedData = [];
    const chains = chainId ? mockTVLData.filter(c => c.id === chainId) : mockTVLData;
    
    for (let i = parseInt(days); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      chains.forEach(chain => {
        const baseValue = parseInt(chain.total_stake);
        const variance = baseValue * 0.1; // 10% variance
        const value = baseValue + (Math.random() - 0.5) * variance;
        
        formattedData.push({
          timestamp: date.toISOString(),
          value: Math.floor(value),
          chain_id: chain.id,
          chain_name: chain.name,
          token_symbol: chain.token_symbol
        });
      });
    }

    console.log(`Successfully generated ${formattedData.length} TVL records`);
    
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
    console.error('Error in getTVLHistory:', {
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

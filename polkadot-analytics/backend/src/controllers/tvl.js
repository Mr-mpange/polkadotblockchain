const { getInitializedModels } = require('../models');
const { Op, literal } = require('sequelize');

// Get models - they will be initialized after database connection
const getModels = () => {
  const models = getInitializedModels();
  return {
    Parachain: models.Parachain,
    TVL: models.TVL,
    sequelize: models.sequelize
  };
};

// Mock TVL data
const mockTVLData = [
  { id: '2000', name: 'Acala', total_stake: '500000000', token_symbol: 'ACA', is_active: true },
  { id: '2001', name: 'Moonbeam', total_stake: '750000000', token_symbol: 'GLMR', is_active: true },
  { id: '2004', name: 'Astar', total_stake: '250000000', token_symbol: 'ASTR', is_active: true }
];

// @desc    Get total value locked across all parachains
// @route   GET /api/tvl
// @access  Public
exports.getTVL = async (req, res) => {
  try {
    console.log('🔍 Fetching TVL data...');
    
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

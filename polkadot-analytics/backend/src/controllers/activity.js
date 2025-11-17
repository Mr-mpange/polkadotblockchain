// Mock data for activity
const mockActivity = {
  totalTransactions: 125000,
  activeUsers: 24500,
  blocksProduced: 8640,
  timestamp: new Date().toISOString(),
  parachains: [
    { id: '2000', name: 'Acala', transactions: 15000 },
    { id: '2001', name: 'Moonbeam', transactions: 22000 },
    { id: '2004', name: 'Astar', transactions: 18000 }
  ]
};

// @desc    Get real-time activity metrics
// @route   GET /api/activity
// @access  Public
const getActivity = async (req, res, next) => {
  try {
    console.log('GET /api/activity');
    
    res.json({
      success: true,
      data: mockActivity
    });
  } catch (error) {
    console.error('Error fetching activity data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity data'
    });
  }
};

// @desc    Get historical activity data
// @route   GET /api/activity/history
// @access  Public
const getActivityHistory = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    console.log(`GET /api/activity/history?days=${days}`);
    
    // Generate mock historical data
    const history = [];
    for (let i = parseInt(days); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push({
        totalTransactions: Math.floor(100000 + Math.random() * 50000),
        activeUsers: Math.floor(20000 + Math.random() * 10000),
        blocksProduced: 8640,
        timestamp: date.toISOString(),
        parachains: mockActivity.parachains
      });
    }

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity history'
    });
  }
};

module.exports = {
  getActivity,
  getActivityHistory
};

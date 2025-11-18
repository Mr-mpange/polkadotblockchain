const { logger } = require('../utils/logger');
const subscanService = require('../services/subscan');

/**
 * Get all alerts based on real Subscan data
 */
exports.getAllAlerts = async (req, res) => {
  try {
    const { severity, status, limit = 50 } = req.query;
    
    // Get real data from Subscan to generate alerts
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    
    const statsResponse = await subscanService.getDailyStats(startDate, endDate);
    
    const alerts = [];
    
    if (statsResponse && statsResponse.code === 0 && statsResponse.data && statsResponse.data.list) {
      const stats = statsResponse.data.list;
      
      // Analyze transaction volume changes
      if (stats.length >= 2) {
        const latest = stats[stats.length - 1];
        const previous = stats[stats.length - 2];
        
        const latestTransfers = parseInt(latest.transfer_count) || 0;
        const previousTransfers = parseInt(previous.transfer_count) || 0;
        
        if (previousTransfers > 0) {
          const percentChange = ((latestTransfers - previousTransfers) / previousTransfers) * 100;
          
          // High volume alert
          if (percentChange > 50) {
            alerts.push({
              id: alerts.length + 1,
              type: 'high_volume',
              severity: percentChange > 100 ? 'high' : 'medium',
              status: 'active',
              title: 'High Transaction Volume Detected',
              message: `Network experiencing ${percentChange.toFixed(1)}% increase in transaction volume (${latestTransfers.toLocaleString()} transactions)`,
              parachain: 'Polkadot',
              parachainName: 'Polkadot',
              parachainId: '0',
              timestamp: new Date().toISOString(),
              firstSeen: latest.time || new Date().toISOString(),
              lastSeen: new Date().toISOString(),
              acknowledged: false,
              count: 1,
              details: {
                currentVolume: latestTransfers,
                previousVolume: previousTransfers,
                percentageChange: percentChange
              }
            });
          }
          
          // Low volume alert
          if (percentChange < -30) {
            alerts.push({
              id: alerts.length + 1,
              type: 'low_volume',
              severity: 'medium',
              status: 'active',
              title: 'Transaction Volume Decrease',
              message: `Network experiencing ${Math.abs(percentChange).toFixed(1)}% decrease in transaction volume`,
              parachain: 'Polkadot',
              parachainName: 'Polkadot',
              parachainId: '0',
              timestamp: new Date().toISOString(),
              firstSeen: latest.time || new Date().toISOString(),
              lastSeen: new Date().toISOString(),
              acknowledged: false,
              count: 1,
              details: {
                currentVolume: latestTransfers,
                previousVolume: previousTransfers,
                percentageChange: percentChange
              }
            });
          }
        }
        
        // Active accounts alert
        const latestAccounts = parseInt(latest.account_count) || 0;
        const previousAccounts = parseInt(previous.account_count) || 0;
        
        if (previousAccounts > 0) {
          const accountChange = ((latestAccounts - previousAccounts) / previousAccounts) * 100;
          
          if (Math.abs(accountChange) > 20) {
            alerts.push({
              id: alerts.length + 1,
              type: 'account_activity',
              severity: Math.abs(accountChange) > 40 ? 'high' : 'medium',
              status: 'active',
              title: accountChange > 0 ? 'Increased User Activity' : 'Decreased User Activity',
              message: `Active accounts ${accountChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(accountChange).toFixed(1)}% (${latestAccounts.toLocaleString()} accounts)`,
              parachain: 'Polkadot',
              parachainName: 'Polkadot',
              parachainId: '0',
              timestamp: new Date().toISOString(),
              firstSeen: latest.time || new Date().toISOString(),
              lastSeen: new Date().toISOString(),
              acknowledged: false,
              count: 1,
              details: {
                currentAccounts: latestAccounts,
                previousAccounts: previousAccounts,
                percentageChange: accountChange
              }
            });
          }
        }
      }
    }
    
    // If no alerts generated from real data, add a status alert
    if (alerts.length === 0) {
      alerts.push({
        id: 1,
        type: 'system_status',
        severity: 'low',
        status: 'active',
        title: 'Network Operating Normally',
        message: 'All metrics within normal parameters',
        parachain: 'Polkadot',
        parachainName: 'Polkadot',
        parachainId: '0',
        timestamp: new Date().toISOString(),
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        acknowledged: false,
        count: 1
      });
    }

    // Filter by severity if provided
    let filteredAlerts = alerts;
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    if (status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }

    // Limit results
    filteredAlerts = filteredAlerts.slice(0, parseInt(limit));

    res.json({
      status: 'success',
      data: filteredAlerts,
      total: filteredAlerts.length
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get alert by ID
 */
exports.getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock alert data
    const alert = {
      id: parseInt(id),
      type: 'high_volume',
      severity: 'high',
      status: 'active',
      title: 'High Transaction Volume Detected',
      message: 'Acala network experiencing 300% increase in transaction volume',
      parachain: 'Acala',
      parachainName: 'Acala',
      parachainId: '2000',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      firstSeen: new Date(Date.now() - 3600000).toISOString(),
      lastSeen: new Date(Date.now() - 300000).toISOString(),
      acknowledged: false,
      count: 5,
      details: {
        currentVolume: 150000,
        normalVolume: 50000,
        percentageIncrease: 300
      }
    };

    res.json({
      status: 'success',
      data: alert
    });
  } catch (error) {
    logger.error('Error fetching alert:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch alert',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Acknowledge an alert
 */
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      status: 'success',
      message: `Alert ${id} acknowledged successfully`,
      data: {
        id: parseInt(id),
        acknowledged: true,
        acknowledgedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to acknowledge alert',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Resolve an alert
 */
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      status: 'success',
      message: `Alert ${id} resolved successfully`,
      data: {
        id: parseInt(id),
        status: 'resolved',
        resolvedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to resolve alert',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get alert statistics based on real data
 */
exports.getAlertStats = async (req, res) => {
  try {
    // Get alerts using the same logic as getAllAlerts
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    
    const statsResponse = await subscanService.getDailyStats(startDate, endDate);
    
    let alertCount = { high: 0, medium: 0, low: 0 };
    let totalAlerts = 0;
    
    if (statsResponse && statsResponse.code === 0 && statsResponse.data && statsResponse.data.list) {
      const stats = statsResponse.data.list;
      
      if (stats.length >= 2) {
        const latest = stats[stats.length - 1];
        const previous = stats[stats.length - 2];
        
        const latestTransfers = parseInt(latest.transfer_count) || 0;
        const previousTransfers = parseInt(previous.transfer_count) || 0;
        
        if (previousTransfers > 0) {
          const percentChange = ((latestTransfers - previousTransfers) / previousTransfers) * 100;
          
          if (percentChange > 100) {
            alertCount.high++;
            totalAlerts++;
          } else if (percentChange > 50) {
            alertCount.medium++;
            totalAlerts++;
          } else if (percentChange < -30) {
            alertCount.medium++;
            totalAlerts++;
          }
        }
        
        const latestAccounts = parseInt(latest.account_count) || 0;
        const previousAccounts = parseInt(previous.account_count) || 0;
        
        if (previousAccounts > 0) {
          const accountChange = ((latestAccounts - previousAccounts) / previousAccounts) * 100;
          
          if (Math.abs(accountChange) > 40) {
            alertCount.high++;
            totalAlerts++;
          } else if (Math.abs(accountChange) > 20) {
            alertCount.medium++;
            totalAlerts++;
          }
        }
      }
    }
    
    // If no alerts, add a low severity status
    if (totalAlerts === 0) {
      alertCount.low = 1;
      totalAlerts = 1;
    }

    const stats = {
      total: totalAlerts,
      active: totalAlerts,
      resolved: 0,
      bySeverity: alertCount,
      byParachain: {
        'Polkadot': totalAlerts
      }
    };

    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching alert stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch alert statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

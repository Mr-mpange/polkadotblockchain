const { logger } = require('../utils/logger');

/**
 * Get all alerts
 */
exports.getAllAlerts = async (req, res) => {
  try {
    const { severity, status, limit = 50 } = req.query;
    
    // Mock alerts data
    const alerts = [
      {
        id: 1,
        severity: 'high',
        status: 'active',
        title: 'High Transaction Volume Detected',
        message: 'Acala network experiencing 300% increase in transaction volume',
        parachain: 'Acala',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        acknowledged: false
      },
      {
        id: 2,
        severity: 'medium',
        status: 'active',
        title: 'TVL Fluctuation',
        message: 'Moonbeam TVL decreased by 15% in the last hour',
        parachain: 'Moonbeam',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        acknowledged: false
      },
      {
        id: 3,
        severity: 'low',
        status: 'resolved',
        title: 'Network Latency',
        message: 'Minor network latency detected on Astar',
        parachain: 'Astar',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        acknowledged: true
      }
    ];

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
      severity: 'high',
      status: 'active',
      title: 'High Transaction Volume Detected',
      message: 'Acala network experiencing 300% increase in transaction volume',
      parachain: 'Acala',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      acknowledged: false,
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
 * Get alert statistics
 */
exports.getAlertStats = async (req, res) => {
  try {
    const stats = {
      total: 15,
      active: 8,
      resolved: 7,
      bySeverity: {
        high: 3,
        medium: 5,
        low: 7
      },
      byParachain: {
        'Acala': 4,
        'Moonbeam': 3,
        'Astar': 2,
        'Others': 6
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

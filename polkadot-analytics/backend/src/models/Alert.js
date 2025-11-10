const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM(
        'tvl_drop', 'tvl_spike', 'activity_drop', 
        'activity_spike', 'xcm_anomaly', 'new_parachain', 'parachain_issue'
      ),
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    parachainId: {
      type: DataTypes.INTEGER,
      field: 'parachain_id'
    },
    parachainName: {
      type: DataTypes.STRING,
      field: 'parachain_name'
    },
    // Alert thresholds and values
    threshold: {
      type: DataTypes.FLOAT
    },
    currentValue: {
      type: DataTypes.FLOAT,
      field: 'current_value'
    },
    previousValue: {
      type: DataTypes.FLOAT,
      field: 'previous_value'
    },
    changePercentage: {
      type: DataTypes.FLOAT,
      field: 'change_percentage'
    },
    // Alert metadata
    source: {
      type: DataTypes.ENUM('system', 'manual', 'external'),
      defaultValue: 'system'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isAcknowledged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_acknowledged'
    },
    acknowledgedBy: {
      type: DataTypes.INTEGER,
      field: 'acknowledged_by'
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      field: 'acknowledged_at'
    },
    resolvedAt: {
      type: DataTypes.DATE,
      field: 'resolved_at'
    },
    resolvedBy: {
      type: DataTypes.INTEGER,
      field: 'resolved_by'
    },
    // Cooldown to prevent duplicate alerts
    cooldownUntil: {
      type: DataTypes.DATE,
      field: 'cooldown_until'
    },
    // Additional metadata
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'alerts',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['severity'] },
      { fields: ['parachain_id'] },
      { fields: ['is_active'] },
      { fields: ['is_acknowledged'] },
      { fields: ['created_at'] }
    ]
  });

  // Static methods
  Alert.getActiveAlerts = async function() {
    return this.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']]
    });
  };

  Alert.getAlertsByType = async function(type) {
    return this.findAll({
      where: { type },
      order: [['createdAt', 'DESC']]
    });
  };

  Alert.getAlertsByParachain = async function(parachainId) {
    return this.findAll({
      where: { parachainId },
      order: [['createdAt', 'DESC']]
    });
  };

  Alert.getRecentAlerts = async function(hours = 24) {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    
    return this.findAll({
      where: {
        createdAt: { [sequelize.Op.gte]: date }
      },
      order: [['createdAt', 'DESC']]
    });
  };

  // Instance methods
  Alert.prototype.acknowledge = async function(userId) {
    this.isAcknowledged = true;
    this.acknowledgedBy = userId;
    this.acknowledgedAt = new Date();
    return this.save();
  };

  Alert.prototype.resolve = async function(userId) {
    this.isActive = false;
    this.resolvedBy = userId;
    this.resolvedAt = new Date();
    return this.save();
  };

  Alert.prototype.addNotificationAttempt = async function(method, status, error = null) {
    const notification = {
      method,
      status,
      timestamp: new Date()
    };
    
    if (error) {
      notification.error = error.message || String(error);
    }
    
    if (!this.metadata.notifications) {
      this.metadata.notifications = [];
    }
    
    this.metadata.notifications.push(notification);
    return this.save();
  };

  Alert.prototype.isInCooldown = function() {
    return this.cooldownUntil && this.cooldownUntil > new Date();
  };

  Alert.prototype.setCooldown = function(minutes = 60) {
    const cooldownDate = new Date();
    cooldownDate.setMinutes(cooldownDate.getMinutes() + minutes);
    this.cooldownUntil = cooldownDate;
    return this.save();
  };

  return Alert;
};

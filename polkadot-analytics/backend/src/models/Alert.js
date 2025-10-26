const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['tvl_drop', 'tvl_spike', 'activity_drop', 'activity_spike', 'xcm_anomaly', 'new_parachain', 'parachain_issue'],
    index: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  parachainId: {
    type: Number,
    index: true
  },
  parachainName: {
    type: String
  },
  // Alert thresholds and values
  threshold: {
    type: Number
  },
  currentValue: {
    type: Number
  },
  previousValue: {
    type: Number
  },
  changePercentage: {
    type: Number
  },
  // Alert metadata
  source: {
    type: String,
    enum: ['system', 'manual', 'external'],
    default: 'system'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isAcknowledged: {
    type: Boolean,
    default: false,
    index: true
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: {
    type: Date
  },
  // Notification settings
  notifications: {
    email: {
      type: Boolean,
      default: false
    },
    webhook: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  // Notification history
  notificationHistory: [{
    method: {
      type: String,
      enum: ['email', 'webhook', 'push']
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    error: String
  }],
  // Alert conditions and triggers
  conditions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Cooldown and frequency settings
  cooldownUntil: {
    type: Date,
    index: true
  },
  maxFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'none'],
    default: 'hourly'
  },
  // Additional context
  relatedAlerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  // Timestamps
  firstSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
alertSchema.index({ type: 1, isActive: 1 });
alertSchema.index({ severity: 1, isActive: 1 });
alertSchema.index({ parachainId: 1, isActive: 1 });
alertSchema.index({ firstSeen: -1 });
alertSchema.index({ lastSeen: -1 });

// Virtual for duration (how long alert has been active)
alertSchema.virtual('duration').get(function() {
  return this.resolvedAt ? this.resolvedAt - this.firstSeen : Date.now() - this.firstSeen;
});

// Virtual for status
alertSchema.virtual('status').get(function() {
  if (this.resolvedAt) return 'resolved';
  if (!this.isActive) return 'inactive';
  if (this.isAcknowledged) return 'acknowledged';
  return 'active';
});

// Pre-save middleware
alertSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastSeen = Date.now();
  }
  next();
});

// Static methods
alertSchema.statics.getActiveAlerts = function() {
  return this.find({ isActive: true, resolvedAt: { $exists: false } })
    .sort({ severity: 1, firstSeen: -1 });
};

alertSchema.statics.getAlertsByType = function(type) {
  return this.find({ type, isActive: true })
    .sort({ firstSeen: -1 });
};

alertSchema.statics.getAlertsByParachain = function(parachainId) {
  return this.find({ parachainId, isActive: true })
    .sort({ firstSeen: -1 });
};

alertSchema.statics.getRecentAlerts = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ firstSeen: { $gte: since } })
    .sort({ firstSeen: -1 });
};

// Instance methods
alertSchema.methods.acknowledge = function(userId) {
  this.isAcknowledged = true;
  this.acknowledgedBy = userId;
  this.acknowledgedAt = Date.now();
  return this.save();
};

alertSchema.methods.resolve = function(userId) {
  this.isActive = false;
  this.resolvedAt = Date.now();
  this.resolvedBy = userId;
  return this.save();
};

alertSchema.methods.addNotificationAttempt = function(method, status, error = null) {
  this.notificationHistory.push({
    method,
    status,
    error,
    sentAt: Date.now()
  });
  return this.save();
};

alertSchema.methods.isInCooldown = function() {
  if (!this.cooldownUntil) return false;
  return Date.now() < this.cooldownUntil;
};

alertSchema.methods.setCooldown = function(minutes = 60) {
  this.cooldownUntil = new Date(Date.now() + minutes * 60 * 1000);
  return this.save();
};

module.exports = mongoose.model('Alert', alertSchema);

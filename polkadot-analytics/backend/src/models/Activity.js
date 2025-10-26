const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  parachainId: {
    type: Number,
    required: true,
    index: true
  },
  parachainName: {
    type: String,
    required: true
  },
  // Block production metrics
  blocksProduced: {
    type: Number,
    default: 0
  },
  averageBlockTime: {
    type: Number,
    default: 0 // in seconds
  },
  blockUtilization: {
    type: Number,
    min: 0,
    max: 100,
    default: 0 // percentage
  },
  // Transaction metrics
  totalTransactions: {
    type: Number,
    default: 0
  },
  transactionsPerBlock: {
    type: Number,
    default: 0
  },
  uniqueActiveAccounts: {
    type: Number,
    default: 0
  },
  newAccounts: {
    type: Number,
    default: 0
  },
  // Transfer metrics
  totalTransfers: {
    type: Number,
    default: 0
  },
  transferVolume: {
    type: String,
    default: '0'
  },
  transferVolumeUSD: {
    type: Number,
    default: 0
  },
  // Cross-chain activity
  xcmTransfers: {
    type: Number,
    default: 0
  },
  xcmVolume: {
    type: String,
    default: '0'
  },
  xcmVolumeUSD: {
    type: Number,
    default: 0
  },
  // Staking metrics (if applicable)
  totalStaked: {
    type: String,
    default: '0'
  },
  totalStakedUSD: {
    type: Number,
    default: 0
  },
  stakingRatio: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Network fees
  totalFees: {
    type: String,
    default: '0'
  },
  totalFeesUSD: {
    type: Number,
    default: 0
  },
  averageFeePerTx: {
    type: Number,
    default: 0
  },
  // Timestamp information
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  hour: {
    type: Number,
    required: true,
    index: true
  },
  blockNumber: {
    type: Number,
    index: true
  },
  // Data source and validation
  source: {
    type: String,
    enum: ['polkadot-api', 'subscan', 'sidecar', 'manual'],
    default: 'polkadot-api'
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  validationScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  },
  // Additional metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Performance indexes
activitySchema.index({ parachainId: 1, timestamp: -1 });
activitySchema.index({ parachainId: 1, date: 1, hour: 1 });
activitySchema.index({ totalTransactions: -1 });
activitySchema.index({ uniqueActiveAccounts: -1 });
activitySchema.index({ timestamp: -1 });

// Virtual for activity score (composite metric)
activitySchema.virtual('activityScore').get(function() {
  // Weighted score based on different metrics
  const txScore = Math.min(this.totalTransactions / 1000, 1) * 0.4;
  const accountScore = Math.min(this.uniqueActiveAccounts / 100, 1) * 0.3;
  const blockScore = Math.min(this.blocksProduced / 100, 1) * 0.2;
  const xcmScore = Math.min(this.xcmTransfers / 10, 1) * 0.1;

  return Math.round((txScore + accountScore + blockScore + xcmScore) * 100);
});

// Virtual for growth metrics
activitySchema.virtual('growthMetrics').get(function() {
  return {
    transactionGrowth: this.previousTxCount ? ((this.totalTransactions - this.previousTxCount) / this.previousTxCount) * 100 : 0,
    accountGrowth: this.previousAccountCount ? ((this.uniqueActiveAccounts - this.previousAccountCount) / this.previousAccountCount) * 100 : 0,
    volumeGrowth: this.previousVolume ? ((this.transferVolumeUSD - this.previousVolume) / this.previousVolume) * 100 : 0
  };
});

// Pre-save middleware
activitySchema.pre('save', function(next) {
  const timestamp = this.timestamp;
  this.date = timestamp.toISOString().split('T')[0];
  this.hour = timestamp.getHours();
  next();
});

// Static methods
activitySchema.statics.getLatestActivity = function(parachainId) {
  return this.findOne({ parachainId }).sort({ timestamp: -1 });
};

activitySchema.statics.getActivityHistory = function(parachainId, startDate, endDate, groupBy = 'hour') {
  const groupField = groupBy === 'day' ? '$date' : { $dateToString: { format: '%Y-%m-%d %H:00:00', date: '$timestamp' } };

  return this.aggregate([
    {
      $match: {
        parachainId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: groupField,
        totalTransactions: { $last: '$totalTransactions' },
        uniqueActiveAccounts: { $last: '$uniqueActiveAccounts' },
        blocksProduced: { $last: '$blocksProduced' },
        transferVolumeUSD: { $last: '$transferVolumeUSD' },
        xcmTransfers: { $last: '$xcmTransfers' },
        timestamp: { $last: '$timestamp' }
      }
    },
    {
      $sort: { timestamp: 1 }
    }
  ]);
};

activitySchema.statics.getTopParachainsByActivity = function(limit = 10) {
  return this.aggregate([
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$parachainId',
        parachainName: { $first: '$parachainName' },
        totalTransactions: { $first: '$totalTransactions' },
        uniqueActiveAccounts: { $first: '$uniqueActiveAccounts' },
        activityScore: { $first: { $add: ['$totalTransactions', '$uniqueActiveAccounts'] } },
        timestamp: { $first: '$timestamp' }
      }
    },
    {
      $sort: { activityScore: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Instance method to calculate growth from previous record
activitySchema.methods.calculateGrowth = async function() {
  const previousRecord = await this.constructor.findOne({
    parachainId: this.parachainId,
    timestamp: { $lt: this.timestamp }
  }).sort({ timestamp: -1 });

  if (previousRecord) {
    this.previousTxCount = previousRecord.totalTransactions;
    this.previousAccountCount = previousRecord.uniqueActiveAccounts;
    this.previousVolume = previousRecord.transferVolumeUSD;
  }

  return this;
};

module.exports = mongoose.model('Activity', activitySchema);

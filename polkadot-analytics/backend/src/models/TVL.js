const mongoose = require('mongoose');

const tvlSchema = new mongoose.Schema({
  parachainId: {
    type: Number,
    required: true,
    index: true
  },
  parachainName: {
    type: String,
    required: true
  },
  totalValueLocked: {
    type: String,
    required: true,
    default: '0'
  },
  totalValueLockedUSD: {
    type: Number,
    required: true,
    default: 0
  },
  tokenCount: {
    type: Number,
    default: 0
  },
  protocolCount: {
    type: Number,
    default: 0
  },
  dominantToken: {
    symbol: String,
    amount: String,
    percentage: Number
  },
  topProtocols: [{
    name: String,
    tvl: String,
    tvlUSD: Number,
    percentage: Number
  }],
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
  source: {
    type: String,
    enum: ['polkadot-api', 'subscan', 'defillama', 'manual'],
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
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
tvlSchema.index({ parachainId: 1, timestamp: -1 });
tvlSchema.index({ parachainId: 1, date: 1, hour: 1 });
tvlSchema.index({ totalValueLockedUSD: -1 });
tvlSchema.index({ timestamp: -1 });

// Virtual for change percentage from previous hour
tvlSchema.virtual('changePercentage').get(function() {
  return this.previousTVL ? ((this.totalValueLockedUSD - this.previousTVL) / this.previousTVL) * 100 : 0;
});

// Virtual for 24h change
tvlSchema.virtual('change24h').get(function() {
  return this.previous24hTVL ? ((this.totalValueLockedUSD - this.previous24hTVL) / this.previous24hTVL) * 100 : 0;
});

// Pre-save middleware to calculate date and hour
tvlSchema.pre('save', function(next) {
  const timestamp = this.timestamp;
  this.date = timestamp.toISOString().split('T')[0];
  this.hour = timestamp.getHours();
  next();
});

// Static method to get latest TVL for a parachain
tvlSchema.statics.getLatestTVL = function(parachainId) {
  return this.findOne({ parachainId }).sort({ timestamp: -1 });
};

// Static method to get TVL history for date range
tvlSchema.statics.getTVLHistory = function(parachainId, startDate, endDate, groupBy = 'hour') {
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
        totalValueLocked: { $last: '$totalValueLocked' },
        totalValueLockedUSD: { $last: '$totalValueLockedUSD' },
        timestamp: { $last: '$timestamp' },
        tokenCount: { $last: '$tokenCount' },
        protocolCount: { $last: '$protocolCount' }
      }
    },
    {
      $sort: { timestamp: 1 }
    }
  ]);
};

// Static method to get top parachains by TVL
tvlSchema.statics.getTopParachainsByTVL = function(limit = 10) {
  return this.aggregate([
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$parachainId',
        parachainName: { $first: '$parachainName' },
        totalValueLockedUSD: { $first: '$totalValueLockedUSD' },
        timestamp: { $first: '$timestamp' }
      }
    },
    {
      $sort: { totalValueLockedUSD: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Instance method to calculate change from previous record
tvlSchema.methods.calculateChange = async function() {
  const previousRecord = await this.constructor.findOne({
    parachainId: this.parachainId,
    timestamp: { $lt: this.timestamp }
  }).sort({ timestamp: -1 });

  if (previousRecord) {
    this.previousTVL = previousRecord.totalValueLockedUSD;
  }

  // Calculate 24h change
  const previous24h = await this.constructor.findOne({
    parachainId: this.parachainId,
    timestamp: { $lte: new Date(this.timestamp.getTime() - 24 * 60 * 60 * 1000) }
  }).sort({ timestamp: -1 });

  if (previous24h) {
    this.previous24hTVL = previous24h.totalValueLockedUSD;
  }

  return this;
};

module.exports = mongoose.model('TVL', tvlSchema);

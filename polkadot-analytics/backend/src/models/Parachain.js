const mongoose = require('mongoose');

const parachainSchema = new mongoose.Schema({
  parachainId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Privacy', 'Identity', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Coming Soon', 'Retired'],
    default: 'Active'
  },
  launchDate: {
    type: Date
  },
  totalSupply: {
    type: String,
    default: '0'
  },
  decimals: {
    type: Number,
    default: 18
  },
  contractAddress: {
    type: String,
    trim: true
  },
  relayChain: {
    type: String,
    enum: ['Polkadot', 'Kusama'],
    default: 'Polkadot'
  },
  crowdloanInfo: {
    raised: String,
    target: String,
    endDate: Date,
    contributors: Number
  },
  socialLinks: {
    twitter: String,
    telegram: String,
    discord: String,
    github: String,
    medium: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
parachainSchema.index({ name: 1 });
parachainSchema.index({ symbol: 1 });
parachainSchema.index({ category: 1 });
parachainSchema.index({ status: 1 });
parachainSchema.index({ relayChain: 1 });

// Virtual for TVL data
parachainSchema.virtual('tvlData', {
  ref: 'TVL',
  localField: 'parachainId',
  foreignField: 'parachainId',
  justOne: false
});

// Virtual for activity data
parachainSchema.virtual('activityData', {
  ref: 'Activity',
  localField: 'parachainId',
  foreignField: 'parachainId',
  justOne: false
});

// Pre-save middleware
parachainSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find active parachains
parachainSchema.statics.findActive = function() {
  return this.find({ status: 'Active' });
};

// Static method to find by relay chain
parachainSchema.statics.findByRelayChain = function(relayChain) {
  return this.find({ relayChain, status: 'Active' });
};

// Instance method to get latest metrics
parachainSchema.methods.getLatestMetrics = async function() {
  const TVL = mongoose.model('TVL');
  const Activity = mongoose.model('Activity');

  const [latestTVL, latestActivity] = await Promise.all([
    TVL.findOne({ parachainId: this.parachainId }).sort({ timestamp: -1 }),
    Activity.findOne({ parachainId: this.parachainId }).sort({ timestamp: -1 })
  ]);

  return {
    tvl: latestTVL,
    activity: latestActivity
  };
};

module.exports = mongoose.model('Parachain', parachainSchema);

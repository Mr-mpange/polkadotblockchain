const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const { Op } = require('sequelize');
  
  const Activity = sequelize.define('Activity', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    parachainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'parachain_id'
    },
    parachainName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'parachain_name'
    },
    // Block production metrics
    blocksProduced: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'blocks_produced'
    },
    averageBlockTime: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'average_block_time'
    },
    blockUtilization: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'block_utilization'
    },
    // Transaction metrics
    totalTransactions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_transactions'
    },
    transactionsPerBlock: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'transactions_per_block'
    },
    uniqueActiveAccounts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'unique_active_accounts'
    },
    newAccounts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'new_accounts'
    },
    // Transfer metrics
    totalTransfers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_transfers'
    },
    transferVolume: {
      type: DataTypes.STRING,
      defaultValue: '0',
      field: 'transfer_volume'
    },
    transferVolumeUSD: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'transfer_volume_usd'
    },
    // Smart contract interactions
    contractCalls: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'contract_calls'
    },
    contractsDeployed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'contracts_deployed'
    },
    // Staking metrics
    totalStaked: {
      type: DataTypes.STRING,
      defaultValue: '0',
      field: 'total_staked'
    },
    stakingParticipation: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'staking_participation'
    },
    // Governance
    proposals: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    referendums: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Cross-chain
    xcmTransfers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'xcm_transfers'
    },
    // Error metrics
    failedTransactions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'failed_transactions'
    },
    errorRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'error_rate'
    },
    // Timestamp
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    // Additional metadata
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'activities',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['parachain_id', 'timestamp']
      },
      {
        fields: ['timestamp']
      }
    ]
  });

  // Add static methods
  Activity.getLatestActivity = async function(parachainId) {
    return this.findOne({
      where: { parachainId },
      order: [['timestamp', 'DESC']]
    });
  };

  Activity.getActivityHistory = async function(parachainId, startDate, endDate, groupBy = 'hour') {
    return this.findAll({
      where: {
        parachainId,
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['timestamp', 'ASC']]
    });
  };

  Activity.getTopParachainsByActivity = async function(limit = 10) {
    return this.findAll({
      attributes: [
        'parachainId',
        'parachainName',
        [sequelize.fn('SUM', sequelize.col('total_transactions')), 'totalActivity']
      ],
      group: ['parachainId', 'parachainName'],
      order: [[sequelize.literal('totalActivity'), 'DESC']],
      limit
    });
  };

  return Activity;
};

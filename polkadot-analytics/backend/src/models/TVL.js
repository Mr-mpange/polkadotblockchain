module.exports = (sequelize, DataTypes) => {
  const TVL = sequelize.define('TVL', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    parachainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'parachain_id',
      references: {
        model: 'parachains', 
        key: 'id'
      }
    },
    totalValueLocked: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
      field: 'total_value_locked'
    },
    totalValueLockedUSD: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      defaultValue: 0,
      field: 'total_value_locked_usd'
    },
    tokenCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'token_count'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    blockNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'block_number'
    }
  }, {
    tableName: 'tvl_history',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['parachain_id']
      },
      {
        fields: ['timestamp']
      }
    ]
  });

  // Static methods
  TVL.getLatestTVL = async function(parachainId) {
    return this.findOne({
      where: { parachainId },
      order: [['timestamp', 'DESC']]
    });
  };

  TVL.getTVLHistory = async function(parachainId, startDate, endDate, groupBy = 'day') {
    return this.findAll({
      where: {
        parachainId,
        timestamp: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['timestamp', 'ASC']]
    });
  };

  TVL.getTopParachainsByTVL = async function(limit = 10) {
    return this.findAll({
      attributes: [
        'parachainId',
        [sequelize.fn('MAX', sequelize.col('total_value_locked')), 'max_tvl'],
        [sequelize.literal('(SELECT name FROM parachains WHERE parachains.id = TVL.parachain_id)'), 'parachainName']
      ],
      group: ['parachainId'],
      order: [[sequelize.literal('max_tvl'), 'DESC']],
      limit,
      raw: true
    });
  };

  TVL.associate = function(models) {
    TVL.belongsTo(models.Parachain, {
      foreignKey: 'parachainId',
      as: 'parachain'
    });
  };

  return TVL;
};

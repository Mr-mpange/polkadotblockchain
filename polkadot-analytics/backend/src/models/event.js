module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.STRING(66),
      primaryKey: true,
      allowNull: false
    },
    blockNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    blockHash: {
      type: DataTypes.STRING(66),
      allowNull: false
    },
    phase: {
      type: DataTypes.JSON,
      allowNull: false
    },
    section: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    method: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    indexInBlock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    extrinsicIdx: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['blockNumber'] },
      { fields: ['blockHash'] },
      { fields: ['section', 'method'] },
      { fields: ['extrinsicIdx'] },
      { fields: ['timestamp'] },
      {
        fields: [
          sequelize.literal("((data->0->'toString'())::text)"),
          sequelize.literal("((data->1->'toString'())::text)")
        ],
        name: 'event_data_search_idx'
      }
    ]
  });

  Event.associate = (models) => {
    Event.belongsTo(models.Block, {
      foreignKey: 'blockHash',
      targetKey: 'hash',
      as: 'block'
    });
    Event.belongsTo(models.Transaction, {
      foreignKey: 'extrinsicIdx',
      targetKey: 'indexInBlock',
      as: 'extrinsic'
    });
  };

  return Event;
};

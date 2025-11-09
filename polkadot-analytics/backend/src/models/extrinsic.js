module.exports = (sequelize, DataTypes) => {
  const Extrinsic = sequelize.define('Extrinsic', {
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
    indexInBlock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    signer: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    signature: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    era: {
      type: DataTypes.JSON,
      allowNull: true
    },
    nonce: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    section: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    method: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    args: {
      type: DataTypes.JSON,
      allowNull: true
    },
    hash: {
      type: DataTypes.STRING(66),
      allowNull: false
    },
    isSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    error: {
      type: DataTypes.JSON,
      allowNull: true
    },
    fee: {
      type: DataTypes.STRING,
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
      { fields: ['signer'] },
      { fields: ['section', 'method'] },
      { fields: ['hash'] },
      { fields: ['timestamp'] },
      {
        fields: [sequelize.literal("((args->'toString'())::text)")],
        name: 'extrinsic_args_search_idx'
      }
    ]
  });

  Extrinsic.associate = (models) => {
    Extrinsic.belongsTo(models.Block, {
      foreignKey: 'blockHash',
      targetKey: 'hash',
      as: 'block'
    });
    Extrinsic.hasMany(models.Event, {
      foreignKey: 'extrinsicIdx',
      sourceKey: 'indexInBlock',
      as: 'events'
    });
  };

  return Extrinsic;
};

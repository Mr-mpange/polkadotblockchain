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
      allowNull: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
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
    argsText: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const args = this.getDataValue('args');
        return args ? JSON.stringify(args) : null;
      }
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
      { fields: ['argsText'] }
    ]
  });

  Extrinsic.associate = (models) => {
    Extrinsic.belongsTo(models.Block, {
      foreignKey: 'blockHash',
      targetKey: 'hash',
      as: 'block',
      constraints: false // We're handling constraints manually in database.js
    });
    Extrinsic.hasMany(models.Event, {
      foreignKey: 'extrinsicIdx',
      sourceKey: 'indexInBlock',
      as: 'events'
    });
  };

  // Add beforeSave hook to update argsText when args changes
  Extrinsic.beforeSave((extrinsic, options) => {
    if (extrinsic.changed('args')) {
      extrinsic.argsText = extrinsic.args ? JSON.stringify(extrinsic.args) : null;
    }
    return Promise.resolve();
  });

  return Extrinsic;
};

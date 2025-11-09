module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.STRING(66),
      primaryKey: true,
      allowNull: false
    },
    blockHash: {
      type: DataTypes.STRING(66),
      allowNull: false,
      references: {
        model: 'blocks',  // This references the table name, not the model name
        key: 'hash'
      },
      onDelete: 'CASCADE'
    },
    blockNumber: {
      type: DataTypes.INTEGER,
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
    signer: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    args: {
      type: DataTypes.JSON,
      allowNull: true
    },
    hash: {
      type: DataTypes.STRING(66),
      unique: true,
      allowNull: false
    },
    indexInBlock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    error: {
      type: DataTypes.JSON,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    fee: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tip: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['blockNumber'] },
      { fields: ['blockHash'] },
      { fields: ['signer'] },
      { fields: ['section', 'method'] },
      { fields: ['timestamp'] }
    ]
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Block, {
      foreignKey: 'blockHash',
      targetKey: 'hash',
      as: 'block'
    });
  };

  return Transaction;
};

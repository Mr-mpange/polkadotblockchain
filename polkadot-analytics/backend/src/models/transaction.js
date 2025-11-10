module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.STRING(66),
      primaryKey: true,
      allowNull: false
    },
    blockHash: {
      type: DataTypes.STRING(66, 'utf8mb4'),
      allowNull: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
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
      allowNull: false,
      unique: true,
      comment: 'Unique index of the transaction within the block'
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
    tableName: 'transactions',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // Disable automatic pluralization
    freezeTableName: true,
    indexes: [
      { fields: ['blockNumber'] },
      { fields: ['blockHash'] },
      { fields: ['signer'] },
      { fields: ['section', 'method'] },
      { fields: ['timestamp'] },
      { fields: ['indexInBlock'], unique: true }
    ]
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Block, {
      foreignKey: 'blockHash',
      targetKey: 'hash',
      as: 'block',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      constraints: true
    });
  };

  return Transaction;
};

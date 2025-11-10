module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.STRING(66),
      primaryKey: true,
      allowNull: false
    },
    // blockHash is the foreign key to blocks table
    blockHash: {
      type: DataTypes.STRING(66),
      allowNull: false,
      field: 'block_hash',
      comment: 'References blocks(hash). Foreign key to the block containing this transaction.',
      references: {
        model: 'blocks',
        key: 'hash'
      }
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
      field: 'index_in_block',
      comment: 'Unique index of the transaction within the block'
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
      type: DataTypes.STRING(255),
      allowNull: true
    },
    tip: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'transactions',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { fields: ['block_hash'] },
      { fields: ['blockNumber'] },
      { fields: ['signer'] },
      { fields: ['section', 'method'] },
      { fields: ['timestamp'] },
      { fields: ['index_in_block'], unique: true }
    ]
  });

  // Add a flag to track if associations have been set up
  if (!Transaction.associationsSetUp) {
    Transaction.associate = (models) => {
      try {
        // Clear any existing associations
        if (Transaction.associations) {
          Object.keys(Transaction.associations).forEach(assoc => {
            delete Transaction.associations[assoc];
          });
        }

        // Define the relationship with Block
        Transaction.belongsTo(models.Block, {
          foreignKey: {
            name: 'blockHash',
            field: 'block_hash'
          },
          targetKey: 'hash',
          as: 'block',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          constraints: true
        });

        // Mark associations as set up
        Transaction.associationsSetUp = true;
      } catch (error) {
        console.error('Error in Transaction.associate:', error);
        throw error;
      }
    };
  }

  return Transaction;
};

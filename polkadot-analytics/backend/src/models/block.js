const { Model, DataTypes } = require('sequelize');

// Debug log to track model loading
console.log('🔍 Loading Block model...');

module.exports = (sequelize, DataTypes) => {
  const Block = sequelize.define('Block', {
    number: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false
    },
    hash: {
      type: DataTypes.STRING(66),
      primaryKey: true,
      allowNull: false,
      field: 'hash',
      comment: 'Primary key, block hash',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    // Remove the id field as we're using hash as primary key
    parentHash: {
      type: DataTypes.STRING(66),
      allowNull: false
    },
    stateRoot: {
      type: DataTypes.STRING(66),
      allowNull: false
    },
    extrinsicsRoot: {
      type: DataTypes.STRING(66),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    validator: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    blockTime: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    extrinsicsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    eventsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    specVersion: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    finalized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'blocks',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    freezeTableName: true, // Prevent Sequelize from pluralizing table name
    indexes: [
      // Primary key index is automatically created for the primary key (hash)
      { 
        fields: ['number'],
        unique: true
      },
      { fields: ['validator'] },
      { fields: ['timestamp'] }
      // parentHash index is automatically created by the foreign key constraint
    ]
  });

  // Add a flag to track if associations have been set up
  if (!Block.associationsSetUp) {
    Block.associate = (models) => {
      console.log('🔗 Setting up Block associations...');
      try {
        // Clear any existing associations
        if (Block.associations) {
          Object.keys(Block.associations).forEach(assoc => {
            delete Block.associations[assoc];
          });
        }

        // A block has many transactions
        Block.hasMany(models.Transaction, {
          foreignKey: {
            name: 'blockHash',
            field: 'block_hash'
          },
          sourceKey: 'hash',
          as: 'transactions',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          constraints: true
        });

        // A block has many extrinsics
        Block.hasMany(models.Extrinsic, {
          foreignKey: {
            name: 'blockHash',
            field: 'block_hash'
          },
          sourceKey: 'hash',
          as: 'extrinsics',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          constraints: true
        });

        // Mark associations as set up
        Block.associationsSetUp = true;
      } catch (error) {
        console.error('Error in Block.associate:', error);
        throw error;
      }
    };
  }

  return Block;
};

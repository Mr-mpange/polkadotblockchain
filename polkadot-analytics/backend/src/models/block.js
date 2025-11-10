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
      { 
        fields: ['hash'],
        unique: true
      },
      { 
        fields: ['number'],
        unique: true
      },
      { fields: ['parentHash'] },
      { fields: ['validator'] },
      { fields: ['timestamp'] }
    ]
  });

  Block.associate = (models) => {
    try {
      // A block has many transactions
      Block.hasMany(models.Transaction, {
        foreignKey: {
          name: 'blockHash',
          field: 'block_hash'
        },
        sourceKey: 'hash',
        as: 'blockTransactions',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // A block has many extrinsics
      Block.hasMany(models.Extrinsic, {
        foreignKey: {
          name: 'blockHash',
          field: 'block_hash'
        },
        sourceKey: 'hash',
        as: 'blockExtrinsics',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    } catch (error) {
      console.error('Error in Block.associate:', error);
      throw error;
    }
  };

  return Block;
};

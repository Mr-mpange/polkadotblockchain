module.exports = (sequelize, DataTypes) => {
  const Block = sequelize.define('Block', {
    id: {
      type: DataTypes.STRING(66),
      primaryKey: true,
      allowNull: false
    },
    number: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false
    },
    hash: {
      type: DataTypes.STRING(66, 'utf8mb4'),
      unique: true,
      allowNull: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
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
    Block.hasMany(models.Transaction, {
      foreignKey: 'blockHash',
      sourceKey: 'hash',
      as: 'transactions',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      constraints: true
    });
  };

  return Block;
};

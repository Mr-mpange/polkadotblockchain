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
      type: DataTypes.STRING(66),
      unique: true,
      allowNull: false
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
    timestamps: true,
    indexes: [
      { fields: ['number'] },
      { fields: ['hash'] },
      { fields: ['timestamp'] },
      { fields: ['validator'] }
    ]
  });

  Block.associate = (models) => {
    Block.hasMany(models.Transaction, {
      foreignKey: 'blockHash',
      sourceKey: 'hash',
      as: 'transactions'
    });
  };

  return Block;
};

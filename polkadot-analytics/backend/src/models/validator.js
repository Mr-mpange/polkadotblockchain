module.exports = (sequelize, DataTypes) => {
  const Validator = sequelize.define('Validator', {
    stashAddress: {
      type: DataTypes.STRING(48),
      primaryKey: true,
      allowNull: false
    },
    controllerAddress: {
      type: DataTypes.STRING(48),
      allowNull: false
    },
    commission: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    totalStake: {
      type: DataTypes.STRING,
      defaultValue: '0'
    },
    ownStake: {
      type: DataTypes.STRING,
      defaultValue: '0'
    },
    nominatorCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastEra: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    identity: {
      type: DataTypes.JSON,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isElected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isWaiting: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rewards: {
      type: DataTypes.JSON,
      allowNull: true
    },
    slashes: {
      type: DataTypes.JSON,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['controllerAddress'] },
      { fields: ['isActive'] },
      { fields: ['isElected'] },
      { fields: ['commission'] },
      { fields: ['totalStake'] }
    ]
  });

  Validator.associate = (models) => {
    Validator.hasMany(models.Account, {
      foreignKey: 'stashAddress',
      sourceKey: 'stashAddress',
      as: 'nominators'
    });
  };

  return Validator;
};

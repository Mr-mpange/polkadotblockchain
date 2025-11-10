module.exports = (sequelize, DataTypes) => {
  const Validator = sequelize.define('Validator', {
    stashAddress: {
      type: DataTypes.STRING(48),
      primaryKey: true,
      allowNull: false,
      field: 'stash_address'  // Explicitly set the column name in snake_case
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

  // Set table name explicitly to match the expected name in the foreign key constraint
  Validator.tableName = 'validators';
  
  // Define associations
  Validator.associate = function(models) {
    // Accounts associated with this validator
    Validator.hasMany(models.Account, {
      foreignKey: 'stashAddress',
      sourceKey: 'stashAddress',
      as: 'accounts',
      constraints: false // We're handling constraints manually
    });
    
    // Nominators for this validator
    Validator.hasMany(models.Account, {
      foreignKey: 'stashAddress',
      sourceKey: 'stashAddress',
      as: 'nominators',
      scope: {
        isNominator: true
      },
      constraints: false // We're handling constraints manually
    });
  };

  return Validator;
};

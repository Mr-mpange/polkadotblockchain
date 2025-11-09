const { sequelize } = require('../config/mysql');
const { DataTypes } = require('sequelize');

// Import models
const Block = require('./block');
const Transaction = require('./transaction');
const Validator = require('./validator');
const Account = require('./account');

// Initialize models with sequelize instance and DataTypes
const models = {
  Block: Block(sequelize, DataTypes),
  Transaction: Transaction(sequelize, DataTypes),
  Validator: Validator(sequelize, DataTypes),
  Account: Account(sequelize, DataTypes)
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export models and sequelize instance
module.exports = {
  ...models,
  sequelize,
  Sequelize: require('sequelize')
};

const { sequelize } = require('../config/mysql');
const { DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Import all models
const models = {};

// Read all model files
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => 
    file !== 'index.js' && 
    file.endsWith('.js') &&
    !file.endsWith('.test.js')
  );

// Initialize each model
modelFiles.forEach(file => {
  const model = require(path.join(__dirname, file))(sequelize, DataTypes);
  models[model.name] = model;
});

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

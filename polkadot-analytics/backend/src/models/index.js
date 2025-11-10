const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
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
  try {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    if (model) {
      models[model.name] = model;
    }
  } catch (error) {
    console.error(`Error loading model ${file}:`, error);
  }
});

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName] && typeof models[modelName].associate === 'function') {
    models[modelName].associate(models);
  }
});

// Export models and sequelize instance
module.exports = {
  ...models,
  sequelize,
  Sequelize
};

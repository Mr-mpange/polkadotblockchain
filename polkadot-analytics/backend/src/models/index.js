const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

// This will be set by the database configuration
let sequelize;

// Cache for models to prevent duplicate loading
const models = {};
let modelsInitialized = false;

// Define the correct order for model initialization to handle dependencies
const modelLoadOrder = [
  'block',      // Base model with no dependencies
  'account',    // Depends on block
  'validator',  // Depends on account
  'parachain',  // Depends on block
  'extrinsic',  // Depends on block
  'transaction',// Depends on block and extrinsic
  'event'       // Depends on block and extrinsic
];

const initializeModels = (sequelizeInstance) => {
  if (modelsInitialized) {
    return models;
  }

  // Set the sequelize instance
  sequelize = sequelizeInstance;

  // First pass: Load all models
  modelLoadOrder.forEach(modelFile => {
    try {
      const modelPath = path.join(__dirname, `${modelFile}.js`);
      if (fs.existsSync(modelPath)) {
        const model = require(modelPath)(sequelize, DataTypes);
        if (model) {
          models[model.name] = model;
        }
      }
    } catch (error) {
      console.error(`Error loading model ${modelFile}:`, error);
    }
  });

  // Second pass: Set up associations
  modelLoadOrder.forEach(modelFile => {
    try {
      const modelName = modelFile.charAt(0).toUpperCase() + modelFile.slice(1);
      if (models[modelName] && typeof models[modelName].associate === 'function') {
        models[modelName].associate(models);
      }
    } catch (error) {
      console.error(`Error setting up associations for ${modelFile}:`, error);
    }
  });

  modelsInitialized = true;
  return models;
};

// Export the initialization function and empty models object
module.exports = {
  models,
  initializeModels,
  getInitializedModels: () => models,
  getSequelize: () => sequelize
};

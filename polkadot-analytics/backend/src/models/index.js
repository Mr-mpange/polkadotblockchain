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
  // Clear the require cache to ensure we get fresh model instances
  modelLoadOrder.forEach(modelFile => {
    const modelPath = path.join(__dirname, `${modelFile}.js`);
    if (require.cache[require.resolve(modelPath)]) {
      delete require.cache[require.resolve(modelPath)];
    }
  });

  // Clear existing models
  Object.keys(models).forEach(modelName => {
    delete models[modelName];
  });

  // Set the sequelize instance
  sequelize = sequelizeInstance;

  // First pass: Load all models
  modelLoadOrder.forEach(modelFile => {
    try {
      const modelPath = path.join(__dirname, `${modelFile}.js`);
      if (fs.existsSync(modelPath)) {
        // Clear the module from require cache
        if (require.cache[require.resolve(modelPath)]) {
          delete require.cache[require.resolve(modelPath)];
        }
        
        // Require the model
        const modelModule = require(modelPath);
        if (typeof modelModule === 'function') {
          const model = modelModule(sequelize, DataTypes);
          if (model) {
            // Clear any existing model with the same name
            if (models[model.name]) {
              delete models[model.name];
            }
            models[model.name] = model;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error loading model ${modelFile}:`, error);
      throw error; // Rethrow to prevent silent failures
    }
  });

  // Second pass: Set up associations
  modelLoadOrder.forEach(modelFile => {
    try {
      const modelName = modelFile.charAt(0).toUpperCase() + modelFile.slice(1);
      if (models[modelName] && typeof models[modelName].associate === 'function') {
        console.log(`🔗 Setting up associations for ${modelName}...`);
        models[modelName].associate(models);
        console.log(`✅ Successfully set up associations for ${modelName}`);
      }
    } catch (error) {
      console.error(`❌ Error setting up associations for ${modelFile}:`, error);
      throw error; // Rethrow to prevent silent failures
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

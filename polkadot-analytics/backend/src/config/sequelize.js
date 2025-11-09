const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');
const path = require('path');

const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'polkadot_analytics',
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.SEQUELIZE_LOGGING === 'true' ? msg => logger.debug(msg) : false,
    pool: {
      max: parseInt(process.env.DB_MAX_POOL_SIZE) || 20,
      min: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
      acquire: 60000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true
    },
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeders'
  },
  test: {
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_TEST_DATABASE || 'polkadot_analytics_test',
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true
    },
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeders'
  },
  production: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: parseInt(process.env.DB_MAX_POOL_SIZE) || 30,
      min: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,
      acquire: 60000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true
    },
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeders',
    ssl: process.env.DB_SSL === 'true',
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
};

const sequelizeConfig = config[env];

// Initialize Sequelize with the configuration
const sequelize = new Sequelize(
  sequelizeConfig.database,
  sequelizeConfig.username,
  sequelizeConfig.password,
  {
    ...sequelizeConfig,
    // Override the logging function to use our logger
    logging: sequelizeConfig.logging === true ? msg => logger.debug(msg) : sequelizeConfig.logging
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Close the database connection
const closeConnection = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed.');
    return true;
  } catch (error) {
    logger.error('Error closing database connection:', error);
    return false;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  closeConnection,
  config: sequelizeConfig
};

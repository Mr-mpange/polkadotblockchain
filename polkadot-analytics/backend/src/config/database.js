console.log('🔌 Loading database configuration...');

const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

let sequelize;

const connectDB = async () => {
  console.log('🔄 Attempting to connect to database...');
  
  try {
    // Database configuration
    const dbConfig = {
      database: 'polkadot_analytics',
      username: 'root',
      password: '',
      host: '127.0.0.1',
      port: 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: parseInt(process.env.DB_POOL_MAX) || 10,
        min: parseInt(process.env.DB_POOL_MIN) || 0,
        acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
        idle: parseInt(process.env.DB_POOL_IDLE) || 10000
      }
    };

    // Create Sequelize instance
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool,
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true
        }
      }
    );

    // Test the connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Sync models with database
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized');
    }

    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Handle database connection events
const setupDatabaseEvents = () => {
  sequelize.connectionManager.on('connect', () => {
    logger.info('Database connection established');
  });

  sequelize.connectionManager.on('disconnect', () => {
    logger.warn('Database connection lost');
  });

  sequelize.connectionManager.on('error', (err) => {
    logger.error('Database connection error:', err);
  });
};

// Graceful shutdown
const closeDatabase = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

// Handle application termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

module.exports = {
  sequelize,
  connectDB,
  closeDatabase,
  setupDatabaseEvents
};

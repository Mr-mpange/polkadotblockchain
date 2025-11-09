const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'polkadot_analytics',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true, // Enables soft deletes
    },
    dialectOptions: {
      decimalNumbers: true,
      supportBigNumbers: true,
      bigNumberStrings: false,
      dateStrings: true,
      typeCast: true,
    },
    pool: {
      max: parseInt(process.env.DB_MAX_POOL_SIZE) || 20,
      min: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
      acquire: 60000, // Max time in ms that a connection can be idle before being released
      idle: 10000,    // Max time in ms that a connection can be idle before being released
      acquire: 60000
    }
  }
);

/**
 * Attempts to establish a database connection with retry logic
 * @param {number} retryCount - Current retry attempt number
 */
const connectDB = async function connectDB(retryCount = 0) {
  try {
    await sequelize.authenticate();
    logger.info('✅ MySQL connection established successfully.');
    
    // Sync models with database (set force: false in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Database models synchronized');
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const nextRetry = retryCount + 1;
      const delay = RETRY_DELAY * nextRetry;
      logger.warn(`⚠️  MySQL connection attempt ${nextRetry}/${MAX_RETRIES} failed. Retrying in ${delay/1000} seconds...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(nextRetry);
    }
    
    logger.error('❌ Unable to connect to MySQL after multiple attempts:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await sequelize.close();
    logger.info('MySQL connection closed through app termination');
    process.exit(0);
  } catch (error) {
    logger.error('Error closing MySQL connection:', error);
    process.exit(1);
  }
});;

module.exports = { sequelize, connectDB };

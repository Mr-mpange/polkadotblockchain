const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'polkadot_analytics',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
      min: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
      idle: 30000,
      acquire: 60000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL connection has been established successfully.');
    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to the MySQL database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

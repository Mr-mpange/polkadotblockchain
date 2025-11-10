const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');
const { execSync } = require('child_process');
const path = require('path');

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

// Log database connection details
console.log('🔌 Database connection details:', {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  database: process.env.MYSQL_DATABASE,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD ? '***' : '(empty)'
});

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'polkadot_analytics',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    dialect: 'mysql',
    logging: (msg) => {
      console.log(`[Sequelize] ${msg}`);
    },
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
    }
  }
);

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    logger.info('🔄 Running database migrations...');
    
    // Use Sequelize CLI to run migrations
    execSync('npx sequelize-cli db:migrate', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..') 
    });
    
    // Only run seeds in development or if explicitly enabled
    if (process.env.NODE_ENV === 'development' || process.env.RUN_SEEDERS === 'true') {
      logger.info('🌱 Running database seeders...');
      execSync('npx sequelize-cli db:seed:all', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '../..')
      });
    }
    
    logger.info('✅ Database migrations completed successfully');
  } catch (error) {
    logger.error('❌ Error running migrations:', error);
    process.exit(1);
  }
}

/**
 * Attempts to establish a database connection with retry logic
 * @param {number} retryCount - Current retry attempt number
 */
const connectDB = async (retryCount = 0) => {
  console.log(`\n🔄 Attempting to connect to database (attempt ${retryCount + 1})...`);
  try {
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully.');
    logger.info('✅ MySQL connection established successfully.');
    
    // Run migrations on startup
    await runMigrations();
    
    // Sync models with database (only in development, migrations handle production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // Set to false since we're using migrations
      logger.info('✅ Database models synchronized');
    }
  } catch (error) {
    console.error('\n❌ DATABASE CONNECTION ERROR');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.original) {
      console.error('\nOriginal error details:');
      console.error('Error code:', error.original.code);
      console.error('Error number:', error.original.errno);
      console.error('SQL State:', error.original.sqlState);
      console.error('SQL Message:', error.original.sqlMessage);
      console.error('SQL:', error.original.sql);
    }
    
    if (retryCount < MAX_RETRIES - 1) {
      const delay = RETRY_DELAY / 1000;
      console.log(`\n🔄 Retrying connection in ${delay} seconds (attempt ${retryCount + 2}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    }
    
    console.error('\n❌ MAXIMUM NUMBER OF RETRIES REACHED');
    console.error('Could not connect to the database after', MAX_RETRIES, 'attempts');
    console.error('Please check the following:');
    console.error('1. Is MySQL server running?');
    console.error('2. Are the database credentials correct?');
    console.error('3. Is the database created?');
    console.error('4. Is the port correct?');
    console.error('5. Is there a firewall blocking the connection?');
    
    throw error;
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
});

module.exports = { sequelize, connectDB };

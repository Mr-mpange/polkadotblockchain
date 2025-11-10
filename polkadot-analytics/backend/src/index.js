require('dotenv').config();
const { logger } = require('./utils/logger');
const { connectDB, sequelize } = require('./config/mysql');
const PolkadotAnalyticsApp = require('./app');

// Start server
const startServer = async () => {
  try {
    logger.info('Starting Polkadot Analytics API server...');
    
    // Initialize database connection
    await connectDB();
    logger.info('✅ Database connected successfully');
    
    // Sync database models
    if (process.env.NODE_ENV !== 'production') {
      logger.info('🔄 Running database migrations...');
      await sequelize.sync({ alter: true });
      logger.info('✅ Database synchronized');
    }
    
    // Create and start the application
    const app = new PolkadotAnalyticsApp();
    await app.start();
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

startServer();

module.exports = app;

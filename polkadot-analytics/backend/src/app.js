const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { connectDB } = require('./src/config/database');
const { errorHandler } = require('./src/middleware/errorHandler');
const { notFound } = require('./src/middleware/notFound');

const authRoutes = require('./src/routes/auth');
const parachainRoutes = require('./src/routes/parachains');
const tvlRoutes = require('./src/routes/tvl');
const activityRoutes = require('./src/routes/activity');
const historyRoutes = require('./src/routes/history');
const alertRoutes = require('./src/routes/alerts');
const dashboardRoutes = require('./src/routes/dashboard');

const { logger } = require('./src/utils/logger');
const { initializeScheduler } = require('./src/services/scheduler');

class PolkadotAnalyticsApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSwagger();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    const corsOptions = {
      origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200
    };
    this.app.use(cors(corsOptions));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Logging
    this.app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });
  }

  setupRoutes() {
    // Debug middleware to log all incoming requests
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
      next();
    });

    // API routes
    const apiRouter = express.Router();
    
    console.log('Mounting auth routes at /auth');
    apiRouter.use('/auth', authRoutes);
    
    console.log('Mounting parachain routes at /parachains');
    apiRouter.use('/parachains', parachainRoutes);
    
    console.log('Mounting TVL routes at /tvl');
    apiRouter.use('/tvl', tvlRoutes);
    
    console.log('Mounting activity routes at /activity');
    apiRouter.use('/activity', activityRoutes);
    
    console.log('Mounting history routes at /history');
    apiRouter.use('/history', historyRoutes);
    
    console.log('Mounting alert routes at /alerts');
    apiRouter.use('/alerts', alertRoutes);
    
    // Test route to verify dashboard endpoint
    console.log('Mounting test dashboard route at /test-dashboard');
    apiRouter.get('/test-dashboard', (req, res) => {
      console.log('Test dashboard endpoint hit');
      res.json({ message: 'Test dashboard endpoint is working' });
    });
    
    // Dashboard routes
    console.log('Mounting dashboard routes at /dashboard');
    apiRouter.use('/dashboard', (req, res, next) => {
      console.log('Dashboard middleware hit:', req.originalUrl);
      next();
    }, dashboardRoutes);
    
    // Mount all API routes under /api
    this.app.use('/api', apiRouter);
    
    // Log all registered routes
    console.log('All routes mounted successfully');

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Polkadot Cross-Chain Analytics API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          api: '/api',
          docs: '/api-docs'
        },
        timestamp: new Date().toISOString()
      });
    });

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Polkadot Analytics API',
        version: '1.0.0',
        description: 'Real-time analytics for Polkadot parachains',
        endpoints: {
          parachains: '/api/parachains',
          tvl: '/api/tvl',
          activity: '/api/activity',
          history: '/api/history',
          alerts: '/api/alerts'
        }
      });
    });
  }

  setupSwagger() {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Polkadot Analytics API',
          version: '1.0.0',
          description: 'Real-time analytics platform for Polkadot parachains',
          contact: {
            name: 'Polkadot Analytics Team',
            url: 'https://github.com/polkadot-analytics'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: [
          {
            url: `http://localhost:${this.port}`,
            description: 'Development server'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            },
            apiKey: {
              type: 'apiKey',
              in: 'header',
              name: 'x-api-key'
            }
          }
        },
        security: [
          {
            bearerAuth: []
          }
        ]
      },
      apis: ['./src/routes/*.js', './src/models/*.js']
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Polkadot Analytics API Documentation'
    }));
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Connect to database
      await connectDB();
      logger.info('Database connected successfully');

      // Initialize scheduler for data fetching
      await initializeScheduler();
      logger.info('Scheduler initialized successfully');

      // Start server
      this.server = this.app.listen(this.port, () => {
        logger.info(`Server running on port ${this.port}`);
        logger.info(`API Documentation: http://localhost:${this.port}/api-docs`);
        logger.info(`Health Check: http://localhost:${this.port}/health`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown() {
    logger.info('Starting graceful shutdown...');

    if (this.server) {
      this.server.close((err) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }

        logger.info('Server closed successfully');
        process.exit(0);
      });
    }

    // Close database connections
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    logger.info('Database connections closed');

    // Shutdown timeout
    setTimeout(() => {
      logger.error('Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, parseInt(process.env.SHUTDOWN_TIMEOUT) * 1000 || 30000);
  }
}

// Create and start the application
const app = new PolkadotAnalyticsApp();
app.start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

module.exports = app;

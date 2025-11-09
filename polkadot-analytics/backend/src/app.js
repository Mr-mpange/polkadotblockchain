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

// Import test routes first
const testRoutes = require('./src/routes/test-routes');

// Original routes
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
    // Enable CORS for all routes
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    // Apply CORS middleware with specific options
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      next();
    });

    // Security middleware with proper CSP
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", 'http://localhost:3001', 'ws://localhost:3001'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false
    }));

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

    // Health check endpoint - moved to a separate method to ensure it's registered early
    this.app.get('/health', (req, res) => {
      logger.info('Health check endpoint hit');
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        nodeEnv: process.env.NODE_ENV || 'development'
      });
    });
  }

  setupRoutes() {
    // Debug middleware to log all incoming requests
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
      next();
    });

    // Mount test routes first
    console.log('Mounting test routes at /api/test');
    this.app.use('/api/test', testRoutes);

    // Mount the dashboard router directly
    console.log('Mounting dashboard routes at /api/dashboard');
    this.app.use('/api/dashboard', (req, res, next) => {
      console.log('Dashboard middleware hit for path:', req.path);
      next();
    }, dashboardRoutes);
    
    // Log all registered routes (for debugging)
    const routes = [];
    this.app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        // Routes registered directly on the app
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods),
          type: 'direct'
        });
      } else if (middleware.name === 'router') {
        // Routes added with app.use()
        const mountPath = middleware.regexp.toString()
          .replace('/^', '')
          .replace('\\/?', '')
          .replace('(?=\\/|$)', '')
          .replace(/\/$/, '')
          .replace(/\\(.)/g, '$1');
          
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({
              path: `${mountPath}${handler.route.path}`,
              methods: Object.keys(handler.route.methods),
              type: 'mounted',
              mountPath: mountPath
            });
          }
        });
      }
    });
    
    console.log('Registered routes:', JSON.stringify(routes, null, 2));
    
    // 404 handler for /api/*
    this.app.use('/api', (req, res, next) => {
      console.log(`API 404: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ 
        status: 'error', 
        message: 'Endpoint not found',
        path: req.originalUrl
      });
    });

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

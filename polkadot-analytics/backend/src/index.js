console.log('🚀 Starting application...');

// Basic error handling
process.on('uncaughtException', (err) => {
  console.error('\n❌ UNCAUGHT EXCEPTION!');
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED REJECTION!');
  console.error('Reason:', reason);
  process.exit(1);
});

// Import database connection
const { connectDB } = require('./config/database');
const express = require('express');
const cors = require('cors');

// Import routes
const dashboardRoutes = require('./routes/dashboard');

async function startServer() {
  try {
    // Connect to database first
    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully!');
    
    // Initialize Express app
    const app = express();
    
    // Request logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
      });
      
      next();
    });
    
    // Enable CORS for all routes
    app.use(cors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Parse JSON bodies
    app.use(express.json());
    
    // Test route
    app.get('/', (req, res) => {
      res.json({ message: 'Polkadot Analytics API is running!' });
    });
    
    // API Routes
    console.log('Mounting dashboard routes...');
    
    // Test route before mounting
    app.get('/api/test-before', (req, res) => {
      res.json({ message: 'Test route before dashboard' });
    });
    
    // Mount dashboard routes under /api/dashboard
    app.use('/api/dashboard', (req, res, next) => {
      console.log('Dashboard router hit:', req.originalUrl);
      next();
    }, dashboardRoutes);
    
    // Test route after mounting
    app.get('/api/test-after', (req, res) => {
      res.json({ message: 'Test route after dashboard' });
    });
    
    // Debug: Print all registered routes
    console.log('\n=== Registered Routes ===');
    const printRoutes = (router, prefix = '') => {
      router.stack.forEach((middleware) => {
        if (middleware.route) {
          console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${prefix}${middleware.route.path}`);
        } else if (middleware.name === 'router' || middleware.name === 'router') {
          let route = '';
          if (middleware.regexp) {
            route = middleware.regexp.toString()
              .replace('/^\\/', '')  // Remove leading /^
              .replace('\\/?', '')   // Remove optional trailing /
              .replace('(?=\\/|$)', '')
              .replace(/\\(.)/g, '$1');
            
            // If the route is empty (root), don't add an extra /
            if (route === '') {
              route = '/';
            } else {
              route = `/${route}/`;
            }
          }
          printRoutes(middleware.handle, `${prefix}${route}`);
        }
      });
    };
    
    printRoutes(app._router);
    console.log('=========================\n');
    
    // 404 handler for /api/*
    app.use('/api', (req, res) => {
      res.status(404).json({ 
        status: 'error',
        message: 'Endpoint not found',
        path: req.originalUrl
      });
    });
    
    const PORT = 3001;
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:');
    console.error(error);
    process.exit(1);
  }
}

// Start the server
startServer();

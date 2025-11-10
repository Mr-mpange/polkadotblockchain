require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes with debug logging
console.log('\n=== Loading route modules ===');

// Import dashboard routes
let dashboardRoutes;
try {
  dashboardRoutes = require('./src/routes/dashboard');
  console.log('✅ Dashboard routes module loaded successfully');
} catch (error) {
  console.error('❌ Failed to load dashboard routes:', error);
  process.exit(1);
}

// Import parachains routes
let parachainsRoutes;
try {
  parachainsRoutes = require('./src/routes/parachains');
  console.log('✅ Parachains routes module loaded successfully');
} catch (error) {
  console.error('❌ Failed to load parachains routes:', error);
  process.exit(1);
}

console.log('=== Route modules loaded ===\n');

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ message: 'Test route works!' });
});

// Debug: Log all routes
// Debug: Print all routes with better formatting
const printRoutes = (router, prefix = '') => {
  router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(method => method.toUpperCase()).join(', ');
      console.log(`[ROUTE] ${methods.padEnd(8)} ${prefix}${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      const path = middleware.regexp.toString()
        .replace('/^', '')
        .replace('\\/?', '')
        .replace('(?=\\/|$)/i', '')
        .replace(/\/(.*)\/$/, '/$1')
        .replace('\\', '');
      printRoutes(middleware.handle, `${prefix}${path}`);
    }
  });
};

// Mount routes with debug logging
console.log('\n=== Mounting Routes ===');

// Test direct route first - this will help verify the server is working
app.get('/api/test-direct', (req, res) => {
  console.log('✅ Direct test route hit');
  res.json({ 
    status: 'success', 
    message: 'Direct route is working',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'polkadot-analytics-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount dashboard routes with enhanced logging
console.log('\n🔧 Mounting dashboard routes at /api/dashboard');
try {
  app.use('/api/dashboard', (req, res, next) => {
    console.log(`[${new Date().toISOString()}] 📡 Dashboard request: ${req.method} ${req.originalUrl}`);
    next();
  }, dashboardRoutes);
  console.log('✅ Dashboard routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to mount dashboard routes:', error);
  process.exit(1);
}

// Mount parachains routes with enhanced logging
console.log('\n🔧 Mounting parachains routes at /api/parachains');
try {
  app.use('/api/parachains', (req, res, next) => {
    console.log(`[${new Date().toISOString()}] 📡 Parachains request: ${req.method} ${req.originalUrl}`);
    next();
  }, parachainsRoutes);
  console.log('✅ Parachains routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to mount parachains routes:', error);
  process.exit(1);
}

// Add a catch-all route for debugging 404s
app.use('/api/*', (req, res, next) => {
  console.warn(`⚠️  Unhandled API route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET    /api/test-direct',
      'GET    /api/health',
      'GET    /api/dashboard',
      'GET    /api/dashboard/debug',
      'GET    /api/parachains'
    ]
  });
});

// Print all registered routes for debugging
console.log('\n=== Registered Routes ===');
const routes = [];

app._router.stack.forEach((middleware) => {
  if (middleware.name === 'router') {
    // Handle router middleware
    const router = middleware.handle;
    if (router.stack) {
      router.stack.forEach((layer) => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
          const path = middleware.regexp.toString()
            .replace('/^', '')
            .replace('\\/?', '')
            .replace('(?=\\/|$)/i', '')
            .replace(/\/$/, '');
          routes.push({
            methods,
            path: path + layer.route.path,
            type: 'router'
          });
        }
      });
    }
  } else if (middleware.route) {
    // Handle app.route()
    const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(',');
    routes.push({
      methods,
      path: middleware.route.path,
      type: 'app.route'
    });
  }
});

// Display routes in a nice format
console.log('\n🔍 Available Routes:');
console.log('='.repeat(80));
console.log('METHOD   PATH');
console.log('='.repeat(80));

routes.forEach(route => {
  const methods = route.methods.padEnd(8);
  console.log(`${methods} ${route.path}`);
});

console.log('='.repeat(80));
console.log(`Found ${routes.length} routes in total`);
console.log('=== End of Registered Routes ===\n');

// Debug route to test if server is running
app.get('/api/ping', (req, res) => {
  console.log('Ping route hit');
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', '.next', 'static')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', '.next', 'static', 'index.html'));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'polkadot-analytics-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.error(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api/ping',
      'GET /api/dashboard',
      'GET /api/dashboard/health',
      'GET /api/dashboard/test',
      'GET /api/parachains'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Server Running ===`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Health:  http://localhost:${PORT}/health`);
  console.log(`API:     http://localhost:${PORT}/api/dashboard\n`);
});

module.exports = app;
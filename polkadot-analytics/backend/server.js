require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const dashboardRoutes = require('./src/routes/dashboard');
const parachainsRoutes = require('./src/routes/parachains');

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
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/parachains', parachainsRoutes);

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
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path,
    method: req.method
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
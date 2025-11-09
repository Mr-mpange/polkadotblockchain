const express = require('express');
const app = express();
const port = 3002; // Using a different port to avoid conflicts

// Simple middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Test server is working!'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Test Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    health: '/health'
  });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`\n=== Test Server Running ===`);
  console.log(`Local:   http://localhost:${port}`);
  console.log(`Test endpoints:`);
  console.log(`- http://localhost:${port}/`);
  console.log(`- http://localhost:${port}/health`);
  console.log('\nPress Ctrl+C to stop the server\n');
});

// Handle server errors
app.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  }
  process.exit(1);
});

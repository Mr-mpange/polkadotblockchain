// Minimal test server to verify basic Express functionality
const express = require('express');
const app = express();
const port = 3001;

// Basic request logging
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
    message: 'Test server is running',
    nodeVersion: process.version
  });
});

// Start the server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`\n=== Test Server Running ===`);
  console.log(`Local:   http://localhost:${port}`);
  console.log(`Network: http://${require('os').hostname()}:${port}`);
  console.log(`\nTest endpoints:`);
  console.log(`- http://localhost:${port}/health`);
  console.log('\nPress Ctrl+C to stop the server\n');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nError: Port ${port} is already in use.`);
    console.log('Please stop any other servers using this port and try again.\n');
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

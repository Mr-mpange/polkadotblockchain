console.log('🚀 Starting simple test server...');

const express = require('express');
const app = express();
const PORT = 3001;

// Basic route
app.get('/', (req, res) => {
  res.send('Test server is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

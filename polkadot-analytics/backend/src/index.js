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

// Minimal server
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, Polkadot Analytics!');
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

const http = require('http');
const port = 3001;

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'Simple HTTP server is working',
      nodeVersion: process.version
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.on('error', (e) => {
  console.error('Server error:', e);
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
    console.log('Please stop any other servers using this port and try again.');
  }
  process.exit(1);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`\n=== Simple HTTP Server Running ===`);
  console.log(`Local:   http://localhost:${port}/health`);
  console.log(`Network: http://${require('os').hostname()}:${port}/health`);
  console.log('\nPress Ctrl+C to stop the server\n');
});

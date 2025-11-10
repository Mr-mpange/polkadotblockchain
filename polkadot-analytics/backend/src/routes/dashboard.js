const express = require('express');
const router = express.Router();

// Debug middleware for all dashboard routes
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Dashboard route hit: ${req.method} ${req.originalUrl}`);
  next();
});

// Enable CORS for all routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

console.log('=== Dashboard routes module loaded ===');

// Mock data
const mockData = {
  status: 'success',
  data: {
    total_parachains: 15,
    active_parachains: 12,
    total_tvl: 1250000000, // $1.25B
    recent_activity: [
      { id: 1, event: 'New block', timestamp: new Date().toISOString() },
      { id: 2, event: 'Parachain updated', timestamp: new Date().toISOString() }
    ]
  }
};

// Debug: Log when routes are being set up
console.log('Setting up dashboard routes...');

// Debug: Print router stack before adding routes
console.log('Router stack before routes:', router.stack.length, 'items');

// Debug route to test if router is working at all
router.get('/debug', (req, res) => {
  console.log('Dashboard debug route hit at', new Date().toISOString());
  res.json({
    status: 'debug',
    message: 'Dashboard router is working',
    timestamp: new Date().toISOString(),
    routerStack: router.stack.map(layer => ({
      path: layer.route?.path,
      methods: layer.route?.methods,
      name: layer.name
    }))
  });
});

// GET / - Get dashboard summary data
router.get('/', (req, res) => {
  console.log('Dashboard root route handler called');
  const requestTime = new Date().toISOString();
  console.log(`[${requestTime}] GET /api/dashboard`);
  
  try {
    // Mock data
    const mockData = {
      status: 'success',
      data: {
        total_parachains: 15,
        active_parachains: 12,
        total_tvl: 1250000000,
        recent_activity: [
          { id: 1, event: 'New block', timestamp: new Date().toISOString() },
          { id: 2, event: 'Parachain updated', timestamp: new Date().toISOString() }
        ]
      }
    };
    
    console.log('Sending mock data:', JSON.stringify(mockData, null, 2));
    
    // Add some debug headers
    res.set('X-Debug-Timestamp', requestTime);
    res.set('X-Debug-Route', '/api/dashboard');
    
    return res.status(200).json(mockData);
  } catch (error) {
    const errorTime = new Date().toISOString();
    console.error(`[${errorTime}] Dashboard error:`, error);
    
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch dashboard data',
      timestamp: errorTime,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  console.log('Dashboard health check hit'); // Debug log
  res.status(200).json({ 
    status: 'ok', 
    message: 'Dashboard service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Debug route to test if router is working
router.get('/test', (req, res) => {
  console.log('Dashboard test route hit');
  res.json({ message: 'Dashboard router is working!' });
});

console.log('Dashboard routes configured'); // Debug log

// Export the router
module.exports = router;

// Debug: Log the router's stack after all routes are added
console.log('Router stack after routes:', router.stack.length, 'items');
router.stack.forEach((layer, i) => {
  if (layer.route) {
    console.log(`Route ${i}:`, {
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
      regexp: layer.regexp.toString()
    });
  }
});

console.log('=== Dashboard routes setup complete ===\n');

// Debug: Log the router's stack after all routes are added
console.log('=== Dashboard routes configuration ===');
console.log('Router stack has', router.stack.length, 'route handlers');
router.stack.forEach((layer, i) => {
  if (layer.route) {
    console.log(`Route ${i}:`, {
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
      regexp: layer.regexp.toString()
    });
  }
});

console.log('=== End of dashboard routes ===\n');

module.exports = router;
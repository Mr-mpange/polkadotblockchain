/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation
 */

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Polkadot Analytics API',
      version: '1.0.0',
      description: 'Comprehensive API for Polkadot parachain analytics, providing real-time and historical data on TVL, transactions, user activity, and cross-chain flows.',
      contact: {
        name: 'API Support',
        email: 'support@polkadot-analytics.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.polkadot-analytics.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        Parachain: {
          type: 'object',
          properties: {
            parachain_id: { type: 'number', example: 2000 },
            name: { type: 'string', example: 'Acala' },
            description: { type: 'string', example: 'DeFi Hub of Polkadot' },
            category: { type: 'string', example: 'DeFi' },
            tvl: { type: 'number', example: 125000000 },
            transactions_24h: { type: 'number', example: 15234 },
            active_users: { type: 'number', example: 5621 },
            token_symbol: { type: 'string', example: 'ACA' },
            website: { type: 'string', example: 'https://acala.network' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        TVLData: {
          type: 'object',
          properties: {
            parachain_id: { type: 'number', example: 2000 },
            timestamp: { type: 'string', format: 'date-time' },
            tvl: { type: 'number', example: 125000000 },
            tvl_change_24h: { type: 'number', example: 2.5 },
            volume_24h: { type: 'number', example: 5000000 },
          },
        },
        Activity: {
          type: 'object',
          properties: {
            parachain_id: { type: 'number', example: 2000 },
            timestamp: { type: 'string', format: 'date-time' },
            active_users: { type: 'number', example: 5621 },
            transactions: { type: 'number', example: 15234 },
            avg_gas_fee: { type: 'number', example: 0.05 },
          },
        },
        Alert: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            parachain_id: { type: 'number', example: 2000 },
            type: { type: 'string', enum: ['tvl_spike', 'tvl_drop', 'activity_spike', 'activity_drop'], example: 'tvl_spike' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high' },
            message: { type: 'string', example: 'TVL increased by 25% in the last hour' },
            threshold: { type: 'number', example: 20 },
            actual_value: { type: 'number', example: 25 },
            status: { type: 'string', enum: ['active', 'acknowledged', 'resolved'], example: 'active' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid request' },
            message: { type: 'string', example: 'Parachain ID is required' },
            statusCode: { type: 'number', example: 400 },
          },
        },
      },
    },
    tags: [
      {
        name: 'Parachains',
        description: 'Parachain information and metrics',
      },
      {
        name: 'TVL',
        description: 'Total Value Locked analytics',
      },
      {
        name: 'Activity',
        description: 'User activity and transaction metrics',
      },
      {
        name: 'Alerts',
        description: 'Real-time alert management',
      },
      {
        name: 'History',
        description: 'Historical data queries',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to API routes
};

module.exports = swaggerOptions;

const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        return log;
      })
    )
  })
];

// File transport for production
if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE) {
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/error.log',
      level: 'error',
      format: logFormat
    }),
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/combined.log',
      format: logFormat
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/exceptions.log'
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/rejections.log'
    })
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 400 ? '❌' : '✅';

    logger.info(`${statusEmoji} ${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      ...(req.user && { userId: req.user._id })
    });
  });

  next();
};

// Performance monitoring
const performanceLogger = (operation, startTime) => {
  const duration = Date.now() - startTime;
  logger.debug(`Performance: ${operation} took ${duration}ms`);
};

// Database query logging
const queryLogger = (operation, collection, query, duration) => {
  logger.debug(`DB Query: ${operation} on ${collection}`, {
    operation,
    collection,
    query: JSON.stringify(query),
    duration: `${duration}ms`
  });
};

// API response time middleware
const responseTimeLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    if (duration > 1000) { // Log slow requests (> 1 second)
      logger.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`, {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
  });

  next();
};

module.exports = {
  logger,
  requestLogger,
  performanceLogger,
  queryLogger,
  responseTimeLogger
};

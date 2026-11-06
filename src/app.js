const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status');
const routes = require('./routes');
const { swaggerUi, swaggerSpec, customOptions } = require('./docs/swagger');
const globalErrorHandler = require('./middlewares/globalErrorHandler');
const notFound = require('./middlewares/notFound');

const app = express();

// Security & Utility Middlewares (CSP disabled so Swagger UI assets load cleanly)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger Interactive API Documentation & Spec Endpoints
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, customOptions));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, customOptions));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.get('/docs', (req, res) => res.redirect('/api/docs'));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status_code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', limiter);

// Health Check Endpoint (accessible via /api/health and /health)
const healthCheck = (req, res) => {
  res.status(httpStatus.OK).json({
    success: true,
    status_code: httpStatus.OK,
    message: 'Track It Backend API is healthy and running!',
    timestamp: new Date().toISOString(),
  });
};
app.get('/api/health', healthCheck);
app.get('/health', healthCheck);

// API Routes with /api prefix (also supporting /api/v1 for backwards compatibility)
app.use('/api', routes);
app.use('/api/v1', routes);

// 404 Not Found Handler
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;

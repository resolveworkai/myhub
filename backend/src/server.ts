import express, { Express } from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from './config';
import { logger } from './utils/logger';
import { globalErrorHandler } from './middleware/errorHandler';
import { securityMiddleware, requestLogger } from './middleware/security';
import { generalRateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';

const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Enable CORS to allow your frontend (React) to call this backend
app.use(cors());
// secure put specific domains in production
// app.use(cors({ origin: 'https://portal.c7corp.com/' }));

// Security middleware
app.use(securityMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// General rate limiting
app.use(config.apiPrefix, generalRateLimiter);

// Health check routes (before API prefix)
app.use('/health', healthRoutes);
app.use('/ready', healthRoutes);

// API routes
app.use(`${config.apiPrefix}/auth`, authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`, {
    env: config.env,
    apiPrefix: config.apiPrefix,
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  // Don't exit in production, let the process manager handle it
  if (config.env !== 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

export default app;

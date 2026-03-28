import dotenv from 'dotenv';
import { Server } from 'http';
import { createApp } from './app';
import {
  connectDatabase,
  disconnectDatabase,
  redisClient,
  disconnectRedis,
  closeQueues,
  validateEnv,
} from './config';
import { startWorkers, stopWorkers } from './workers';
import { warmCache } from './services/cache.service';
import { metricsService } from './services/metrics.service';
import logger from './utils/logger';

/**
 * Server Entry Point
 * Requirements: 21.10, 28.5
 */

// Load environment variables
dotenv.config();

// Validate environment variables after loading
validateEnv();

const PORT = process.env.PORT || 3000;
let server: Server | null = null;

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    logger.info('Starting FOLKIFY Backend API...');

    // 1. Connect to database (Prisma)
    await connectDatabase();
    logger.info('✓ Database connected successfully');

    // 2. Connect to Redis
    try {
      await redisClient.ping();
      logger.info('✓ Redis connected successfully');
    } catch (error) {
      logger.warn('⚠ Redis connection failed, continuing without cache:', error);
    }

    // 3. Initialize BullMQ queues (queues are initialized in config/queues.ts)
    logger.info('✓ BullMQ queues initialized');

    // 4. Start queue workers
    startWorkers();
    logger.info('✓ Queue workers started successfully');

    // 5. Warm cache on startup
    try {
      await warmCache();
      logger.info('✓ Cache warmed successfully');
    } catch (error) {
      logger.warn('⚠ Cache warming failed, continuing:', error);
    }

    // 6. Start performance monitoring
    metricsService.startMonitoring();
    logger.info('✓ Performance monitoring started');

    // 7. Create Express app
    const app = createApp();

    // 8. Start Express server
    server = app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      console.log('\n' + '='.repeat(60));
      console.log('🎵 FOLKIFY Backend API');
      console.log('='.repeat(60));
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(60) + '\n');
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    // 1. Stop accepting new connections
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) {
            logger.error('Error closing server:', err);
            reject(err);
          } else {
            logger.info('✓ Server closed');
            resolve();
          }
        });
      });
    }

    // 2. Stop performance monitoring
    metricsService.stopMonitoring();
    logger.info('✓ Performance monitoring stopped');

    // 3. Stop queue workers
    await stopWorkers();
    logger.info('✓ Queue workers stopped');

    // 4. Close BullMQ queues
    await closeQueues();
    logger.info('✓ BullMQ queues closed');

    // 5. Disconnect Redis
    await disconnectRedis();
    logger.info('✓ Redis disconnected');

    // 6. Disconnect database
    await disconnectDatabase();
    logger.info('✓ Database disconnected');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();
('');

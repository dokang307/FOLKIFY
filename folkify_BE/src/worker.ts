import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase, redisClient, disconnectRedis } from './config';
import { createAIGradingWorker, createEmailWorker } from './workers';
import logger from './utils/logger';
import { Worker } from 'bullmq';

/**
 * Worker Entry Point
 * Separate process for queue workers
 * Requirements: 4.4
 */

// Load environment variables
dotenv.config();

let aiGradingWorker: Worker | null = null;
let emailWorker: Worker | null = null;

/**
 * Start all workers
 */
async function startWorkers(): Promise<void> {
  try {
    logger.info('Starting FOLKIFY Queue Workers...');

    // 1. Connect to database
    await connectDatabase();
    logger.info('✓ Database connected successfully');

    // 2. Connect to Redis (required for workers)
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
      logger.error('❌ Redis is not configured (REDIS_URL or REDIS_HOST not set)');
      logger.error('Workers require Redis to process background jobs');
      logger.error('Please provision Redis service and set environment variables');
      process.exit(1);
    }

    try {
      await redisClient.connect();
      await redisClient.ping();
      logger.info('✓ Redis connected successfully');
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      logger.error('Workers cannot start without Redis connection');
      logger.error('Please verify Redis service is running and environment variables are correct');
      process.exit(1);
    }

    // 3. Start AI grading worker
    aiGradingWorker = createAIGradingWorker();
    logger.info('✓ AI grading worker started');

    // 4. Start email worker
    emailWorker = createEmailWorker();
    logger.info('✓ Email worker started');

    console.log('\n' + '='.repeat(60));
    console.log('🎵 FOLKIFY Queue Workers');
    console.log('='.repeat(60));
    console.log('AI Grading Worker: Running');
    console.log('Email Worker: Running');
    console.log('='.repeat(60) + '\n');

    logger.info('All workers started successfully');
  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down workers gracefully...`);

  try {
    // 1. Stop AI grading worker
    if (aiGradingWorker) {
      await aiGradingWorker.close();
      logger.info('✓ AI grading worker stopped');
    }

    // 2. Stop email worker
    if (emailWorker) {
      await emailWorker.close();
      logger.info('✓ Email worker stopped');
    }

    // 3. Disconnect Redis
    await disconnectRedis();
    logger.info('✓ Redis disconnected');

    // 4. Disconnect database
    await disconnectDatabase();
    logger.info('✓ Database disconnected');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

/**
 * Handle worker errors and restarts
 */
function setupErrorHandlers(): void {
  // Handle AI grading worker errors
  if (aiGradingWorker) {
    aiGradingWorker.on('error', (error) => {
      logger.error('AI grading worker error:', error);
      // Worker will automatically attempt to reconnect
    });

    aiGradingWorker.on('failed', (job, error) => {
      logger.error(`AI grading job ${job?.id} failed:`, error);
    });
  }

  // Handle email worker errors
  if (emailWorker) {
    emailWorker.on('error', (error) => {
      logger.error('Email worker error:', error);
      // Worker will automatically attempt to reconnect
    });

    emailWorker.on('failed', (job, error) => {
      logger.error(`Email job ${job?.id} failed:`, error);
    });
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in worker:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection in worker at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the workers
startWorkers().then(() => {
  setupErrorHandlers();
});

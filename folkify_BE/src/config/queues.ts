import { Queue, QueueOptions } from 'bullmq';
import { getEnv } from './env';
import logger from '../utils/logger';

/**
 * BullMQ Queue Configuration
 * Provides queue instances for async job processing
 */

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

function getQueueOptions(): QueueOptions {
  const env = getEnv();
  return {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
    },
    defaultJobOptions: {
      attempts: process.env.NODE_ENV === 'test' ? 1 : env.QUEUE_RETRY_ATTEMPTS || 3,
      backoff: {
        type: 'exponential',
        delay: process.env.NODE_ENV === 'test' ? 1000 : env.QUEUE_RETRY_DELAY || 2000,
      },
      removeOnComplete: {
        count: 100, // Keep last 100 completed jobs
        age: 24 * 3600, // Keep for 24 hours
      },
      removeOnFail: {
        count: 500, // Keep last 500 failed jobs for debugging
        age: 7 * 24 * 3600, // Keep for 7 days
      },
    },
  };
}

const queueOptions = getQueueOptions();

/**
 * AI Grading Queue
 * Processes AI grading submissions asynchronously
 */
export const aiGradingQueue = new Queue('ai-grading', queueOptions);

/**
 * Email Queue
 * Processes email notifications asynchronously
 */
export const emailQueue = new Queue('email', queueOptions);

// Queue event handlers for monitoring (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  aiGradingQueue.on('error', (error) => {
    logger.error('AI Grading Queue error:', error);
  });

  emailQueue.on('error', (error) => {
    logger.error('Email Queue error:', error);
  });

  logger.info('BullMQ queues initialized');
}

/**
 * Graceful shutdown handler for queues
 */
export async function closeQueues(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    await Promise.all([aiGradingQueue.close(), emailQueue.close()]);
    logger.info('All queues closed gracefully');
  } catch (error) {
    logger.error('Error closing queues:', error);
  }
}

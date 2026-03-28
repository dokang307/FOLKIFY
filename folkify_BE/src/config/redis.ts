import Redis from 'ioredis';
import logger from '../utils/logger';

// Support both individual config and REDIS_URL
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

/**
 * Redis client configuration with retry logic
 */
const redisClient = REDIS_URL
  ? new Redis(REDIS_URL, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    })
  : new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

// Connection event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connecting...');
});

redisClient.on('ready', () => {
  logger.info('Redis client connected and ready');
});

redisClient.on('error', (error) => {
  logger.error('Redis client error:', error);
});

redisClient.on('close', () => {
  logger.warn('Redis client connection closed');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

/**
 * Graceful shutdown handler
 */
export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.quit();
    logger.info('Redis client disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting Redis client:', error);
    redisClient.disconnect();
  }
}

export default redisClient;

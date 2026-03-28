import Redis from 'ioredis';
import logger from '../utils/logger';

// Support both individual config and REDIS_URL
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// Check if Redis is configured
const isRedisConfigured = !!(REDIS_URL || process.env.REDIS_HOST);

if (!isRedisConfigured) {
  logger.warn('Redis is not configured (REDIS_URL or REDIS_HOST not set)');
  logger.warn('The application will run without caching and background jobs');
  logger.warn('To enable Redis, set REDIS_URL or REDIS_HOST environment variable');
}

/**
 * Redis client configuration with retry logic
 */
const redisClient = REDIS_URL
  ? new Redis(REDIS_URL, {
      retryStrategy: (times: number) => {
        if (times > 10) {
          logger.error('Redis connection failed after 10 retries, giving up');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true, // Don't connect immediately
    })
  : new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        if (times > 10) {
          logger.error('Redis connection failed after 10 retries, giving up');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true, // Don't connect immediately
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

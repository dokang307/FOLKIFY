// Export environment configuration
export { validateEnv, getEnvConfig, getEnv, type EnvConfig } from './env';

// Export database client
export {
  prisma,
  connectDatabase,
  disconnectDatabase,
  databaseHealthCheck,
  validateSupabaseConfig,
} from './database';

// Export Redis client
export { default as redisClient, disconnectRedis } from './redis';

// Export BullMQ queues
export { aiGradingQueue, emailQueue, closeQueues } from './queues';

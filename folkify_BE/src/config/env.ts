import { z } from 'zod';
import logger from '../utils/logger';

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3000'),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),

  // Database Configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required for Prisma migrations'),

  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // CORS Configuration
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // File Upload Configuration
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_AUDIO_SIZE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('52428800'),
  MAX_VIDEO_SIZE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('209715200'),

  // Email Configuration
  EMAIL_MODE: z.enum(['console', 'smtp']).default('console'),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR: z.string().default('./logs'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('100'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('5'),

  // Cache Configuration
  CACHE_TTL_INSTRUMENTS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('1800'),
  CACHE_TTL_LESSONS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('600'),
  CACHE_TTL_SHEETS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('1800'),
  CACHE_TTL_ANALYTICS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('300'),

  // Cronjob Configuration
  PREMIUM_EXPIRATION_CRON: z.string().default('0 0 * * *'),

  // BullMQ Configuration
  QUEUE_RETRY_ATTEMPTS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3'),
  QUEUE_RETRY_DELAY: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('2000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Lazy-loaded validated config
let cachedEnv: EnvConfig | null = null;

/**
 * Validate environment variables on startup
 */
export function validateEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  try {
    const env = envSchema.parse(process.env);
    logger.info('Environment variables validated successfully');
    cachedEnv = env;
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        return `${err.path.join('.')}: ${err.message}`;
      });

      logger.error('Environment validation failed:');
      missingVars.forEach((msg) => logger.error(`  - ${msg}`));

      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Get validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  return validateEnv();
}

// Export a getter function instead of immediate validation
export function getEnv(): EnvConfig {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

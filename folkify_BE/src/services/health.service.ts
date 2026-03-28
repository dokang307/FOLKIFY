import { databaseHealthCheck } from '../config/database';
import redisClient from '../config/redis';
import { aiGradingQueue, emailQueue } from '../config/queues';
import logger from '../utils/logger';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Health Check Service
 * Validates: Requirements 14.10, 14.11, 23.10
 */

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  queue: 'running' | 'stopped';
  diskSpace: string;
  uptime: string;
}

/**
 * Check database connection health
 */
async function checkDatabaseHealth(): Promise<'connected' | 'disconnected'> {
  try {
    const isHealthy = await databaseHealthCheck();
    return isHealthy ? 'connected' : 'disconnected';
  } catch (error) {
    logger.error('Database health check failed:', error);
    return 'disconnected';
  }
}

/**
 * Check Redis connection health
 */
async function checkRedisHealth(): Promise<'connected' | 'disconnected'> {
  try {
    // Check if Redis is configured
    if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
      logger.debug('Redis not configured (REDIS_HOST or REDIS_URL not set)');
      return 'disconnected';
    }

    await redisClient.ping();
    return 'connected';
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return 'disconnected';
  }
}

/**
 * Check queue worker status
 */
async function checkQueueHealth(): Promise<'running' | 'stopped'> {
  try {
    // Check if Redis is configured (required for queues)
    if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
      logger.debug('Queues not available (Redis not configured)');
      return 'stopped';
    }

    // Check if queues are accessible
    const [_aiGradingCount, _emailCount] = await Promise.all([
      aiGradingQueue.count(),
      emailQueue.count(),
    ]);

    // If we can get counts, queues are running
    return 'running';
  } catch (error) {
    logger.error('Queue health check failed:', error);
    return 'stopped';
  }
}

/**
 * Check disk space
 */
async function checkDiskSpace(): Promise<string> {
  try {
    // For Windows
    if (process.platform === 'win32') {
      const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
      const lines = stdout
        .trim()
        .split('\n')
        .filter((line) => line.trim());
      if (lines.length > 1) {
        // Parse first drive (usually C:)
        const parts = lines[1].trim().split(/\s+/);
        if (parts.length >= 2) {
          const freeBytes = parseInt(parts[1], 10);
          const freeGB = Math.floor(freeBytes / (1024 * 1024 * 1024));
          return `${freeGB}GB free`;
        }
      }
    } else {
      // For Unix-like systems
      const { stdout } = await execAsync('df -h / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      if (parts.length >= 4) {
        return `${parts[3]} free`;
      }
    }

    return 'unknown';
  } catch (error) {
    logger.error('Disk space check failed:', error);
    return 'unknown';
  }
}

/**
 * Get system uptime
 */
function getUptime(): string {
  const uptimeSeconds = os.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Get overall health status
 *
 * Health check strategy:
 * - Returns "healthy" if database is connected (critical service)
 * - Redis and queue status are informational only
 * - This allows the service to start even if Redis is not yet configured
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const [database, redis, queue, diskSpace] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkQueueHealth(),
    checkDiskSpace(),
  ]);

  const uptime = getUptime();

  // Service is healthy if database is connected (critical service)
  // Redis and queues are optional services that can be degraded
  const status = database === 'connected' ? 'healthy' : 'unhealthy';

  return {
    status,
    database,
    redis,
    queue,
    diskSpace,
    uptime,
  };
}

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

/**
 * Validate Supabase configuration on startup
 * Requirements: 3.5
 */
export function validateSupabaseConfig(): void {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  // Check DATABASE_URL is set
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for Supabase connection');
  }

  // Check DIRECT_URL is set
  if (!directUrl) {
    throw new Error('DIRECT_URL environment variable is required for Prisma migrations');
  }

  // Validate DATABASE_URL format (pooled connection)
  if (!databaseUrl.includes('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Validate DIRECT_URL format
  if (!directUrl.includes('postgresql://')) {
    throw new Error('DIRECT_URL must be a valid PostgreSQL connection string');
  }

  // Warn if DATABASE_URL doesn't include pgbouncer parameter
  if (!databaseUrl.includes('pgbouncer=true')) {
    logger.warn(
      'DATABASE_URL should include pgbouncer=true parameter for connection pooling. ' +
        'Example: postgresql://user:pass@host:6543/db?pgbouncer=true'
    );
  }

  // Warn if DIRECT_URL includes pgbouncer parameter (should be direct connection)
  if (directUrl.includes('pgbouncer=true')) {
    logger.warn(
      'DIRECT_URL should not include pgbouncer parameter. ' +
        'It should be a direct connection for migrations. ' +
        'Example: postgresql://user:pass@host:5432/db'
    );
  }

  // Warn if DATABASE_URL uses port 5432 (should use 6543 for pooling)
  if (databaseUrl.includes(':5432/')) {
    logger.warn(
      'DATABASE_URL appears to use port 5432. ' +
        'For Supabase connection pooling, use port 6543 with pgbouncer=true'
    );
  }

  // Warn if DIRECT_URL uses port 6543 (should use 5432 for direct connection)
  if (directUrl.includes(':6543/')) {
    logger.warn(
      'DIRECT_URL appears to use port 6543. ' +
        'For direct connections (migrations), use port 5432 without pgbouncer parameter'
    );
  }

  logger.info('Supabase configuration validated successfully');
}

/**
 * Prisma client singleton with connection pooling
 * Requirements: 21.2, 28.5
 */
class DatabaseClient {
  private static instance: PrismaClient | null = null;

  /**
   * Get Prisma client instance (singleton pattern)
   * Supabase handles connection pooling via PgBouncer
   */
  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      // Supabase connection strings already include pooling parameters
      const databaseUrl = process.env.DATABASE_URL || '';

      DatabaseClient.instance = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
        log: [
          { level: 'warn', emit: 'event' },
          { level: 'error', emit: 'event' },
        ],
      });

      // Log slow queries (> 1 second)
      DatabaseClient.instance.$on('query' as never, (e: any) => {
        if (e.duration > 1000) {
          logger.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
        }
      });

      // Log warnings and errors
      DatabaseClient.instance.$on('warn' as never, (e: any) => {
        logger.warn('Prisma warning:', e);
      });

      DatabaseClient.instance.$on('error' as never, (e: any) => {
        logger.error('Prisma error:', e);
      });

      logger.info('Prisma client initialized with Supabase connection pooling');
    }

    return DatabaseClient.instance;
  }

  /**
   * Connect to database
   */
  public static async connect(): Promise<void> {
    try {
      // Validate Supabase configuration before connecting
      validateSupabaseConfig();

      const client = DatabaseClient.getInstance();
      await client.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown - disconnect from database
   */
  public static async disconnect(): Promise<void> {
    try {
      if (DatabaseClient.instance) {
        await DatabaseClient.instance.$disconnect();
        DatabaseClient.instance = null;
        logger.info('Database disconnected gracefully');
      }
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  /**
   * Health check - verify database connection
   */
  public static async healthCheck(): Promise<boolean> {
    try {
      const client = DatabaseClient.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const prisma = DatabaseClient.getInstance();

// Export utility functions
export const connectDatabase = DatabaseClient.connect;
export const disconnectDatabase = DatabaseClient.disconnect;
export const databaseHealthCheck = DatabaseClient.healthCheck;

export default DatabaseClient;

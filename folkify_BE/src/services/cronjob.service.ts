import { prisma } from '../config/database';
import redisClient from '../config/redis';
import { emailQueue } from '../config/queues';
import logger from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

/**
 * Cronjob Service
 * Handles automated processes like premium expiration checks
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9
 */

const LOCK_KEY = 'cronjob:premium_expiration';
const LOCK_TTL = 600; // 10 minutes in seconds

/**
 * Check and downgrade expired premium users
 * Uses distributed lock to prevent concurrent execution
 */
export async function checkExpiredPremium(): Promise<{
  success: boolean;
  affectedUsersCount: number;
  message: string;
}> {
  const startTime = Date.now();
  logger.info('Starting premium expiration cronjob');

  try {
    // 1. Acquire distributed lock
    const lockAcquired = await redisClient.set(LOCK_KEY, '1', 'EX', LOCK_TTL, 'NX');

    if (!lockAcquired) {
      logger.warn('Cronjob already running (lock held), skipping execution');
      return {
        success: false,
        affectedUsersCount: 0,
        message: 'Cronjob already running',
      };
    }

    try {
      // 2. Find expired premium users
      const now = new Date();
      const expiredUsers = await prisma.user.findMany({
        where: {
          account_type: { in: ['basic', 'pro'] },
          premium_expires_at: { lte: now },
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          account_type: true,
          premium_expires_at: true,
        },
      });

      logger.info(`Found ${expiredUsers.length} expired premium users`);

      // 3. Downgrade each user
      for (const user of expiredUsers) {
        try {
          // Update user account_type to 'free'
          await prisma.user.update({
            where: { id: user.id },
            data: { account_type: 'free' },
          });

          // Queue email notification
          await emailQueue.add('premium-expired', {
            type: 'premium-expired',
            to: user.email,
            data: {
              fullName: user.full_name,
              renewUrl: 'https://folkify.com/premium',
            },
          });

          logger.info(`Premium subscription expired for user ${user.id} (${user.email})`);
        } catch (error) {
          logger.error(`Failed to downgrade user ${user.id}:`, error);
          // Continue with other users even if one fails
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        `Premium expiration cronjob completed. Processed ${expiredUsers.length} users in ${duration}ms`
      );

      return {
        success: true,
        affectedUsersCount: expiredUsers.length,
        message: `Successfully processed ${expiredUsers.length} expired users`,
      };
    } finally {
      // 4. Release lock
      await redisClient.del(LOCK_KEY);
      logger.info('Released cronjob lock');
    }
  } catch (error) {
    logger.error('Premium expiration cronjob failed:', error);
    throw error;
  }
}

const FILE_CLEANUP_LOCK_KEY = 'cronjob:file_cleanup';

/**
 * Clean up old AI grading files (older than 30 days)
 * Deletes files from /uploads/ai-grading that are no longer needed
 * Requirements: 17.8
 */
export async function cleanupOldFiles(): Promise<{
  success: boolean;
  deletedFilesCount: number;
  message: string;
}> {
  const startTime = Date.now();
  logger.info('Starting file cleanup cronjob');

  try {
    // 1. Acquire distributed lock
    const lockAcquired = await redisClient.set(FILE_CLEANUP_LOCK_KEY, '1', 'EX', LOCK_TTL, 'NX');

    if (!lockAcquired) {
      logger.warn('File cleanup cronjob already running (lock held), skipping execution');
      return {
        success: false,
        deletedFilesCount: 0,
        message: 'Cronjob already running',
      };
    }

    try {
      // 2. Find AI grading sessions older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldSessions = await prisma.aIGradingSession.findMany({
        where: {
          submitted_at: { lte: thirtyDaysAgo },
          file_path: { not: null as any },
        },
        select: {
          id: true,
          file_path: true,
          submitted_at: true,
        },
      });

      logger.info(`Found ${oldSessions.length} old AI grading sessions to clean up`);

      let deletedCount = 0;

      // 3. Delete files from filesystem
      for (const session of oldSessions) {
        if (!session.file_path) continue;

        try {
          // Construct full file path
          const fullPath = path.join(process.cwd(), session.file_path);

          // Check if file exists
          try {
            await fs.access(fullPath);
            // File exists, delete it
            await fs.unlink(fullPath);
            deletedCount++;
            logger.info(`Deleted file: ${session.file_path} (session: ${session.id})`);
          } catch (accessError) {
            // File doesn't exist, skip
            logger.warn(`File not found: ${session.file_path} (session: ${session.id})`);
          }
        } catch (error) {
          logger.error(`Failed to delete file ${session.file_path}:`, error);
          // Continue with other files even if one fails
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`File cleanup cronjob completed. Deleted ${deletedCount} files in ${duration}ms`);

      return {
        success: true,
        deletedFilesCount: deletedCount,
        message: `Successfully deleted ${deletedCount} old files`,
      };
    } finally {
      // 4. Release lock
      await redisClient.del(FILE_CLEANUP_LOCK_KEY);
      logger.info('Released file cleanup cronjob lock');
    }
  } catch (error) {
    logger.error('File cleanup cronjob failed:', error);
    throw error;
  }
}

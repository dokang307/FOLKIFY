import { getAllInstruments } from '../repositories/instrument.repository';
import { getLessonsByInstrument } from '../repositories/lesson.repository';
import redisClient from '../config/redis';
import logger from '../utils/logger';

/**
 * Cache Service
 * Handles cache warming on server startup
 * Requirements: 13.9
 */

/**
 * Warm cache with frequently accessed data
 * Warms instruments and lessons cache on startup
 */
export async function warmCache(): Promise<void> {
  try {
    logger.info('Starting cache warming...');

    // 1. Warm instruments cache
    const instruments = await getAllInstruments();
    if (instruments.length > 0) {
      await redisClient.setex('instruments:list', 1800, JSON.stringify(instruments)); // 30 min TTL
      logger.info(`✓ Instruments cache warmed (${instruments.length} instruments)`);
    }

    // 2. Warm lessons cache for each instrument
    let totalLessons = 0;
    for (const instrument of instruments) {
      try {
        const lessons = await getLessonsByInstrument(instrument.id);
        if (lessons.length > 0) {
          await redisClient.setex(
            `lessons:${instrument.id}`,
            600, // 10 min TTL
            JSON.stringify(lessons)
          );
          totalLessons += lessons.length;
        }
      } catch (error) {
        logger.warn(`Failed to warm lessons cache for instrument ${instrument.id}:`, error);
        // Continue with other instruments
      }
    }
    logger.info(
      `✓ Lessons cache warmed (${totalLessons} lessons across ${instruments.length} instruments)`
    );

    logger.info('✓ Cache warming completed successfully');
  } catch (error) {
    logger.error('Error warming cache:', error);
    // Don't throw - cache warming failure shouldn't prevent server startup
  }
}

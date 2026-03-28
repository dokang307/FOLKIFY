import { Request, Response } from 'express';
import { getAllInstruments, getInstrumentById } from '../repositories/instrument.repository';
import redisClient from '../config/redis';
import { metricsService } from '../services/metrics.service';
import logger from '../utils/logger';

const INSTRUMENTS_CACHE_KEY = 'instruments:list';
const INSTRUMENTS_CACHE_TTL = 1800; // 30 minutes

/**
 * GET /api/instruments
 * Get all instruments with caching
 */
export async function getInstrumentsController(_req: Request, res: Response): Promise<void> {
  try {
    // Try to get from cache
    const cached = await redisClient.get(INSTRUMENTS_CACHE_KEY);
    if (cached) {
      metricsService.trackCacheHit();
      const instruments = JSON.parse(cached);
      res.status(200).json({
        success: true,
        data: instruments,
      });
      return;
    }

    // Cache miss
    metricsService.trackCacheMiss();

    // Get from database
    const instruments = await getAllInstruments();

    // Cache the result
    await redisClient.setex(
      INSTRUMENTS_CACHE_KEY,
      INSTRUMENTS_CACHE_TTL,
      JSON.stringify(instruments)
    );

    res.status(200).json({
      success: true,
      data: instruments,
    });
  } catch (error) {
    logger.error('Get instruments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/instruments/:id
 * Get instrument by ID with lessons
 */
export async function getInstrumentByIdController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Try to get from cache
    const cacheKey = `instrument:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      metricsService.trackCacheHit();
      const instrument = JSON.parse(cached);
      res.status(200).json({
        success: true,
        data: instrument,
      });
      return;
    }

    // Cache miss
    metricsService.trackCacheMiss();

    // Get from database
    const instrument = await getInstrumentById(id);

    if (!instrument) {
      res.status(404).json({
        success: false,
        error: 'Instrument not found',
        code: 'INSTRUMENT_NOT_FOUND',
      });
      return;
    }

    // Cache the result
    await redisClient.setex(cacheKey, INSTRUMENTS_CACHE_TTL, JSON.stringify(instrument));

    res.status(200).json({
      success: true,
      data: instrument,
    });
  } catch (error) {
    logger.error('Get instrument by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

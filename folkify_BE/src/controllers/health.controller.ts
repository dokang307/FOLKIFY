import { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service';
import { metricsService } from '../services/metrics.service';
import logger from '../utils/logger';

/**
 * Health Check and Metrics Controller
 * Validates: Requirements 14.10, 14.11, 23.8, 23.10
 */

/**
 * GET /api/health
 * Public endpoint - Check system health
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  try {
    const healthStatus = await getHealthStatus();

    res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
      success: true,
      data: healthStatus,
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
    });
  }
}

/**
 * GET /api/metrics
 * Public endpoint - Get current metrics
 */
export function getMetrics(_req: Request, res: Response): void {
  try {
    const metrics = metricsService.getMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
    });
  }
}

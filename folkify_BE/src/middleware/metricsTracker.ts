import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service';

/**
 * Metrics Tracking Middleware
 * Tracks request count, error count, and response times
 * Validates: Requirements 23.1, 23.2, 23.3, 23.4
 */
export function metricsTracker(_req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Track response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    metricsService.trackRequest(responseTime, res.statusCode);
  });

  next();
}

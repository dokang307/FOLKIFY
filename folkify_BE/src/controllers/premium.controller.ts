import { Request, Response } from 'express';
import { getPremiumPlans, getPremiumStatus } from '../services/premium.service';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * GET /api/premium/plans
 * Get available premium plans (public)
 */
export async function getPlansController(_req: Request, res: Response): Promise<void> {
  try {
    const plans = getPremiumPlans();

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    logger.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/premium/status
 * Get current user's premium status (protected)
 */
export async function getStatusController(req: Request, res: Response): Promise<void> {
  try {
    // userId is attached by authenticate middleware
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const status = await getPremiumStatus(userId);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Get premium status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

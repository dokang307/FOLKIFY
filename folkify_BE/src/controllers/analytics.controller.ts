import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getUserStatistics,
  getRevenueStatistics,
  getAIGradingStatistics,
  getUsersExpiringSoon,
  getRevenueReport,
} from '../services/analytics.service';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

// Validation schemas
const getUsersExpiringQuerySchema = z.object({
  days: z.string().optional().default('7'),
});

const getRevenueReportQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});

/**
 * GET /api/admin/analytics/users
 * Get user statistics (admin only)
 */
export async function getUserStatisticsController(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await getUserStatistics();

    res.status(200).json({
      success: true,
      data: stats,
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

    logger.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/admin/analytics/revenue
 * Get revenue statistics (admin only)
 */
export async function getRevenueStatisticsController(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await getRevenueStatistics();

    res.status(200).json({
      success: true,
      data: stats,
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

    logger.error('Get revenue statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/admin/analytics/ai-grading
 * Get AI grading statistics (admin only)
 */
export async function getAIGradingStatisticsController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const stats = await getAIGradingStatistics();

    res.status(200).json({
      success: true,
      data: stats,
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

    logger.error('Get AI grading statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/admin/analytics/users-expiring
 * Get users expiring soon (admin only)
 */
export async function getUsersExpiringController(req: Request, res: Response): Promise<void> {
  try {
    // Validate query parameters
    const validatedQuery = getUsersExpiringQuerySchema.parse(req.query);
    const days = parseInt(validatedQuery.days);

    if (isNaN(days) || days < 1 || days > 365) {
      res.status(400).json({
        success: false,
        error: 'Days must be a number between 1 and 365',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const users = await getUsersExpiringSoon(days);

    res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length,
        days,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors[0].message,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Get users expiring error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/admin/analytics/revenue-report
 * Get revenue report (admin only)
 */
export async function getRevenueReportController(req: Request, res: Response): Promise<void> {
  try {
    // Validate query parameters
    const validatedQuery = getRevenueReportQuerySchema.parse(req.query);

    const startDate = new Date(validatedQuery.startDate);
    const endDate = new Date(validatedQuery.endDate);

    // Validate date range
    if (startDate > endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date must be before end date',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const report = await getRevenueReport(startDate, endDate);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors[0].message,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

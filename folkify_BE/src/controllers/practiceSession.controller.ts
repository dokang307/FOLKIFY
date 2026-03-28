import { Request, Response } from 'express';
import { z } from 'zod';
import {
  startPracticeSession,
  endPracticeSession,
  getPracticeHistory,
} from '../services/practiceSession.service';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

// Validation schemas
const startSessionSchema = z.object({
  lessonId: z.string().uuid().optional(),
  instrumentId: z.string().uuid().optional(),
});

const endSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

const historyQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * POST /api/practice/start
 * Start a new practice session (protected)
 */
export async function startPracticeController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Validate request body
    const validatedBody = startSessionSchema.parse(req.body);

    // Start practice session
    const result = await startPracticeSession(
      userId,
      validatedBody.lessonId,
      validatedBody.instrumentId
    );

    res.status(201).json({
      success: true,
      data: result,
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

    logger.error('Start practice session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * POST /api/practice/end
 * End a practice session (protected)
 */
export async function endPracticeController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Validate request body
    const validatedBody = endSessionSchema.parse(req.body);

    // End practice session
    const result = await endPracticeSession(validatedBody.sessionId, userId);

    res.status(200).json({
      success: true,
      data: result,
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

    logger.error('End practice session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/practice/history
 * Get practice session history (protected)
 */
export async function getPracticeHistoryController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Validate query parameters
    const validatedQuery = historyQuerySchema.parse(req.query);

    // Parse dates if provided
    const options: any = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    };

    if (validatedQuery.startDate) {
      options.startDate = new Date(validatedQuery.startDate);
    }

    if (validatedQuery.endDate) {
      options.endDate = new Date(validatedQuery.endDate);
    }

    // Get practice history
    const result = await getPracticeHistory(userId, options);

    res.status(200).json({
      success: true,
      data: result.sessions,
      pagination: result.pagination,
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

    logger.error('Get practice history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

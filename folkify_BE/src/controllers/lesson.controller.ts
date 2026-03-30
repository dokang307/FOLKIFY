import { Request, Response } from 'express';
import { z } from 'zod';
import { getLessonWithAccess, completeLesson, getRecentLessons } from '../services/lesson.service';
import { searchLessons } from '../repositories/lesson.repository';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

// Validation schemas
const searchLessonsSchema = z.object({
  q: z.string().optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  instrumentId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * GET /api/lessons/:id
 * Get lesson by ID with access control (protected)
 */
export async function getLessonController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Get lesson with access control
    const lesson = await getLessonWithAccess(id, userId);

    res.status(200).json({
      success: true,
      data: lesson,
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

    logger.error('Get lesson error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * POST /api/lessons/:id/complete
 * Complete a lesson (protected)
 */
export async function completeLessonController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Complete lesson
    const result = await completeLesson(id, userId);

    res.status(200).json({
      success: true,
      data: result,
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

    logger.error('Complete lesson error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/lessons/search
 * Search lessons with filters and pagination
 */
export async function searchLessonsController(req: Request, res: Response): Promise<void> {
  try {
    // Validate query parameters
    const validatedQuery = searchLessonsSchema.parse(req.query);

    // Search lessons
    const { lessons, total } = await searchLessons(validatedQuery);

    const totalPages = Math.ceil(total / validatedQuery.limit);

    res.status(200).json({
      success: true,
      data: lessons,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages,
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

    logger.error('Search lessons error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/lessons/recent
 * Get user's recent lessons (in progress) (protected)
 */
export async function getRecentLessonsController(req: Request, res: Response): Promise<void> {
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

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    // Get recent lessons
    const lessons = await getRecentLessons(userId, limit);

    res.status(200).json({
      success: true,
      data: lessons,
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

    logger.error('Get recent lessons error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

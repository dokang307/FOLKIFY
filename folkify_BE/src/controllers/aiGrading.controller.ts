import { Request, Response } from 'express';
import { z } from 'zod';
import {
  submitAIGrading,
  getAIGradingResult,
  getAIGradingHistory,
} from '../services/aiGrading.service';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

// Validation schemas
const submitSchema = z.object({
  lessonId: z.string().uuid().optional(),
});

const historySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * POST /api/ai-grading/submit
 * Submit AI grading job (protected, PRO only)
 * Requirements: 4.8
 */
export async function submitAIGradingController(req: Request, res: Response): Promise<void> {
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

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE',
      });
      return;
    }

    // Validate request body
    const validatedBody = submitSchema.parse(req.body);

    // Submit AI grading
    const result = await submitAIGrading(userId, validatedBody.lessonId, req.file.path);

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

    logger.error('Submit AI grading error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/ai-grading/:id
 * Get AI grading result by session ID (protected, ownership check)
 * Requirements: 4.8
 */
export async function getAIGradingResultController(req: Request, res: Response): Promise<void> {
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

    // Get AI grading result
    const session = await getAIGradingResult(id, userId);

    res.status(200).json({
      success: true,
      data: {
        id: session.id,
        status: session.status,
        ai_score: session.ai_score,
        criteria_scores: session.criteria_scores,
        ai_feedback: session.ai_feedback,
        improvement_suggestions: session.improvement_suggestions,
        error_message: session.error_message,
        submitted_at: session.submitted_at,
        completed_at: session.completed_at,
      },
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

    logger.error('Get AI grading result error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/ai-grading/history
 * Get AI grading history for current user (protected, with pagination)
 * Requirements: 4.8
 */
export async function getAIGradingHistoryController(req: Request, res: Response): Promise<void> {
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
    const validatedQuery = historySchema.parse(req.query);

    // Get AI grading history
    const result = await getAIGradingHistory(userId, validatedQuery.page, validatedQuery.limit);

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

    logger.error('Get AI grading history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

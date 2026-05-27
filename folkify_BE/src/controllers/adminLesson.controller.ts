/**
 * Admin Lesson Controller
 * Feature: lesson-management
 * Handles HTTP requests for admin lesson management operations
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.10, 2.11, 3.5, 4.5, 5.1, 5.2, 5.10, 5.11, 5.12,
 *               6.2, 6.6, 6.7, 7.2, 7.6, 7.7, 8.2, 8.5, 9.2, 9.6, 9.7, 9.8, 10.3, 10.5, 10.6, 11.2, 12.5
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createLesson,
  getAllLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
  reorderLessons,
  publishLesson,
  uploadVideo,
  uploadSheetMusic,
} from '../services/adminLesson.service';
import {
  createLessonSchema,
  updateLessonSchema,
  queryLessonsSchema,
  reorderLessonsSchema,
  publishLessonSchema,
  lessonIdParamSchema,
} from '../validators/adminLesson.validator';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * POST /api/admin/lessons
 * Create a new lesson
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.10, 2.11, 12.5
 */
export async function createLessonController(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    const validatedData = createLessonSchema.parse(req.body);

    const adminId = req.userId!; // Set by authenticate middleware

    // Create lesson
    const lesson = await createLesson(validatedData, adminId, req.ip, req.headers['user-agent']);

    // Transform to response format
    const response = {
      id: lesson.id,
      title: lesson.title,
      instrumentId: lesson.instrument_id,
      difficulty: lesson.level,
      duration: lesson.duration,
      description: lesson.description,
      videoUrl: lesson.youtube_embed_url,
      sheetMusicUrl: null,
      xp: lesson.xp,
      isPremium: lesson.is_premium,
      status: lesson.status,
      orderIndex: lesson.order_index,
      createdAt: lesson.created_at,
      updatedAt: lesson.updated_at,
      deletedAt: lesson.deleted_at,
    };

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    handleControllerError(error, res, 'Create lesson error');
  }
}

/**
 * GET /api/admin/lessons
 * Get all lessons with filters, pagination, and sorting
 * Requirements: 7.2, 7.6, 7.7, 11.2
 */
export async function getAllLessonsController(req: Request, res: Response): Promise<void> {
  try {
    // Validate query parameters
    const validatedQuery = queryLessonsSchema.parse(req.query);

    const filters = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      instrumentId: validatedQuery.instrumentId,
      status: validatedQuery.status,
      level: validatedQuery.level,
      sort: validatedQuery.sort,
      includeDeleted: true, // Admin can see deleted lessons
    };

    const result = await getAllLessons(filters);

    // Calculate pagination metadata
    const totalPages = Math.ceil(result.total / validatedQuery.limit);

    res.status(200).json({
      success: true,
      data: result.lessons,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: result.total,
        totalPages,
      },
    });
  } catch (error) {
    handleControllerError(error, res, 'Get all lessons error');
  }
}

/**
 * GET /api/admin/lessons/:id
 * Get single lesson by ID
 * Requirements: 8.2, 8.5, 11.2, 12.5
 */
export async function getLessonByIdController(req: Request, res: Response): Promise<void> {
  try {
    // Validate lesson ID parameter
    const validatedParams = lessonIdParamSchema.parse(req.params);

    const lesson = await getLessonById(validatedParams.id);

    res.status(200).json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    handleControllerError(error, res, 'Get lesson by ID error');
  }
}

/**
 * PUT /api/admin/lessons/:id
 * Update an existing lesson
 * Requirements: 5.1, 5.2, 5.10, 5.11, 5.12, 11.2, 12.5
 */
export async function updateLessonController(req: Request, res: Response): Promise<void> {
  try {
    // Validate lesson ID parameter
    const validatedParams = lessonIdParamSchema.parse(req.params);

    // Validate request body
    const validatedData = updateLessonSchema.parse(req.body);

    const adminId = req.userId!; // Set by authenticate middleware

    // Update lesson
    const lesson = await updateLesson(
      validatedParams.id,
      validatedData,
      adminId,
      req.ip,
      req.headers['user-agent']
    );

    // Transform to response format
    const response = {
      id: lesson.id,
      title: lesson.title,
      instrumentId: lesson.instrument_id,
      difficulty: lesson.level,
      duration: lesson.duration,
      description: lesson.description,
      videoUrl: lesson.youtube_embed_url,
      sheetMusicUrl: null,
      xp: lesson.xp,
      isPremium: lesson.is_premium,
      status: lesson.status,
      orderIndex: lesson.order_index,
      createdAt: lesson.created_at,
      updatedAt: lesson.updated_at,
      deletedAt: lesson.deleted_at,
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    handleControllerError(error, res, 'Update lesson error');
  }
}

/**
 * DELETE /api/admin/lessons/:id
 * Soft delete a lesson
 * Requirements: 6.2, 6.6, 6.7, 11.2, 12.5
 */
export async function deleteLessonController(req: Request, res: Response): Promise<void> {
  try {
    // Validate lesson ID parameter
    const validatedParams = lessonIdParamSchema.parse(req.params);

    const adminId = req.userId!; // Set by authenticate middleware

    // Delete lesson
    await deleteLesson(validatedParams.id, adminId, req.ip, req.headers['user-agent']);

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    handleControllerError(error, res, 'Delete lesson error');
  }
}

/**
 * POST /api/admin/lessons/:id/upload-video
 * Upload video file for a lesson
 * Requirements: 3.5, 11.2
 */
export async function uploadVideoController(req: Request, res: Response): Promise<void> {
  try {
    // Validate lesson ID parameter
    const validatedParams = lessonIdParamSchema.parse(req.params);

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No video file provided',
        code: 'NO_FILE_PROVIDED',
      });
      return;
    }

    const adminId = req.userId!; // Set by authenticate middleware

    // Upload video using service method
    const videoUrl = await uploadVideo(
      validatedParams.id,
      req.file,
      adminId,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      data: {
        videoUrl,
        message: 'Video uploaded successfully',
      },
    });
  } catch (error) {
    handleControllerError(error, res, 'Upload video error');
  }
}

/**
 * POST /api/admin/lessons/:id/upload-sheet
 * Upload sheet music file for a lesson
 * Requirements: 4.5, 11.2
 */
export async function uploadSheetMusicController(req: Request, res: Response): Promise<void> {
  try {
    // Validate lesson ID parameter
    const validatedParams = lessonIdParamSchema.parse(req.params);

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No sheet music file provided',
        code: 'NO_FILE_PROVIDED',
      });
      return;
    }

    const adminId = req.userId!; // Set by authenticate middleware

    // Upload sheet music using service method
    const sheetMusicUrl = await uploadSheetMusic(
      validatedParams.id,
      req.file,
      adminId,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      data: {
        sheetMusicUrl,
        message: 'Sheet music uploaded successfully',
      },
    });
  } catch (error) {
    handleControllerError(error, res, 'Upload sheet music error');
  }
}

/**
 * PUT /api/admin/lessons/reorder
 * Reorder lessons within an instrument
 * Requirements: 9.2, 9.6, 9.7, 9.8, 11.2
 */
export async function reorderLessonsController(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    const validatedData = reorderLessonsSchema.parse(req.body);

    const adminId = req.userId!; // Set by authenticate middleware

    // Reorder lessons
    const result = await reorderLessons(
      validatedData.lessonIds,
      adminId,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Lessons reordered successfully',
    });
  } catch (error) {
    handleControllerError(error, res, 'Reorder lessons error');
  }
}

/**
 * PUT /api/admin/lessons/:id/publish
 * Publish or unpublish a lesson
 * Requirements: 10.3, 10.5, 10.6, 11.2, 12.5
 */
export async function publishLessonController(req: Request, res: Response): Promise<void> {
  try {
    // Validate lesson ID parameter
    const validatedParams = lessonIdParamSchema.parse(req.params);

    // Validate request body
    const validatedData = publishLessonSchema.parse(req.body);

    const adminId = req.userId!; // Set by authenticate middleware

    // Publish/unpublish lesson
    const lesson = await publishLesson(
      validatedParams.id,
      validatedData.publish,
      adminId,
      req.ip,
      req.headers['user-agent']
    );

    // Transform to response format
    const response = {
      id: lesson.id,
      title: lesson.title,
      instrumentId: lesson.instrument_id,
      difficulty: lesson.level,
      duration: lesson.duration,
      description: lesson.description,
      videoUrl: lesson.youtube_embed_url,
      sheetMusicUrl: null,
      xp: lesson.xp,
      isPremium: lesson.is_premium,
      status: lesson.status,
      orderIndex: lesson.order_index,
      createdAt: lesson.created_at,
      updatedAt: lesson.updated_at,
      deletedAt: lesson.deleted_at,
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    handleControllerError(error, res, 'Publish lesson error');
  }
}

/**
 * Centralized error handler for consistent error response formatting
 * Requirements: 11.2
 */
function handleControllerError(error: unknown, res: Response, logMessage: string): void {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: error.errors[0].message,
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
    });
    return;
  }

  // Handle unexpected errors
  logger.error(logMessage, error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

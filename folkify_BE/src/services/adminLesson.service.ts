/**
 * Admin Lesson Service
 * Feature: lesson-management
 * Implements business logic for admin lesson management operations
 * Requirements: 2.1, 2.8, 2.9, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.8, 5.9, 6.1, 7.1, 7.2, 7.3, 7.4, 8.1, 8.4, 9.1, 9.3, 9.4, 9.5, 10.1, 10.2, 11.3, 11.5
 */

import * as adminLessonRepository from '../repositories/adminLesson.repository';
import { createActivityLog } from '../repositories/adminActivity.repository';
import { NotFoundError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';
import { Lesson, LessonStatus } from '@prisma/client';
import {
  CreateLessonRequest,
  UpdateLessonRequest,
  LessonFilters,
  LessonQueryResult,
  LessonResponse,
  LessonOrderInfo,
} from '../types/adminLesson.types';
import fs from 'fs/promises';

/**
 * Create a new lesson with automatic orderIndex calculation and activity logging
 * @param data - Lesson creation data
 * @param adminId - Admin user ID performing the action
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 * @returns Created lesson
 * Requirements: 2.1, 2.8, 2.9, 11.3
 */
export async function createLesson(
  data: CreateLessonRequest,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Lesson> {
  // Verify instrument exists
  const instrumentExists = await adminLessonRepository.instrumentExists(data.instrumentId);
  if (!instrumentExists) {
    throw new NotFoundError('Instrument not found', 'INSTRUMENT_NOT_FOUND');
  }

  // Calculate next orderIndex for the instrument
  const maxOrderIndex = await adminLessonRepository.getMaxOrderIndex(data.instrumentId);
  const orderIndex = maxOrderIndex + 1;

  // Set default values (Requirement 2.9)
  const lessonData = {
    title: data.title,
    instrument: {
      connect: { id: data.instrumentId },
    },
    level: data.difficulty,
    duration: data.duration,
    description: data.description,
    youtube_embed_url: data.videoUrl,
    xp: data.xp ?? 100,
    is_premium: data.isPremium ?? false,
    status: data.status ?? ('draft' as LessonStatus),
    order_index: orderIndex,
  };

  // Create lesson
  const lesson = await adminLessonRepository.create(lessonData);

  // Log admin activity
  await createActivityLog({
    admin_id: adminId,
    action: 'create_lesson',
    resource_type: 'lesson',
    resource_id: lesson.id,
    changes: {
      lesson: {
        title: lesson.title,
        instrumentId: data.instrumentId,
        difficulty: lesson.level,
        status: lesson.status,
        orderIndex: lesson.order_index,
      },
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info(`Admin ${adminId} created lesson ${lesson.id}: ${lesson.title}`);

  return lesson;
}

/**
 * Get all lessons with filtering, pagination, and sorting
 * @param filters - Query filters
 * @returns Lessons with total count
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export async function getAllLessons(filters: LessonFilters): Promise<LessonQueryResult> {
  const {
    page,
    limit,
    instrumentId,
    status,
    level,
    sort,
    includeDeleted = true, // Admin can see deleted lessons by default
  } = filters;

  // Build where clause
  const where: any = {};

  if (instrumentId) {
    where.instrument_id = instrumentId;
  }

  if (status) {
    where.status = status;
  }

  if (level) {
    where.level = level;
  }

  // Admin view includes deleted lessons unless explicitly excluded
  if (!includeDeleted) {
    where.deleted_at = null;
  }

  // Build orderBy clause
  const orderByMap: Record<string, any> = {
    orderIndex: { order_index: 'asc' },
    createdAt: { created_at: 'desc' },
    updatedAt: { updated_at: 'desc' },
  };

  const orderBy = orderByMap[sort] || { order_index: 'asc' };

  // Fetch lessons with instrument information
  const [lessons, total] = await Promise.all([
    adminLessonRepository.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        instrument: {
          select: {
            id: true,
            name: true,
            english_name: true,
            emoji: true,
            color: true,
          },
        },
      },
    }),
    adminLessonRepository.count(where),
  ]);

  // Transform to response format
  const lessonResponses: LessonResponse[] = lessons.map((lesson: any) => ({
    id: lesson.id,
    title: lesson.title,
    instrumentId: lesson.instrument_id,
    instrument: lesson.instrument
      ? {
          id: lesson.instrument.id,
          name: lesson.instrument.name,
          englishName: lesson.instrument.english_name,
          emoji: lesson.instrument.emoji,
          color: lesson.instrument.color,
        }
      : undefined,
    difficulty: lesson.level,
    duration: lesson.duration,
    description: lesson.description,
    videoUrl: lesson.youtube_embed_url,
    sheetMusicUrl: null, // Not in current schema
    xp: lesson.xp,
    isPremium: lesson.is_premium,
    status: lesson.status,
    orderIndex: lesson.order_index,
    steps: lesson.steps,
    tips: lesson.tips,
    createdAt: lesson.created_at,
    updatedAt: lesson.updated_at,
    deletedAt: lesson.deleted_at,
  }));

  return {
    lessons: lessonResponses,
    total,
  };
}

/**
 * Get single lesson by ID (includes deleted lessons for admin)
 * @param lessonId - Lesson ID
 * @returns Lesson details
 * Requirements: 8.1, 8.4
 */
export async function getLessonById(lessonId: string): Promise<LessonResponse> {
  const lesson = await adminLessonRepository.findById(lessonId, true); // Include deleted

  if (!lesson) {
    throw new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND');
  }

  // Fetch instrument details
  const lessonWithInstrument: any = await adminLessonRepository.findMany({
    where: { id: lessonId },
    include: {
      instrument: {
        select: {
          id: true,
          name: true,
          english_name: true,
          emoji: true,
          color: true,
        },
      },
    },
  });

  const lessonData = lessonWithInstrument[0];

  return {
    id: lessonData.id,
    title: lessonData.title,
    instrumentId: lessonData.instrument_id,
    instrument: lessonData.instrument
      ? {
          id: lessonData.instrument.id,
          name: lessonData.instrument.name,
          englishName: lessonData.instrument.english_name,
          emoji: lessonData.instrument.emoji,
          color: lessonData.instrument.color,
        }
      : undefined,
    difficulty: lessonData.level,
    duration: lessonData.duration,
    description: lessonData.description,
    videoUrl: lessonData.youtube_embed_url,
    sheetMusicUrl: null,
    xp: lessonData.xp,
    isPremium: lessonData.is_premium,
    status: lessonData.status,
    orderIndex: lessonData.order_index,
    steps: lessonData.steps,
    tips: lessonData.tips,
    createdAt: lessonData.created_at,
    updatedAt: lessonData.updated_at,
    deletedAt: lessonData.deleted_at,
  };
}

/**
 * Update lesson with partial updates and activity logging
 * @param lessonId - Lesson ID
 * @param data - Update data
 * @param adminId - Admin user ID
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 * @returns Updated lesson
 * Requirements: 5.1, 5.8, 5.9, 11.3
 */
export async function updateLesson(
  lessonId: string,
  data: UpdateLessonRequest,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Lesson> {
  // Verify lesson exists and is not deleted
  const existingLesson = await adminLessonRepository.findById(lessonId, false);
  if (!existingLesson) {
    throw new NotFoundError('Lesson not found or already deleted', 'LESSON_NOT_FOUND');
  }

  // If instrumentId is being changed, verify new instrument exists
  if (data.instrumentId && data.instrumentId !== existingLesson.instrument_id) {
    const instrumentExists = await adminLessonRepository.instrumentExists(data.instrumentId);
    if (!instrumentExists) {
      throw new NotFoundError('Instrument not found', 'INSTRUMENT_NOT_FOUND');
    }
  }

  // Build update data (partial update - Requirement 5.8)
  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.instrumentId !== undefined) {
    updateData.instrument = { connect: { id: data.instrumentId } };
  }
  if (data.difficulty !== undefined) updateData.level = data.difficulty;
  if (data.duration !== undefined) updateData.duration = data.duration;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.videoUrl !== undefined) updateData.youtube_embed_url = data.videoUrl;
  if (data.xp !== undefined) updateData.xp = data.xp;
  if (data.isPremium !== undefined) updateData.is_premium = data.isPremium;
  if (data.status !== undefined) updateData.status = data.status;

  // Update lesson (updated_at is automatically set by Prisma - Requirement 5.9)
  const updatedLesson = await adminLessonRepository.update(lessonId, updateData);

  // Log admin activity
  await createActivityLog({
    admin_id: adminId,
    action: 'update_lesson',
    resource_type: 'lesson',
    resource_id: lessonId,
    changes: {
      old: {
        title: existingLesson.title,
        level: existingLesson.level,
        status: existingLesson.status,
      },
      new: {
        title: data.title,
        difficulty: data.difficulty,
        duration: data.duration,
        status: data.status,
        isPremium: data.isPremium,
      },
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info(`Admin ${adminId} updated lesson ${lessonId}`);

  return updatedLesson;
}

/**
 * Soft delete lesson and log activity
 * @param lessonId - Lesson ID
 * @param adminId - Admin user ID
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 * Requirements: 6.1, 11.3
 */
export async function deleteLesson(
  lessonId: string,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  // Verify lesson exists and is not already deleted
  const existingLesson = await adminLessonRepository.findById(lessonId, false);
  if (!existingLesson) {
    throw new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND');
  }

  // Check if already deleted
  if (existingLesson.deleted_at) {
    throw new BadRequestError('Lesson is already deleted', 'LESSON_ALREADY_DELETED');
  }

  // Soft delete
  await adminLessonRepository.softDelete(lessonId);

  // Log admin activity
  await createActivityLog({
    admin_id: adminId,
    action: 'delete_lesson',
    resource_type: 'lesson',
    resource_id: lessonId,
    changes: {
      lesson: {
        title: existingLesson.title,
        instrumentId: existingLesson.instrument_id,
      },
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info(`Admin ${adminId} deleted lesson ${lessonId}`);
}

/**
 * Reorder lessons within an instrument with transaction and validation
 * @param lessonIds - Array of lesson IDs in desired order
 * @param adminId - Admin user ID
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 * @returns Updated lesson order information
 * Requirements: 9.1, 9.3, 9.4, 9.5, 11.3
 */
export async function reorderLessons(
  lessonIds: string[],
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LessonOrderInfo[]> {
  if (lessonIds.length === 0) {
    throw new BadRequestError('Lesson IDs array cannot be empty', 'EMPTY_LESSON_IDS');
  }

  // Fetch all lessons to verify they exist
  const lessons = await Promise.all(
    lessonIds.map((id) => adminLessonRepository.findById(id, false))
  );

  // Check if any lesson doesn't exist
  const missingIndex = lessons.findIndex((lesson) => !lesson);
  if (missingIndex !== -1) {
    throw new NotFoundError(
      `Lesson with ID ${lessonIds[missingIndex]} not found`,
      'LESSON_NOT_FOUND'
    );
  }

  // Verify all lessons belong to the same instrument (Requirement 9.3)
  const instrumentIds = new Set(lessons.map((lesson) => lesson!.instrument_id));
  if (instrumentIds.size > 1) {
    throw new BadRequestError(
      'All lessons must belong to the same instrument',
      'LESSONS_DIFFERENT_INSTRUMENTS'
    );
  }

  // Build updates array with new orderIndex values (Requirement 9.4)
  const updates = lessonIds.map((id, index) => ({
    id,
    orderIndex: index,
  }));

  // Perform batch update in transaction (Requirement 9.5)
  await adminLessonRepository.batchUpdateOrderIndex(updates);

  // Log admin activity
  await createActivityLog({
    admin_id: adminId,
    action: 'reorder_lessons',
    resource_type: 'lesson',
    resource_id: instrumentIds.values().next().value || lessonIds[0],
    changes: {
      lessonIds,
      newOrder: updates,
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info(`Admin ${adminId} reordered ${lessonIds.length} lessons`);

  return updates;
}

/**
 * Publish or unpublish a lesson
 * @param lessonId - Lesson ID
 * @param publish - True to publish, false to unpublish
 * @param adminId - Admin user ID
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 * @returns Updated lesson
 * Requirements: 10.1, 10.2, 11.3
 */
export async function publishLesson(
  lessonId: string,
  publish: boolean,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Lesson> {
  // Verify lesson exists and is not deleted
  const existingLesson = await adminLessonRepository.findById(lessonId, false);
  if (!existingLesson) {
    throw new NotFoundError('Lesson not found or already deleted', 'LESSON_NOT_FOUND');
  }

  // Determine new status
  const newStatus: LessonStatus = publish ? 'published' : 'draft';

  // Update lesson status
  const updatedLesson = await adminLessonRepository.update(lessonId, {
    status: newStatus,
  });

  // Log admin activity
  await createActivityLog({
    admin_id: adminId,
    action: publish ? 'publish_lesson' : 'unpublish_lesson',
    resource_type: 'lesson',
    resource_id: lessonId,
    changes: {
      old_status: existingLesson.status,
      new_status: newStatus,
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info(`Admin ${adminId} ${publish ? 'published' : 'unpublished'} lesson ${lessonId}`);

  return updatedLesson;
}

/**
 * Upload video file for a lesson
 * @param lessonId - Lesson ID
 * @param file - Uploaded video file
 * @param adminId - Admin user ID
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 * @returns Video URL path
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 11.3, 11.5
 */
export async function uploadVideo(
  lessonId: string,
  file: Express.Multer.File,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  try {
    // Verify lesson exists and is not deleted
    const existingLesson = await adminLessonRepository.findById(lessonId, false);
    if (!existingLesson) {
      // Clean up uploaded file
      await fs.unlink(file.path).catch(() => {});
      throw new NotFoundError('Lesson not found or already deleted', 'LESSON_NOT_FOUND');
    }

    // File is already stored by multer middleware in uploads/lessons/{lessonId}/videos/
    // Generate the URL path for the video
    const videoUrl = `/uploads/lessons/${lessonId}/videos/${file.filename}`;

    // Update lesson with video URL
    await adminLessonRepository.update(lessonId, {
      youtube_embed_url: videoUrl,
    });

    // Log admin activity
    await createActivityLog({
      admin_id: adminId,
      action: 'upload_lesson_video',
      resource_type: 'lesson',
      resource_id: lessonId,
      changes: {
        videoUrl,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    logger.info(`Admin ${adminId} uploaded video for lesson ${lessonId}: ${file.filename}`);

    return videoUrl;
  } catch (error) {
    // Clean up uploaded file on error
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      logger.error(`Failed to clean up uploaded file: ${file.path}`, unlinkError);
    }
    throw error;
  }
}

/**
 * Upload sheet music file for a lesson
 * @param lessonId - Lesson ID
 * @param file - Uploaded sheet music file
 * @param adminId - Admin user ID
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 * @returns Sheet music URL path
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 11.3, 11.5
 */
export async function uploadSheetMusic(
  lessonId: string,
  file: Express.Multer.File,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  try {
    // Verify lesson exists and is not deleted
    const existingLesson = await adminLessonRepository.findById(lessonId, false);
    if (!existingLesson) {
      // Clean up uploaded file
      await fs.unlink(file.path).catch(() => {});
      throw new NotFoundError('Lesson not found or already deleted', 'LESSON_NOT_FOUND');
    }

    // File is already stored by multer middleware in uploads/lessons/{lessonId}/sheets/
    // Generate the URL path for the sheet music
    const sheetMusicUrl = `/uploads/lessons/${lessonId}/sheets/${file.filename}`;

    // Note: Current Prisma schema doesn't have a sheet_music_url field
    // This would need to be added to the schema or stored in a JSON field
    // For now, we'll log the activity but not update the lesson record
    // TODO: Add sheet_music_url field to Lesson model or use JSON field

    // Log admin activity
    await createActivityLog({
      admin_id: adminId,
      action: 'upload_lesson_sheet_music',
      resource_type: 'lesson',
      resource_id: lessonId,
      changes: {
        sheetMusicUrl,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    logger.info(`Admin ${adminId} uploaded sheet music for lesson ${lessonId}: ${file.filename}`);

    return sheetMusicUrl;
  } catch (error) {
    // Clean up uploaded file on error
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      logger.error(`Failed to clean up uploaded file: ${file.path}`, unlinkError);
    }
    throw error;
  }
}

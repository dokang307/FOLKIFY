import { z } from 'zod';

/**
 * Validation schemas for admin lesson management operations
 * Feature: lesson-management
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.2, 5.4, 5.5, 5.6, 9.2, 10.3, 12.3, 12.4
 */

// ============= CREATE LESSON SCHEMA =============

/**
 * Schema for creating a new lesson
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */
export const createLessonSchema = z.object({
  title: z
    .string({
      required_error: 'Title is required',
      invalid_type_error: 'Title must be a string',
    })
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),

  instrumentId: z
    .string({
      required_error: 'Instrument ID is required',
      invalid_type_error: 'Instrument ID must be a string',
    })
    .uuid('Instrument ID must be a valid UUID'),

  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced'], {
    required_error: 'Difficulty level is required',
    invalid_type_error: 'Difficulty must be one of: Beginner, Intermediate, Advanced',
  }),

  duration: z
    .number({
      required_error: 'Duration is required',
      invalid_type_error: 'Duration must be a number',
    })
    .int('Duration must be an integer')
    .positive('Duration must be a positive number'),

  description: z
    .string({
      invalid_type_error: 'Description must be a string',
    })
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),

  videoUrl: z
    .string({
      invalid_type_error: 'Video URL must be a string',
    })
    .url('Video URL must be a valid URL')
    .optional(),

  sheetMusicUrl: z
    .string({
      invalid_type_error: 'Sheet music URL must be a string',
    })
    .url('Sheet music URL must be a valid URL')
    .optional(),

  xp: z
    .number({
      invalid_type_error: 'XP must be a number',
    })
    .int('XP must be an integer')
    .positive('XP must be a positive number')
    .optional()
    .default(100),

  isPremium: z
    .boolean({
      invalid_type_error: 'isPremium must be a boolean',
    })
    .optional()
    .default(false),

  status: z
    .enum(['draft', 'published'], {
      invalid_type_error: 'Status must be either draft or published',
    })
    .optional()
    .default('draft'),
});

// ============= UPDATE LESSON SCHEMA =============

/**
 * Schema for updating an existing lesson
 * All fields are optional for partial updates
 * Validates: Requirements 5.4, 5.5, 5.6
 */
export const updateLessonSchema = z.object({
  title: z
    .string({
      invalid_type_error: 'Title must be a string',
    })
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters')
    .trim()
    .optional(),

  instrumentId: z
    .string({
      invalid_type_error: 'Instrument ID must be a string',
    })
    .uuid('Instrument ID must be a valid UUID')
    .optional(),

  difficulty: z
    .enum(['Beginner', 'Intermediate', 'Advanced'], {
      invalid_type_error: 'Difficulty must be one of: Beginner, Intermediate, Advanced',
    })
    .optional(),

  duration: z
    .number({
      invalid_type_error: 'Duration must be a number',
    })
    .int('Duration must be an integer')
    .positive('Duration must be a positive number')
    .optional(),

  description: z
    .string({
      invalid_type_error: 'Description must be a string',
    })
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),

  videoUrl: z
    .string({
      invalid_type_error: 'Video URL must be a string',
    })
    .url('Video URL must be a valid URL')
    .optional(),

  sheetMusicUrl: z
    .string({
      invalid_type_error: 'Sheet music URL must be a string',
    })
    .url('Sheet music URL must be a valid URL')
    .optional(),

  xp: z
    .number({
      invalid_type_error: 'XP must be a number',
    })
    .int('XP must be an integer')
    .positive('XP must be a positive number')
    .optional(),

  isPremium: z
    .boolean({
      invalid_type_error: 'isPremium must be a boolean',
    })
    .optional(),

  status: z
    .enum(['draft', 'published'], {
      invalid_type_error: 'Status must be either draft or published',
    })
    .optional(),
});

// ============= QUERY LESSONS SCHEMA =============

/**
 * Schema for querying lessons with filters, pagination, and sorting
 * Validates: Requirements 7.2, 7.3, 7.4
 */
export const queryLessonsSchema = z.object({
  page: z.coerce
    .number({
      invalid_type_error: 'Page must be a number',
    })
    .int('Page must be an integer')
    .positive('Page must be a positive number')
    .optional()
    .default(1),

  limit: z.coerce
    .number({
      invalid_type_error: 'Limit must be a number',
    })
    .int('Limit must be an integer')
    .positive('Limit must be a positive number')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),

  instrumentId: z
    .string({
      invalid_type_error: 'Instrument ID must be a string',
    })
    .uuid('Instrument ID must be a valid UUID')
    .optional(),

  status: z
    .enum(['draft', 'published'], {
      invalid_type_error: 'Status must be either draft or published',
    })
    .optional(),

  level: z
    .enum(['Beginner', 'Intermediate', 'Advanced'], {
      invalid_type_error: 'Level must be one of: Beginner, Intermediate, Advanced',
    })
    .optional(),

  sort: z
    .enum(['orderIndex', 'createdAt', 'updatedAt'], {
      invalid_type_error: 'Sort must be one of: orderIndex, createdAt, updatedAt',
    })
    .optional()
    .default('orderIndex'),
});

// ============= REORDER LESSONS SCHEMA =============

/**
 * Schema for reordering lessons
 * Validates: Requirements 9.2
 */
export const reorderLessonsSchema = z.object({
  lessonIds: z
    .array(
      z
        .string({
          invalid_type_error: 'Each lesson ID must be a string',
        })
        .uuid('Each lesson ID must be a valid UUID'),
      {
        required_error: 'Lesson IDs array is required',
        invalid_type_error: 'Lesson IDs must be an array',
      }
    )
    .min(1, 'At least one lesson ID is required'),
});

// ============= PUBLISH LESSON SCHEMA =============

/**
 * Schema for publishing/unpublishing a lesson
 * Validates: Requirements 10.1, 10.2
 */
export const publishLessonSchema = z.object({
  publish: z.boolean({
    required_error: 'Publish flag is required',
    invalid_type_error: 'Publish must be a boolean',
  }),
});

// ============= LESSON ID PARAM SCHEMA =============

/**
 * Schema for validating lesson ID in URL parameters
 * Validates: Requirements 5.2, 10.3, 12.3
 */
export const lessonIdParamSchema = z.object({
  id: z
    .string({
      required_error: 'Lesson ID is required',
      invalid_type_error: 'Lesson ID must be a string',
    })
    .uuid('Lesson ID must be a valid UUID'),
});

// ============= TYPE EXPORTS =============

/**
 * TypeScript types inferred from Zod schemas
 * These types can be used throughout the application for type safety
 */

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type QueryLessonsInput = z.infer<typeof queryLessonsSchema>;
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;
export type PublishLessonInput = z.infer<typeof publishLessonSchema>;
export type LessonIdParam = z.infer<typeof lessonIdParamSchema>;

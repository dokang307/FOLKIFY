/**
 * TypeScript interfaces for admin lesson management
 * Feature: lesson-management
 * Requirements: 2.1, 5.1, 7.1, 8.1, 9.1, 10.1
 */

import { LessonLevel, LessonStatus } from '@prisma/client';

// ============= REQUEST TYPES =============

/**
 * Request body for creating a new lesson
 */
export interface CreateLessonRequest {
  title: string;
  instrumentId: string;
  difficulty: LessonLevel;
  duration: number;
  description?: string;
  videoUrl?: string;
  sheetMusicUrl?: string;
  xp?: number;
  isPremium?: boolean;
  status?: LessonStatus;
}

/**
 * Request body for updating an existing lesson
 * All fields are optional for partial updates
 */
export interface UpdateLessonRequest {
  title?: string;
  instrumentId?: string;
  difficulty?: LessonLevel;
  duration?: number;
  description?: string;
  videoUrl?: string;
  sheetMusicUrl?: string;
  xp?: number;
  isPremium?: boolean;
  status?: LessonStatus;
}

/**
 * Query parameters for listing lessons
 */
export interface QueryLessonsRequest {
  page?: number;
  limit?: number;
  instrumentId?: string;
  status?: LessonStatus;
  level?: LessonLevel;
  sort?: 'orderIndex' | 'createdAt' | 'updatedAt';
}

/**
 * Request body for reordering lessons
 */
export interface ReorderLessonsRequest {
  lessonIds: string[];
}

/**
 * Request body for publishing/unpublishing a lesson
 */
export interface PublishLessonRequest {
  publish: boolean;
}

// ============= RESPONSE TYPES =============

/**
 * Lesson response with instrument details
 * Used for single lesson retrieval and list items
 */
export interface LessonResponse {
  id: string;
  title: string;
  instrumentId: string;
  instrument?: InstrumentSummary;
  difficulty: LessonLevel;
  duration: number;
  description: string | null;
  videoUrl: string | null;
  sheetMusicUrl: string | null;
  xp: number;
  isPremium: boolean;
  status: LessonStatus;
  orderIndex: number;
  steps: any | null;
  tips: any | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

/**
 * Simplified instrument information included in lesson responses
 */
export interface InstrumentSummary {
  id: string;
  name: string;
  englishName: string;
  emoji?: string | null;
  color?: string | null;
}

/**
 * Pagination metadata for lesson lists
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Response for lesson list endpoint
 */
export interface LessonListResponse {
  success: true;
  data: LessonResponse[];
  pagination: PaginationMetadata;
}

/**
 * Response for single lesson endpoint
 */
export interface SingleLessonResponse {
  success: true;
  data: LessonResponse;
}

/**
 * Response for lesson creation
 */
export interface CreateLessonResponse {
  success: true;
  data: LessonResponse;
}

/**
 * Response for lesson update
 */
export interface UpdateLessonResponse {
  success: true;
  data: LessonResponse;
}

/**
 * Response for lesson deletion
 */
export interface DeleteLessonResponse {
  success: true;
  message: string;
}

/**
 * Response for file upload (video or sheet music)
 */
export interface FileUploadResponse {
  success: true;
  data: {
    videoUrl?: string;
    sheetMusicUrl?: string;
    message: string;
  };
}

/**
 * Lesson order information after reordering
 */
export interface LessonOrderInfo {
  id: string;
  orderIndex: number;
}

/**
 * Response for lesson reordering
 */
export interface ReorderLessonsResponse {
  success: true;
  data: LessonOrderInfo[];
  message: string;
}

/**
 * Response for publish/unpublish operation
 */
export interface PublishLessonResponse {
  success: true;
  data: LessonResponse;
}

// ============= ERROR RESPONSE TYPES =============

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation error response with field-specific errors
 */
export interface ValidationErrorResponse {
  success: false;
  error: string;
  code: 'VALIDATION_ERROR';
  details?: ValidationError[];
}

// ============= SERVICE LAYER TYPES =============

/**
 * Filters for querying lessons in the service/repository layer
 */
export interface LessonFilters {
  page: number;
  limit: number;
  instrumentId?: string;
  status?: LessonStatus;
  level?: LessonLevel;
  sort: 'orderIndex' | 'createdAt' | 'updatedAt';
  includeDeleted?: boolean;
}

/**
 * Result from service layer when fetching lessons
 */
export interface LessonQueryResult {
  lessons: LessonResponse[];
  total: number;
}

/**
 * Data for creating a lesson in the service layer
 */
export interface CreateLessonData {
  title: string;
  instrumentId: string;
  difficulty: LessonLevel;
  duration: number;
  description?: string;
  videoUrl?: string;
  sheetMusicUrl?: string;
  xp: number;
  isPremium: boolean;
  status: LessonStatus;
  orderIndex: number;
}

/**
 * Data for updating a lesson in the service layer
 */
export interface UpdateLessonData {
  title?: string;
  instrumentId?: string;
  difficulty?: LessonLevel;
  duration?: number;
  description?: string;
  videoUrl?: string;
  sheetMusicUrl?: string;
  xp?: number;
  isPremium?: boolean;
  status?: LessonStatus;
}

/**
 * Admin activity log entry data
 */
export interface AdminActivityData {
  adminId: string;
  action: string;
  resourceType: 'lesson';
  resourceId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

// ============= FILE UPLOAD TYPES =============

/**
 * Allowed video file mimetypes
 */
export const ALLOWED_VIDEO_MIMETYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'] as const;

/**
 * Allowed sheet music file mimetypes
 */
export const ALLOWED_SHEET_MIMETYPES = [
  'application/pdf',
  'application/vnd.recordare.musicxml+xml',
] as const;

/**
 * File upload configuration
 */
export interface FileUploadConfig {
  maxVideoSize: number; // 500MB in bytes
  maxSheetSize: number; // 20MB in bytes
  videoMimetypes: readonly string[];
  sheetMimetypes: readonly string[];
  uploadBasePath: string;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

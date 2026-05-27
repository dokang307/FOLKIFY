import { Router } from 'express';
import {
  createLessonController,
  getAllLessonsController,
  getLessonByIdController,
  updateLessonController,
  deleteLessonController,
  uploadVideoController,
  uploadSheetMusicController,
  reorderLessonsController,
  publishLessonController,
} from '../controllers/adminLesson.controller';
import { authenticate, requireAdmin, adminLimiter } from '../middleware';
import { uploadLessonVideo, uploadSheetMusic } from '../middleware/upload';

const router = Router();

// All admin lesson routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// POST /api/admin/lessons - Create new lesson
router.post('/', adminLimiter, createLessonController);

// GET /api/admin/lessons - Get all lessons (with filters, pagination)
router.get('/', getAllLessonsController);

// PUT /api/admin/lessons/reorder - Reorder lessons (must be before /:id routes)
router.put('/reorder', adminLimiter, reorderLessonsController);

// GET /api/admin/lessons/:id - Get single lesson by ID
router.get('/:id', getLessonByIdController);

// PUT /api/admin/lessons/:id - Update lesson
router.put('/:id', adminLimiter, updateLessonController);

// DELETE /api/admin/lessons/:id - Soft delete lesson
router.delete('/:id', adminLimiter, deleteLessonController);

// POST /api/admin/lessons/:id/upload-video - Upload video file
router.post('/:id/upload-video', adminLimiter, uploadLessonVideo, uploadVideoController);

// POST /api/admin/lessons/:id/upload-sheet - Upload sheet music file
router.post('/:id/upload-sheet', adminLimiter, uploadSheetMusic, uploadSheetMusicController);

// PUT /api/admin/lessons/:id/publish - Publish/unpublish lesson
router.put('/:id/publish', adminLimiter, publishLessonController);

export default router;

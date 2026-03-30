import { Router } from 'express';
import {
  getLessonController,
  completeLessonController,
  searchLessonsController,
  getRecentLessonsController,
} from '../controllers/lesson.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /api/lessons/search:
 *   get:
 *     summary: Search lessons
 *     tags: [Lessons]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced]
 *       - in: query
 *         name: instrument_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lesson'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/search', searchLessonsController);

/**
 * @swagger
 * /api/lessons/recent:
 *   get:
 *     summary: Get user's recent lessons (in progress)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Recent lessons with progress
 *       401:
 *         description: Unauthorized
 */
router.get('/recent', authenticate, getRecentLessonsController);

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Get lesson by ID with access control
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lesson details with access information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Lesson'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Premium required
 *       404:
 *         description: Lesson not found
 */
router.get('/:id', authenticate, getLessonController);

/**
 * @swagger
 * /api/lessons/{id}/complete:
 *   post:
 *     summary: Mark lesson as completed
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lesson completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     xp_earned:
 *                       type: integer
 *                     new_total_xp:
 *                       type: integer
 *                     new_level:
 *                       type: integer
 *                     level_up:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Lesson not found
 */
router.post('/:id/complete', authenticate, completeLessonController);

export default router;

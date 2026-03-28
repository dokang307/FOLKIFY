import { Router } from 'express';
import {
  submitAIGradingController,
  getAIGradingResultController,
  getAIGradingHistoryController,
} from '../controllers/aiGrading.controller';
import { authenticate } from '../middleware/authenticate';
import { uploadAIGrading, validateFileSize } from '../middleware/upload';

const router = Router();

/**
 * AI Grading Routes
 * All routes require authentication
 * Requirements: 4.8
 */

// POST /api/ai-grading/submit - Submit AI grading (PRO only, multipart/form-data)
router.post('/submit', authenticate, uploadAIGrading, validateFileSize, submitAIGradingController);

// GET /api/ai-grading/history - Get AI grading history (with pagination)
router.get('/history', authenticate, getAIGradingHistoryController);

// GET /api/ai-grading/:id - Get AI grading result by ID (ownership check)
router.get('/:id', authenticate, getAIGradingResultController);

export default router;

import { Router } from 'express';
import {
  startPracticeController,
  endPracticeController,
  getPracticeHistoryController,
} from '../controllers/practiceSession.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All practice session routes are protected
router.post('/start', authenticate, startPracticeController);
router.post('/end', authenticate, endPracticeController);
router.get('/history', authenticate, getPracticeHistoryController);

export default router;

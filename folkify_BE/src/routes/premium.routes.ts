import { Router } from 'express';
import { getPlansController, getStatusController } from '../controllers/premium.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Public routes
router.get('/plans', getPlansController);

// Protected routes
router.get('/status', authenticate, getStatusController);

export default router;

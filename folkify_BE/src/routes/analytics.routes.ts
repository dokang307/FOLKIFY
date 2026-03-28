import { Router } from 'express';
import {
  getUserStatisticsController,
  getRevenueStatisticsController,
  getAIGradingStatisticsController,
  getUsersExpiringController,
  getRevenueReportController,
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// All analytics routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Analytics routes
router.get('/users', getUserStatisticsController);
router.get('/revenue', getRevenueStatisticsController);
router.get('/ai-grading', getAIGradingStatisticsController);
router.get('/users-expiring', getUsersExpiringController);
router.get('/revenue-report', getRevenueReportController);

export default router;

import { Router } from 'express';
import {
  getUsersController,
  getUserDetailsController,
  upgradeUserController,
  banUserController,
  unbanUserController,
  setLessonPremiumController,
  publishLessonController,
  unpublishLessonController,
  getActivityLogsController,
  triggerCronjobController,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin, adminLimiter } from '../middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);
router.use(adminLimiter);

// Admin user management routes
router.get('/users', getUsersController);
router.get('/users/:id', getUserDetailsController);
router.post('/users/:id/upgrade', upgradeUserController);
router.post('/users/:id/ban', banUserController);
router.post('/users/:id/unban', unbanUserController);

// Admin content management routes
router.post('/lessons/:id/set-premium', setLessonPremiumController);
router.post('/lessons/:id/publish', publishLessonController);
router.post('/lessons/:id/unpublish', unpublishLessonController);

// Admin activity logs routes
router.get('/activity-logs', getActivityLogsController);

// Admin cronjob routes
router.post('/cronjobs/trigger', triggerCronjobController);

export default router;

import { Router } from 'express';
import {
  getSheetsController,
  getSheetController,
  downloadSheetController,
  searchSheetsController,
} from '../controllers/sheet.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Public routes
router.get('/', getSheetsController);
router.get('/search', searchSheetsController);

// Protected routes
router.get('/:id', authenticate, getSheetController);
router.get('/:id/download', authenticate, downloadSheetController);

export default router;

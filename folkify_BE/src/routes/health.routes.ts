import { Router } from 'express';
import { healthCheck, getMetrics } from '../controllers/health.controller';

const router = Router();

/**
 * Health Check and Metrics Routes
 * All routes are public (no authentication required)
 */

// GET /api/health - Check system health
router.get('/health', healthCheck);

// GET /api/metrics - Get current metrics
router.get('/metrics', getMetrics);

export default router;

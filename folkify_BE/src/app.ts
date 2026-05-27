import express, { Application } from 'express';
import {
  corsMiddleware,
  apiLimiter,
  requestLogger,
  errorLogger,
  errorHandler,
  notFoundHandler,
} from './middleware';
import { metricsTracker } from './middleware/metricsTracker';
import authRoutes from './routes/auth.routes';
import instrumentRoutes from './routes/instrument.routes';
import lessonRoutes from './routes/lesson.routes';
import sheetRoutes from './routes/sheet.routes';
import premiumRoutes from './routes/premium.routes';
import aiGradingRoutes from './routes/aiGrading.routes';
import practiceSessionRoutes from './routes/practiceSession.routes';
import adminRoutes from './routes/admin.routes';
import adminLessonRoutes from './routes/adminLesson.routes';
import analyticsRoutes from './routes/analytics.routes';
import healthRoutes from './routes/health.routes';
import swaggerRoutes from './routes/swagger.routes';

/**
 * Create and configure Express application
 * Requirements: 30.3
 */
export function createApp(): Application {
  const app: Application = express();

  // ============= MIDDLEWARE (Applied in correct order) =============

  // 1. CORS - must be first to handle preflight requests
  app.use(corsMiddleware);

  // 2. Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. Metrics tracking
  app.use(metricsTracker);

  // 4. Request logging
  app.use(requestLogger);
  app.use(errorLogger);

  // 5. Rate limiting (general API limiter)
  app.use('/api', apiLimiter);

  // 6. Serve static files from uploads directory with cache headers
  app.use(
    '/uploads',
    express.static('uploads', {
      maxAge: '1d', // Cache for 1 day
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        // Set cache control headers based on file type
        if (path.endsWith('.pdf')) {
          res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for PDFs
        } else if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days for images
        } else if (path.match(/\.(mp3|wav|m4a|mp4|mov|avi)$/i)) {
          res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for audio/video
        }
      },
    })
  );

  // ============= ROUTES =============

  // Health and metrics routes (public, no auth required)
  app.use('/api', healthRoutes);

  // API Documentation (public)
  app.use('/api/docs', swaggerRoutes);

  // Authentication routes
  app.use('/api/auth', authRoutes);

  // Public content routes
  app.use('/api/instruments', instrumentRoutes);
  app.use('/api/lessons', lessonRoutes);
  app.use('/api/sheets', sheetRoutes);

  // Premium routes
  app.use('/api/premium', premiumRoutes);

  // AI Grading routes (PRO users only)
  app.use('/api/ai-grading', aiGradingRoutes);

  // Practice session routes
  app.use('/api/practice', practiceSessionRoutes);

  // Admin routes (admin only)
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/lessons', adminLessonRoutes);
  app.use('/api/admin/analytics', analyticsRoutes);

  // ============= ERROR HANDLING =============

  // 404 handler - must be after all routes
  app.use(notFoundHandler);

  // Global error handler - must be last
  app.use(errorHandler);

  return app;
}

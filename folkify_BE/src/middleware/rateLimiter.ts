import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Skip rate limiting in test environment
const skipRateLimiting = process.env.NODE_ENV === 'test';

// No-op middleware for test environment
const noopMiddleware = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * General API rate limiter: 100 requests per 15 minutes
 * Applied to all API endpoints
 */
export const apiLimiter = skipRateLimiting
  ? noopMiddleware
  : rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      message: {
        success: false,
        error: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
    });

/**
 * Auth rate limiter: 5 login attempts per 15 minutes
 * Applied to authentication endpoints (login, register)
 */
export const authLimiter = skipRateLimiting
  ? noopMiddleware
  : rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10),
      message: {
        success: false,
        error: 'Too many authentication attempts, please try again later',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
    });

/**
 * Admin rate limiter: 100 requests per 15 minutes
 * Applied to admin endpoints
 */
export const adminLimiter = skipRateLimiting
  ? noopMiddleware
  : rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      message: {
        success: false,
        error: 'Too many admin requests, please try again later',
        code: 'ADMIN_RATE_LIMIT_EXCEEDED',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
    });

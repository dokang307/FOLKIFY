import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Global error handling middleware
 * Catches all errors thrown in the application and returns consistent error responses
 * Logs errors with Winston including error message, stack trace, and request details
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  // Check if it's an operational error (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'APP_ERROR';

    // Log operational errors at appropriate level
    if (statusCode >= 500) {
      logger.error('Operational error:', {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        stack: err.stack,
        method: req.method,
        url: req.url,
        userId: (req as any).userId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    } else {
      logger.warn('Client error:', {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        method: req.method,
        url: req.url,
        userId: (req as any).userId,
        ip: req.ip,
      });
    }
  } else {
    // Log unexpected errors with full details
    logger.error('Unexpected error:', {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
      body: sanitizeBody(req.body),
      query: req.query,
      params: req.params,
      userId: (req as any).userId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  // Never expose sensitive data in error responses
  // In production, don't expose stack traces or internal details
  const response: any = {
    success: false,
    error: message,
    code: code,
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development' && !(err instanceof AppError)) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Sanitize request body to remove sensitive data before logging
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = [
    'password',
    'passwordHash',
    'password_hash',
    'token',
    'accessToken',
    'refreshToken',
    'access_token',
    'refresh_token',
    'creditCard',
    'credit_card',
    'cvv',
    'ssn',
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * 404 Not Found handler
 * Should be placed after all route handlers
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
}

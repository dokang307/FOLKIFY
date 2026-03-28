import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

/**
 * Authorization middleware to check if user has admin role
 * Must be used after authenticate middleware
 * Returns 403 if user is not an admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  try {
    // Check if userRole is attached (should be set by authenticate middleware)
    if (!req.userRole) {
      throw new ForbiddenError('User role not found', 'NO_USER_ROLE');
    }

    // Check if user is admin
    if (req.userRole !== 'admin') {
      throw new ForbiddenError('Admin access required', 'ADMIN_REQUIRED');
    }

    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    } else {
      res.status(403).json({
        success: false,
        error: 'Authorization failed',
        code: 'AUTH_FAILED',
      });
    }
  }
}

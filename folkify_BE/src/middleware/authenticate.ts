import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

// Extend Express Request type to include userId and userRole
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

/**
 * Authentication middleware to verify JWT from Authorization header
 * Extracts userId and role from token payload and attaches to req
 * Returns 401 if token is missing or invalid
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Authorization header missing', 'NO_AUTH_HEADER');
    }

    // Check if it's a Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError(
        'Invalid authorization format. Use: Bearer <token>',
        'INVALID_AUTH_FORMAT'
      );
    }

    const token = parts[1];

    // Verify token
    const payload = verifyToken(token);

    // Attach userId and userRole to request
    req.userId = payload.userId;
    req.userRole = payload.role;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
      });
    }
  }
}

import jwt, { SignOptions } from 'jsonwebtoken';
import { getEnv } from '../config/env';
import { UnauthorizedError } from './errors';

export interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload extends TokenPayload {
  type: 'refresh';
}

/**
 * Generate an access token with 15 minute expiry
 * @param userId - User ID
 * @param role - User role
 * @returns JWT access token
 */
export function generateAccessToken(userId: string, role: string): string {
  const env = getEnv();
  const payload: TokenPayload = {
    userId,
    role,
  };

  return jwt.sign(payload, env.JWT_SECRET || 'default-secret', {
    expiresIn: env.JWT_ACCESS_EXPIRATION || '15m',
  } as SignOptions);
}

/**
 * Generate a refresh token with 7 day expiry
 * @param userId - User ID
 * @param role - User role
 * @returns JWT refresh token
 */
export function generateRefreshToken(userId: string, role: string): string {
  const env = getEnv();
  const payload: RefreshTokenPayload = {
    userId,
    role,
    type: 'refresh',
  };

  return jwt.sign(payload, env.JWT_SECRET || 'default-secret', {
    expiresIn: env.JWT_REFRESH_EXPIRATION || '7d',
  } as SignOptions);
}

/**
 * Verify a JWT token and return the payload
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws UnauthorizedError if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  const env = getEnv();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET || 'default-secret') as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired', 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token', 'INVALID_TOKEN');
    }
    throw new UnauthorizedError('Token verification failed', 'TOKEN_VERIFICATION_FAILED');
  }
}

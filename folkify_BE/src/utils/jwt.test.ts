import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, verifyToken } from './jwt';
import { UnauthorizedError } from './errors';

// Mock env config
jest.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-for-testing-purposes-only',
    JWT_ACCESS_EXPIRATION: '15m',
    JWT_REFRESH_EXPIRATION: '7d',
  },
}));

describe('JWT Utilities', () => {
  const userId = 'test-user-id';
  const role = 'user';

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(userId, role);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include userId and role in token payload', () => {
      const token = generateAccessToken(userId, role);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
    });

    it('should have expiration time set', () => {
      const token = generateAccessToken(userId, role);
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(userId, role);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should include userId, role, and type in token payload', () => {
      const token = generateRefreshToken(userId, role);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
      expect(decoded.type).toBe('refresh');
    });

    it('should have longer expiration than access token', () => {
      const accessToken = generateAccessToken(userId, role);
      const refreshToken = generateRefreshToken(userId, role);

      const accessDecoded = jwt.decode(accessToken) as any;
      const refreshDecoded = jwt.decode(refreshToken) as any;

      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateAccessToken(userId, role);
      const payload = verifyToken(token);

      expect(payload.userId).toBe(userId);
      expect(payload.role).toBe(role);
    });

    it('should throw UnauthorizedError for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow(UnauthorizedError);
      expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
    });

    it('should throw UnauthorizedError for expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign({ userId, role }, 'test-secret-key-for-testing-purposes-only', {
        expiresIn: '0s',
      });

      // Wait a bit to ensure expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => verifyToken(expiredToken)).toThrow(UnauthorizedError);
          expect(() => verifyToken(expiredToken)).toThrow('Token has expired');
          resolve(undefined);
        }, 100);
      });
    });

    it('should throw UnauthorizedError for token with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign({ userId, role }, 'wrong-secret', {
        expiresIn: '15m',
      });

      expect(() => verifyToken(tokenWithWrongSecret)).toThrow(UnauthorizedError);
    });
  });
});

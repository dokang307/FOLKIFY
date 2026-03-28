import { apiLimiter, authLimiter, adminLimiter } from './rateLimiter';

describe('Rate Limiter Middleware', () => {
  describe('apiLimiter', () => {
    it('should be defined', () => {
      expect(apiLimiter).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof apiLimiter).toBe('function');
    });
  });

  describe('authLimiter', () => {
    it('should be defined', () => {
      expect(authLimiter).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof authLimiter).toBe('function');
    });
  });

  describe('adminLimiter', () => {
    it('should be defined', () => {
      expect(adminLimiter).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof adminLimiter).toBe('function');
    });
  });
});

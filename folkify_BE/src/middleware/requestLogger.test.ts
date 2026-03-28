import { requestLogger, errorLogger } from './requestLogger';

describe('Request Logger Middleware', () => {
  describe('requestLogger', () => {
    it('should be defined', () => {
      expect(requestLogger).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof requestLogger).toBe('function');
    });
  });

  describe('errorLogger', () => {
    it('should be defined', () => {
      expect(errorLogger).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof errorLogger).toBe('function');
    });
  });
});

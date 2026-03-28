import { corsMiddleware } from './cors';

describe('CORS Middleware', () => {
  it('should be defined', () => {
    expect(corsMiddleware).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof corsMiddleware).toBe('function');
  });
});

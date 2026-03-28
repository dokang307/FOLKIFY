import { Request, Response, NextFunction } from 'express';
import { metricsTracker } from './metricsTracker';
import { metricsService } from '../services/metrics.service';

// Mock dependencies
jest.mock('../services/metrics.service');

describe('Metrics Tracker Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let onFinishCallback: () => void;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          onFinishCallback = callback;
        }
        return mockResponse as Response;
      }),
      statusCode: 200,
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  it('should call next() immediately', () => {
    metricsTracker(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should register finish event listener', () => {
    metricsTracker(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should track request with response time and status code on finish', () => {
    metricsTracker(mockRequest as Request, mockResponse as Response, mockNext);

    // Simulate response finish after some time
    mockResponse.statusCode = 200;
    onFinishCallback();

    expect(metricsService.trackRequest).toHaveBeenCalledWith(expect.any(Number), 200);
  });

  it('should track error responses (4xx status codes)', () => {
    metricsTracker(mockRequest as Request, mockResponse as Response, mockNext);

    mockResponse.statusCode = 404;
    onFinishCallback();

    expect(metricsService.trackRequest).toHaveBeenCalledWith(expect.any(Number), 404);
  });

  it('should track server error responses (5xx status codes)', () => {
    metricsTracker(mockRequest as Request, mockResponse as Response, mockNext);

    mockResponse.statusCode = 500;
    onFinishCallback();

    expect(metricsService.trackRequest).toHaveBeenCalledWith(expect.any(Number), 500);
  });

  it('should calculate response time correctly', (done) => {
    const startTime = Date.now();

    metricsTracker(mockRequest as Request, mockResponse as Response, mockNext);

    // Simulate delay
    setTimeout(() => {
      mockResponse.statusCode = 200;
      onFinishCallback();

      const callArgs = (metricsService.trackRequest as jest.Mock).mock.calls[0];
      const responseTime = callArgs[0];

      // Response time should be at least 50ms (with some tolerance)
      expect(responseTime).toBeGreaterThanOrEqual(45);
      expect(responseTime).toBeLessThan(100);

      done();
    }, 50);
  });

  it('should track multiple requests independently', () => {
    // First request
    const mockResponse1 = {
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          callback();
        }
        return mockResponse1 as Response;
      }),
      statusCode: 200,
    };

    metricsTracker(mockRequest as Request, mockResponse1 as Response, mockNext);

    // Second request
    const mockResponse2 = {
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          callback();
        }
        return mockResponse2 as Response;
      }),
      statusCode: 404,
    };

    metricsTracker(mockRequest as Request, mockResponse2 as Response, mockNext);

    expect(metricsService.trackRequest).toHaveBeenCalledTimes(2);
    expect(metricsService.trackRequest).toHaveBeenNthCalledWith(1, expect.any(Number), 200);
    expect(metricsService.trackRequest).toHaveBeenNthCalledWith(2, expect.any(Number), 404);
  });
});

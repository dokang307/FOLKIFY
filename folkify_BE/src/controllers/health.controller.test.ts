import { Request, Response } from 'express';
import { healthCheck, getMetrics } from './health.controller';
import { getHealthStatus } from '../services/health.service';
import { metricsService } from '../services/metrics.service';

// Mock dependencies
jest.mock('../services/health.service');
jest.mock('../services/metrics.service');
jest.mock('../utils/logger');

describe('Health Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {};
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should return 200 with healthy status when all services are healthy', async () => {
      const mockHealthStatus = {
        status: 'healthy' as const,
        database: 'connected' as const,
        redis: 'connected' as const,
        queue: 'running' as const,
        diskSpace: '50GB free',
        uptime: '5 days',
      };

      (getHealthStatus as jest.Mock).mockResolvedValue(mockHealthStatus);

      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockHealthStatus,
      });
    });

    it('should return 503 with unhealthy status when services are down', async () => {
      const mockHealthStatus = {
        status: 'unhealthy' as const,
        database: 'disconnected' as const,
        redis: 'connected' as const,
        queue: 'running' as const,
        diskSpace: '50GB free',
        uptime: '5 days',
      };

      (getHealthStatus as jest.Mock).mockResolvedValue(mockHealthStatus);

      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockHealthStatus,
      });
    });

    it('should return 503 when health check fails', async () => {
      (getHealthStatus as jest.Mock).mockRejectedValue(new Error('Health check failed'));

      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Health check failed',
      });
    });

    it('should include all health check components', async () => {
      const mockHealthStatus = {
        status: 'healthy' as const,
        database: 'connected' as const,
        redis: 'connected' as const,
        queue: 'running' as const,
        diskSpace: '100GB free',
        uptime: '10 days 5 hours',
      };

      (getHealthStatus as jest.Mock).mockResolvedValue(mockHealthStatus);

      await healthCheck(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          database: 'connected',
          redis: 'connected',
          queue: 'running',
          diskSpace: expect.any(String),
          uptime: expect.any(String),
        }),
      });
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      const mockMetrics = {
        requestCount: 1000,
        errorRate: 2.5,
        avgResponseTime: 150,
      };

      (metricsService.getMetrics as jest.Mock).mockReturnValue(mockMetrics);

      getMetrics(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockMetrics,
      });
    });

    it('should return zero metrics when no requests tracked', () => {
      const mockMetrics = {
        requestCount: 0,
        errorRate: 0,
        avgResponseTime: 0,
      };

      (metricsService.getMetrics as jest.Mock).mockReturnValue(mockMetrics);

      getMetrics(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockMetrics,
      });
    });

    it('should return 500 when metrics retrieval fails', () => {
      (metricsService.getMetrics as jest.Mock).mockImplementation(() => {
        throw new Error('Metrics error');
      });

      getMetrics(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get metrics',
      });
    });

    it('should include all metrics fields', () => {
      const mockMetrics = {
        requestCount: 5000,
        errorRate: 1.25,
        avgResponseTime: 200,
      };

      (metricsService.getMetrics as jest.Mock).mockReturnValue(mockMetrics);

      getMetrics(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          requestCount: expect.any(Number),
          errorRate: expect.any(Number),
          avgResponseTime: expect.any(Number),
        }),
      });
    });
  });
});

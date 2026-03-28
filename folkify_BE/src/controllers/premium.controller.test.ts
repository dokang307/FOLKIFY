import { Request, Response } from 'express';
import { getPlansController, getStatusController } from './premium.controller';
import { getPremiumPlans, getPremiumStatus } from '../services/premium.service';
import { NotFoundError } from '../utils/errors';

// Mock dependencies
jest.mock('../services/premium.service');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const mockGetPremiumPlans = getPremiumPlans as jest.MockedFunction<typeof getPremiumPlans>;
const mockGetPremiumStatus = getPremiumStatus as jest.MockedFunction<typeof getPremiumStatus>;

describe('Premium Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('getPlansController', () => {
    it('should return available premium plans', async () => {
      const mockPlans = [
        {
          id: 'basic',
          name: 'BASIC',
          price: 149000,
          currency: 'VND',
          features: ['Feature 1', 'Feature 2'],
        },
        {
          id: 'pro',
          name: 'PRO',
          price: 199000,
          currency: 'VND',
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
        },
      ];

      mockGetPremiumPlans.mockReturnValue(mockPlans);

      await getPlansController(mockRequest as Request, mockResponse as Response);

      expect(mockGetPremiumPlans).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockPlans,
      });
    });

    it('should handle errors', async () => {
      mockGetPremiumPlans.mockImplementation(() => {
        throw new Error('Test error');
      });

      await getPlansController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });
  });

  describe('getStatusController', () => {
    it('should return premium status for authenticated user', async () => {
      const mockStatus = {
        account_type: 'basic',
        is_premium: true,
        is_pro: false,
        premium_started_at: new Date(),
        premium_expires_at: new Date(),
        days_remaining: 30,
      };

      mockRequest.userId = 'user-1';
      mockGetPremiumStatus.mockResolvedValue(mockStatus as any);

      await getStatusController(mockRequest as Request, mockResponse as Response);

      expect(mockGetPremiumStatus).toHaveBeenCalledWith('user-1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockStatus,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.userId = undefined;

      await getStatusController(mockRequest as Request, mockResponse as Response);

      expect(mockGetPremiumStatus).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    });

    it('should handle NotFoundError', async () => {
      mockRequest.userId = 'user-1';
      mockGetPremiumStatus.mockRejectedValue(new NotFoundError('User not found', 'USER_NOT_FOUND'));

      await getStatusController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    });

    it('should handle generic errors', async () => {
      mockRequest.userId = 'user-1';
      mockGetPremiumStatus.mockRejectedValue(new Error('Test error'));

      await getStatusController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });
  });
});

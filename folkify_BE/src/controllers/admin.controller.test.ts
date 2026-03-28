import { Request, Response } from 'express';
import {
  getUsersController,
  getUserDetailsController,
  upgradeUserController,
  banUserController,
  unbanUserController,
} from './admin.controller';
import {
  getUsersService,
  getUserDetails,
  manualUpgradeUser,
  banUser,
  unbanUser,
} from '../services/admin.service';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Mock dependencies
jest.mock('../services/admin.service');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const mockGetUsersService = getUsersService as jest.MockedFunction<typeof getUsersService>;
const mockGetUserDetails = getUserDetails as jest.MockedFunction<typeof getUserDetails>;
const mockManualUpgradeUser = manualUpgradeUser as jest.MockedFunction<typeof manualUpgradeUser>;
const mockBanUser = banUser as jest.MockedFunction<typeof banUser>;
const mockUnbanUser = unbanUser as jest.MockedFunction<typeof unbanUser>;

describe('Admin Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('getUsersController', () => {
    it('should return users with pagination', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@test.com',
          full_name: 'User One',
          account_type: 'free',
          account_status: 'active',
          created_at: new Date(),
        },
      ];

      mockGetUsersService.mockResolvedValue({
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      mockRequest = {
        query: {
          page: '1',
          limit: '20',
        },
      };

      await getUsersController(mockRequest as Request, mockResponse as Response);

      expect(mockGetUsersService).toHaveBeenCalledWith(
        {
          accountType: undefined,
          accountStatus: undefined,
          search: undefined,
        },
        {
          page: 1,
          limit: 20,
        }
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          users: mockUsers,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
      });
    });

    it('should handle filters correctly', async () => {
      mockGetUsersService.mockResolvedValue({
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });

      mockRequest = {
        query: {
          accountType: 'pro',
          accountStatus: 'active',
          search: 'test',
          page: '1',
          limit: '20',
        },
      };

      await getUsersController(mockRequest as Request, mockResponse as Response);

      expect(mockGetUsersService).toHaveBeenCalledWith(
        {
          accountType: 'pro',
          accountStatus: 'active',
          search: 'test',
        },
        {
          page: 1,
          limit: 20,
        }
      );
    });

    it('should return 400 for invalid query parameters', async () => {
      mockRequest = {
        query: {
          accountType: 'invalid',
        },
      };

      await getUsersController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'VALIDATION_ERROR',
        })
      );
    });
  });

  describe('getUserDetailsController', () => {
    it('should return user details', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user1@test.com',
        full_name: 'User One',
        account_type: 'pro',
        user_stats: {
          level: 5,
          total_xp: 5000,
        },
        premium_subscriptions: [],
        payment_transactions: [],
      };

      mockGetUserDetails.mockResolvedValue(mockUser as any);

      mockRequest = {
        params: {
          id: 'user1',
        },
      };

      await getUserDetailsController(mockRequest as Request, mockResponse as Response);

      expect(mockGetUserDetails).toHaveBeenCalledWith('user1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser,
        },
      });
    });

    it('should return 404 if user not found', async () => {
      mockGetUserDetails.mockRejectedValue(new NotFoundError('User not found', 'USER_NOT_FOUND'));

      mockRequest = {
        params: {
          id: 'nonexistent',
        },
      };

      await getUserDetailsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('upgradeUserController', () => {
    it('should upgrade user successfully', async () => {
      const mockResult = {
        message: 'User upgraded successfully',
        user: {
          id: 'user1',
          email: 'user1@test.com',
          account_type: 'pro',
          premium_started_at: new Date(),
          premium_expires_at: new Date(),
        },
      };

      mockManualUpgradeUser.mockResolvedValue(mockResult as any);

      mockRequest = {
        params: {
          id: 'user1',
        },
        body: {
          planType: 'pro',
          durationMonths: 3,
          notes: 'Test upgrade',
        },
        userId: 'admin1',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
        },
      };

      await upgradeUserController(mockRequest as Request, mockResponse as Response);

      expect(mockManualUpgradeUser).toHaveBeenCalledWith(
        'user1',
        'pro',
        3,
        'admin1',
        'Test upgrade',
        '127.0.0.1',
        'test-agent'
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 400 for invalid plan type', async () => {
      mockRequest = {
        params: {
          id: 'user1',
        },
        body: {
          planType: 'invalid',
          durationMonths: 3,
        },
        userId: 'admin1',
      };

      await upgradeUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should return 400 for invalid duration', async () => {
      mockRequest = {
        params: {
          id: 'user1',
        },
        body: {
          planType: 'pro',
          durationMonths: 15,
        },
        userId: 'admin1',
      };

      await upgradeUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'VALIDATION_ERROR',
        })
      );
    });
  });

  describe('banUserController', () => {
    it('should ban user successfully', async () => {
      const mockResult = {
        message: 'User banned successfully',
        user: {
          id: 'user1',
          email: 'user1@test.com',
          account_status: 'banned',
          ban_reason: 'Violation of terms',
        },
      };

      mockBanUser.mockResolvedValue(mockResult as any);

      mockRequest = {
        params: {
          id: 'user1',
        },
        body: {
          reason: 'Violation of terms',
        },
        userId: 'admin1',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
        },
      };

      await banUserController(mockRequest as Request, mockResponse as Response);

      expect(mockBanUser).toHaveBeenCalledWith(
        'user1',
        'Violation of terms',
        'admin1',
        '127.0.0.1',
        'test-agent'
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 400 if reason is missing', async () => {
      mockRequest = {
        params: {
          id: 'user1',
        },
        body: {},
        userId: 'admin1',
      };

      await banUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'VALIDATION_ERROR',
        })
      );
    });
  });

  describe('unbanUserController', () => {
    it('should unban user successfully', async () => {
      const mockResult = {
        message: 'User unbanned successfully',
        user: {
          id: 'user1',
          email: 'user1@test.com',
          account_status: 'active',
          ban_reason: null,
        },
      };

      mockUnbanUser.mockResolvedValue(mockResult as any);

      mockRequest = {
        params: {
          id: 'user1',
        },
        userId: 'admin1',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
        },
      };

      await unbanUserController(mockRequest as Request, mockResponse as Response);

      expect(mockUnbanUser).toHaveBeenCalledWith('user1', 'admin1', '127.0.0.1', 'test-agent');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 404 if user not found', async () => {
      const error = new NotFoundError('User not found', 'USER_NOT_FOUND');
      mockUnbanUser.mockRejectedValue(error);

      mockRequest = {
        params: {
          id: 'nonexistent',
        },
        userId: 'admin1',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
        },
      };

      await unbanUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('getActivityLogsController', () => {
    it('should return activity logs with pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          admin_id: 'admin-1',
          action: 'manual_upgrade',
          resource_type: 'user',
          resource_id: 'user-1',
          changes: { plan: 'pro' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
          created_at: new Date('2024-01-01'),
        },
      ];

      // Mock the service module
      jest.doMock('../services/admin.service', () => ({
        ...jest.requireActual('../services/admin.service'),
        getActivityLogs: jest.fn().mockResolvedValue({
          logs: mockLogs,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        }),
      }));

      // Clear cache and re-import
      jest.resetModules();
      const { getActivityLogsController } = require('./admin.controller');

      mockRequest = {
        query: {
          page: '1',
          limit: '20',
        },
      };

      await getActivityLogsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          logs: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 20,
          }),
        }),
      });
    });

    it('should filter by action', async () => {
      mockRequest = {
        query: {
          action: 'ban_user',
          page: '1',
          limit: '20',
        },
      };

      // Use the already imported controller
      const { getActivityLogsController } = require('./admin.controller');
      await getActivityLogsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should filter by resource_type', async () => {
      mockRequest = {
        query: {
          resource_type: 'lesson',
          page: '1',
          limit: '20',
        },
      };

      const { getActivityLogsController } = require('./admin.controller');
      await getActivityLogsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should filter by date range', async () => {
      mockRequest = {
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: '1',
          limit: '20',
        },
      };

      const { getActivityLogsController } = require('./admin.controller');
      await getActivityLogsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should use default pagination values', async () => {
      mockRequest = {
        query: {},
      };

      const { getActivityLogsController } = require('./admin.controller');
      await getActivityLogsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should handle validation errors', async () => {
      mockRequest = {
        query: {
          page: 'invalid',
        },
      };

      const { getActivityLogsController } = require('./admin.controller');
      await getActivityLogsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.any(String),
        code: 'VALIDATION_ERROR',
      });
    });

    it('should handle internal errors', async () => {
      // Mock service to throw error
      jest.doMock('../services/admin.service', () => ({
        ...jest.requireActual('../services/admin.service'),
        getActivityLogs: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

      jest.resetModules();
      const { getActivityLogsController } = require('./admin.controller');

      mockRequest = {
        query: {
          page: '1',
          limit: '20',
        },
      };

      await getActivityLogsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });
  });

  afterAll(async () => {
    // Clean up any open handles
    jest.clearAllTimers();
    await new Promise((resolve) => setImmediate(resolve));
  });
});

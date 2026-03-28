import {
  calculateAmount,
  manualUpgrade,
  downgradeToFree,
  getPremiumPlans,
  getPremiumStatus,
} from './premium.service';
import { findUserById } from '../repositories/user.repository';
import { BadRequestError, NotFoundError } from '../utils/errors';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

jest.mock('../repositories/user.repository');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const { prisma } = require('../config/database');
const mockFindUserById = findUserById as jest.MockedFunction<typeof findUserById>;

describe('Premium Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAmount', () => {
    it('should calculate correct amount for basic plan', () => {
      expect(calculateAmount('basic', 1)).toBe(149000);
      expect(calculateAmount('basic', 3)).toBe(447000);
      expect(calculateAmount('basic', 12)).toBe(1788000);
    });

    it('should calculate correct amount for pro plan', () => {
      expect(calculateAmount('pro', 1)).toBe(199000);
      expect(calculateAmount('pro', 3)).toBe(597000);
      expect(calculateAmount('pro', 12)).toBe(2388000);
    });
  });

  describe('manualUpgrade', () => {
    it('should successfully upgrade user to basic plan', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        account_type: 'free',
        password_hash: 'hash',
        full_name: 'Test User',
        role: 'user',
        account_status: 'active',
        premium_started_at: null,
        premium_expires_at: null,
        ban_reason: null,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      const mockUpdatedUser = {
        ...mockUser,
        account_type: 'basic',
        premium_started_at: new Date(),
        premium_expires_at: new Date(),
      };

      mockFindUserById.mockResolvedValue(mockUser as any);
      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          user: {
            update: jest.fn().mockResolvedValue(mockUpdatedUser),
          },
          premiumSubscription: {
            create: jest.fn().mockResolvedValue({}),
          },
          paymentTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
          adminActivityLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await manualUpgrade({
        userId: 'user-1',
        planType: 'basic',
        durationMonths: 3,
        adminId: 'admin-1',
        notes: 'Test upgrade',
      });

      expect(result.message).toBe('User upgraded successfully');
      expect(result.user.account_type).toBe('basic');
      expect(mockFindUserById).toHaveBeenCalledWith('user-1');
    });

    it('should throw error for invalid plan type', async () => {
      await expect(
        manualUpgrade({
          userId: 'user-1',
          planType: 'invalid' as any,
          durationMonths: 3,
          adminId: 'admin-1',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw error for invalid duration', async () => {
      await expect(
        manualUpgrade({
          userId: 'user-1',
          planType: 'basic',
          durationMonths: 0,
          adminId: 'admin-1',
        })
      ).rejects.toThrow(BadRequestError);

      await expect(
        manualUpgrade({
          userId: 'user-1',
          planType: 'basic',
          durationMonths: 13,
          adminId: 'admin-1',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw error if user not found', async () => {
      mockFindUserById.mockResolvedValue(null);

      await expect(
        manualUpgrade({
          userId: 'nonexistent',
          planType: 'basic',
          durationMonths: 3,
          adminId: 'admin-1',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('downgradeToFree', () => {
    it('should successfully downgrade user to free', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        account_type: 'basic',
        password_hash: 'hash',
        full_name: 'Test User',
        role: 'user',
        account_status: 'active',
        premium_started_at: new Date(),
        premium_expires_at: new Date(),
        ban_reason: null,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      const mockDowngradedUser = {
        ...mockUser,
        account_type: 'free',
        premium_expires_at: new Date(),
      };

      mockFindUserById.mockResolvedValue(mockUser as any);
      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          user: {
            update: jest.fn().mockResolvedValue(mockDowngradedUser),
          },
          premiumSubscription: {
            updateMany: jest.fn().mockResolvedValue({}),
          },
          adminActivityLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await downgradeToFree('user-1', 'admin-1', 'Test downgrade');

      expect(result.message).toBe('User downgraded to free successfully');
      expect(result.user.account_type).toBe('free');
      expect(mockFindUserById).toHaveBeenCalledWith('user-1');
    });

    it('should throw error if user not found', async () => {
      mockFindUserById.mockResolvedValue(null);

      await expect(downgradeToFree('nonexistent', 'admin-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPremiumPlans', () => {
    it('should return available premium plans', () => {
      const plans = getPremiumPlans();

      expect(plans).toHaveLength(2);
      expect(plans[0].id).toBe('basic');
      expect(plans[0].price).toBe(149000);
      expect(plans[1].id).toBe('pro');
      expect(plans[1].price).toBe(199000);
    });
  });

  describe('getPremiumStatus', () => {
    it('should return premium status for basic user', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        account_type: 'basic',
        premium_started_at: new Date(),
        premium_expires_at: futureDate,
        password_hash: 'hash',
        full_name: 'Test User',
        role: 'user',
        account_status: 'active',
        ban_reason: null,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      mockFindUserById.mockResolvedValue(mockUser as any);

      const status = await getPremiumStatus('user-1');

      expect(status.account_type).toBe('basic');
      expect(status.is_premium).toBe(true);
      expect(status.is_pro).toBe(false);
      expect(status.days_remaining).toBeGreaterThan(0);
    });

    it('should return premium status for pro user', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        account_type: 'pro',
        premium_started_at: new Date(),
        premium_expires_at: futureDate,
        password_hash: 'hash',
        full_name: 'Test User',
        role: 'user',
        account_status: 'active',
        ban_reason: null,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      mockFindUserById.mockResolvedValue(mockUser as any);

      const status = await getPremiumStatus('user-1');

      expect(status.account_type).toBe('pro');
      expect(status.is_premium).toBe(true);
      expect(status.is_pro).toBe(true);
    });

    it('should return non-premium status for free user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        account_type: 'free',
        premium_started_at: null,
        premium_expires_at: null,
        password_hash: 'hash',
        full_name: 'Test User',
        role: 'user',
        account_status: 'active',
        ban_reason: null,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      mockFindUserById.mockResolvedValue(mockUser as any);

      const status = await getPremiumStatus('user-1');

      expect(status.account_type).toBe('free');
      expect(status.is_premium).toBe(false);
      expect(status.is_pro).toBe(false);
      expect(status.days_remaining).toBe(0);
    });

    it('should return non-premium status for expired premium user', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        account_type: 'basic',
        premium_started_at: new Date(),
        premium_expires_at: pastDate,
        password_hash: 'hash',
        full_name: 'Test User',
        role: 'user',
        account_status: 'active',
        ban_reason: null,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      mockFindUserById.mockResolvedValue(mockUser as any);

      const status = await getPremiumStatus('user-1');

      expect(status.is_premium).toBe(false);
      expect(status.is_pro).toBe(false);
    });

    it('should throw error if user not found', async () => {
      mockFindUserById.mockResolvedValue(null);

      await expect(getPremiumStatus('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});

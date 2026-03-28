import {
  createSubscription,
  getActiveSubscription,
  getSubscriptionHistory,
} from './subscription.repository';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    premiumSubscription: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = require('../config/database');

describe('Subscription Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create a new subscription', async () => {
      const mockSubscription = {
        id: 'sub-1',
        user_id: 'user-1',
        plan_type: 'basic',
        status: 'active',
        started_at: new Date(),
        expires_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.premiumSubscription.create.mockResolvedValue(mockSubscription);

      const result = await createSubscription({
        user: { connect: { id: 'user-1' } },
        plan_type: 'basic',
        status: 'active',
        started_at: new Date(),
        expires_at: new Date(),
      });

      expect(result).toEqual(mockSubscription);
      expect(prisma.premiumSubscription.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActiveSubscription', () => {
    it('should return active subscription for user', async () => {
      const mockSubscription = {
        id: 'sub-1',
        user_id: 'user-1',
        plan_type: 'pro',
        status: 'active',
        started_at: new Date('2024-01-01'),
        expires_at: new Date('2025-01-01'),
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.premiumSubscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await getActiveSubscription('user-1');

      expect(result).toEqual(mockSubscription);
      expect(prisma.premiumSubscription.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: 'user-1',
          status: 'active',
          expires_at: {
            gt: expect.any(Date),
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    });

    it('should return null if no active subscription', async () => {
      prisma.premiumSubscription.findFirst.mockResolvedValue(null);

      const result = await getActiveSubscription('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getSubscriptionHistory', () => {
    it('should return subscription history for user', async () => {
      const mockHistory = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          plan_type: 'pro',
          status: 'active',
          started_at: new Date('2024-01-01'),
          expires_at: new Date('2025-01-01'),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'sub-2',
          user_id: 'user-1',
          plan_type: 'basic',
          status: 'expired',
          started_at: new Date('2023-01-01'),
          expires_at: new Date('2024-01-01'),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      prisma.premiumSubscription.findMany.mockResolvedValue(mockHistory);

      const result = await getSubscriptionHistory('user-1');

      expect(result).toEqual(mockHistory);
      expect(prisma.premiumSubscription.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user-1',
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    });

    it('should return empty array if no history', async () => {
      prisma.premiumSubscription.findMany.mockResolvedValue([]);

      const result = await getSubscriptionHistory('user-1');

      expect(result).toEqual([]);
    });
  });
});

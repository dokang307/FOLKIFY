import redis from '../config/redis';
import {
  getUserStatistics,
  getRevenueStatistics,
  getAIGradingStatistics,
  getUsersExpiringSoon,
  getRevenueReport,
} from './analytics.service';
import * as analyticsRepo from '../repositories/analytics.repository';

// Mock the repository
jest.mock('../repositories/analytics.repository');

// Mock Redis
jest.mock('../config/redis', () => ({
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
}));

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserStatistics', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        total_users: 100,
        free_users_count: 60,
        basic_users_count: 30,
        pro_users_count: 10,
        conversion_rate: 40,
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getUserStatistics();

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith('analytics:user_stats');
      expect(analyticsRepo.getUserStatistics).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not cached', async () => {
      const repoData = {
        total_users: 100,
        free_users_count: 60,
        basic_users_count: 30,
        pro_users_count: 10,
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (analyticsRepo.getUserStatistics as jest.Mock).mockResolvedValue(repoData);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await getUserStatistics();

      expect(result.total_users).toBe(100);
      expect(result.conversion_rate).toBe(40); // (30 + 10) / 100 * 100
      expect(redis.setex).toHaveBeenCalledWith('analytics:user_stats', 300, expect.any(String));
    });

    it('should calculate conversion rate correctly', async () => {
      const repoData = {
        total_users: 200,
        free_users_count: 100,
        basic_users_count: 60,
        pro_users_count: 40,
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (analyticsRepo.getUserStatistics as jest.Mock).mockResolvedValue(repoData);

      const result = await getUserStatistics();

      expect(result.conversion_rate).toBe(50); // (60 + 40) / 200 * 100
    });

    it('should handle zero users gracefully', async () => {
      const repoData = {
        total_users: 0,
        free_users_count: 0,
        basic_users_count: 0,
        pro_users_count: 0,
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (analyticsRepo.getUserStatistics as jest.Mock).mockResolvedValue(repoData);

      const result = await getUserStatistics();

      expect(result.conversion_rate).toBe(0);
    });

    it('should continue if cache read fails', async () => {
      const repoData = {
        total_users: 100,
        free_users_count: 60,
        basic_users_count: 30,
        pro_users_count: 10,
      };

      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      (analyticsRepo.getUserStatistics as jest.Mock).mockResolvedValue(repoData);

      const result = await getUserStatistics();

      expect(result.total_users).toBe(100);
    });
  });

  describe('getRevenueStatistics', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        monthly_recurring_revenue: 1000000,
        total_revenue_this_month: 500000,
        growth_percentage: 25.5,
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getRevenueStatistics();

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith('analytics:revenue_stats');
    });

    it('should calculate growth percentage correctly', async () => {
      const repoData = {
        monthly_recurring_revenue: 1000000,
        total_revenue_this_month: 600000,
        last_month_revenue: 400000,
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (analyticsRepo.getRevenueStatistics as jest.Mock).mockResolvedValue(repoData);

      const result = await getRevenueStatistics();

      expect(result.growth_percentage).toBe(50); // (600000 - 400000) / 400000 * 100
    });

    it('should handle zero last month revenue', async () => {
      const repoData = {
        monthly_recurring_revenue: 1000000,
        total_revenue_this_month: 500000,
        last_month_revenue: 0,
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (analyticsRepo.getRevenueStatistics as jest.Mock).mockResolvedValue(repoData);

      const result = await getRevenueStatistics();

      expect(result.growth_percentage).toBe(0);
    });

    it('should cache the result', async () => {
      const repoData = {
        monthly_recurring_revenue: 1000000,
        total_revenue_this_month: 500000,
        last_month_revenue: 400000,
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (analyticsRepo.getRevenueStatistics as jest.Mock).mockResolvedValue(repoData);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      await getRevenueStatistics();

      expect(redis.setex).toHaveBeenCalledWith('analytics:revenue_stats', 300, expect.any(String));
    });
  });

  describe('getAIGradingStatistics', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        total_gradings: 500,
        average_score: 82.5,
        usage_by_account_type: { pro: 500 },
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getAIGradingStatistics();

      expect(result).toEqual(cachedData);
    });

    it('should fetch from database and cache if not cached', async () => {
      const repoData = {
        total_gradings: 500,
        average_score: 82.456,
        usage_by_account_type: { pro: 500 },
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      (analyticsRepo.getAIGradingStatistics as jest.Mock).mockResolvedValue(repoData);

      const result = await getAIGradingStatistics();

      expect(result.total_gradings).toBe(500);
      expect(result.average_score).toBe(82.46); // Rounded to 2 decimals
      expect(redis.setex).toHaveBeenCalled();
    });
  });

  describe('getUsersExpiringSoon', () => {
    it('should return users with days remaining calculated', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

      const repoData = [
        {
          id: 'user1',
          email: 'user1@test.com',
          full_name: 'User 1',
          account_type: 'basic' as const,
          premium_expires_at: futureDate,
        },
      ];

      (analyticsRepo.getUsersExpiringSoon as jest.Mock).mockResolvedValue(repoData);

      const result = await getUsersExpiringSoon(7);

      expect(result).toHaveLength(1);
      expect(result[0].days_remaining).toBeGreaterThanOrEqual(4);
      expect(result[0].days_remaining).toBeLessThanOrEqual(5);
    });

    it('should not cache the result (real-time data)', async () => {
      (analyticsRepo.getUsersExpiringSoon as jest.Mock).mockResolvedValue([]);

      await getUsersExpiringSoon(7);

      expect(redis.setex).not.toHaveBeenCalled();
    });
  });

  describe('getRevenueReport', () => {
    it('should return revenue report with total calculated', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const repoData = {
        by_month: [
          { month: '2024-01', total_revenue: 500000 },
          { month: '2024-02', total_revenue: 600000 },
        ],
        by_transaction_type: [
          { transaction_type: 'subscription', total_revenue: 1000000 },
          { transaction_type: 'sheet_purchase', total_revenue: 100000 },
        ],
        by_payment_method: [
          { payment_method: 'manual', total_revenue: 800000 },
          { payment_method: 'credit_card', total_revenue: 300000 },
        ],
      };

      (analyticsRepo.getRevenueReport as jest.Mock).mockResolvedValue(repoData);

      const result = await getRevenueReport(startDate, endDate);

      expect(result.total_revenue).toBe(1100000); // 500000 + 600000
      expect(result.date_range.start).toBe(startDate.toISOString());
      expect(result.date_range.end).toBe(endDate.toISOString());
    });

    it('should not cache the result (custom date ranges)', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (analyticsRepo.getRevenueReport as jest.Mock).mockResolvedValue({
        by_month: [],
        by_transaction_type: [],
        by_payment_method: [],
      });

      await getRevenueReport(startDate, endDate);

      expect(redis.setex).not.toHaveBeenCalled();
    });
  });
});

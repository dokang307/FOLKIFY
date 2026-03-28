import { prisma } from '../config/database';
import {
  getUserStatistics,
  getRevenueStatistics,
  getAIGradingStatistics,
  getUsersExpiringSoon,
  getRevenueReport,
} from './analytics.repository';

describe('Analytics Repository', () => {
  beforeEach(async () => {
    // Clean up database
    await prisma.paymentTransaction.deleteMany();
    await prisma.premiumSubscription.deleteMany();
    await prisma.aIGradingSession.deleteMany();
    await prisma.userStats.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getUserStatistics', () => {
    it('should return user statistics by account type', async () => {
      // Create test users
      await prisma.user.createMany({
        data: [
          {
            email: 'free1@test.com',
            password_hash: 'hash',
            full_name: 'Free User 1',
            account_type: 'free',
          },
          {
            email: 'free2@test.com',
            password_hash: 'hash',
            full_name: 'Free User 2',
            account_type: 'free',
          },
          {
            email: 'basic1@test.com',
            password_hash: 'hash',
            full_name: 'Basic User 1',
            account_type: 'basic',
            premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            email: 'pro1@test.com',
            password_hash: 'hash',
            full_name: 'Pro User 1',
            account_type: 'pro',
            premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      const stats = await getUserStatistics();

      expect(stats.total_users).toBe(4);
      expect(stats.free_users_count).toBe(2);
      expect(stats.basic_users_count).toBe(1);
      expect(stats.pro_users_count).toBe(1);
    });

    it('should return zero counts when no users exist', async () => {
      const stats = await getUserStatistics();

      expect(stats.total_users).toBe(0);
      expect(stats.free_users_count).toBe(0);
      expect(stats.basic_users_count).toBe(0);
      expect(stats.pro_users_count).toBe(0);
    });
  });

  describe('getRevenueStatistics', () => {
    it('should calculate MRR from active subscriptions', async () => {
      // Create test users
      const user1 = await prisma.user.create({
        data: {
          email: 'basic@test.com',
          password_hash: 'hash',
          full_name: 'Basic User',
          account_type: 'basic',
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'pro@test.com',
          password_hash: 'hash',
          full_name: 'Pro User',
          account_type: 'pro',
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Create active subscriptions
      await prisma.premiumSubscription.createMany({
        data: [
          {
            user_id: user1.id,
            plan_type: 'basic',
            status: 'active',
            started_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            user_id: user2.id,
            plan_type: 'pro',
            status: 'active',
            started_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      const stats = await getRevenueStatistics();

      // MRR = 149000 (basic) + 199000 (pro) = 348000
      expect(stats.monthly_recurring_revenue).toBe(348000);
    });

    it('should calculate total revenue this month', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user@test.com',
          password_hash: 'hash',
          full_name: 'Test User',
        },
      });

      // Create transactions this month
      await prisma.paymentTransaction.createMany({
        data: [
          {
            user_id: user.id,
            amount: 149000,
            currency: 'VND',
            status: 'completed',
            payment_method: 'manual',
            transaction_type: 'subscription',
            created_at: new Date(),
          },
          {
            user_id: user.id,
            amount: 50000,
            currency: 'VND',
            status: 'completed',
            payment_method: 'manual',
            transaction_type: 'sheet_purchase',
            created_at: new Date(),
          },
        ],
      });

      const stats = await getRevenueStatistics();

      expect(stats.total_revenue_this_month).toBe(199000);
    });

    it('should not include expired subscriptions in MRR', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'expired@test.com',
          password_hash: 'hash',
          full_name: 'Expired User',
          account_type: 'free',
        },
      });

      // Create expired subscription
      await prisma.premiumSubscription.create({
        data: {
          user_id: user.id,
          plan_type: 'basic',
          status: 'expired',
          started_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          expires_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      });

      const stats = await getRevenueStatistics();

      expect(stats.monthly_recurring_revenue).toBe(0);
    });
  });

  describe('getAIGradingStatistics', () => {
    it('should return AI grading statistics', async () => {
      // Create test users
      const freeUser = await prisma.user.create({
        data: {
          email: 'free@test.com',
          password_hash: 'hash',
          full_name: 'Free User',
          account_type: 'free',
        },
      });

      const proUser = await prisma.user.create({
        data: {
          email: 'pro@test.com',
          password_hash: 'hash',
          full_name: 'Pro User',
          account_type: 'pro',
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Create AI grading sessions
      await prisma.aIGradingSession.createMany({
        data: [
          {
            user_id: proUser.id,
            file_path: '/uploads/test1.mp3',
            status: 'completed',
            ai_score: 85,
          },
          {
            user_id: proUser.id,
            file_path: '/uploads/test2.mp3',
            status: 'completed',
            ai_score: 90,
          },
          {
            user_id: proUser.id,
            file_path: '/uploads/test3.mp3',
            status: 'pending',
          },
        ],
      });

      const stats = await getAIGradingStatistics();

      expect(stats.total_gradings).toBe(2); // Only completed
      expect(stats.average_score).toBe(87.5); // (85 + 90) / 2
      expect(stats.usage_by_account_type.pro).toBe(2);
    });

    it('should return zero statistics when no gradings exist', async () => {
      const stats = await getAIGradingStatistics();

      expect(stats.total_gradings).toBe(0);
      expect(stats.average_score).toBe(0);
      expect(stats.usage_by_account_type).toEqual({});
    });
  });

  describe('getUsersExpiringSoon', () => {
    it('should return users expiring within N days', async () => {
      const now = new Date();

      // Create users with different expiration dates
      await prisma.user.createMany({
        data: [
          {
            email: 'expiring-soon@test.com',
            password_hash: 'hash',
            full_name: 'Expiring Soon',
            account_type: 'basic',
            premium_expires_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
          },
          {
            email: 'expiring-later@test.com',
            password_hash: 'hash',
            full_name: 'Expiring Later',
            account_type: 'pro',
            premium_expires_at: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days
          },
          {
            email: 'already-expired@test.com',
            password_hash: 'hash',
            full_name: 'Already Expired',
            account_type: 'free',
            premium_expires_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Expired
          },
        ],
      });

      const users = await getUsersExpiringSoon(7);

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('expiring-soon@test.com');
    });

    it('should return empty array when no users expiring soon', async () => {
      const users = await getUsersExpiringSoon(7);

      expect(users).toHaveLength(0);
    });
  });

  describe('getRevenueReport', () => {
    it('should return revenue breakdown by month, type, and method', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user@test.com',
          password_hash: 'hash',
          full_name: 'Test User',
        },
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Create transactions
      await prisma.paymentTransaction.createMany({
        data: [
          {
            user_id: user.id,
            amount: 149000,
            currency: 'VND',
            status: 'completed',
            payment_method: 'manual',
            transaction_type: 'subscription',
            created_at: new Date('2024-01-15'),
          },
          {
            user_id: user.id,
            amount: 199000,
            currency: 'VND',
            status: 'completed',
            payment_method: 'credit_card',
            transaction_type: 'subscription',
            created_at: new Date('2024-02-15'),
          },
          {
            user_id: user.id,
            amount: 50000,
            currency: 'VND',
            status: 'completed',
            payment_method: 'manual',
            transaction_type: 'sheet_purchase',
            created_at: new Date('2024-01-20'),
          },
        ],
      });

      const report = await getRevenueReport(startDate, endDate);

      expect(report.by_month).toHaveLength(2);
      expect(report.by_transaction_type).toHaveLength(2);
      expect(report.by_payment_method).toHaveLength(2);

      // Check totals
      const subscriptionRevenue = report.by_transaction_type.find(
        (item) => item.transaction_type === 'subscription'
      );
      expect(subscriptionRevenue?.total_revenue).toBe(348000);

      const sheetRevenue = report.by_transaction_type.find(
        (item) => item.transaction_type === 'sheet_purchase'
      );
      expect(sheetRevenue?.total_revenue).toBe(50000);
    });

    it('should return empty report when no transactions in date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const report = await getRevenueReport(startDate, endDate);

      expect(report.by_month).toHaveLength(0);
      expect(report.by_transaction_type).toHaveLength(0);
      expect(report.by_payment_method).toHaveLength(0);
    });
  });
});

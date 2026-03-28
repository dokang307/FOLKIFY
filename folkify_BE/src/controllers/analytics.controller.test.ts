import request from 'supertest';
import express, { Application } from 'express';
import analyticsRoutes from '../routes/analytics.routes';
import { prisma } from '../config/database';
import { generateAccessToken } from '../utils/jwt';

const app: Application = express();
app.use(express.json());
app.use('/api/admin/analytics', analyticsRoutes);

describe('Analytics Controller', () => {
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password_hash: 'hash',
        full_name: 'Admin User',
        role: 'admin',
      },
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken(adminUserId, 'admin');

    // Create regular user
    const regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password_hash: 'hash',
        full_name: 'Regular User',
        role: 'user',
      },
    });
    regularUserId = regularUser.id;
    userToken = generateAccessToken(regularUserId, 'user');
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.paymentTransaction.deleteMany();
    await prisma.premiumSubscription.deleteMany();
    await prisma.aIGradingSession.deleteMany();
    await prisma.userStats.deleteMany();
    await prisma.user.deleteMany({
      where: {
        id: { notIn: [adminUserId, regularUserId] },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/admin/analytics/users', () => {
    it('should return user statistics for admin', async () => {
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

      const response = await request(app)
        .get('/api/admin/analytics/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total_users).toBeGreaterThanOrEqual(5); // Including admin and regular user
      expect(response.body.data.free_users_count).toBeGreaterThanOrEqual(1);
      expect(response.body.data.basic_users_count).toBe(1);
      expect(response.body.data.pro_users_count).toBe(1);
      expect(response.body.data.conversion_rate).toBeGreaterThan(0);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/admin/analytics/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/analytics/revenue', () => {
    it('should return revenue statistics for admin', async () => {
      // Create test user with subscription
      const user = await prisma.user.create({
        data: {
          email: 'premium@test.com',
          password_hash: 'hash',
          full_name: 'Premium User',
          account_type: 'basic',
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Create active subscription
      await prisma.premiumSubscription.create({
        data: {
          user_id: user.id,
          plan_type: 'basic',
          status: 'active',
          started_at: new Date(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Create payment transaction
      await prisma.paymentTransaction.create({
        data: {
          user_id: user.id,
          amount: 149000,
          currency: 'VND',
          status: 'completed',
          payment_method: 'manual',
          transaction_type: 'subscription',
        },
      });

      const response = await request(app)
        .get('/api/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.monthly_recurring_revenue).toBeGreaterThanOrEqual(149000);
      expect(response.body.data.total_revenue_this_month).toBeGreaterThanOrEqual(149000);
      expect(response.body.data).toHaveProperty('growth_percentage');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/revenue')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/analytics/ai-grading', () => {
    it('should return AI grading statistics for admin', async () => {
      // Create pro user
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
        ],
      });

      const response = await request(app)
        .get('/api/admin/analytics/ai-grading')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total_gradings).toBe(2);
      expect(response.body.data.average_score).toBe(87.5);
      expect(response.body.data.usage_by_account_type).toHaveProperty('pro');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/ai-grading')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/analytics/users-expiring', () => {
    it('should return users expiring within specified days', async () => {
      const now = new Date();

      // Create user expiring in 5 days
      await prisma.user.create({
        data: {
          email: 'expiring@test.com',
          password_hash: 'hash',
          full_name: 'Expiring User',
          account_type: 'basic',
          premium_expires_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .get('/api/admin/analytics/users-expiring?days=7')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.count).toBe(1);
      expect(response.body.data.days).toBe(7);
      expect(response.body.data.users[0]).toHaveProperty('days_remaining');
    });

    it('should use default 7 days if not specified', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/users-expiring')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.days).toBe(7);
    });

    it('should return 400 for invalid days parameter', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/users-expiring?days=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for days out of range', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/users-expiring?days=500')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/users-expiring?days=7')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/analytics/revenue-report', () => {
    it('should return revenue report for date range', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'report@test.com',
          password_hash: 'hash',
          full_name: 'Report User',
        },
      });

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
            amount: 50000,
            currency: 'VND',
            status: 'completed',
            payment_method: 'manual',
            transaction_type: 'sheet_purchase',
            created_at: new Date('2024-01-20'),
          },
        ],
      });

      const response = await request(app)
        .get('/api/admin/analytics/revenue-report?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('by_month');
      expect(response.body.data).toHaveProperty('by_transaction_type');
      expect(response.body.data).toHaveProperty('by_payment_method');
      expect(response.body.data).toHaveProperty('total_revenue');
      expect(response.body.data).toHaveProperty('date_range');
    });

    it('should return 400 for missing date parameters', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/revenue-report')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/revenue-report?startDate=invalid&endDate=2024-12-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 400 when start date is after end date', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/revenue-report?startDate=2024-12-31&endDate=2024-01-01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Start date must be before end date');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/revenue-report?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});

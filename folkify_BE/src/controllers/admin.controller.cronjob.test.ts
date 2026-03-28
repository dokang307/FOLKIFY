import request from 'supertest';
import express, { Express } from 'express';
import adminRoutes from '../routes/admin.routes';
import { prisma } from '../config/database';
import redisClient from '../config/redis';
import { emailQueue } from '../config/queues';
import { generateAccessToken } from '../utils/jwt';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    set: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('../config/queues', () => ({
  emailQueue: {
    add: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Admin Cronjob Controller', () => {
  let app: Express;
  let adminToken: string;
  let userToken: string;

  beforeAll(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);

    // Generate tokens
    adminToken = generateAccessToken('admin-id', 'admin');
    userToken = generateAccessToken('user-id', 'user');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/admin/cronjobs/trigger', () => {
    it('should trigger cronjob and return affected users count (admin)', async () => {
      // Mock admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
        account_status: 'active',
      });

      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Mock expired users
      const expiredUsers = [
        {
          id: 'user1',
          email: 'user1@test.com',
          full_name: 'User One',
          account_type: 'basic',
          premium_expires_at: new Date('2024-01-01'),
        },
        {
          id: 'user2',
          email: 'user2@test.com',
          full_name: 'User Two',
          account_type: 'pro',
          premium_expires_at: new Date('2024-01-01'),
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(expiredUsers);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (emailQueue.add as jest.Mock).mockResolvedValue({});

      // Execute
      const response = await request(app)
        .post('/api/admin/cronjobs/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'premium-expiration' });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          success: true,
          affectedUsersCount: 2,
          message: 'Successfully processed 2 expired users',
        },
      });

      // Verify cronjob executed
      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledTimes(2);
      expect(emailQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should return 403 if user is not admin', async () => {
      // Mock regular user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        role: 'user',
        account_status: 'active',
      });

      // Execute
      const response = await request(app)
        .post('/api/admin/cronjobs/trigger')
        .set('Authorization', `Bearer ${userToken}`);

      // Verify response
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED',
      });

      // Verify cronjob not executed
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      // Execute
      const response = await request(app).post('/api/admin/cronjobs/trigger');

      // Verify response
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Authorization header missing',
        code: 'NO_AUTH_HEADER',
      });

      // Verify cronjob not executed
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should handle cronjob already running scenario', async () => {
      // Mock admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
        account_status: 'active',
      });

      // Mock lock acquisition failure (already held)
      (redisClient.set as jest.Mock).mockResolvedValue(null);

      // Execute
      const response = await request(app)
        .post('/api/admin/cronjobs/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'premium-expiration' });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          success: false,
          affectedUsersCount: 0,
          message: 'Cronjob already running',
        },
      });

      // Verify no users processed
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should handle zero expired users', async () => {
      // Mock admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
        account_status: 'active',
      });

      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Mock no expired users
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Execute
      const response = await request(app)
        .post('/api/admin/cronjobs/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'premium-expiration' });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          success: true,
          affectedUsersCount: 0,
          message: 'Successfully processed 0 expired users',
        },
      });

      // Verify cronjob executed but no updates
      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Mock admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
        account_status: 'active',
      });

      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Mock database error
      (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('Database connection lost'));

      // Execute
      const response = await request(app)
        .post('/api/admin/cronjobs/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'premium-expiration' });

      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });

      // Verify lock was released
      expect(redisClient.del).toHaveBeenCalledWith('cronjob:premium_expiration');
    });

    it('should process multiple expired users correctly', async () => {
      // Mock admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
        account_status: 'active',
      });

      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Mock 5 expired users
      const expiredUsers = Array.from({ length: 5 }, (_, i) => ({
        id: `user${i + 1}`,
        email: `user${i + 1}@test.com`,
        full_name: `User ${i + 1}`,
        account_type: i % 2 === 0 ? 'basic' : 'pro',
        premium_expires_at: new Date('2024-01-01'),
      }));

      (prisma.user.findMany as jest.Mock).mockResolvedValue(expiredUsers);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (emailQueue.add as jest.Mock).mockResolvedValue({});

      // Execute
      const response = await request(app)
        .post('/api/admin/cronjobs/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'premium-expiration' });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.data.affectedUsersCount).toBe(5);

      // Verify all users processed
      expect(prisma.user.update).toHaveBeenCalledTimes(5);
      expect(emailQueue.add).toHaveBeenCalledTimes(5);
    });
  });

  describe('POST /api/admin/cronjobs/trigger - file cleanup', () => {
    beforeEach(async () => {
      // Add delay to avoid rate limiting (rate limiter resets after 15 minutes)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    it('should trigger file cleanup cronjob and return deleted files count (admin)', async () => {
      // Mock admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
        account_status: 'active',
      });

      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Mock old sessions
      const oldSessions = [
        {
          id: 'session1',
          file_path: '/uploads/ai-grading/user1/file1.mp3',
          submitted_at: new Date('2024-01-01'),
        },
      ];

      (prisma as any).aIGradingSession = {
        findMany: jest.fn().mockResolvedValue(oldSessions),
      };

      // Mock file system
      const fs = require('fs/promises');
      fs.access = jest.fn().mockResolvedValue(undefined);
      fs.unlink = jest.fn().mockResolvedValue(undefined);

      // Execute
      const response = await request(app)
        .post('/api/admin/cronjobs/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'file-cleanup' });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('deletedFilesCount');
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 400 if cronjob type is invalid', async () => {
      // Mock admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
        account_status: 'active',
      });

      // Execute
      const response = await request(app)
        .post('/api/admin/cronjobs/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'invalid-type' });

      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid cronjob type. Must be "premium-expiration" or "file-cleanup"',
        code: 'INVALID_CRONJOB_TYPE',
      });
    });

    it('should return 400 if cronjob type is missing', async () => {
      // Mock admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
        account_status: 'active',
      });

      // Execute
      const response = await request(app)
        .post('/api/admin/cronjobs/trigger')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid cronjob type. Must be "premium-expiration" or "file-cleanup"',
        code: 'INVALID_CRONJOB_TYPE',
      });
    });
  });
});

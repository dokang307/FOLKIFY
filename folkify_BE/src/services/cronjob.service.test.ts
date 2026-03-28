import { checkExpiredPremium } from './cronjob.service';
import { prisma } from '../config/database';
import redisClient from '../config/redis';
import { emailQueue } from '../config/queues';
import { AccountType } from '@prisma/client';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    user: {
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

describe('Cronjob Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkExpiredPremium', () => {
    it('should acquire lock and process expired premium users', async () => {
      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Mock expired users
      const expiredUsers = [
        {
          id: 'user1',
          email: 'user1@test.com',
          full_name: 'User One',
          account_type: 'basic' as AccountType,
          premium_expires_at: new Date('2024-01-01'),
        },
        {
          id: 'user2',
          email: 'user2@test.com',
          full_name: 'User Two',
          account_type: 'pro' as AccountType,
          premium_expires_at: new Date('2024-01-01'),
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(expiredUsers);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (emailQueue.add as jest.Mock).mockResolvedValue({});

      // Execute
      const result = await checkExpiredPremium();

      // Verify lock acquisition
      expect(redisClient.set).toHaveBeenCalledWith(
        'cronjob:premium_expiration',
        '1',
        'EX',
        600,
        'NX'
      );

      // Verify users query
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          account_type: { in: ['basic', 'pro'] },
          premium_expires_at: { lte: expect.any(Date) },
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          account_type: true,
          premium_expires_at: true,
        },
      });

      // Verify each user was downgraded
      expect(prisma.user.update).toHaveBeenCalledTimes(2);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { account_type: 'free' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user2' },
        data: { account_type: 'free' },
      });

      // Verify email notifications queued
      expect(emailQueue.add).toHaveBeenCalledTimes(2);
      expect(emailQueue.add).toHaveBeenCalledWith('premium-expired', {
        type: 'premium-expired',
        to: 'user1@test.com',
        data: {
          fullName: 'User One',
          renewUrl: 'https://folkify.com/premium',
        },
      });

      // Verify lock released
      expect(redisClient.del).toHaveBeenCalledWith('cronjob:premium_expiration');

      // Verify result
      expect(result).toEqual({
        success: true,
        affectedUsersCount: 2,
        message: 'Successfully processed 2 expired users',
      });
    });

    it('should skip execution if lock is already held', async () => {
      // Mock lock acquisition failure (already held)
      (redisClient.set as jest.Mock).mockResolvedValue(null);

      // Execute
      const result = await checkExpiredPremium();

      // Verify lock acquisition attempted
      expect(redisClient.set).toHaveBeenCalledWith(
        'cronjob:premium_expiration',
        '1',
        'EX',
        600,
        'NX'
      );

      // Verify no users queried
      expect(prisma.user.findMany).not.toHaveBeenCalled();

      // Verify no lock released (we never acquired it)
      expect(redisClient.del).not.toHaveBeenCalled();

      // Verify result
      expect(result).toEqual({
        success: false,
        affectedUsersCount: 0,
        message: 'Cronjob already running',
      });
    });

    it('should process zero users when no premium expired', async () => {
      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Mock no expired users
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Execute
      const result = await checkExpiredPremium();

      // Verify users query
      expect(prisma.user.findMany).toHaveBeenCalled();

      // Verify no updates
      expect(prisma.user.update).not.toHaveBeenCalled();

      // Verify no emails
      expect(emailQueue.add).not.toHaveBeenCalled();

      // Verify lock released
      expect(redisClient.del).toHaveBeenCalledWith('cronjob:premium_expiration');

      // Verify result
      expect(result).toEqual({
        success: true,
        affectedUsersCount: 0,
        message: 'Successfully processed 0 expired users',
      });
    });

    it('should continue processing other users if one fails', async () => {
      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Mock expired users
      const expiredUsers = [
        {
          id: 'user1',
          email: 'user1@test.com',
          full_name: 'User One',
          account_type: 'basic' as AccountType,
          premium_expires_at: new Date('2024-01-01'),
        },
        {
          id: 'user2',
          email: 'user2@test.com',
          full_name: 'User Two',
          account_type: 'pro' as AccountType,
          premium_expires_at: new Date('2024-01-01'),
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(expiredUsers);

      // Mock first update fails, second succeeds
      (prisma.user.update as jest.Mock)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({});

      (emailQueue.add as jest.Mock).mockResolvedValue({});

      // Execute
      const result = await checkExpiredPremium();

      // Verify both updates attempted
      expect(prisma.user.update).toHaveBeenCalledTimes(2);

      // Verify only one email queued (for successful update)
      expect(emailQueue.add).toHaveBeenCalledTimes(1);
      expect(emailQueue.add).toHaveBeenCalledWith('premium-expired', {
        type: 'premium-expired',
        to: 'user2@test.com',
        data: {
          fullName: 'User Two',
          renewUrl: 'https://folkify.com/premium',
        },
      });

      // Verify lock released
      expect(redisClient.del).toHaveBeenCalledWith('cronjob:premium_expiration');

      // Verify result (still reports 2 users found)
      expect(result).toEqual({
        success: true,
        affectedUsersCount: 2,
        message: 'Successfully processed 2 expired users',
      });
    });

    it('should release lock even if processing fails', async () => {
      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Mock database error
      (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('Database connection lost'));

      // Execute and expect error
      await expect(checkExpiredPremium()).rejects.toThrow('Database connection lost');

      // Verify lock was released despite error
      expect(redisClient.del).toHaveBeenCalledWith('cronjob:premium_expiration');
    });

    it('should only query users with basic or pro account types', async () => {
      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Execute
      await checkExpiredPremium();

      // Verify query filters
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          account_type: { in: ['basic', 'pro'] },
          premium_expires_at: { lte: expect.any(Date) },
        },
        select: expect.any(Object),
      });
    });

    it('should downgrade users to free account type', async () => {
      // Mock lock acquisition
      (redisClient.set as jest.Mock).mockResolvedValue('OK');
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      // Mock one expired user
      const expiredUsers = [
        {
          id: 'user1',
          email: 'user1@test.com',
          full_name: 'User One',
          account_type: 'pro' as AccountType,
          premium_expires_at: new Date('2024-01-01'),
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(expiredUsers);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (emailQueue.add as jest.Mock).mockResolvedValue({});

      // Execute
      await checkExpiredPremium();

      // Verify downgrade to 'free'
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { account_type: 'free' },
      });
    });
  });
});

describe('cleanupOldFiles', () => {
  // Import the function
  let cleanupOldFiles: any;

  beforeAll(async () => {
    const module = await import('./cronjob.service');
    cleanupOldFiles = module.cleanupOldFiles;
  });

  // Mock fs/promises
  const mockFs = {
    access: jest.fn(),
    unlink: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fs module
    jest.mock('fs/promises', () => mockFs);
  });

  it('should acquire lock and delete old AI grading files', async () => {
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
      {
        id: 'session2',
        file_path: '/uploads/ai-grading/user2/file2.mp4',
        submitted_at: new Date('2024-01-01'),
      },
    ];

    (prisma as any).aIGradingSession = {
      findMany: jest.fn().mockResolvedValue(oldSessions),
    };

    // Mock file system operations
    const fs = require('fs/promises');
    fs.access = jest.fn().mockResolvedValue(undefined);
    fs.unlink = jest.fn().mockResolvedValue(undefined);

    // Execute
    const result = await cleanupOldFiles();

    // Verify lock acquisition
    expect(redisClient.set).toHaveBeenCalledWith('cronjob:file_cleanup', '1', 'EX', 600, 'NX');

    // Verify sessions query
    expect((prisma as any).aIGradingSession.findMany).toHaveBeenCalledWith({
      where: {
        submitted_at: { lte: expect.any(Date) },
        file_path: { not: null },
      },
      select: {
        id: true,
        file_path: true,
        submitted_at: true,
      },
    });

    // Verify lock released
    expect(redisClient.del).toHaveBeenCalledWith('cronjob:file_cleanup');

    // Verify result
    expect(result).toEqual({
      success: true,
      deletedFilesCount: expect.any(Number),
      message: expect.stringContaining('Successfully deleted'),
    });
  });

  it('should skip execution if lock is already held', async () => {
    // Mock lock acquisition failure
    (redisClient.set as jest.Mock).mockResolvedValue(null);

    // Execute
    const result = await cleanupOldFiles();

    // Verify lock acquisition attempted
    expect(redisClient.set).toHaveBeenCalledWith('cronjob:file_cleanup', '1', 'EX', 600, 'NX');

    // Verify no sessions queried
    if ((prisma as any).aIGradingSession) {
      expect((prisma as any).aIGradingSession.findMany).not.toHaveBeenCalled();
    }

    // Verify result
    expect(result).toEqual({
      success: false,
      deletedFilesCount: 0,
      message: 'Cronjob already running',
    });
  });

  it('should handle sessions with null file_path', async () => {
    // Mock lock acquisition
    (redisClient.set as jest.Mock).mockResolvedValue('OK');
    (redisClient.del as jest.Mock).mockResolvedValue(1);

    // Mock sessions with null file_path
    const oldSessions = [
      {
        id: 'session1',
        file_path: null,
        submitted_at: new Date('2024-01-01'),
      },
    ];

    (prisma as any).aIGradingSession = {
      findMany: jest.fn().mockResolvedValue(oldSessions),
    };

    // Execute
    const result = await cleanupOldFiles();

    // Verify no files deleted
    expect(result.deletedFilesCount).toBe(0);

    // Verify lock released
    expect(redisClient.del).toHaveBeenCalledWith('cronjob:file_cleanup');
  });

  it('should continue processing if file does not exist', async () => {
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

    // Mock file not found - fs.access should throw
    const fs = require('fs/promises');
    fs.access = jest.fn().mockRejectedValue({ code: 'ENOENT', message: 'file not found' });
    fs.unlink = jest.fn(); // Should not be called

    // Execute
    const result = await cleanupOldFiles();

    // Verify lock released
    expect(redisClient.del).toHaveBeenCalledWith('cronjob:file_cleanup');

    // Verify result (no files deleted because file doesn't exist)
    expect(result.deletedFilesCount).toBe(0);
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  it('should release lock even if processing fails', async () => {
    // Mock lock acquisition
    (redisClient.set as jest.Mock).mockResolvedValue('OK');
    (redisClient.del as jest.Mock).mockResolvedValue(1);

    // Mock database error
    (prisma as any).aIGradingSession = {
      findMany: jest.fn().mockRejectedValue(new Error('Database error')),
    };

    // Execute and expect error
    await expect(cleanupOldFiles()).rejects.toThrow('Database error');

    // Verify lock was released
    expect(redisClient.del).toHaveBeenCalledWith('cronjob:file_cleanup');
  });
});

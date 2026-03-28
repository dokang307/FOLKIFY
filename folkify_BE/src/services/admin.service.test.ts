import {
  getUsersService,
  getUserDetails,
  manualUpgradeUser,
  banUser,
  unbanUser,
  setLessonPremium,
  publishLesson,
  unpublishLesson,
} from './admin.service';
import {
  getUsers,
  getUserById,
  updateUser,
  logAdminActivity,
} from '../repositories/admin.repository';
import { manualUpgrade } from './premium.service';
import { NotFoundError } from '../utils/errors';
import { prisma } from '../config/database';
import redis from '../config/redis';

// Mock dependencies
jest.mock('../repositories/admin.repository');
jest.mock('./premium.service');
jest.mock('../config/database', () => ({
  prisma: {
    lesson: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    del: jest.fn().mockResolvedValue(1),
  },
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const mockGetUsers = getUsers as jest.MockedFunction<typeof getUsers>;
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;
const mockLogAdminActivity = logAdminActivity as jest.MockedFunction<typeof logAdminActivity>;
const mockManualUpgrade = manualUpgrade as jest.MockedFunction<typeof manualUpgrade>;

describe('Admin Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsersService', () => {
    it('should return users with pagination and remove password_hash', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@test.com',
          password_hash: 'hashed_password',
          full_name: 'User One',
          role: 'user' as const,
          account_type: 'free' as const,
          account_status: 'active' as const,
          premium_started_at: null,
          premium_expires_at: null,
          ban_reason: null,
          last_login_at: null,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          user_stats: {
            id: 'stats1',
            user_id: 'user1',
            level: 1,
            total_xp: 0,
            lessons_completed: 0,
            total_practice_minutes: 0,
            current_streak: 0,
            longest_streak: 0,
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      ];

      mockGetUsers.mockResolvedValue({
        users: mockUsers,
        total: 1,
      });

      const result = await getUsersService(
        {
          accountType: 'free',
          accountStatus: 'active',
          search: 'test',
        },
        {
          page: 1,
          limit: 20,
        }
      );

      expect(mockGetUsers).toHaveBeenCalledWith(
        {
          accountType: 'free',
          accountStatus: 'active',
          search: 'test',
        },
        {
          page: 1,
          limit: 20,
        }
      );

      expect(result.users).toHaveLength(1);
      expect(result.users[0]).not.toHaveProperty('password_hash');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should handle empty results', async () => {
      mockGetUsers.mockResolvedValue({
        users: [],
        total: 0,
      });

      const result = await getUsersService({}, { page: 1, limit: 20 });

      expect(result.users).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('getUserDetails', () => {
    it('should return user details without password_hash', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user1@test.com',
        password_hash: 'hashed_password',
        full_name: 'User One',
        role: 'user' as const,
        account_type: 'pro' as const,
        account_status: 'active' as const,
        premium_started_at: new Date(),
        premium_expires_at: new Date(),
        ban_reason: null,
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        user_stats: {
          id: 'stats1',
          user_id: 'user1',
          level: 5,
          total_xp: 5000,
          lessons_completed: 10,
          total_practice_minutes: 300,
          current_streak: 5,
          longest_streak: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        premium_subscriptions: [],
        payment_transactions: [],
      };

      mockGetUserById.mockResolvedValue(mockUser);

      const result = await getUserDetails('user1');

      expect(mockGetUserById).toHaveBeenCalledWith('user1');
      expect(result).not.toHaveProperty('password_hash');
      expect(result.id).toBe('user1');
      expect(result.email).toBe('user1@test.com');
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockGetUserById.mockResolvedValue(null);

      await expect(getUserDetails('nonexistent')).rejects.toThrow(NotFoundError);
      await expect(getUserDetails('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('manualUpgradeUser', () => {
    it('should call premium service manualUpgrade', async () => {
      const mockResult = {
        message: 'User upgraded successfully',
        user: {
          id: 'user1',
          email: 'user1@test.com',
          account_type: 'pro' as const,
          premium_started_at: new Date(),
          premium_expires_at: new Date(),
        },
      };

      mockManualUpgrade.mockResolvedValue(mockResult);

      const result = await manualUpgradeUser(
        'user1',
        'pro',
        3,
        'admin1',
        'Test upgrade',
        '127.0.0.1',
        'test-agent'
      );

      expect(mockManualUpgrade).toHaveBeenCalledWith({
        userId: 'user1',
        planType: 'pro',
        durationMonths: 3,
        adminId: 'admin1',
        notes: 'Test upgrade',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('banUser', () => {
    it('should ban user and log activity', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user1@test.com',
        password_hash: 'hashed_password',
        full_name: 'User One',
        role: 'user' as const,
        account_type: 'free' as const,
        account_status: 'active' as const,
        premium_started_at: null,
        premium_expires_at: null,
        ban_reason: null,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        user_stats: null,
        premium_subscriptions: [],
        payment_transactions: [],
      };

      const mockUpdatedUser = {
        ...mockUser,
        account_status: 'banned' as const,
        ban_reason: 'Violation of terms',
      };

      mockGetUserById.mockResolvedValue(mockUser);
      mockUpdateUser.mockResolvedValue(mockUpdatedUser);
      mockLogAdminActivity.mockResolvedValue();

      const result = await banUser(
        'user1',
        'Violation of terms',
        'admin1',
        '127.0.0.1',
        'test-agent'
      );

      expect(mockGetUserById).toHaveBeenCalledWith('user1');
      expect(mockUpdateUser).toHaveBeenCalledWith('user1', {
        account_status: 'banned',
        ban_reason: 'Violation of terms',
      });
      expect(mockLogAdminActivity).toHaveBeenCalledWith({
        admin_id: 'admin1',
        action: 'ban_user',
        resource_type: 'user',
        resource_id: 'user1',
        changes: {
          old_account_status: 'active',
          new_account_status: 'banned',
          reason: 'Violation of terms',
        },
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
      });

      expect(result.message).toBe('User banned successfully');
      expect(result.user).not.toHaveProperty('password_hash');
      expect(result.user.account_status).toBe('banned');
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockGetUserById.mockResolvedValue(null);

      await expect(banUser('nonexistent', 'reason', 'admin1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('unbanUser', () => {
    it('should unban user and log activity', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user1@test.com',
        password_hash: 'hashed_password',
        full_name: 'User One',
        role: 'user' as const,
        account_type: 'free' as const,
        account_status: 'banned' as const,
        premium_started_at: null,
        premium_expires_at: null,
        ban_reason: 'Violation of terms',
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        user_stats: null,
        premium_subscriptions: [],
        payment_transactions: [],
      };

      const mockUpdatedUser = {
        ...mockUser,
        account_status: 'active' as const,
        ban_reason: null,
      };

      mockGetUserById.mockResolvedValue(mockUser);
      mockUpdateUser.mockResolvedValue(mockUpdatedUser);
      mockLogAdminActivity.mockResolvedValue();

      const result = await unbanUser('user1', 'admin1', '127.0.0.1', 'test-agent');

      expect(mockGetUserById).toHaveBeenCalledWith('user1');
      expect(mockUpdateUser).toHaveBeenCalledWith('user1', {
        account_status: 'active',
        ban_reason: null,
      });
      expect(mockLogAdminActivity).toHaveBeenCalledWith({
        admin_id: 'admin1',
        action: 'unban_user',
        resource_type: 'user',
        resource_id: 'user1',
        changes: {
          old_account_status: 'banned',
          new_account_status: 'active',
        },
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
      });

      expect(result.message).toBe('User unbanned successfully');
      expect(result.user).not.toHaveProperty('password_hash');
      expect(result.user.account_status).toBe('active');
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockGetUserById.mockResolvedValue(null);

      await expect(unbanUser('nonexistent', 'admin1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('setLessonPremium', () => {
    it('should set lesson premium status and invalidate cache', async () => {
      const mockLesson = {
        id: 'lesson1',
        instrument_id: 'instrument1',
        title: 'Test Lesson',
        duration: 30,
        level: 'Beginner' as const,
        status: 'published' as const,
        is_premium: false,
        youtube_embed_url: null,
        video_thumb: null,
        description: 'Test description',
        xp: 100,
        order_index: 0,
        steps: null,
        tips: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        instrument: {
          id: 'instrument1',
          name: 'Đàn tranh',
          english_name: 'Vietnamese Zither',
          region: 'South',
          category: 'String',
          emoji: null,
          color: null,
          bg_gradient: null,
          image: null,
          short_desc: null,
          description: null,
          origin: null,
          material: null,
          sound_range: null,
          difficulty: null,
          popularity: 0,
          facts: null,
          order_index: 0,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
      };

      const mockUpdatedLesson = {
        ...mockLesson,
        is_premium: true,
      };

      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);
      (prisma.lesson.update as jest.Mock).mockResolvedValue(mockUpdatedLesson);
      mockLogAdminActivity.mockResolvedValue();

      const result = await setLessonPremium('lesson1', true, 'admin1', '127.0.0.1', 'test-agent');

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 'lesson1' },
        include: { instrument: true },
      });
      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson1' },
        data: { is_premium: true },
      });
      expect(redis.del).toHaveBeenCalledWith('lessons:instrument1');
      expect(mockLogAdminActivity).toHaveBeenCalledWith({
        admin_id: 'admin1',
        action: 'set_lesson_premium',
        resource_type: 'lesson',
        resource_id: 'lesson1',
        changes: {
          old_is_premium: false,
          new_is_premium: true,
        },
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
      });

      expect(result.message).toBe('Lesson premium status updated successfully');
      expect(result.lesson.is_premium).toBe(true);
    });

    it('should throw NotFoundError if lesson does not exist', async () => {
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(setLessonPremium('nonexistent', true, 'admin1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('publishLesson', () => {
    it('should publish lesson and invalidate cache', async () => {
      const mockLesson = {
        id: 'lesson1',
        instrument_id: 'instrument1',
        title: 'Test Lesson',
        duration: 30,
        level: 'Beginner' as const,
        status: 'draft' as const,
        is_premium: false,
        youtube_embed_url: null,
        video_thumb: null,
        description: 'Test description',
        xp: 100,
        order_index: 0,
        steps: null,
        tips: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        instrument: {
          id: 'instrument1',
          name: 'Đàn tranh',
          english_name: 'Vietnamese Zither',
          region: 'South',
          category: 'String',
          emoji: null,
          color: null,
          bg_gradient: null,
          image: null,
          short_desc: null,
          description: null,
          origin: null,
          material: null,
          sound_range: null,
          difficulty: null,
          popularity: 0,
          facts: null,
          order_index: 0,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
      };

      const mockUpdatedLesson = {
        ...mockLesson,
        status: 'published' as const,
      };

      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);
      (prisma.lesson.update as jest.Mock).mockResolvedValue(mockUpdatedLesson);
      mockLogAdminActivity.mockResolvedValue();

      const result = await publishLesson('lesson1', 'admin1', '127.0.0.1', 'test-agent');

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 'lesson1' },
        include: { instrument: true },
      });
      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson1' },
        data: { status: 'published' },
      });
      expect(redis.del).toHaveBeenCalledWith('lessons:instrument1');
      expect(mockLogAdminActivity).toHaveBeenCalledWith({
        admin_id: 'admin1',
        action: 'publish_lesson',
        resource_type: 'lesson',
        resource_id: 'lesson1',
        changes: {
          old_status: 'draft',
          new_status: 'published',
        },
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
      });

      expect(result.message).toBe('Lesson published successfully');
      expect(result.lesson.status).toBe('published');
    });

    it('should throw NotFoundError if lesson does not exist', async () => {
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(publishLesson('nonexistent', 'admin1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('unpublishLesson', () => {
    it('should unpublish lesson and invalidate cache', async () => {
      const mockLesson = {
        id: 'lesson1',
        instrument_id: 'instrument1',
        title: 'Test Lesson',
        duration: 30,
        level: 'Beginner' as const,
        status: 'published' as const,
        is_premium: false,
        youtube_embed_url: null,
        video_thumb: null,
        description: 'Test description',
        xp: 100,
        order_index: 0,
        steps: null,
        tips: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        instrument: {
          id: 'instrument1',
          name: 'Đàn tranh',
          english_name: 'Vietnamese Zither',
          region: 'South',
          category: 'String',
          emoji: null,
          color: null,
          bg_gradient: null,
          image: null,
          short_desc: null,
          description: null,
          origin: null,
          material: null,
          sound_range: null,
          difficulty: null,
          popularity: 0,
          facts: null,
          order_index: 0,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
      };

      const mockUpdatedLesson = {
        ...mockLesson,
        status: 'draft' as const,
      };

      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);
      (prisma.lesson.update as jest.Mock).mockResolvedValue(mockUpdatedLesson);
      mockLogAdminActivity.mockResolvedValue();

      const result = await unpublishLesson('lesson1', 'admin1', '127.0.0.1', 'test-agent');

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 'lesson1' },
        include: { instrument: true },
      });
      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson1' },
        data: { status: 'draft' },
      });
      expect(redis.del).toHaveBeenCalledWith('lessons:instrument1');
      expect(mockLogAdminActivity).toHaveBeenCalledWith({
        admin_id: 'admin1',
        action: 'unpublish_lesson',
        resource_type: 'lesson',
        resource_id: 'lesson1',
        changes: {
          old_status: 'published',
          new_status: 'draft',
        },
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
      });

      expect(result.message).toBe('Lesson unpublished successfully');
      expect(result.lesson.status).toBe('draft');
    });

    it('should throw NotFoundError if lesson does not exist', async () => {
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(unpublishLesson('nonexistent', 'admin1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getActivityLogs', () => {
    it('should get activity logs with pagination', async () => {
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
        {
          id: 'log-2',
          admin_id: 'admin-1',
          action: 'ban_user',
          resource_type: 'user',
          resource_id: 'user-2',
          changes: { status: 'banned' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
          created_at: new Date('2024-01-02'),
        },
      ];

      // Mock the repository module
      const mockGetActivityLogsRepo = jest.fn().mockResolvedValue({
        logs: mockLogs,
        total: 2,
      });

      jest.doMock('../repositories/adminActivity.repository', () => ({
        getActivityLogs: mockGetActivityLogsRepo,
      }));

      // Clear module cache and re-import
      jest.resetModules();
      const { getActivityLogs } = await import('./admin.service');

      const result = await getActivityLogs({}, { page: 1, limit: 20 });

      expect(result.logs).toEqual(mockLogs);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should calculate totalPages correctly', async () => {
      const mockGetActivityLogsRepo = jest.fn().mockResolvedValue({
        logs: [],
        total: 25,
      });

      jest.doMock('../repositories/adminActivity.repository', () => ({
        getActivityLogs: mockGetActivityLogsRepo,
      }));

      jest.resetModules();
      const { getActivityLogs } = await import('./admin.service');

      const result = await getActivityLogs({}, { page: 1, limit: 10 });

      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.total).toBe(25);
    });

    it('should pass filters to repository', async () => {
      const mockGetActivityLogsRepo = jest.fn().mockResolvedValue({
        logs: [],
        total: 0,
      });

      jest.doMock('../repositories/adminActivity.repository', () => ({
        getActivityLogs: mockGetActivityLogsRepo,
      }));

      jest.resetModules();
      const { getActivityLogs } = await import('./admin.service');

      const filters = {
        action: 'ban_user',
        resource_type: 'user',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      await getActivityLogs(filters, { page: 1, limit: 20 });

      expect(mockGetActivityLogsRepo).toHaveBeenCalledWith(filters, { page: 1, limit: 20 });
    });
  });
});

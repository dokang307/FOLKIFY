import { canAccessLesson, getLessonWithAccess, completeLesson } from './lesson.service';
import { getLessonById } from '../repositories/lesson.repository';
import { findUserById } from '../repositories/user.repository';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { User, Lesson, AccountType } from '@prisma/client';

// Mock dependencies
jest.mock('../repositories/lesson.repository');
jest.mock('../repositories/user.repository');

jest.mock('../config/database', () => ({
  prisma: {
    userProgress: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    userStats: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Import after mocking
import { prisma } from '../config/database';

describe('Lesson Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canAccessLesson', () => {
    const mockLesson = {
      id: 'lesson1',
      is_premium: true,
      order_index: 5,
    } as Lesson;

    it('should allow access to free lessons for all users', () => {
      const freeLesson = { ...mockLesson, is_premium: false };
      const freeUser = { account_type: 'free' as AccountType } as User;

      const result = canAccessLesson(freeUser, freeLesson);

      expect(result).toBe(true);
    });

    it('should allow free users to access first 3 premium lessons', () => {
      const earlyLesson = { ...mockLesson, order_index: 2 };
      const freeUser = { account_type: 'free' as AccountType } as User;

      const result = canAccessLesson(freeUser, earlyLesson);

      expect(result).toBe(true);
    });

    it('should deny free users access to premium lessons beyond first 3', () => {
      const freeUser = { account_type: 'free' as AccountType } as User;

      const result = canAccessLesson(freeUser, mockLesson);

      expect(result).toBe(false);
    });

    it('should allow premium users with active subscription to access all lessons', () => {
      const premiumUser = {
        account_type: 'basic' as AccountType,
        premium_expires_at: new Date(Date.now() + 86400000), // Tomorrow
      } as User;

      const result = canAccessLesson(premiumUser, mockLesson);

      expect(result).toBe(true);
    });

    it('should deny premium users with expired subscription', () => {
      const expiredUser = {
        account_type: 'basic' as AccountType,
        premium_expires_at: new Date(Date.now() - 86400000), // Yesterday
      } as User;

      const result = canAccessLesson(expiredUser, mockLesson);

      expect(result).toBe(false);
    });

    it('should deny premium users with null expiration date', () => {
      const userWithNullExpiry = {
        account_type: 'basic' as AccountType,
        premium_expires_at: null,
      } as User;

      const result = canAccessLesson(userWithNullExpiry, mockLesson);

      expect(result).toBe(false);
    });
  });

  describe('getLessonWithAccess', () => {
    const mockLesson = {
      id: 'lesson1',
      title: 'Test Lesson',
      is_premium: true,
      order_index: 5,
      instrument: { id: 'instrument1', name: 'Đàn Tranh' },
    } as any;

    const mockUser = {
      id: 'user1',
      account_type: 'free' as AccountType,
    } as User;

    it('should return lesson with access flags and progress', async () => {
      (getLessonById as jest.Mock).mockResolvedValue(mockLesson);
      (findUserById as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue({
        completed: true,
        progress_percentage: 100,
      });

      const result = await getLessonWithAccess('lesson1', 'user1');

      expect(result).toMatchObject({
        id: 'lesson1',
        has_access: false,
        requires_premium: true,
        completed: true,
        progress_percentage: 100,
      });
    });

    it('should throw NotFoundError if lesson not found', async () => {
      (getLessonById as jest.Mock).mockResolvedValue(null);

      await expect(getLessonWithAccess('nonexistent', 'user1')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if user not found', async () => {
      (getLessonById as jest.Mock).mockResolvedValue(mockLesson);
      (findUserById as jest.Mock).mockResolvedValue(null);

      await expect(getLessonWithAccess('lesson1', 'nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should return default progress if no progress exists', async () => {
      (getLessonById as jest.Mock).mockResolvedValue(mockLesson);
      (findUserById as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getLessonWithAccess('lesson1', 'user1');

      expect(result.completed).toBe(false);
      expect(result.progress_percentage).toBe(0);
    });
  });

  describe('completeLesson', () => {
    const mockLesson = {
      id: 'lesson1',
      xp: 100,
      is_premium: false,
      order_index: 0,
    } as Lesson;

    const mockUser = {
      id: 'user1',
      account_type: 'free' as AccountType,
    } as User;

    const mockStats = {
      user_id: 'user1',
      total_xp: 500,
      level: 1,
      lessons_completed: 5,
    };

    beforeEach(() => {
      // Setup transaction mock to execute callback with prisma
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(prisma);
      });

      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.userStats.findUnique as jest.Mock).mockResolvedValue(mockStats);
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userProgress.upsert as jest.Mock).mockResolvedValue({});
      (prisma.userStats.update as jest.Mock).mockResolvedValue({});
    });

    it('should complete lesson and award XP', async () => {
      const result = await completeLesson('lesson1', 'user1');

      expect(result).toEqual({
        xp_earned: 100,
        new_total_xp: 600,
        new_level: 1,
        level_up: false,
      });

      expect(prisma.userProgress.upsert).toHaveBeenCalledWith({
        where: {
          user_id_lesson_id: {
            user_id: 'user1',
            lesson_id: 'lesson1',
          },
        },
        update: {
          completed: true,
          progress_percentage: 100,
          completed_at: expect.any(Date),
        },
        create: {
          user_id: 'user1',
          lesson_id: 'lesson1',
          completed: true,
          progress_percentage: 100,
          completed_at: expect.any(Date),
        },
      });

      expect(prisma.userStats.update).toHaveBeenCalledWith({
        where: { user_id: 'user1' },
        data: {
          total_xp: 600,
          level: 1,
          lessons_completed: { increment: 1 },
        },
      });
    });

    it('should trigger level up when XP threshold is reached', async () => {
      (prisma.userStats.findUnique as jest.Mock).mockResolvedValue({
        ...mockStats,
        total_xp: 950,
        level: 1,
      });

      const result = await completeLesson('lesson1', 'user1');

      expect(result).toEqual({
        xp_earned: 100,
        new_total_xp: 1050,
        new_level: 2,
        level_up: true,
      });
    });

    it('should not award XP if lesson already completed', async () => {
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue({
        completed: true,
      });

      const result = await completeLesson('lesson1', 'user1');

      expect(result.xp_earned).toBe(0);
      expect(prisma.userStats.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if lesson not found', async () => {
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(completeLesson('nonexistent', 'user1')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(completeLesson('lesson1', 'nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user does not have access', async () => {
      const premiumLesson = {
        ...mockLesson,
        is_premium: true,
        order_index: 5,
      };
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(premiumLesson);

      await expect(completeLesson('lesson1', 'user1')).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if user stats not found', async () => {
      (prisma.userStats.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(completeLesson('lesson1', 'user1')).rejects.toThrow(NotFoundError);
    });
  });
});

import {
  startPracticeSession,
  endPracticeSession,
  calculateStreak,
  getPracticeHistory,
} from './practiceSession.service';
import { createSession, getSessionHistory } from '../repositories/practiceSession.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

// Mock dependencies
jest.mock('../repositories/practiceSession.repository');

jest.mock('../config/database', () => ({
  prisma: {
    practiceSession: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    userStats: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Import after mocking
import { prisma } from '../config/database';

describe('Practice Session Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startPracticeSession', () => {
    it('should create a new practice session', async () => {
      const mockSession = {
        id: 'session1',
        user_id: 'user1',
        started_at: new Date(),
        status: 'active',
      };

      (createSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await startPracticeSession('user1', 'lesson1', 'instrument1');

      expect(result).toEqual({
        sessionId: 'session1',
        startedAt: mockSession.started_at,
      });

      expect(createSession).toHaveBeenCalledWith({
        user: { connect: { id: 'user1' } },
        lesson: { connect: { id: 'lesson1' } },
        instrument: { connect: { id: 'instrument1' } },
        started_at: expect.any(Date),
        status: 'active',
      });
    });

    it('should create session without lesson and instrument', async () => {
      const mockSession = {
        id: 'session1',
        user_id: 'user1',
        started_at: new Date(),
        status: 'active',
      };

      (createSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await startPracticeSession('user1');

      expect(result.sessionId).toBe('session1');
      expect(createSession).toHaveBeenCalledWith({
        user: { connect: { id: 'user1' } },
        lesson: undefined,
        instrument: undefined,
        started_at: expect.any(Date),
        status: 'active',
      });
    });
  });

  describe('endPracticeSession', () => {
    const mockSession = {
      id: 'session1',
      user_id: 'user1',
      started_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      status: 'active',
    };

    const mockStats = {
      user_id: 'user1',
      total_xp: 500,
      level: 1,
      total_practice_minutes: 100,
      current_streak: 1,
      longest_streak: 5,
    };

    beforeEach(() => {
      // Setup transaction mock to execute callback with prisma
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(prisma);
      });

      (prisma.practiceSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.userStats.findUnique as jest.Mock).mockResolvedValue(mockStats);
      (prisma.practiceSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.practiceSession.update as jest.Mock).mockResolvedValue({});
      (prisma.userStats.update as jest.Mock).mockResolvedValue({});
    });

    it('should end practice session and award XP', async () => {
      const result = await endPracticeSession('session1', 'user1');

      expect(result.durationMinutes).toBeGreaterThan(0);
      expect(result.xpEarned).toBe(result.durationMinutes);
      expect(result.newTotalXp).toBe(500 + result.durationMinutes);
      expect(result.currentStreak).toBe(1);

      expect(prisma.practiceSession.update).toHaveBeenCalledWith({
        where: { id: 'session1' },
        data: {
          ended_at: expect.any(Date),
          duration_minutes: expect.any(Number),
          xp_earned: expect.any(Number),
          status: 'completed',
        },
      });

      expect(prisma.userStats.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError if session not found', async () => {
      (prisma.practiceSession.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(endPracticeSession('nonexistent', 'user1')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user does not own session', async () => {
      await expect(endPracticeSession('session1', 'user2')).rejects.toThrow(ForbiddenError);
    });

    it('should throw BadRequestError if session is not active', async () => {
      (prisma.practiceSession.findUnique as jest.Mock).mockResolvedValue({
        ...mockSession,
        status: 'completed',
      });

      await expect(endPracticeSession('session1', 'user1')).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if session exceeds 8 hours', async () => {
      const longSession = {
        ...mockSession,
        started_at: new Date(Date.now() - 9 * 60 * 60 * 1000), // 9 hours ago
      };
      (prisma.practiceSession.findUnique as jest.Mock).mockResolvedValue(longSession);

      await expect(endPracticeSession('session1', 'user1')).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if user stats not found', async () => {
      (prisma.userStats.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(endPracticeSession('session1', 'user1')).rejects.toThrow(NotFoundError);
    });

    it('should update longest streak if current streak exceeds it', async () => {
      (prisma.userStats.findUnique as jest.Mock).mockResolvedValue({
        ...mockStats,
        current_streak: 5,
        longest_streak: 3,
      });

      const lastPractice = {
        ended_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      };
      (prisma.practiceSession.findFirst as jest.Mock).mockResolvedValue(lastPractice);

      await endPracticeSession('session1', 'user1');

      expect(prisma.userStats.update).toHaveBeenCalledWith({
        where: { user_id: 'user1' },
        data: expect.objectContaining({
          longest_streak: 6, // current_streak + 1
        }),
      });
    });
  });

  describe('calculateStreak', () => {
    const mockTx = prisma;

    beforeEach(() => {
      (prisma.userStats.findUnique as jest.Mock).mockResolvedValue({
        current_streak: 5,
      });
    });

    it('should return 1 if no previous practice', async () => {
      (prisma.practiceSession.findFirst as jest.Mock).mockResolvedValue(null);

      const streak = await calculateStreak('user1', new Date(), mockTx);

      expect(streak).toBe(1);
    });

    it('should increment streak if last practice within 24 hours', async () => {
      const lastPractice = {
        ended_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      };
      (prisma.practiceSession.findFirst as jest.Mock).mockResolvedValue(lastPractice);

      const streak = await calculateStreak('user1', new Date(), mockTx);

      expect(streak).toBe(6); // 5 + 1
    });

    it('should reset streak to 1 if last practice over 24 hours ago', async () => {
      const lastPractice = {
        ended_at: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      };
      (prisma.practiceSession.findFirst as jest.Mock).mockResolvedValue(lastPractice);

      const streak = await calculateStreak('user1', new Date(), mockTx);

      expect(streak).toBe(1);
    });

    it('should return 1 if last practice has no ended_at', async () => {
      const lastPractice = {
        ended_at: null,
      };
      (prisma.practiceSession.findFirst as jest.Mock).mockResolvedValue(lastPractice);

      const streak = await calculateStreak('user1', new Date(), mockTx);

      expect(streak).toBe(1);
    });
  });

  describe('getPracticeHistory', () => {
    it('should return practice history with pagination', async () => {
      const mockSessions = [
        { id: 'session1', duration_minutes: 30 },
        { id: 'session2', duration_minutes: 45 },
      ];

      (getSessionHistory as jest.Mock).mockResolvedValue({
        sessions: mockSessions,
        total: 10,
      });

      const result = await getPracticeHistory('user1', { page: 1, limit: 20 });

      expect(result.sessions).toEqual(mockSessions);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 10,
        totalPages: 1,
      });
    });

    it('should pass date filters to repository', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (getSessionHistory as jest.Mock).mockResolvedValue({
        sessions: [],
        total: 0,
      });

      await getPracticeHistory('user1', { startDate, endDate, page: 2, limit: 10 });

      expect(getSessionHistory).toHaveBeenCalledWith('user1', {
        startDate,
        endDate,
        page: 2,
        limit: 10,
      });
    });
  });
});

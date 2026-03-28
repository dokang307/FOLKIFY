import { prisma } from '../config/database';
import { aiGradingQueue } from '../config/queues';
import { submitAIGrading, getAIGradingResult, getAIGradingHistory } from './aiGrading.service';
import { ForbiddenError, NotFoundError } from '../utils/errors';

// Mock the queue
jest.mock('../config/queues', () => ({
  aiGradingQueue: {
    add: jest.fn(),
  },
}));

describe('AI Grading Service', () => {
  let proUserId: string;
  let freeUserId: string;
  let testLessonId: string;

  beforeAll(async () => {
    // Create PRO user
    const proUser = await prisma.user.create({
      data: {
        email: 'prouser@test.com',
        password_hash: 'hashedpassword',
        full_name: 'PRO User',
        account_type: 'pro',
        premium_started_at: new Date(),
        premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        user_stats: {
          create: {
            level: 1,
            total_xp: 0,
          },
        },
      },
    });
    proUserId = proUser.id;

    // Create FREE user
    const freeUser = await prisma.user.create({
      data: {
        email: 'freeuser@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Free User',
        account_type: 'free',
        user_stats: {
          create: {
            level: 1,
            total_xp: 0,
          },
        },
      },
    });
    freeUserId = freeUser.id;

    // Create test lesson
    const instrument = await prisma.instrument.create({
      data: {
        name: 'Test Instrument',
        english_name: 'Test Instrument',
        region: 'Test Region',
        category: 'Test Category',
      },
    });

    const lesson = await prisma.lesson.create({
      data: {
        instrument_id: instrument.id,
        title: 'Test Lesson',
        duration: 30,
        level: 'Beginner',
        status: 'published',
      },
    });
    testLessonId = lesson.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.aIGradingSession.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.instrument.deleteMany({});
    await prisma.userStats.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitAIGrading', () => {
    it('should submit AI grading for PRO user', async () => {
      const result = await submitAIGrading(
        proUserId,
        testLessonId,
        '/uploads/ai-grading/test-user/test-file.mp3'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.message).toBe('Your submission is being processed');
      expect(result.sessionId).toBeDefined();

      // Verify queue was called
      expect(aiGradingQueue.add).toHaveBeenCalledWith(
        'grade-submission',
        expect.objectContaining({
          sessionId: result.sessionId,
          filePath: '/uploads/ai-grading/test-user/test-file.mp3',
        }),
        expect.any(Object)
      );
    });

    it('should throw ForbiddenError for FREE user', async () => {
      await expect(
        submitAIGrading(freeUserId, testLessonId, '/uploads/ai-grading/test-user/test-file.mp3')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(
        submitAIGrading(
          '00000000-0000-0000-0000-000000000000',
          testLessonId,
          '/uploads/ai-grading/test-user/test-file.mp3'
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should submit without lesson_id', async () => {
      const result = await submitAIGrading(
        proUserId,
        undefined,
        '/uploads/ai-grading/test-user/test-file2.mp3'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
    });
  });

  describe('getAIGradingResult', () => {
    let sessionId: string;

    beforeAll(async () => {
      const session = await prisma.aIGradingSession.create({
        data: {
          user_id: proUserId,
          lesson_id: testLessonId,
          file_path: '/uploads/ai-grading/test-user/test-file.mp3',
          status: 'completed',
          ai_score: 85,
          criteria_scores: {
            rhythm: 80,
            pitch: 85,
            technique: 90,
            expression: 85,
          },
          ai_feedback: 'Good performance!',
          improvement_suggestions: ['Practice rhythm', 'Work on pitch'],
          submitted_at: new Date(),
          completed_at: new Date(),
        },
      });
      sessionId = session.id;
    });

    it('should get AI grading result for owner', async () => {
      const result = await getAIGradingResult(sessionId, proUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(sessionId);
      expect(result.status).toBe('completed');
      expect(result.ai_score).toBe(85);
    });

    it('should throw ForbiddenError for non-owner', async () => {
      await expect(getAIGradingResult(sessionId, freeUserId)).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError for non-existent session', async () => {
      await expect(
        getAIGradingResult('00000000-0000-0000-0000-000000000000', proUserId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAIGradingHistory', () => {
    beforeAll(async () => {
      // Create multiple sessions
      for (let i = 0; i < 5; i++) {
        await prisma.aIGradingSession.create({
          data: {
            user_id: proUserId,
            file_path: `/uploads/ai-grading/test-user/test-file-${i}.mp3`,
            status: 'pending',
            submitted_at: new Date(),
          },
        });
      }
    });

    it('should get AI grading history with pagination', async () => {
      const result = await getAIGradingHistory(proUserId, 1, 3);

      expect(result).toBeDefined();
      expect(result.sessions).toBeDefined();
      expect(result.sessions.length).toBeLessThanOrEqual(3);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(3);
      expect(result.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it('should calculate total pages correctly', async () => {
      const result = await getAIGradingHistory(proUserId, 1, 2);

      expect(result.pagination.totalPages).toBe(Math.ceil(result.pagination.total / 2));
    });

    it('should return empty array for user with no sessions', async () => {
      const result = await getAIGradingHistory(freeUserId, 1, 20);

      expect(result.sessions).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });
});

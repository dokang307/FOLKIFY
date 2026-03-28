import { prisma } from '../config/database';
import { createSession, getSessionById, getSessionHistory } from './aiGrading.repository';

describe('AI Grading Repository', () => {
  let testUserId: string;
  let testLessonId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'aigrading@test.com',
        password_hash: 'hashedpassword',
        full_name: 'AI Grading Test User',
        account_type: 'pro',
        premium_started_at: new Date(),
        premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        user_stats: {
          create: {
            level: 1,
            total_xp: 0,
          },
        },
      },
    });
    testUserId = user.id;

    // Create test instrument and lesson
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
    // Clean up test data
    await prisma.aIGradingSession.deleteMany({ where: { user_id: testUserId } });
    await prisma.lesson.deleteMany({});
    await prisma.instrument.deleteMany({});
    await prisma.userStats.deleteMany({ where: { user_id: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('createSession', () => {
    it('should create a new AI grading session', async () => {
      const session = await createSession({
        user: { connect: { id: testUserId } },
        lesson: { connect: { id: testLessonId } },
        file_path: '/uploads/ai-grading/test-user/test-file.mp3',
        status: 'pending',
        submitted_at: new Date(),
      });

      expect(session).toBeDefined();
      expect(session.user_id).toBe(testUserId);
      expect(session.lesson_id).toBe(testLessonId);
      expect(session.status).toBe('pending');
      expect(session.file_path).toBe('/uploads/ai-grading/test-user/test-file.mp3');
    });

    it('should create session without lesson_id', async () => {
      const session = await createSession({
        user: { connect: { id: testUserId } },
        file_path: '/uploads/ai-grading/test-user/test-file2.mp3',
        status: 'pending',
        submitted_at: new Date(),
      });

      expect(session).toBeDefined();
      expect(session.user_id).toBe(testUserId);
      expect(session.lesson_id).toBeNull();
      expect(session.status).toBe('pending');
    });
  });

  describe('getSessionById', () => {
    it('should get session by ID', async () => {
      const created = await createSession({
        user: { connect: { id: testUserId } },
        file_path: '/uploads/ai-grading/test-user/test-file3.mp3',
        status: 'pending',
        submitted_at: new Date(),
      });

      const session = await getSessionById(created.id);
      expect(session).toBeDefined();
      expect(session?.id).toBe(created.id);
      expect(session?.user_id).toBe(testUserId);
    });

    it('should return null for non-existent session', async () => {
      const session = await getSessionById('00000000-0000-0000-0000-000000000000');
      expect(session).toBeNull();
    });
  });

  describe('getSessionHistory', () => {
    beforeAll(async () => {
      // Create multiple sessions for pagination test
      for (let i = 0; i < 5; i++) {
        await createSession({
          user: { connect: { id: testUserId } },
          file_path: `/uploads/ai-grading/test-user/test-file-${i}.mp3`,
          status: 'pending',
          submitted_at: new Date(),
        });
      }
    });

    it('should get session history with pagination', async () => {
      const { sessions, total } = await getSessionHistory(testUserId, 1, 3);

      expect(sessions).toBeDefined();
      expect(sessions.length).toBeLessThanOrEqual(3);
      expect(total).toBeGreaterThanOrEqual(5);
    });

    it('should return sessions in descending order by submitted_at', async () => {
      const { sessions } = await getSessionHistory(testUserId, 1, 10);

      for (let i = 0; i < sessions.length - 1; i++) {
        expect(sessions[i].submitted_at.getTime()).toBeGreaterThanOrEqual(
          sessions[i + 1].submitted_at.getTime()
        );
      }
    });

    it('should handle pagination correctly', async () => {
      const page1 = await getSessionHistory(testUserId, 1, 2);
      const page2 = await getSessionHistory(testUserId, 2, 2);

      expect(page1.sessions.length).toBe(2);
      expect(page2.sessions.length).toBeGreaterThan(0);
      expect(page1.sessions[0].id).not.toBe(page2.sessions[0].id);
    });
  });
});

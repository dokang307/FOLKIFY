import request from 'supertest';
import express, { Application } from 'express';
import { prisma } from '../config/database';
import { generateAccessToken } from '../utils/jwt';
import aiGradingRoutes from '../routes/aiGrading.routes';
import path from 'path';
import fs from 'fs';

// Mock the queue
jest.mock('../config/queues', () => ({
  aiGradingQueue: {
    add: jest.fn(),
  },
}));

describe('AI Grading Controller', () => {
  let app: Application;
  let proUserId: string;
  let proUserToken: string;
  let freeUserId: string;
  let freeUserToken: string;
  let testLessonId: string;
  let testFilePath: string;

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/ai-grading', aiGradingRoutes);

    // Create PRO user
    const proUser = await prisma.user.create({
      data: {
        email: 'prouser-controller@test.com',
        password_hash: 'hashedpassword',
        full_name: 'PRO User Controller',
        account_type: 'pro',
        role: 'user',
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
    proUserToken = generateAccessToken(proUser.id, proUser.role);

    // Create FREE user
    const freeUser = await prisma.user.create({
      data: {
        email: 'freeuser-controller@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Free User Controller',
        account_type: 'free',
        role: 'user',
        user_stats: {
          create: {
            level: 1,
            total_xp: 0,
          },
        },
      },
    });
    freeUserId = freeUser.id;
    freeUserToken = generateAccessToken(freeUser.id, freeUser.role);

    // Create test lesson
    const instrument = await prisma.instrument.create({
      data: {
        name: 'Test Instrument Controller',
        english_name: 'Test Instrument Controller',
        region: 'Test Region',
        category: 'Test Category',
      },
    });

    const lesson = await prisma.lesson.create({
      data: {
        instrument_id: instrument.id,
        title: 'Test Lesson Controller',
        duration: 30,
        level: 'Beginner',
        status: 'published',
      },
    });
    testLessonId = lesson.id;

    // Create test file
    const uploadDir = path.join(process.cwd(), 'uploads', 'ai-grading', proUserId);
    fs.mkdirSync(uploadDir, { recursive: true });
    testFilePath = path.join(uploadDir, 'test-audio.mp3');
    fs.writeFileSync(testFilePath, 'fake audio content');
  });

  afterAll(async () => {
    // Clean up
    await prisma.aIGradingSession.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.instrument.deleteMany({});
    await prisma.userStats.deleteMany({});
    await prisma.user.deleteMany({});

    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    await prisma.$disconnect();
  });

  describe('POST /api/ai-grading/submit', () => {
    it('should submit AI grading for PRO user', async () => {
      const response = await request(app)
        .post('/api/ai-grading/submit')
        .set('Authorization', `Bearer ${proUserToken}`)
        .field('lessonId', testLessonId)
        .attach('file', testFilePath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.status).toBe('pending');
    });

    it('should return 403 for FREE user', async () => {
      const response = await request(app)
        .post('/api/ai-grading/submit')
        .set('Authorization', `Bearer ${freeUserToken}`)
        .field('lessonId', testLessonId)
        .attach('file', testFilePath);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/ai-grading/submit')
        .field('lessonId', testLessonId)
        .attach('file', testFilePath);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 without file', async () => {
      const response = await request(app)
        .post('/api/ai-grading/submit')
        .set('Authorization', `Bearer ${proUserToken}`)
        .field('lessonId', testLessonId);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/ai-grading/:id', () => {
    let sessionId: string;

    beforeAll(async () => {
      const session = await prisma.aIGradingSession.create({
        data: {
          user_id: proUserId,
          lesson_id: testLessonId,
          file_path: testFilePath,
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
      const response = await request(app)
        .get(`/api/ai-grading/${sessionId}`)
        .set('Authorization', `Bearer ${proUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(sessionId);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.ai_score).toBe(85);
    });

    it('should return 403 for non-owner', async () => {
      const response = await request(app)
        .get(`/api/ai-grading/${sessionId}`)
        .set('Authorization', `Bearer ${freeUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get(`/api/ai-grading/${sessionId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/ai-grading/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${proUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/ai-grading/history', () => {
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

    it('should get AI grading history with default pagination', async () => {
      const response = await request(app)
        .get('/api/ai-grading/history')
        .set('Authorization', `Bearer ${proUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });

    it('should get AI grading history with custom pagination', async () => {
      const response = await request(app)
        .get('/api/ai-grading/history?page=1&limit=3')
        .set('Authorization', `Bearer ${proUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/ai-grading/history');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return empty array for user with no sessions', async () => {
      const response = await request(app)
        .get('/api/ai-grading/history')
        .set('Authorization', `Bearer ${freeUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });
});

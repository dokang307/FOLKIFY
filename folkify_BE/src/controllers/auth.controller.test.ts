import request from 'supertest';
import express, { Application } from 'express';
import authRoutes from '../routes/auth.routes';
import { prisma } from '../config/database';

// Create test app
const app: Application = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller', () => {
  beforeEach(async () => {
    await prisma.userStats.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalidemail',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password123',
        fullName: 'First User',
      });

      const response = await request(app).post('/api/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password456',
        fullName: 'Second User',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'logintest@example.com',
        password: 'password123',
        fullName: 'Login Test User',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'logintest@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'logintest@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'refresh@example.com',
        password: 'password123',
        fullName: 'Refresh User',
      });

      const refreshToken = registerResponse.body.data.refreshToken;

      const response = await request(app).post('/api/auth/refresh').send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'me@example.com',
        password: 'password123',
        fullName: 'Me User',
      });

      const accessToken = registerResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('me@example.com');
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

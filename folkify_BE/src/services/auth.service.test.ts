import { prisma } from '../config/database';
import { register, login, refreshAccessToken, getMe } from './auth.service';
import { BadRequestError, UnauthorizedError, ConflictError, ForbiddenError } from '../utils/errors';

describe('Auth Service', () => {
  beforeEach(async () => {
    await prisma.userStats.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await register({
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.full_name).toBe('New User');
      expect(result.user.account_type).toBe('free');
      expect(result.user.user_stats).toBeDefined();
      expect(result.user.user_stats?.level).toBe(1);
      expect(result.user.user_stats?.total_xp).toBe(0);
    });

    it('should throw error for invalid email', async () => {
      await expect(
        register({
          email: 'invalidemail',
          password: 'password123',
          fullName: 'Test User',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw error for short password', async () => {
      await expect(
        register({
          email: 'test@example.com',
          password: '12345',
          fullName: 'Test User',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw error for empty full name', async () => {
      await expect(
        register({
          email: 'test@example.com',
          password: 'password123',
          fullName: '   ',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw error for duplicate email', async () => {
      await register({
        email: 'duplicate@example.com',
        password: 'password123',
        fullName: 'First User',
      });

      await expect(
        register({
          email: 'duplicate@example.com',
          password: 'password456',
          fullName: 'Second User',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await register({
        email: 'loginuser@example.com',
        password: 'password123',
        fullName: 'Login User',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const result = await login({
        email: 'loginuser@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('loginuser@example.com');
      expect(result.user.last_login_at).toBeDefined();
    });

    it('should throw error for non-existent email', async () => {
      await expect(
        login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw error for incorrect password', async () => {
      await expect(
        login({
          email: 'loginuser@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw error for banned user', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'loginuser@example.com' },
      });

      await prisma.user.update({
        where: { id: user!.id },
        data: { account_status: 'banned' },
      });

      await expect(
        login({
          email: 'loginuser@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token with valid refresh token', async () => {
      const registerResult = await register({
        email: 'refresh@example.com',
        password: 'password123',
        fullName: 'Refresh User',
      });

      const result = await refreshAccessToken(registerResult.refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.accessToken).not.toBe(registerResult.accessToken);
    });

    it('should throw error for missing refresh token', async () => {
      await expect(refreshAccessToken('')).rejects.toThrow(BadRequestError);
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(refreshAccessToken('invalid-token')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw error for banned user', async () => {
      const registerResult = await register({
        email: 'bannedrefresh@example.com',
        password: 'password123',
        fullName: 'Banned Refresh User',
      });

      await prisma.user.update({
        where: { email: 'bannedrefresh@example.com' },
        data: { account_status: 'banned' },
      });

      await expect(refreshAccessToken(registerResult.refreshToken)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getMe', () => {
    it('should return user with stats', async () => {
      const registerResult = await register({
        email: 'getme@example.com',
        password: 'password123',
        fullName: 'Get Me User',
      });

      const user = await getMe(registerResult.user.id);

      expect(user).toBeDefined();
      expect(user.email).toBe('getme@example.com');
      expect(user.user_stats).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      await expect(getMe('00000000-0000-0000-0000-000000000000')).rejects.toThrow();
    });
  });
});

import { prisma } from '../config/database';
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByIdWithStats,
  updateUser,
} from './user.repository';
import { hashPassword } from '../utils/password';

describe('User Repository', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.userStats.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createUser', () => {
    it('should create user with user_stats', async () => {
      const passwordHash = await hashPassword('password123');
      const user = await createUser({
        email: 'test@example.com',
        password_hash: passwordHash,
        full_name: 'Test User',
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.full_name).toBe('Test User');
      expect(user.account_type).toBe('free');
      expect(user.user_stats).toBeDefined();
      expect(user.user_stats?.level).toBe(1);
      expect(user.user_stats?.total_xp).toBe(0);
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const passwordHash = await hashPassword('password123');
      await createUser({
        email: 'find@example.com',
        password_hash: passwordHash,
        full_name: 'Find User',
      });

      const user = await findUserByEmail('find@example.com');
      expect(user).toBeDefined();
      expect(user?.email).toBe('find@example.com');
    });

    it('should return null for non-existent email', async () => {
      const user = await findUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find user by ID', async () => {
      const passwordHash = await hashPassword('password123');
      const created = await createUser({
        email: 'findbyid@example.com',
        password_hash: passwordHash,
        full_name: 'Find By ID User',
      });

      const user = await findUserById(created.id);
      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
    });

    it('should return null for non-existent ID', async () => {
      const user = await findUserById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeNull();
    });
  });

  describe('findUserByIdWithStats', () => {
    it('should find user with stats', async () => {
      const passwordHash = await hashPassword('password123');
      const created = await createUser({
        email: 'withstats@example.com',
        password_hash: passwordHash,
        full_name: 'With Stats User',
      });

      const user = await findUserByIdWithStats(created.id);
      expect(user).toBeDefined();
      expect(user?.user_stats).toBeDefined();
      expect(user?.user_stats?.level).toBe(1);
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const passwordHash = await hashPassword('password123');
      const created = await createUser({
        email: 'update@example.com',
        password_hash: passwordHash,
        full_name: 'Update User',
      });

      const updated = await updateUser(created.id, {
        full_name: 'Updated Name',
        last_login_at: new Date(),
      });

      expect(updated.full_name).toBe('Updated Name');
      expect(updated.last_login_at).toBeDefined();
    });
  });
});

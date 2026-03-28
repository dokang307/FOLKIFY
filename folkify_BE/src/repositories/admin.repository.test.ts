import { getUsers, getUserById, updateUser, logAdminActivity } from './admin.repository';
import { prisma } from '../config/database';

// Mock Prisma client
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adminActivityLog: {
      create: jest.fn(),
    },
  },
}));

const mockPrismaUserFindMany = prisma.user.findMany as jest.MockedFunction<
  typeof prisma.user.findMany
>;
const mockPrismaUserCount = prisma.user.count as jest.MockedFunction<typeof prisma.user.count>;
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;
const mockPrismaUserUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>;
const mockPrismaAdminActivityLogCreate = prisma.adminActivityLog.create as jest.MockedFunction<
  typeof prisma.adminActivityLog.create
>;

describe('Admin Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return users with filters and pagination', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@test.com',
          password_hash: 'hashed',
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

      mockPrismaUserFindMany.mockResolvedValue(mockUsers);
      mockPrismaUserCount.mockResolvedValue(1);

      const result = await getUsers(
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

      expect(mockPrismaUserFindMany).toHaveBeenCalledWith({
        where: {
          account_type: 'free',
          account_status: 'active',
          OR: [
            { email: { contains: 'test', mode: 'insensitive' } },
            { full_name: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        include: {
          user_stats: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      expect(mockPrismaUserCount).toHaveBeenCalledWith({
        where: {
          account_type: 'free',
          account_status: 'active',
          OR: [
            { email: { contains: 'test', mode: 'insensitive' } },
            { full_name: { contains: 'test', mode: 'insensitive' } },
          ],
        },
      });

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      mockPrismaUserFindMany.mockResolvedValue([]);
      mockPrismaUserCount.mockResolvedValue(0);

      await getUsers({}, { page: 2, limit: 10 });

      expect(mockPrismaUserFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should work without filters', async () => {
      mockPrismaUserFindMany.mockResolvedValue([]);
      mockPrismaUserCount.mockResolvedValue(0);

      await getUsers({}, { page: 1, limit: 20 });

      expect(mockPrismaUserFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });
  });

  describe('getUserById', () => {
    it('should return user with relations', async () => {
      const mockUser = {
        id: 'user1',
        email: 'user1@test.com',
        password_hash: 'hashed',
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

      mockPrismaUserFindUnique.mockResolvedValue(mockUser);

      const result = await getUserById('user1');

      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        include: {
          user_stats: true,
          premium_subscriptions: {
            orderBy: {
              created_at: 'desc',
            },
          },
          payment_transactions: {
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaUserFindUnique.mockResolvedValue(null);

      const result = await getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const mockUpdatedUser = {
        id: 'user1',
        email: 'user1@test.com',
        password_hash: 'hashed',
        full_name: 'User One',
        role: 'user' as const,
        account_type: 'free' as const,
        account_status: 'banned' as const,
        premium_started_at: null,
        premium_expires_at: null,
        ban_reason: 'Violation',
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };

      mockPrismaUserUpdate.mockResolvedValue(mockUpdatedUser);

      const result = await updateUser('user1', {
        account_status: 'banned',
        ban_reason: 'Violation',
      });

      expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: {
          account_status: 'banned',
          ban_reason: 'Violation',
        },
      });

      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('logAdminActivity', () => {
    it('should create admin activity log', async () => {
      const mockLog = {
        id: 'log1',
        admin_id: 'admin1',
        action: 'ban_user',
        resource_type: 'user',
        resource_id: 'user1',
        changes: { reason: 'Violation' },
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
        created_at: new Date(),
      };

      mockPrismaAdminActivityLogCreate.mockResolvedValue(mockLog);

      await logAdminActivity({
        admin_id: 'admin1',
        action: 'ban_user',
        resource_type: 'user',
        resource_id: 'user1',
        changes: { reason: 'Violation' },
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
      });

      expect(mockPrismaAdminActivityLogCreate).toHaveBeenCalledWith({
        data: {
          admin_id: 'admin1',
          action: 'ban_user',
          resource_type: 'user',
          resource_id: 'user1',
          changes: { reason: 'Violation' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
        },
      });
    });
  });
});

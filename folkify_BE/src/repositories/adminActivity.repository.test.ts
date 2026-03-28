import { prisma } from '../config/database';
import { createActivityLog, getActivityLogs } from './adminActivity.repository';

// Mock Prisma client
jest.mock('../config/database', () => ({
  prisma: {
    adminActivityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockPrismaCreate = prisma.adminActivityLog.create as jest.MockedFunction<
  typeof prisma.adminActivityLog.create
>;
const mockPrismaFindMany = prisma.adminActivityLog.findMany as jest.MockedFunction<
  typeof prisma.adminActivityLog.findMany
>;
const mockPrismaCount = prisma.adminActivityLog.count as jest.MockedFunction<
  typeof prisma.adminActivityLog.count
>;

describe('AdminActivity Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createActivityLog', () => {
    it('should create an activity log entry', async () => {
      const logData = {
        admin_id: 'admin-123',
        action: 'manual_upgrade',
        resource_type: 'user',
        resource_id: 'user-123',
        changes: { plan: 'pro' },
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
      };

      const mockLog = {
        id: 'log-123',
        ...logData,
        created_at: new Date(),
      };

      mockPrismaCreate.mockResolvedValue(mockLog as any);

      const log = await createActivityLog(logData);

      expect(log).toBeDefined();
      expect(log.admin_id).toBe('admin-123');
      expect(log.action).toBe('manual_upgrade');
      expect(log.resource_type).toBe('user');
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: logData,
      });
    });
  });

  describe('getActivityLogs', () => {
    const mockLogs = [
      {
        id: 'log-1',
        admin_id: 'admin-1',
        action: 'manual_upgrade',
        resource_type: 'user',
        resource_id: 'user-1',
        changes: { plan: 'pro' },
        ip_address: null,
        user_agent: null,
        created_at: new Date('2024-01-03'),
      },
      {
        id: 'log-2',
        admin_id: 'admin-1',
        action: 'ban_user',
        resource_type: 'user',
        resource_id: 'user-2',
        changes: { status: 'banned' },
        ip_address: null,
        user_agent: null,
        created_at: new Date('2024-01-02'),
      },
      {
        id: 'log-3',
        admin_id: 'admin-2',
        action: 'publish_lesson',
        resource_type: 'lesson',
        resource_id: 'lesson-1',
        changes: { status: 'published' },
        ip_address: null,
        user_agent: null,
        created_at: new Date('2024-01-01'),
      },
    ];

    it('should get all activity logs with pagination', async () => {
      mockPrismaFindMany.mockResolvedValue(mockLogs as any);
      mockPrismaCount.mockResolvedValue(3);

      const result = await getActivityLogs({}, { page: 1, limit: 10 });

      expect(result.logs).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should filter by action', async () => {
      const filteredLogs = [mockLogs[1]];
      mockPrismaFindMany.mockResolvedValue(filteredLogs as any);
      mockPrismaCount.mockResolvedValue(1);

      const result = await getActivityLogs({ action: 'ban_user' }, { page: 1, limit: 10 });

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: { action: 'ban_user' },
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should filter by resource_type', async () => {
      const filteredLogs = [mockLogs[2]];
      mockPrismaFindMany.mockResolvedValue(filteredLogs as any);
      mockPrismaCount.mockResolvedValue(1);

      const result = await getActivityLogs({ resource_type: 'lesson' }, { page: 1, limit: 10 });

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: { resource_type: 'lesson' },
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should filter by date range', async () => {
      const filteredLogs = [mockLogs[0], mockLogs[1]];
      mockPrismaFindMany.mockResolvedValue(filteredLogs as any);
      mockPrismaCount.mockResolvedValue(2);

      const startDate = new Date('2024-01-02');
      const endDate = new Date('2024-01-03');

      const result = await getActivityLogs({ startDate, endDate }, { page: 1, limit: 10 });

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should filter by startDate only', async () => {
      const filteredLogs = [mockLogs[0], mockLogs[1]];
      mockPrismaFindMany.mockResolvedValue(filteredLogs as any);
      mockPrismaCount.mockResolvedValue(2);

      const startDate = new Date('2024-01-02');

      const result = await getActivityLogs({ startDate }, { page: 1, limit: 10 });

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: {
          created_at: {
            gte: startDate,
          },
        },
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should filter by endDate only', async () => {
      const filteredLogs = [mockLogs[1], mockLogs[2]];
      mockPrismaFindMany.mockResolvedValue(filteredLogs as any);
      mockPrismaCount.mockResolvedValue(2);

      const endDate = new Date('2024-01-02');

      const result = await getActivityLogs({ endDate }, { page: 1, limit: 10 });

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: {
          created_at: {
            lte: endDate,
          },
        },
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should combine multiple filters', async () => {
      const filteredLogs = [mockLogs[0]];
      mockPrismaFindMany.mockResolvedValue(filteredLogs as any);
      mockPrismaCount.mockResolvedValue(1);

      const startDate = new Date('2024-01-01');

      const result = await getActivityLogs(
        {
          action: 'manual_upgrade',
          resource_type: 'user',
          startDate,
        },
        { page: 1, limit: 10 }
      );

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: {
          action: 'manual_upgrade',
          resource_type: 'user',
          created_at: {
            gte: startDate,
          },
        },
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should paginate results', async () => {
      const page1Logs = [mockLogs[0], mockLogs[1]];
      const page2Logs = [mockLogs[2]];

      mockPrismaFindMany.mockResolvedValueOnce(page1Logs as any);
      mockPrismaCount.mockResolvedValue(3);

      const page1 = await getActivityLogs({}, { page: 1, limit: 2 });

      expect(page1.logs).toHaveLength(2);
      expect(page1.total).toBe(3);
      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 2,
        orderBy: { created_at: 'desc' },
      });

      mockPrismaFindMany.mockResolvedValueOnce(page2Logs as any);

      const page2 = await getActivityLogs({}, { page: 2, limit: 2 });

      expect(page2.logs).toHaveLength(1);
      expect(page2.total).toBe(3);
      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: {},
        skip: 2,
        take: 2,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should return empty array when no logs match filters', async () => {
      mockPrismaFindMany.mockResolvedValue([]);
      mockPrismaCount.mockResolvedValue(0);

      const result = await getActivityLogs({ action: 'nonexistent' }, { page: 1, limit: 10 });

      expect(result.logs).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});

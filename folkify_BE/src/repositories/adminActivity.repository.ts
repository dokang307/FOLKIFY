import { prisma } from '../config/database';
import { AdminActivityLog, Prisma } from '@prisma/client';

/**
 * Create an admin activity log entry
 * @param data - Activity log data
 * @returns Created log entry
 */
export async function createActivityLog(
  data: Prisma.AdminActivityLogCreateInput
): Promise<AdminActivityLog> {
  return prisma.adminActivityLog.create({
    data,
  });
}

/**
 * Get activity logs with filters and pagination
 * @param filters - Filter options (action, resource_type, date range)
 * @param pagination - Pagination options
 * @returns Activity logs with pagination info
 */
export async function getActivityLogs(
  filters: {
    action?: string;
    resource_type?: string;
    startDate?: Date;
    endDate?: Date;
  },
  pagination: {
    page: number;
    limit: number;
  }
): Promise<{
  logs: AdminActivityLog[];
  total: number;
}> {
  const { action, resource_type, startDate, endDate } = filters;
  const { page, limit } = pagination;

  const where: Prisma.AdminActivityLogWhereInput = {};

  if (action) {
    where.action = action;
  }

  if (resource_type) {
    where.resource_type = resource_type;
  }

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at.gte = startDate;
    }
    if (endDate) {
      where.created_at.lte = endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.adminActivityLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
    }),
    prisma.adminActivityLog.count({ where }),
  ]);

  return { logs, total };
}

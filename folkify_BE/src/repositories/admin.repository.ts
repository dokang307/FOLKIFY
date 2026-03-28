import { prisma } from '../config/database';
import { User, UserStats, PremiumSubscription, PaymentTransaction, Prisma } from '@prisma/client';

/**
 * Get users with filters and pagination
 * @param filters - Filter options
 * @param pagination - Pagination options
 * @returns Users with pagination info
 */
export async function getUsers(
  filters: {
    accountType?: string;
    accountStatus?: string;
    search?: string;
  },
  pagination: {
    page: number;
    limit: number;
  }
): Promise<{
  users: (User & { user_stats: UserStats | null })[];
  total: number;
}> {
  const { accountType, accountStatus, search } = filters;
  const { page, limit } = pagination;

  const where: Prisma.UserWhereInput = {};

  if (accountType) {
    where.account_type = accountType as any;
  }

  if (accountStatus) {
    where.account_status = accountStatus as any;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { full_name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user_stats: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

/**
 * Get user by ID with relations (stats, subscriptions, payments)
 * @param userId - User ID
 * @returns User with relations or null
 */
export async function getUserById(userId: string): Promise<
  | (User & {
      user_stats: UserStats | null;
      premium_subscriptions: PremiumSubscription[];
      payment_transactions: PaymentTransaction[];
    })
  | null
> {
  return prisma.user.findUnique({
    where: { id: userId },
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
}

/**
 * Update user
 * @param userId - User ID
 * @param data - Update data
 * @returns Updated user
 */
export async function updateUser(userId: string, data: Prisma.UserUpdateInput): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

/**
 * Log admin activity
 * @param data - Activity log data
 * @returns Created log entry
 */
export async function logAdminActivity(data: Prisma.AdminActivityLogCreateInput): Promise<void> {
  await prisma.adminActivityLog.create({
    data,
  });
}

import {
  getUsers,
  getUserById,
  updateUser,
  logAdminActivity,
} from '../repositories/admin.repository';
import { manualUpgrade, ManualUpgradeResult } from './premium.service';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';
import { prisma } from '../config/database';
import redis from '../config/redis';

interface GetUsersFilters {
  accountType?: string;
  accountStatus?: string;
  search?: string;
}

interface GetUsersPagination {
  page: number;
  limit: number;
}

/**
 * Get users with filters and pagination
 * @param filters - Filter options
 * @param pagination - Pagination options
 * @returns Users with pagination info
 */
export async function getUsersService(filters: GetUsersFilters, pagination: GetUsersPagination) {
  const { users, total } = await getUsers(filters, pagination);

  // Remove password_hash from response
  const sanitizedUsers = users.map((user) => {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  return {
    users: sanitizedUsers,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

/**
 * Get user details with subscription and payment history
 * @param userId - User ID
 * @returns User details with relations
 */
export async function getUserDetails(userId: string) {
  const user = await getUserById(userId);

  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = user;

  return userWithoutPassword;
}

/**
 * Manually upgrade user to premium (admin action)
 * @param userId - User ID
 * @param planType - Plan type ('basic' or 'pro')
 * @param durationMonths - Duration in months
 * @param adminId - Admin ID performing the action
 * @param notes - Optional notes
 * @param ipAddress - Admin IP address
 * @param userAgent - Admin user agent
 * @returns Upgrade result
 */
export async function manualUpgradeUser(
  userId: string,
  planType: 'basic' | 'pro',
  durationMonths: number,
  adminId: string,
  notes?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ManualUpgradeResult> {
  // Call the existing premium service manualUpgrade function
  const result = await manualUpgrade({
    userId,
    planType,
    durationMonths,
    adminId,
    notes,
    ipAddress,
    userAgent,
  });

  logger.info(`Admin ${adminId} manually upgraded user ${userId} to ${planType}`);

  return result;
}

/**
 * Ban user (admin action)
 * @param userId - User ID
 * @param reason - Ban reason
 * @param adminId - Admin ID performing the action
 * @param ipAddress - Admin IP address
 * @param userAgent - Admin user agent
 * @returns Updated user
 */
export async function banUser(
  userId: string,
  reason: string,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Check if user exists
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  const oldAccountStatus = existingUser.account_status;

  // Update user account_status to banned
  const updatedUser = await updateUser(userId, {
    account_status: 'banned',
    ban_reason: reason,
  });

  // Log admin activity
  await logAdminActivity({
    admin_id: adminId,
    action: 'ban_user',
    resource_type: 'user',
    resource_id: userId,
    changes: {
      old_account_status: oldAccountStatus,
      new_account_status: 'banned',
      reason,
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info(`Admin ${adminId} banned user ${userId}. Reason: ${reason}`);

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = updatedUser;

  return {
    message: 'User banned successfully',
    user: userWithoutPassword,
  };
}

/**
 * Unban user (admin action)
 * @param userId - User ID
 * @param adminId - Admin ID performing the action
 * @param ipAddress - Admin IP address
 * @param userAgent - Admin user agent
 * @returns Updated user
 */
export async function unbanUser(
  userId: string,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Check if user exists
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  const oldAccountStatus = existingUser.account_status;

  // Update user account_status to active
  const updatedUser = await updateUser(userId, {
    account_status: 'active',
    ban_reason: null,
  });

  // Log admin activity
  await logAdminActivity({
    admin_id: adminId,
    action: 'unban_user',
    resource_type: 'user',
    resource_id: userId,
    changes: {
      old_account_status: oldAccountStatus,
      new_account_status: 'active',
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info(`Admin ${adminId} unbanned user ${userId}`);

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = updatedUser;

  return {
    message: 'User unbanned successfully',
    user: userWithoutPassword,
  };
}

/**
 * Set lesson premium status (admin action)
 * @param lessonId - Lesson ID
 * @param isPremium - Premium status
 * @param adminId - Admin ID performing the action
 * @param ipAddress - Admin IP address
 * @param userAgent - Admin user agent
 * @returns Updated lesson
 */
export async function setLessonPremium(
  lessonId: string,
  isPremium: boolean,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Check if lesson exists
  const existingLesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { instrument: true },
  });

  if (!existingLesson) {
    throw new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND');
  }

  const oldIsPremium = existingLesson.is_premium;

  // Update lesson
  const updatedLesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: { is_premium: isPremium },
  });

  // Invalidate cache for lessons of this instrument
  const cacheKey = `lessons:${existingLesson.instrument_id}`;
  await redis.del(cacheKey);

  // Log admin activity
  await logAdminActivity({
    admin_id: adminId,
    action: 'set_lesson_premium',
    resource_type: 'lesson',
    resource_id: lessonId,
    changes: {
      old_is_premium: oldIsPremium,
      new_is_premium: isPremium,
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info(`Admin ${adminId} set lesson ${lessonId} premium status to ${isPremium}`);

  return {
    message: 'Lesson premium status updated successfully',
    lesson: updatedLesson,
  };
}

/**
 * Publish lesson (admin action)
 * @param lessonId - Lesson ID
 * @param adminId - Admin ID performing the action
 * @param ipAddress - Admin IP address
 * @param userAgent - Admin user agent
 * @returns Updated lesson
 */
export async function publishLesson(
  lessonId: string,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Check if lesson exists
  const existingLesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { instrument: true },
  });

  if (!existingLesson) {
    throw new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND');
  }

  const oldStatus = existingLesson.status;

  // Update lesson status to published
  const updatedLesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: { status: 'published' },
  });

  // Invalidate cache for lessons of this instrument
  const cacheKey = `lessons:${existingLesson.instrument_id}`;
  await redis.del(cacheKey);

  // Log admin activity
  await logAdminActivity({
    admin_id: adminId,
    action: 'publish_lesson',
    resource_type: 'lesson',
    resource_id: lessonId,
    changes: {
      old_status: oldStatus,
      new_status: 'published',
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info(`Admin ${adminId} published lesson ${lessonId}`);

  return {
    message: 'Lesson published successfully',
    lesson: updatedLesson,
  };
}

/**
 * Unpublish lesson (admin action)
 * @param lessonId - Lesson ID
 * @param adminId - Admin ID performing the action
 * @param ipAddress - Admin IP address
 * @param userAgent - Admin user agent
 * @returns Updated lesson
 */
export async function unpublishLesson(
  lessonId: string,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Check if lesson exists
  const existingLesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { instrument: true },
  });

  if (!existingLesson) {
    throw new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND');
  }

  const oldStatus = existingLesson.status;

  // Update lesson status to draft
  const updatedLesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: { status: 'draft' },
  });

  // Invalidate cache for lessons of this instrument
  const cacheKey = `lessons:${existingLesson.instrument_id}`;
  await redis.del(cacheKey);

  // Log admin activity
  await logAdminActivity({
    admin_id: adminId,
    action: 'unpublish_lesson',
    resource_type: 'lesson',
    resource_id: lessonId,
    changes: {
      old_status: oldStatus,
      new_status: 'draft',
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  logger.info(`Admin ${adminId} unpublished lesson ${lessonId}`);

  return {
    message: 'Lesson unpublished successfully',
    lesson: updatedLesson,
  };
}

/**
 * Get activity logs with filters and pagination
 * @param filters - Filter options
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
) {
  const { getActivityLogs: getActivityLogsRepo } =
    await import('../repositories/adminActivity.repository');

  const { logs, total } = await getActivityLogsRepo(filters, pagination);

  return {
    logs,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

import { prisma } from '../config/database';
import { User, UserStats, Prisma } from '@prisma/client';

/**
 * Create a new user with user_stats
 * @param data - User creation data
 * @returns Created user with user_stats
 */
export async function createUser(
  data: Prisma.UserCreateInput
): Promise<User & { user_stats: UserStats | null }> {
  return prisma.user.create({
    data: {
      ...data,
      user_stats: {
        create: {
          level: 1,
          total_xp: 0,
        },
      },
    },
    include: {
      user_stats: true,
    },
  });
}

/**
 * Find user by email
 * @param email - User email
 * @returns User or null
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Find user by ID
 * @param id - User ID
 * @returns User or null
 */
export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

/**
 * Find user by ID with user_stats
 * @param id - User ID
 * @returns User with user_stats or null
 */
export async function findUserByIdWithStats(
  id: string
): Promise<(User & { user_stats: UserStats | null }) | null> {
  return prisma.user.findUnique({
    where: { id },
    include: {
      user_stats: true,
    },
  });
}

/**
 * Update user
 * @param id - User ID
 * @param data - Update data
 * @returns Updated user
 */
export async function updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
  return prisma.user.update({
    where: { id },
    data,
  });
}

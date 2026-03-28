import { prisma } from '../config/database';
import { PremiumSubscription, Prisma } from '@prisma/client';

/**
 * Create a new premium subscription
 * @param data - Subscription creation data
 * @returns Created subscription
 */
export async function createSubscription(
  data: Prisma.PremiumSubscriptionCreateInput
): Promise<PremiumSubscription> {
  return prisma.premiumSubscription.create({
    data,
  });
}

/**
 * Get active subscription for a user
 * @param userId - User ID
 * @returns Active subscription or null
 */
export async function getActiveSubscription(userId: string): Promise<PremiumSubscription | null> {
  return prisma.premiumSubscription.findFirst({
    where: {
      user_id: userId,
      status: 'active',
      expires_at: {
        gt: new Date(),
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
}

/**
 * Get subscription history for a user
 * @param userId - User ID
 * @returns Array of subscriptions
 */
export async function getSubscriptionHistory(userId: string): Promise<PremiumSubscription[]> {
  return prisma.premiumSubscription.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
}

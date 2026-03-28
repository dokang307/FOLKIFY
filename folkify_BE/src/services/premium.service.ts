import { prisma } from '../config/database';
import { AccountType } from '@prisma/client';
import { findUserById } from '../repositories/user.repository';
import { BadRequestError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

// Pricing constants (VND per month)
const PLAN_PRICES = {
  basic: 149000,
  pro: 199000,
};

interface ManualUpgradeInput {
  userId: string;
  planType: 'basic' | 'pro';
  durationMonths: number;
  adminId: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ManualUpgradeResult {
  message: string;
  user: {
    id: string;
    email: string;
    account_type: AccountType;
    premium_started_at: Date | null;
    premium_expires_at: Date | null;
  };
}

/**
 * Calculate subscription amount based on plan type and duration
 * @param planType - 'basic' or 'pro'
 * @param durationMonths - Number of months
 * @returns Total amount in VND
 */
export function calculateAmount(planType: 'basic' | 'pro', durationMonths: number): number {
  return PLAN_PRICES[planType] * durationMonths;
}

/**
 * Manually upgrade a user to premium (admin action)
 * Atomic transaction: update user, create subscription, create payment, log activity
 * @param input - Upgrade parameters
 * @returns Upgrade result
 */
export async function manualUpgrade(input: ManualUpgradeInput): Promise<ManualUpgradeResult> {
  const { userId, planType, durationMonths, adminId, notes, ipAddress, userAgent } = input;

  // Validate input
  if (!['basic', 'pro'].includes(planType)) {
    throw new BadRequestError('Invalid plan type. Must be "basic" or "pro"', 'INVALID_PLAN_TYPE');
  }

  if (durationMonths < 1 || durationMonths > 12) {
    throw new BadRequestError('Duration must be between 1 and 12 months', 'INVALID_DURATION');
  }

  // Check if user exists
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  const oldAccountType = existingUser.account_type;

  // Perform atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Calculate dates
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // 2. Update user
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        account_type: planType,
        premium_started_at: startedAt,
        premium_expires_at: expiresAt,
      },
    });

    // 3. Create premium subscription
    await tx.premiumSubscription.create({
      data: {
        user_id: userId,
        plan_type: planType,
        status: 'active',
        started_at: startedAt,
        expires_at: expiresAt,
      },
    });

    // 4. Create payment transaction
    const amount = calculateAmount(planType, durationMonths);
    await tx.paymentTransaction.create({
      data: {
        user_id: userId,
        amount: amount,
        currency: 'VND',
        status: 'completed',
        payment_method: 'manual',
        transaction_type: 'subscription',
        metadata: {
          notes: notes || '',
          admin_id: adminId,
          duration_months: durationMonths,
        },
      },
    });

    // 5. Log admin activity
    await tx.adminActivityLog.create({
      data: {
        admin_id: adminId,
        action: 'manual_upgrade',
        resource_type: 'user',
        resource_id: userId,
        changes: {
          old_account_type: oldAccountType,
          new_account_type: planType,
          duration_months: durationMonths,
          amount: amount,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    return updatedUser;
  });

  logger.info(`User ${userId} manually upgraded to ${planType} by admin ${adminId}`);

  return {
    message: 'User upgraded successfully',
    user: {
      id: result.id,
      email: result.email,
      account_type: result.account_type,
      premium_started_at: result.premium_started_at,
      premium_expires_at: result.premium_expires_at,
    },
  };
}

/**
 * Downgrade user to free account
 * @param userId - User ID
 * @param adminId - Admin ID performing the action
 * @param reason - Reason for downgrade
 * @param ipAddress - Admin IP address
 * @param userAgent - Admin user agent
 * @returns Downgrade result
 */
export async function downgradeToFree(
  userId: string,
  adminId: string,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<ManualUpgradeResult> {
  // Check if user exists
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  const oldAccountType = existingUser.account_type;

  // Perform atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update user to free
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        account_type: 'free',
        premium_expires_at: new Date(), // Set to now
      },
    });

    // 2. Update active subscriptions to expired
    await tx.premiumSubscription.updateMany({
      where: {
        user_id: userId,
        status: 'active',
      },
      data: {
        status: 'cancelled',
      },
    });

    // 3. Log admin activity
    await tx.adminActivityLog.create({
      data: {
        admin_id: adminId,
        action: 'downgrade_to_free',
        resource_type: 'user',
        resource_id: userId,
        changes: {
          old_account_type: oldAccountType,
          new_account_type: 'free',
          reason: reason || 'Manual downgrade',
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    return updatedUser;
  });

  logger.info(`User ${userId} downgraded to free by admin ${adminId}`);

  return {
    message: 'User downgraded to free successfully',
    user: {
      id: result.id,
      email: result.email,
      account_type: result.account_type,
      premium_started_at: result.premium_started_at,
      premium_expires_at: result.premium_expires_at,
    },
  };
}

/**
 * Get available premium plans
 * @returns Array of plan information
 */
export function getPremiumPlans() {
  return [
    {
      id: 'basic',
      name: 'BASIC',
      price: PLAN_PRICES.basic,
      currency: 'VND',
      features: [
        'Truy cập toàn bộ bài học',
        'Tải xuống 100+ sheet nhạc',
        'Không giới hạn thời gian luyện tập',
        'Theo dõi tiến độ học tập',
      ],
    },
    {
      id: 'pro',
      name: 'PRO',
      price: PLAN_PRICES.pro,
      currency: 'VND',
      features: [
        'Tất cả tính năng BASIC',
        'AI chấm điểm không giới hạn',
        'Phản hồi chi tiết từ AI',
        'Gợi ý cải thiện cá nhân hóa',
      ],
    },
  ];
}

/**
 * Get user premium status
 * @param userId - User ID
 * @returns Premium status information
 */
export async function getPremiumStatus(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  const isPremium =
    (user.account_type === 'basic' || user.account_type === 'pro') &&
    user.premium_expires_at &&
    user.premium_expires_at > new Date();

  const isPro = user.account_type === 'pro' && isPremium;

  let daysRemaining = 0;
  if (isPremium && user.premium_expires_at) {
    const now = new Date();
    const diffTime = user.premium_expires_at.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    account_type: user.account_type,
    is_premium: isPremium,
    is_pro: isPro,
    premium_started_at: user.premium_started_at,
    premium_expires_at: user.premium_expires_at,
    days_remaining: daysRemaining,
  };
}

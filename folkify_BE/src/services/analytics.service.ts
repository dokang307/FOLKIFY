import redis from '../config/redis';
import {
  getUserStatistics as getUserStatsRepo,
  getRevenueStatistics as getRevenueStatsRepo,
  getAIGradingStatistics as getAIGradingStatsRepo,
  getUsersExpiringSoon as getUsersExpiringSoonRepo,
  getRevenueReport as getRevenueReportRepo,
} from '../repositories/analytics.repository';
import logger from '../utils/logger';

const CACHE_TTL = 300; // 5 minutes

/**
 * Get user statistics with caching
 * @returns User statistics with conversion rate
 */
export async function getUserStatistics() {
  const cacheKey = 'analytics:user_stats';

  try {
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn('Redis cache read failed for user statistics:', error);
  }

  // Get from database
  const stats = await getUserStatsRepo();

  // Calculate conversion rate
  const conversionRate =
    stats.total_users > 0
      ? ((stats.basic_users_count + stats.pro_users_count) / stats.total_users) * 100
      : 0;

  const result = {
    ...stats,
    conversion_rate: parseFloat(conversionRate.toFixed(2)),
  };

  // Cache the result
  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (error) {
    logger.warn('Redis cache write failed for user statistics:', error);
  }

  return result;
}

/**
 * Get revenue statistics with caching
 * @returns Revenue statistics with growth percentage
 */
export async function getRevenueStatistics() {
  const cacheKey = 'analytics:revenue_stats';

  try {
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn('Redis cache read failed for revenue statistics:', error);
  }

  // Get from database
  const stats = await getRevenueStatsRepo();

  // Calculate growth percentage
  const growthPercentage =
    Number(stats.last_month_revenue) > 0
      ? ((Number(stats.total_revenue_this_month) - Number(stats.last_month_revenue)) /
          Number(stats.last_month_revenue)) *
        100
      : 0;

  const result = {
    monthly_recurring_revenue: stats.monthly_recurring_revenue,
    total_revenue_this_month: Number(stats.total_revenue_this_month),
    growth_percentage: parseFloat(growthPercentage.toFixed(2)),
  };

  // Cache the result
  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (error) {
    logger.warn('Redis cache write failed for revenue statistics:', error);
  }

  return result;
}

/**
 * Get AI grading statistics with caching
 * @returns AI grading statistics
 */
export async function getAIGradingStatistics() {
  const cacheKey = 'analytics:ai_grading_stats';

  try {
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn('Redis cache read failed for AI grading statistics:', error);
  }

  // Get from database
  const stats = await getAIGradingStatsRepo();

  const result = {
    total_gradings: stats.total_gradings,
    average_score: parseFloat((stats.average_score || 0).toFixed(2)),
    usage_by_account_type: stats.usage_by_account_type,
  };

  // Cache the result
  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (error) {
    logger.warn('Redis cache write failed for AI grading statistics:', error);
  }

  return result;
}

/**
 * Get users expiring soon (no caching - real-time data)
 * @param days - Number of days
 * @returns Users expiring soon
 */
export async function getUsersExpiringSoon(days: number) {
  const users = await getUsersExpiringSoonRepo(days);

  // Calculate days remaining for each user
  const now = new Date();
  const usersWithDaysRemaining = users.map((user) => {
    const daysRemaining = user.premium_expires_at
      ? Math.ceil((user.premium_expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      ...user,
      days_remaining: daysRemaining,
    };
  });

  return usersWithDaysRemaining;
}

/**
 * Get revenue report (no caching - custom date ranges)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Revenue report
 */
export async function getRevenueReport(startDate: Date, endDate: Date) {
  const report = await getRevenueReportRepo(startDate, endDate);

  // Calculate total revenue
  const totalRevenue = report.by_month.reduce((sum, item) => sum + item.total_revenue, 0);

  return {
    ...report,
    total_revenue: totalRevenue,
    date_range: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  };
}

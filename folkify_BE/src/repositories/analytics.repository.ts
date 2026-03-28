import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

/**
 * Get user statistics (count by account_type)
 * @returns User statistics
 */
export async function getUserStatistics() {
  const [total, free, basic, pro] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { account_type: 'free' } }),
    prisma.user.count({ where: { account_type: 'basic' } }),
    prisma.user.count({ where: { account_type: 'pro' } }),
  ]);

  return {
    total_users: total,
    free_users_count: free,
    basic_users_count: basic,
    pro_users_count: pro,
  };
}

/**
 * Get revenue statistics (MRR, total revenue, growth)
 * @returns Revenue statistics
 */
export async function getRevenueStatistics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // MRR = Active subscriptions * monthly price
  const activeSubscriptions = await prisma.premiumSubscription.findMany({
    where: {
      status: 'active',
      expires_at: { gt: now },
    },
  });

  const mrr = activeSubscriptions.reduce((sum, sub) => {
    const price = sub.plan_type === 'basic' ? 149000 : 199000;
    return sum + price;
  }, 0);

  // Total revenue this month
  const thisMonthRevenue = await prisma.paymentTransaction.aggregate({
    where: {
      status: 'completed',
      created_at: { gte: startOfMonth },
    },
    _sum: { amount: true },
  });

  // Last month revenue for growth calculation
  const lastMonthRevenue = await prisma.paymentTransaction.aggregate({
    where: {
      status: 'completed',
      created_at: { gte: startOfLastMonth, lte: endOfLastMonth },
    },
    _sum: { amount: true },
  });

  return {
    monthly_recurring_revenue: mrr,
    total_revenue_this_month: Number(thisMonthRevenue._sum.amount) || 0,
    last_month_revenue: Number(lastMonthRevenue._sum.amount) || 0,
  };
}

/**
 * Get AI grading statistics (total gradings, average score, usage by type)
 * @returns AI grading statistics
 */
export async function getAIGradingStatistics() {
  // Total gradings
  const totalGradings = await prisma.aIGradingSession.count({
    where: { status: 'completed' },
  });

  // Average score
  const avgScore = await prisma.aIGradingSession.aggregate({
    where: { status: 'completed' },
    _avg: { ai_score: true },
  });

  // Usage by account type
  const usageByType = await prisma.$queryRaw<Array<{ account_type: string; count: bigint }>>`
    SELECT u.account_type, COUNT(ags.id)::bigint as count
    FROM "AIGradingSession" ags
    JOIN "User" u ON ags.user_id = u.id
    WHERE ags.status = 'completed'
    GROUP BY u.account_type
  `;

  // Convert bigint to number
  const usageByTypeFormatted = usageByType.reduce(
    (acc, item) => {
      acc[item.account_type] = Number(item.count);
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total_gradings: totalGradings,
    average_score: avgScore._avg.ai_score || 0,
    usage_by_account_type: usageByTypeFormatted,
  };
}

/**
 * Get users expiring soon (premium_expires_at within N days)
 * @param days - Number of days
 * @returns Users expiring soon
 */
export async function getUsersExpiringSoon(days: number) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      account_type: { in: ['basic', 'pro'] },
      premium_expires_at: {
        gt: now,
        lte: futureDate,
      },
    },
    select: {
      id: true,
      email: true,
      full_name: true,
      account_type: true,
      premium_expires_at: true,
    },
    orderBy: {
      premium_expires_at: 'asc',
    },
  });

  return users;
}

/**
 * Get revenue report (breakdown by month, transaction_type, payment_method)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Revenue report
 */
export async function getRevenueReport(startDate: Date, endDate: Date) {
  // Revenue by month
  const revenueByMonth = await prisma.$queryRaw<
    Array<{ month: string; total_revenue: Prisma.Decimal }>
  >`
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM') as month,
      SUM(amount) as total_revenue
    FROM "PaymentTransaction"
    WHERE status = 'completed'
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY month
  `;

  // Revenue by transaction type
  const revenueByType = await prisma.paymentTransaction.groupBy({
    by: ['transaction_type'],
    where: {
      status: 'completed',
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Revenue by payment method
  const revenueByMethod = await prisma.paymentTransaction.groupBy({
    by: ['payment_method'],
    where: {
      status: 'completed',
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return {
    by_month: revenueByMonth.map((item) => ({
      month: item.month,
      total_revenue: Number(item.total_revenue),
    })),
    by_transaction_type: revenueByType.map((item) => ({
      transaction_type: item.transaction_type,
      total_revenue: Number(item._sum.amount || 0),
    })),
    by_payment_method: revenueByMethod.map((item) => ({
      payment_method: item.payment_method,
      total_revenue: Number(item._sum.amount || 0),
    })),
  };
}

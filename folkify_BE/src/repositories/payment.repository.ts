import { prisma } from '../config/database';
import { PaymentTransaction, Prisma } from '@prisma/client';

/**
 * Create a new payment transaction
 * @param data - Transaction creation data
 * @returns Created transaction
 */
export async function createTransaction(
  data: Prisma.PaymentTransactionCreateInput
): Promise<PaymentTransaction> {
  return prisma.paymentTransaction.create({
    data,
  });
}

/**
 * Get transaction history for a user
 * @param userId - User ID
 * @returns Array of transactions
 */
export async function getTransactionHistory(userId: string): Promise<PaymentTransaction[]> {
  return prisma.paymentTransaction.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
}

import { createTransaction, getTransactionHistory } from './payment.repository';

// Mock Prisma
jest.mock('../config/database', () => ({
  prisma: {
    paymentTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = require('../config/database');

describe('Payment Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create a new payment transaction', async () => {
      const mockTransaction = {
        id: 'txn-1',
        user_id: 'user-1',
        amount: 149000,
        currency: 'VND',
        status: 'completed',
        payment_method: 'manual',
        transaction_type: 'subscription',
        metadata: { notes: 'Test payment' },
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.paymentTransaction.create.mockResolvedValue(mockTransaction);

      const result = await createTransaction({
        user: { connect: { id: 'user-1' } },
        amount: 149000,
        currency: 'VND',
        status: 'completed',
        payment_method: 'manual',
        transaction_type: 'subscription',
        metadata: { notes: 'Test payment' },
      });

      expect(result).toEqual(mockTransaction);
      expect(prisma.paymentTransaction.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history for user', async () => {
      const mockHistory = [
        {
          id: 'txn-1',
          user_id: 'user-1',
          amount: 199000,
          currency: 'VND',
          status: 'completed',
          payment_method: 'manual',
          transaction_type: 'subscription',
          metadata: null,
          created_at: new Date('2024-02-01'),
          updated_at: new Date('2024-02-01'),
        },
        {
          id: 'txn-2',
          user_id: 'user-1',
          amount: 149000,
          currency: 'VND',
          status: 'completed',
          payment_method: 'manual',
          transaction_type: 'subscription',
          metadata: null,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      prisma.paymentTransaction.findMany.mockResolvedValue(mockHistory);

      const result = await getTransactionHistory('user-1');

      expect(result).toEqual(mockHistory);
      expect(prisma.paymentTransaction.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user-1',
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    });

    it('should return empty array if no history', async () => {
      prisma.paymentTransaction.findMany.mockResolvedValue([]);

      const result = await getTransactionHistory('user-1');

      expect(result).toEqual([]);
    });
  });
});

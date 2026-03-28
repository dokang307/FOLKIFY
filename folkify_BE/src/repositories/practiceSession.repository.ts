import { prisma } from '../config/database';
import { PracticeSession, Prisma } from '@prisma/client';

/**
 * Create a new practice session
 * @param data - Practice session creation data
 * @returns Created practice session
 */
export async function createSession(
  data: Prisma.PracticeSessionCreateInput
): Promise<PracticeSession> {
  return prisma.practiceSession.create({
    data,
  });
}

/**
 * Update a practice session
 * @param id - Practice session ID
 * @param data - Update data
 * @returns Updated practice session
 */
export async function updateSession(
  id: string,
  data: Prisma.PracticeSessionUpdateInput
): Promise<PracticeSession> {
  return prisma.practiceSession.update({
    where: { id },
    data,
  });
}

/**
 * Get practice session history for a user
 * @param userId - User ID
 * @param options - Pagination and filter options
 * @returns Practice sessions with pagination
 */
export async function getSessionHistory(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ sessions: PracticeSession[]; total: number }> {
  const { startDate, endDate, page = 1, limit = 20 } = options;

  const where: Prisma.PracticeSessionWhereInput = {
    user_id: userId,
    status: 'completed',
  };

  if (startDate || endDate) {
    where.started_at = {};
    if (startDate) {
      where.started_at.gte = startDate;
    }
    if (endDate) {
      where.started_at.lte = endDate;
    }
  }

  const [sessions, total] = await Promise.all([
    prisma.practiceSession.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { started_at: 'desc' },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        instrument: {
          select: {
            id: true,
            name: true,
            english_name: true,
          },
        },
      },
    }),
    prisma.practiceSession.count({ where }),
  ]);

  return { sessions, total };
}

/**
 * Find practice session by ID
 * @param id - Practice session ID
 * @returns Practice session or null
 */
export async function findSessionById(id: string): Promise<PracticeSession | null> {
  return prisma.practiceSession.findUnique({
    where: { id },
  });
}

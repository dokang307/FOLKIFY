import { prisma } from '../config/database';
import { AIGradingSession, Prisma } from '@prisma/client';

/**
 * Create a new AI grading session
 * @param data - Session creation data
 * @returns Created session
 * Requirements: 4.3
 */
export async function createSession(
  data: Prisma.AIGradingSessionCreateInput
): Promise<AIGradingSession> {
  return prisma.aIGradingSession.create({
    data,
  });
}

/**
 * Get AI grading session by ID
 * @param id - Session ID
 * @returns Session or null
 * Requirements: 4.3
 */
export async function getSessionById(id: string): Promise<AIGradingSession | null> {
  return prisma.aIGradingSession.findUnique({
    where: { id },
  });
}

/**
 * Get AI grading session history for a user with pagination
 * @param userId - User ID
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns Array of sessions and total count
 * Requirements: 4.3
 */
export async function getSessionHistory(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ sessions: AIGradingSession[]; total: number }> {
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    prisma.aIGradingSession.findMany({
      where: { user_id: userId },
      orderBy: { submitted_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.aIGradingSession.count({
      where: { user_id: userId },
    }),
  ]);

  return { sessions, total };
}

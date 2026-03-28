import { aiGradingQueue } from '../config/queues';
import { findUserById } from '../repositories/user.repository';
import {
  createSession,
  getSessionById,
  getSessionHistory,
} from '../repositories/aiGrading.repository';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';
import { AIGradingSession } from '@prisma/client';

/**
 * Check if user has PRO access for AI grading
 * @param userId - User ID
 * @returns true if user is PRO
 * Requirements: 4.1, 4.2
 */
async function checkProAccess(userId: string): Promise<boolean> {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  const isPro =
    user.account_type === 'pro' &&
    user.premium_expires_at !== null &&
    user.premium_expires_at > new Date();

  return isPro;
}

/**
 * Submit AI grading job
 * @param userId - User ID
 * @param lessonId - Lesson ID (optional)
 * @param filePath - Path to uploaded file
 * @returns Created session
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.8
 */
export async function submitAIGrading(
  userId: string,
  lessonId: string | undefined,
  filePath: string
): Promise<{ sessionId: string; status: string; message: string }> {
  // 1. Check PRO access
  const hasPro = await checkProAccess(userId);
  if (!hasPro) {
    throw new ForbiddenError('AI grading is only available for PRO users', 'PRO_REQUIRED');
  }

  // 2. Create AI grading session
  const session = await createSession({
    user: { connect: { id: userId } },
    lesson: lessonId ? { connect: { id: lessonId } } : undefined,
    file_path: filePath,
    status: 'pending',
    submitted_at: new Date(),
  });

  // 3. Queue job for processing
  await aiGradingQueue.add(
    'grade-submission',
    {
      sessionId: session.id,
      filePath: filePath,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );

  logger.info(`AI grading job queued for session ${session.id}`);

  return {
    sessionId: session.id,
    status: 'pending',
    message: 'Your submission is being processed',
  };
}

/**
 * Get AI grading result by session ID
 * @param sessionId - Session ID
 * @param userId - User ID (for ownership check)
 * @returns Session with results
 * Requirements: 4.8, 4.10
 */
export async function getAIGradingResult(
  sessionId: string,
  userId: string
): Promise<AIGradingSession> {
  // Get session
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new NotFoundError('AI grading session not found', 'SESSION_NOT_FOUND');
  }

  // Check ownership
  if (session.user_id !== userId) {
    throw new ForbiddenError('You do not have access to this session', 'ACCESS_DENIED');
  }

  return session;
}

/**
 * Get AI grading history for a user
 * @param userId - User ID
 * @param page - Page number
 * @param limit - Items per page
 * @returns Sessions and pagination info
 * Requirements: 4.3, 4.8
 */
export async function getAIGradingHistory(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  sessions: AIGradingSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const { sessions, total } = await getSessionHistory(userId, page, limit);

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

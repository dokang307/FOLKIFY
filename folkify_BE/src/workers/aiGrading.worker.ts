import { Worker, Job } from 'bullmq';
import { prisma } from '../config/database';
import { generateMockAIResult } from '../services/mockAI.service';
import logger from '../utils/logger';

/**
 * AI Grading Worker
 * Processes AI grading jobs asynchronously
 * Requirements: 4.6, 4.7
 */

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

interface AIGradingJobData {
  sessionId: string;
  filePath: string;
}

/**
 * Process AI grading job
 */
async function processAIGrading(job: Job<AIGradingJobData>): Promise<void> {
  const { sessionId, filePath: _filePath } = job.data;

  logger.info(`Processing AI grading job for session ${sessionId}`);

  try {
    // 1. Update session status to 'processing'
    await prisma.aIGradingSession.update({
      where: { id: sessionId },
      data: { status: 'processing' },
    });

    // 2. Call mock AI service to generate results
    const mockResult = generateMockAIResult();

    // 3. Update session with results
    await prisma.aIGradingSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        ai_score: mockResult.overall_score,
        criteria_scores: mockResult.criteria_scores,
        ai_feedback: mockResult.feedback,
        improvement_suggestions: mockResult.suggestions,
        completed_at: new Date(),
      },
    });

    logger.info(`AI grading completed for session ${sessionId}`, {
      overall_score: mockResult.overall_score,
      criteria_scores: mockResult.criteria_scores,
    });
  } catch (error) {
    logger.error(`AI grading failed for session ${sessionId}:`, error);

    // Update session status to failed
    try {
      await prisma.aIGradingSession.update({
        where: { id: sessionId },
        data: {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (updateError) {
      logger.error(`Failed to update session status for ${sessionId}:`, updateError);
    }

    // Re-throw error to trigger retry logic
    throw error;
  }
}

/**
 * Create and start AI grading worker
 */
export function createAIGradingWorker(): Worker<AIGradingJobData> {
  const worker = new Worker<AIGradingJobData>('ai-grading', processAIGrading, {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
    },
    concurrency: 5, // Process up to 5 jobs concurrently
  });

  // Worker event handlers
  worker.on('completed', (job) => {
    logger.info(`AI grading job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`AI grading job ${job?.id} failed:`, error);
  });

  worker.on('error', (error) => {
    logger.error('AI grading worker error:', error);
  });

  logger.info('AI grading worker started');

  return worker;
}

import { Worker } from 'bullmq';
import { createAIGradingWorker } from './aiGrading.worker';
import { createEmailWorker } from './email.worker';
import logger from '../utils/logger';

/**
 * Workers Index
 * Manages all BullMQ workers
 */

let aiGradingWorker: Worker | null = null;
let emailWorker: Worker | null = null;

/**
 * Start all workers
 */
export function startWorkers(): void {
  logger.info('Starting BullMQ workers...');

  aiGradingWorker = createAIGradingWorker();
  emailWorker = createEmailWorker();

  logger.info('All workers started successfully');
}

/**
 * Stop all workers gracefully
 */
export async function stopWorkers(): Promise<void> {
  logger.info('Stopping BullMQ workers...');

  const promises: Promise<void>[] = [];

  if (aiGradingWorker) {
    promises.push(aiGradingWorker.close());
  }

  if (emailWorker) {
    promises.push(emailWorker.close());
  }

  await Promise.all(promises);

  logger.info('All workers stopped successfully');
}

export { createAIGradingWorker, createEmailWorker };

import dotenv from 'dotenv';
import { prisma } from '../src/config/database';
import redisClient from '../src/config/redis';
import { aiGradingQueue, emailQueue } from '../src/config/queues';
import { checkExpiredPremium } from '../src/services/cronjob.service';

/**
 * Test Background Job Processing
 * Tests BullMQ workers with Redis and Supabase
 * Requirements: 7.5
 */

dotenv.config();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Wait for a job to complete
 */
async function waitForJob(jobId: string, queueName: string, timeout = 30000): Promise<boolean> {
  const startTime = Date.now();
  const queue = queueName === 'ai-grading' ? aiGradingQueue : emailQueue;

  while (Date.now() - startTime < timeout) {
    const job = await queue.getJob(jobId);
    if (!job) {
      return false;
    }

    const state = await job.getState();
    if (state === 'completed') {
      return true;
    }
    if (state === 'failed') {
      const failedReason = job.failedReason;
      throw new Error(`Job failed: ${failedReason}`);
    }

    // Wait 500ms before checking again
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Job timeout after ${timeout}ms`);
}

/**
 * Test 1: Enqueue and verify AI grading job processing
 */
async function testAIGradingJob(): Promise<void> {
  console.log('\n📝 Test 1: AI Grading Job Processing');
  console.log('─'.repeat(60));

  const startTime = Date.now();

  try {
    // 1. Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: `test-ai-${Date.now()}@example.com`,
        password_hash: 'test_hash',
        full_name: 'AI Test User',
        account_type: 'pro',
      },
    });

    console.log(`✓ Created test user: ${testUser.id}`);

    // 1.5. Get a valid lesson ID from the database
    const lesson = await prisma.lesson.findFirst({
      select: { id: true },
    });

    if (!lesson) {
      throw new Error('No lessons found in database. Please seed the database first.');
    }

    console.log(`✓ Found lesson: ${lesson.id}`);

    // 2. Create a test AI grading session
    const session = await prisma.aIGradingSession.create({
      data: {
        user_id: testUser.id,
        lesson_id: lesson.id,
        file_path: '/uploads/ai-grading/test-file.mp3',
        status: 'pending',
      },
    });

    console.log(`✓ Created AI grading session: ${session.id}`);

    // 3. Enqueue AI grading job
    const job = await aiGradingQueue.add('process-ai-grading', {
      sessionId: session.id,
      filePath: session.file_path,
    });

    console.log(`✓ Enqueued AI grading job: ${job.id}`);

    // 4. Wait for job to complete
    console.log('⏳ Waiting for job to complete...');
    const completed = await waitForJob(job.id!, 'ai-grading', 30000);

    if (!completed) {
      throw new Error('Job did not complete');
    }

    console.log('✓ Job completed successfully');

    // 5. Verify session was updated
    const updatedSession = await prisma.aIGradingSession.findUnique({
      where: { id: session.id },
    });

    if (!updatedSession) {
      throw new Error('Session not found after processing');
    }

    if (updatedSession.status !== 'completed') {
      throw new Error(`Expected status 'completed', got '${updatedSession.status}'`);
    }

    if (!updatedSession.ai_score) {
      throw new Error('AI score not set');
    }

    console.log(
      `✓ Session updated: status=${updatedSession.status}, score=${updatedSession.ai_score}`
    );

    // 6. Cleanup
    await prisma.aIGradingSession.delete({ where: { id: session.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✓ Cleanup completed');

    const duration = Date.now() - startTime;
    results.push({
      test: 'AI Grading Job Processing',
      status: 'PASS',
      message: `Job processed successfully in ${duration}ms`,
      duration,
    });

    console.log(`\n✅ Test 1 PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      test: 'AI Grading Job Processing',
      status: 'FAIL',
      message,
      duration,
    });

    console.error(`\n❌ Test 1 FAILED: ${message}`);
    throw error;
  }
}

/**
 * Test 2: Enqueue and verify email job processing
 */
async function testEmailJob(): Promise<void> {
  console.log('\n📧 Test 2: Email Job Processing');
  console.log('─'.repeat(60));

  const startTime = Date.now();

  try {
    // 1. Enqueue email job
    const job = await emailQueue.add('test-email', {
      type: 'welcome',
      to: 'test@example.com',
      data: {
        fullName: 'Test User',
        loginUrl: 'https://folkify.com/login',
      },
    });

    console.log(`✓ Enqueued email job: ${job.id}`);

    // 2. Wait for job to complete
    console.log('⏳ Waiting for job to complete...');
    const completed = await waitForJob(job.id!, 'email', 30000);

    if (!completed) {
      throw new Error('Job did not complete');
    }

    console.log('✓ Job completed successfully');

    // 3. Verify job result
    const completedJob = await emailQueue.getJob(job.id!);
    if (!completedJob) {
      throw new Error('Job not found after completion');
    }

    const state = await completedJob.getState();
    if (state !== 'completed') {
      throw new Error(`Expected state 'completed', got '${state}'`);
    }

    console.log('✓ Email job verified');

    const duration = Date.now() - startTime;
    results.push({
      test: 'Email Job Processing',
      status: 'PASS',
      message: `Job processed successfully in ${duration}ms`,
      duration,
    });

    console.log(`\n✅ Test 2 PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      test: 'Email Job Processing',
      status: 'FAIL',
      message,
      duration,
    });

    console.error(`\n❌ Test 2 FAILED: ${message}`);
    throw error;
  }
}

/**
 * Test 3: Test premium expiration cron job
 */
async function testPremiumExpirationCron(): Promise<void> {
  console.log('\n⏰ Test 3: Premium Expiration Cron Job');
  console.log('─'.repeat(60));

  const startTime = Date.now();

  try {
    // 1. Create a test user with expired premium
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const testUser = await prisma.user.create({
      data: {
        email: `test-premium-${Date.now()}@example.com`,
        password_hash: 'test_hash',
        full_name: 'Premium Test User',
        account_type: 'basic',
        premium_expires_at: yesterday,
      },
    });

    console.log(`✓ Created test user with expired premium: ${testUser.id}`);
    console.log(`  - Account type: ${testUser.account_type}`);
    console.log(`  - Expires at: ${testUser.premium_expires_at}`);

    // 2. Run the cron job
    console.log('⏳ Running premium expiration cron job...');
    const result = await checkExpiredPremium();

    console.log(`✓ Cron job completed: ${result.message}`);
    console.log(`  - Success: ${result.success}`);
    console.log(`  - Affected users: ${result.affectedUsersCount}`);

    if (!result.success) {
      throw new Error('Cron job reported failure');
    }

    if (result.affectedUsersCount === 0) {
      throw new Error('Expected at least 1 affected user');
    }

    // 3. Verify user was downgraded
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });

    if (!updatedUser) {
      throw new Error('User not found after cron job');
    }

    if (updatedUser.account_type !== 'free') {
      throw new Error(`Expected account_type 'free', got '${updatedUser.account_type}'`);
    }

    console.log(`✓ User downgraded to: ${updatedUser.account_type}`);

    // 4. Verify email was queued
    const emailJobs = await emailQueue.getJobs(['waiting', 'active', 'completed']);
    const premiumExpiredEmail = emailJobs.find(
      (job) => job.data.type === 'premium-expired' && job.data.to === testUser.email
    );

    if (!premiumExpiredEmail) {
      console.warn('⚠ Premium expired email not found in queue (may have been processed)');
    } else {
      console.log(`✓ Premium expired email queued: ${premiumExpiredEmail.id}`);
    }

    // 5. Cleanup
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✓ Cleanup completed');

    const duration = Date.now() - startTime;
    results.push({
      test: 'Premium Expiration Cron Job',
      status: 'PASS',
      message: `Cron job processed ${result.affectedUsersCount} users in ${duration}ms`,
      duration,
    });

    console.log(`\n✅ Test 3 PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      test: 'Premium Expiration Cron Job',
      status: 'FAIL',
      message,
      duration,
    });

    console.error(`\n❌ Test 3 FAILED: ${message}`);
    throw error;
  }
}

/**
 * Test 4: Verify BullMQ with Redis connectivity
 */
async function testBullMQRedisConnectivity(): Promise<void> {
  console.log('\n🔌 Test 4: BullMQ with Redis Connectivity');
  console.log('─'.repeat(60));

  const startTime = Date.now();

  try {
    // 1. Test Redis connection
    const pong = await redisClient.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis ping failed');
    }
    console.log('✓ Redis connection verified');

    // 2. Test AI grading queue
    const aiQueueHealth = await aiGradingQueue.getJobCounts();
    console.log('✓ AI Grading Queue status:', aiQueueHealth);

    // 3. Test email queue
    const emailQueueHealth = await emailQueue.getJobCounts();
    console.log('✓ Email Queue status:', emailQueueHealth);

    // 4. Test queue operations
    const testJob = await aiGradingQueue.add('connectivity-test', {
      sessionId: 'test',
      filePath: 'test',
    });
    console.log(`✓ Test job added: ${testJob.id}`);

    // Wait a moment for the job to be picked up or completed
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Try to get the job and check its state
    const jobCheck = await aiGradingQueue.getJob(testJob.id!);
    if (jobCheck) {
      const state = await jobCheck.getState();
      console.log(`✓ Test job state: ${state}`);

      // Only try to remove if not locked
      if (state === 'completed' || state === 'failed') {
        await jobCheck.remove();
        console.log('✓ Test job removed');
      } else {
        console.log('✓ Test job is being processed (skipping removal)');
      }
    } else {
      console.log('✓ Test job already processed and removed');
    }

    const duration = Date.now() - startTime;
    results.push({
      test: 'BullMQ with Redis Connectivity',
      status: 'PASS',
      message: `All connectivity checks passed in ${duration}ms`,
      duration,
    });

    console.log(`\n✅ Test 4 PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      test: 'BullMQ with Redis Connectivity',
      status: 'FAIL',
      message,
      duration,
    });

    console.error(`\n❌ Test 4 FAILED: ${message}`);
    throw error;
  }
}

/**
 * Print test summary
 */
function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${icon} ${result.test}${duration}`);
    console.log(`   ${result.message}`);
  });

  console.log('─'.repeat(60));
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Main test runner
 */
async function runTests(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 BACKGROUND JOB PROCESSING TESTS');
  console.log('='.repeat(60));
  console.log('Testing BullMQ workers with Redis and Supabase');
  console.log('Requirements: 7.5');
  console.log('='.repeat(60));

  try {
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✓ Database connected');

    // Connect to Redis
    console.log('🔌 Connecting to Redis...');
    await redisClient.ping();
    console.log('✓ Redis connected');

    // Run tests sequentially
    await testBullMQRedisConnectivity();
    await testEmailJob();
    await testAIGradingJob();
    await testPremiumExpirationCron();

    // Print summary
    printSummary();

    // Exit with appropriate code
    const failed = results.filter((r) => r.status === 'FAIL').length;
    if (failed > 0) {
      console.error(`\n❌ ${failed} test(s) failed`);
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    printSummary();
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await prisma.$disconnect();
    await redisClient.quit();
    console.log('✓ Cleanup completed');
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

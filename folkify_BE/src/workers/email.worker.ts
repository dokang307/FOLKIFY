import { Worker, Job } from 'bullmq';
import logger from '../utils/logger';

/**
 * Email Worker
 * Processes email notification jobs asynchronously
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9
 */

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

type EmailType =
  | 'welcome'
  | 'premium-upgrade'
  | 'premium-expired'
  | 'premium-expiring-soon'
  | 'password-reset'
  | 'ai-grading-completed';

interface EmailJobData {
  type: EmailType;
  to: string;
  data?: Record<string, any>;
}

interface EmailContent {
  subject: string;
  body: string;
}

/**
 * Generate email content based on type
 */
function generateEmailContent(type: EmailType, data?: Record<string, any>): EmailContent {
  switch (type) {
    case 'welcome':
      return {
        subject: 'Welcome to FOLKIFY - Start Your Vietnamese Folk Music Journey!',
        body: `
Hello ${data?.fullName || 'there'}!

Welcome to FOLKIFY, your platform for learning Vietnamese traditional music!

We're excited to have you join our community. Here's what you can do:
- Explore 5+ traditional Vietnamese instruments
- Access free lessons to get started
- Track your progress and earn XP
- Join a community of folk music enthusiasts

Start your journey: ${data?.loginUrl || 'https://folkify.com/login'}

Happy learning!
The FOLKIFY Team
        `.trim(),
      };

    case 'premium-upgrade':
      return {
        subject: 'Welcome to FOLKIFY Premium!',
        body: `
Hello ${data?.fullName || 'there'}!

Congratulations! Your account has been upgraded to ${data?.planType?.toUpperCase() || 'PREMIUM'}.

Your premium benefits:
- Access to ALL lessons and sheet music
${data?.planType === 'pro' ? '- Unlimited AI grading for your performances' : ''}
- Priority support
- New content as soon as it's released

Your subscription expires on: ${data?.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'N/A'}

Enjoy your premium experience!
The FOLKIFY Team
        `.trim(),
      };

    case 'premium-expired':
      return {
        subject: 'Your FOLKIFY Premium Subscription Has Expired',
        body: `
Hello ${data?.fullName || 'there'}!

Your FOLKIFY Premium subscription has expired.

Don't worry - your progress and achievements are still saved! However, you now have access to:
- First 3 lessons of each instrument
- Free sheet music only

To continue enjoying premium benefits, please renew your subscription.

Renew now: ${data?.renewUrl || 'https://folkify.com/premium'}

We hope to see you back soon!
The FOLKIFY Team
        `.trim(),
      };

    case 'premium-expiring-soon':
      return {
        subject: 'Your FOLKIFY Premium Subscription is Expiring Soon',
        body: `
Hello ${data?.fullName || 'there'}!

Your FOLKIFY Premium subscription will expire in ${data?.daysRemaining || 7} days.

Expiration date: ${data?.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'N/A'}

To continue enjoying unlimited access to all lessons, sheet music, and AI grading, please renew your subscription.

Renew now: ${data?.renewUrl || 'https://folkify.com/premium'}

Thank you for being a valued member!
The FOLKIFY Team
        `.trim(),
      };

    case 'password-reset':
      return {
        subject: 'Reset Your FOLKIFY Password',
        body: `
Hello ${data?.fullName || 'there'}!

We received a request to reset your FOLKIFY password.

Click the link below to reset your password:
${data?.resetLink || 'https://folkify.com/reset-password?token=MOCK_TOKEN'}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

The FOLKIFY Team
        `.trim(),
      };

    case 'ai-grading-completed':
      return {
        subject: 'Your FOLKIFY AI Grading Results Are Ready!',
        body: `
Hello ${data?.fullName || 'there'}!

Your AI grading results are ready!

Overall Score: ${data?.score || 'N/A'}/100

View your detailed feedback and improvement suggestions:
${data?.resultsUrl || 'https://folkify.com/ai-grading'}

Keep practicing and improving!
The FOLKIFY Team
        `.trim(),
      };

    default:
      return {
        subject: 'FOLKIFY Notification',
        body: 'You have a new notification from FOLKIFY.',
      };
  }
}

/**
 * Process email job
 */
async function processEmail(job: Job<EmailJobData>): Promise<void> {
  const { type, to, data } = job.data;

  try {
    // Generate email content
    const { subject, body } = generateEmailContent(type, data);

    // Log to console (development mode)
    console.log('\n' + '='.repeat(80));
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Type: ${type}`);
    console.log('-'.repeat(80));
    console.log(body);
    console.log('='.repeat(80) + '\n');

    // Log to Winston emails.log
    logger.info('Email sent', {
      to,
      subject,
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Email job ${job.id} failed:`, error);
    throw error; // Trigger retry
  }
}

/**
 * Create and start email worker
 */
export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>('email', processEmail, {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
    },
    concurrency: 10, // Process up to 10 emails concurrently
  });

  // Worker event handlers
  worker.on('completed', (job) => {
    logger.info(`Email job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Email job ${job?.id} failed:`, error);
  });

  worker.on('error', (error) => {
    logger.error('Email worker error:', error);
  });

  logger.info('Email worker started');

  return worker;
}

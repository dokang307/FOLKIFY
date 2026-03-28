# BullMQ Queue System Documentation

## Overview

The FOLKIFY Backend API uses BullMQ for asynchronous job processing. This document explains the queue system setup and usage.

## Architecture

### Queues

1. **AI Grading Queue** (`ai-grading`)
   - Processes AI grading submissions asynchronously
   - Mock AI service generates random scores (60-95) for development
   - Retry policy: 3 attempts with exponential backoff

2. **Email Queue** (`email`)
   - Processes email notifications asynchronously
   - Logs emails to console and Winston file (no actual SMTP)
   - Retry policy: 3 attempts with exponential backoff

### Workers

Workers are separate processes that consume jobs from queues:

- **AI Grading Worker**: Processes AI grading jobs
- **Email Worker**: Processes email notification jobs

## Configuration

Queue configuration is in `src/config/queues.ts`:

```typescript
const queueOptions: QueueOptions = {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 3600,
    },
  },
};
```

## Usage

### Adding Jobs to Queue

#### AI Grading Job

```typescript
import { aiGradingQueue } from './config/queues';

await aiGradingQueue.add('grade-submission', {
  sessionId: 'session-uuid',
  filePath: '/uploads/ai-grading/user-id/file.mp3',
});
```

#### Email Job

```typescript
import { emailQueue } from './config/queues';

await emailQueue.add('send-email', {
  type: 'welcome',
  to: 'user@example.com',
  data: {
    fullName: 'John Doe',
    loginUrl: 'https://folkify.com/login',
  },
});
```

## Mock AI Service

The mock AI service generates random scores for development:

- **Scores**: Random values between 60-95 for each criterion
- **Criteria**: rhythm, pitch, technique, expression
- **Overall Score**: Average of all criteria scores
- **Feedback**: Generic feedback based on score range
- **Suggestions**: Generic improvement suggestions

## Email Types

Supported email types:

1. `welcome` - Welcome email for new users
2. `premium-upgrade` - Confirmation email for premium upgrade
3. `premium-expired` - Notification when premium expires
4. `premium-expiring-soon` - Reminder before premium expires
5. `password-reset` - Password reset link
6. `ai-grading-completed` - AI grading results ready

## Worker Lifecycle

Workers are started automatically when the server starts:

```typescript
// In src/index.ts
import { startWorkers, stopWorkers } from './workers';

// Start workers
startWorkers();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await stopWorkers();
  await closeQueues();
});
```

## Monitoring

Queue events are logged using Winston:

- Job completed: `logger.info('AI grading job completed')`
- Job failed: `logger.error('AI grading job failed')`
- Worker error: `logger.error('AI grading worker error')`

## Requirements Fulfilled

- **4.4**: Queue system with retry policy
- **4.5**: Mock AI service with random scores
- **4.6**: AI grading worker processes jobs
- **4.7**: Failure handling and retry logic
- **4.9**: Overall score calculation
- **18.1-18.9**: Email queue worker with console logging

## Testing

Run tests:

```bash
npm test -- mockAI.service.test.ts
npm test -- queues.test.ts
```

## Redis Requirement

The queue system requires Redis to be running:

```bash
# Start Redis (Windows)
redis-server

# Start Redis (Linux/Mac)
redis-server
```

Configure Redis connection in `.env`:

```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

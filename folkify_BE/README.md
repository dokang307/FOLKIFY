# FOLKIFY Backend API

Vietnamese Folk Music Learning Platform - Backend API

## Spec Status

**Spec Location:** `.kiro/specs/folkify-backend-api/`

**Spec Type:** Feature (New Feature Development)

**Workflow Type:** Requirements-First

**Current Phase:** Task Execution (Task 1 completed, Task 2 in progress)

### Spec Files

- ✅ `requirements.md` - Complete requirements document with 30 functional requirements
- ✅ `design.md` - Complete technical design with architecture, data models, and API specifications
- ✅ `tasks.md` - Implementation plan with 29 tasks broken down into subtasks
- ✅ `.config.kiro` - Spec configuration metadata

### Progress Summary

**Completed:**

- Task 1: Project setup and core infrastructure ✅
  - Node.js 20 + TypeScript project initialized
  - All dependencies installed (express, prisma, bcrypt, jwt, zod, winston, bullmq, etc.)
  - Directory structure created
  - ESLint and Prettier configured

**In Progress:**

- Task 2: Database schema and Prisma setup
  - Subtask 2.1: Prisma schema with 12 tables (pending)
  - Subtask 2.2: Initial migration and seed data (pending)
  - Subtask 2.3: Property test for database schema (optional, pending)

**Next Steps:**

1. Complete Task 2.1: Define all 12 Prisma models with proper relationships and indexes
2. Complete Task 2.2: Create migrations and seed scripts for initial data
3. Proceed to Task 3: Core utilities and configuration

### Key Implementation Notes

**Account Type Logic:**

- Use 'free', 'basic', 'pro' (NOT 'premium')
- isPremium = account_type IN ['basic', 'pro'] AND premium_expires_at > NOW()
- isPro = account_type = 'pro' AND premium_expires_at > NOW()

**AI Grading Access:**

- Only PRO users have unlimited AI grading
- FREE and BASIC users get 403 Forbidden

**Queue-Based Processing:**

- AI grading MUST be async via BullMQ
- Worker runs in separate process

**Manual Payment:**

- Admin manually upgrades users via dashboard
- No payment gateway webhooks
- All upgrades logged to admin_activity_logs

**Testing Strategy:**

- Unit tests for specific examples and edge cases
- Property-based tests (15 properties) for universal invariants
- Target coverage: >= 80%
- Use fast-check library with minimum 100 iterations per property

### How to Continue

To continue working on this spec:

1. **Review the spec files** in `.kiro/specs/folkify-backend-api/`
2. **Check tasks.md** for the current task status and next steps
3. **Execute tasks sequentially** - each task has clear acceptance criteria
4. **Run tests after each task** to ensure correctness
5. **Update task status** by marking tasks as complete in tasks.md

To execute the next task:

```
Execute task 2.1
```

Or to run all remaining tasks:

```
Run all tasks for folkify-backend-api
```

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Queue:** BullMQ + Redis
- **Cache:** Redis
- **Storage:** Local file system
- **Authentication:** JWT
- **Testing:** Jest + Supertest + fast-check

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

### Database Setup

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions on setting up PostgreSQL and running migrations.

Quick setup:

```bash
# 1. Create PostgreSQL database
createdb folkify_db

# 2. Update DATABASE_URL in .env file

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Seed database with sample data
npx prisma db seed
```

### Development

```bash
# Run in development mode
npm run dev

# Run tests (requires test database setup - see TEST_SETUP.md)
npm test

# Run linter
npm run lint

# Format code
npm run format
```

### Testing

The project uses integration tests that require a real PostgreSQL database.

**📚 Complete Testing Documentation:** See [TEST_DOCUMENTATION_INDEX.md](./TEST_DOCUMENTATION_INDEX.md) for all testing guides.

**⚡ Quick Start:**

- First time? → [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)
- Daily use? → [TESTING_QUICK_START.md](./TESTING_QUICK_START.md)
- Troubleshooting? → [TASK_29_TEST_FIXES.md](./TASK_29_TEST_FIXES.md)

Quick test setup:

```bash
# Windows
scripts\setup-test-db.bat

# Linux/Mac
bash scripts/setup-test-db.sh

# Then run tests
npm test
```

**Test Coverage:** 41 test files covering repositories, services, controllers, middleware, and utilities.

**Coverage Goals:** >= 80% overall, >= 75% branches

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── controllers/    # Request handlers
├── services/       # Business logic
├── repositories/   # Data access layer
├── middleware/     # Express middleware
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── config/         # Configuration files
└── index.ts        # Application entry point
```

## Features

- JWT Authentication (Access + Refresh tokens)
- 3 Account Types: FREE, BASIC, PRO
- Content Access Control
- Queue-based AI Grading (Mock service)
- Manual Payment Processing
- Admin Dashboard
- Practice Session Tracking
- Local File Storage
- Redis Caching
- Winston Logging

## License

ISC

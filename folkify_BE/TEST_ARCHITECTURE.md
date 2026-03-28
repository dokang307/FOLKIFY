# Test Architecture

## Overview

This document explains the test architecture and how tests interact with the system.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Test Execution Flow                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   npm test   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                         Jest                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  jest.config.js                                        │  │
│  │  - testEnvironment: node                               │  │
│  │  - setupFiles: ['src/test-setup.ts']                   │  │
│  │  - testTimeout: 10000ms                                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    src/test-setup.ts                          │
│  - Load .env.test                                             │
│  - Set NODE_ENV=test                                          │
│  - Mock @prisma/client (available but not used)               │
│  - Mock database config (available but not used)              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Test Files                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │  Repository    │  │   Service      │  │  Controller    │ │
│  │    Tests       │  │    Tests       │  │    Tests       │ │
│  │                │  │                │  │                │ │
│  │  - user.repo   │  │  - auth.svc    │  │  - auth.ctrl   │ │
│  │  - lesson.repo │  │  - lesson.svc  │  │  - lesson.ctrl │ │
│  │  - sheet.repo  │  │  - sheet.svc   │  │  - sheet.ctrl  │ │
│  │  - admin.repo  │  │  - admin.svc   │  │  - admin.ctrl  │ │
│  │  - etc...      │  │  - etc...      │  │  - etc...      │ │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
└───────────┼──────────────────┼──────────────────┼────────────┘
            │                  │                  │
            ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────┐
│                  Application Code                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │  Repositories  │  │   Services     │  │  Controllers   │ │
│  │                │  │                │  │                │ │
│  │  Data Access   │  │  Business      │  │  HTTP          │ │
│  │  Layer         │  │  Logic         │  │  Handlers      │ │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
└───────────┼──────────────────┼──────────────────┼────────────┘
            │                  │                  │
            └──────────────────┴──────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Prisma Client                              │
│  - Generated from schema.prisma                               │
│  - Provides type-safe database access                         │
│  - Handles connection pooling                                 │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  folkify_db (or folkify_db_test)                       │  │
│  │                                                         │  │
│  │  Tables:                                                │  │
│  │  - users                                                │  │
│  │  - user_stats                                           │  │
│  │  - instruments                                          │  │
│  │  - lessons                                              │  │
│  │  - sheet_music                                          │  │
│  │  - premium_subscriptions                                │  │
│  │  - payment_transactions                                 │  │
│  │  - ai_grading_sessions                                  │  │
│  │  - practice_sessions                                    │  │
│  │  - user_progress                                        │  │
│  │  - admin_activity_logs                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Test Lifecycle

### 1. Test Suite Initialization

```typescript
describe('Test Suite', () => {
  // Runs once before all tests in this suite
  beforeAll(async () => {
    // Optional: Set up test fixtures
  });

  // Runs before each test
  beforeEach(async () => {
    // Clean up test data
    await prisma.childTable.deleteMany();
    await prisma.parentTable.deleteMany();
  });

  // Runs after each test
  afterEach(async () => {
    // Optional: Additional cleanup
  });

  // Runs once after all tests in this suite
  afterAll(async () => {
    // Disconnect from database
    await prisma.$disconnect();
  });

  it('should test something', async () => {
    // Test implementation
  });
});
```

### 2. Test Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Jest starts                                              │
│     - Loads jest.config.js                                   │
│     - Runs setupFiles (test-setup.ts)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  2. test-setup.ts executes                                   │
│     - Loads .env.test                                        │
│     - Sets NODE_ENV=test                                     │
│     - Configures mocks (not used in integration tests)       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Test file loads                                          │
│     - Imports application code                               │
│     - Imports Prisma client                                  │
│     - Sets up test suite                                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  4. beforeAll hook runs (if present)                         │
│     - Set up test fixtures                                   │
│     - Initialize test data                                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  5. For each test:                                           │
│     ┌─────────────────────────────────────────────────────┐ │
│     │  a. beforeEach hook runs                            │ │
│     │     - Clean up database                             │ │
│     │     - Reset test state                              │ │
│     └─────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│     ┌─────────────────────────────────────────────────────┐ │
│     │  b. Test executes                                   │ │
│     │     - Calls application code                        │ │
│     │     - Makes database queries                        │ │
│     │     - Asserts expectations                          │ │
│     └─────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│     ┌─────────────────────────────────────────────────────┐ │
│     │  c. afterEach hook runs (if present)                │ │
│     │     - Additional cleanup                            │ │
│     └─────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  6. afterAll hook runs                                       │
│     - Disconnect from database                               │
│     - Clean up resources                                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Jest reports results                                     │
│     - Pass/fail status                                       │
│     - Coverage metrics                                       │
│     - Execution time                                         │
└─────────────────────────────────────────────────────────────┘
```

## Test Types

### Integration Tests (Current Approach)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    Test     │─────▶│ Application │─────▶│  Database   │
│    Code     │      │    Code     │      │ (Real)      │
└─────────────┘      └─────────────┘      └─────────────┘
     │                     │                     │
     │                     │                     │
     └─────────────────────┴─────────────────────┘
              Tests real behavior
```

**Characteristics:**

- Uses real PostgreSQL database
- Tests actual SQL queries
- Validates Prisma schema
- High confidence in production behavior
- Slower execution
- Requires database setup

### Unit Tests with Mocks (Alternative)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    Test     │─────▶│ Application │─────▶│   Mock      │
│    Code     │      │    Code     │      │  Database   │
└─────────────┘      └─────────────┘      └─────────────┘
     │                     │                     │
     │                     │                     │
     └─────────────────────┴─────────────────────┘
              Tests mocked behavior
```

**Characteristics:**

- Uses mocked Prisma client
- No real database queries
- Tests business logic only
- Faster execution
- No database setup required
- Lower confidence in production behavior

## Database Connection

### Configuration

```typescript
// .env.test
DATABASE_URL=postgresql://postgres:password@localhost:5432/folkify_db

// src/config/database.ts
export const prisma = DatabaseClient.getInstance();

// Test file
import { prisma } from '../config/database';
```

### Connection Pooling

```
┌─────────────────────────────────────────────────────────────┐
│                    Prisma Client                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Connection Pool (max 20 connections)                  │ │
│  │                                                         │ │
│  │  [Conn 1] [Conn 2] [Conn 3] ... [Conn 20]              │ │
│  │     │        │        │              │                  │ │
│  │     ▼        ▼        ▼              ▼                  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         PostgreSQL Database                      │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Test Data Management

### Cleanup Strategy

```typescript
// Clean up in correct order (child → parent)
beforeEach(async () => {
  // 1. Delete child records first
  await prisma.userStats.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.practiceSession.deleteMany();

  // 2. Delete parent records
  await prisma.user.deleteMany();

  // 3. Delete other tables
  await prisma.lesson.deleteMany();
  await prisma.instrument.deleteMany();
});
```

### Test Isolation

```
Test 1                Test 2                Test 3
  │                     │                     │
  ▼                     ▼                     ▼
Clean DB              Clean DB              Clean DB
  │                     │                     │
  ▼                     ▼                     ▼
Insert Data           Insert Data           Insert Data
  │                     │                     │
  ▼                     ▼                     ▼
Run Test              Run Test              Run Test
  │                     │                     │
  ▼                     ▼                     ▼
Assert                Assert                Assert
  │                     │                     │
  └─────────────────────┴─────────────────────┘
           Each test starts with clean state
```

## Coverage Tracking

```
┌─────────────────────────────────────────────────────────────┐
│                    Jest Coverage                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Instruments code during test execution                │ │
│  │                                                         │ │
│  │  Tracks:                                                │ │
│  │  - Statements executed                                  │ │
│  │  - Branches taken                                       │ │
│  │  - Functions called                                     │ │
│  │  - Lines covered                                        │ │
│  └────────────────────────┬───────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Coverage Report                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  coverage/                                              │ │
│  │  ├── lcov-report/index.html  (HTML report)             │ │
│  │  ├── coverage-final.json     (JSON data)               │ │
│  │  └── lcov.info               (LCOV format)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Test fails with connection error                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Is PostgreSQL running?                                      │
│  Run: pg_isready                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │           │
                   No          Yes
                    │           │
                    ▼           ▼
┌──────────────────────┐  ┌──────────────────────────────────┐
│  Start PostgreSQL    │  │  Is DATABASE_URL correct?        │
│  Check service       │  │  Check .env.test                 │
└──────────────────────┘  └─────────────┬────────────────────┘
                                        │
                                  ┌─────┴─────┐
                                  │           │
                                 No          Yes
                                  │           │
                                  ▼           ▼
                    ┌──────────────────────┐  ┌──────────────┐
                    │  Update .env.test    │  │  Run         │
                    │  with correct URL    │  │  migrations  │
                    └──────────────────────┘  └──────┬───────┘
                                                     │
                                                     ▼
                                        ┌──────────────────────┐
                                        │  npx prisma migrate  │
                                        │  deploy              │
                                        └──────┬───────────────┘
                                               │
                                               ▼
                                        ┌──────────────────────┐
                                        │  Run tests           │
                                        │  npm test            │
                                        └──────────────────────┘
```

## Summary

The test architecture uses:

- **Integration tests** for high confidence
- **Real PostgreSQL database** for accurate testing
- **Prisma Client** for type-safe database access
- **Jest** for test execution and coverage
- **Clean database state** for each test
- **Connection pooling** for performance

This approach ensures that tests validate real-world behavior and catch issues before production.

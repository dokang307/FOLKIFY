# Test Documentation Index

Complete guide to testing the Folkify Backend API.

## Quick Start

**New to testing this project?** Start here:

1. 📋 [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) - Step-by-step checklist
2. ⚡ [TESTING_QUICK_START.md](./TESTING_QUICK_START.md) - Quick reference
3. 🔧 Run setup script:
   - Windows: `scripts\setup-test-db.bat`
   - Linux/Mac: `bash scripts/setup-test-db.sh`
4. ▶️ Run tests: `npm test`

## Documentation Files

### For Getting Started

| File                                               | Purpose                      | When to Use      |
| -------------------------------------------------- | ---------------------------- | ---------------- |
| [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)           | Step-by-step setup checklist | First time setup |
| [TESTING_QUICK_START.md](./TESTING_QUICK_START.md) | Quick reference card         | Daily use        |
| [TEST_SETUP.md](./TEST_SETUP.md)                   | Comprehensive setup guide    | Detailed setup   |

### For Understanding

| File                                                               | Purpose                                 | When to Use                  |
| ------------------------------------------------------------------ | --------------------------------------- | ---------------------------- |
| [TEST_ARCHITECTURE.md](./TEST_ARCHITECTURE.md)                     | Architecture diagrams and flow          | Understanding how tests work |
| [TASK_29_TEST_FIXES.md](./TASK_29_TEST_FIXES.md)                   | Problem analysis and solutions          | Troubleshooting              |
| [TEST_INFRASTRUCTURE_SUMMARY.md](./TEST_INFRASTRUCTURE_SUMMARY.md) | Complete summary of test infrastructure | Overview                     |

### For Troubleshooting

| File                                             | Purpose                     | When to Use          |
| ------------------------------------------------ | --------------------------- | -------------------- |
| [TASK_29_TEST_FIXES.md](./TASK_29_TEST_FIXES.md) | Common issues and solutions | Tests failing        |
| [TEST_SETUP.md](./TEST_SETUP.md)                 | Troubleshooting section     | Specific errors      |
| [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)         | Troubleshooting checklist   | Systematic debugging |

## Setup Scripts

| Script                      | Platform  | Purpose                       |
| --------------------------- | --------- | ----------------------------- |
| `scripts/setup-test-db.bat` | Windows   | Automated test database setup |
| `scripts/setup-test-db.sh`  | Linux/Mac | Automated test database setup |

## Test Files Overview

### Repository Tests (10 files)

Integration tests for data access layer

- `src/repositories/*.repository.test.ts`

### Service Tests (12 files)

Integration tests for business logic

- `src/services/*.service.test.ts`

### Controller Tests (11 files)

Integration tests for HTTP handlers

- `src/controllers/*.controller.test.ts`

### Middleware Tests (4 files)

Unit tests for middleware

- `src/middleware/*.test.ts`

### Utility Tests (4 files)

Unit tests for utilities

- `src/utils/*.test.ts`

**Total: 41 test files**

## Common Tasks

### First Time Setup

```bash
# 1. Check prerequisites
node --version    # Need 20+
psql --version    # Need 14+
pg_isready        # PostgreSQL running?

# 2. Update .env.test with your password
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/folkify_db

# 3. Run setup script
scripts\setup-test-db.bat  # Windows
bash scripts/setup-test-db.sh  # Linux/Mac

# 4. Run tests
npm test
```

### Daily Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- user.repository.test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Troubleshooting

```bash
# Check PostgreSQL
pg_isready

# Check database exists
psql -U postgres -lqt | grep folkify_db

# Run migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset --force

# View database
npx prisma studio
```

## Test Architecture

### Integration Tests (Current)

```
Test → Application Code → Prisma Client → PostgreSQL
```

**Pros:**

- ✅ Tests real database operations
- ✅ High confidence in production behavior
- ✅ Validates Prisma schema

**Cons:**

- ❌ Requires database setup
- ❌ Slower execution

### Unit Tests with Mocks (Alternative)

```
Test → Application Code → Mock Prisma Client
```

**Pros:**

- ✅ No database required
- ✅ Faster execution

**Cons:**

- ❌ Lower confidence
- ❌ Doesn't test actual SQL

**Recommendation:** Use integration tests (current approach)

## Coverage Goals

| Metric     | Target |
| ---------- | ------ |
| Overall    | >= 80% |
| Statements | >= 80% |
| Branches   | >= 75% |
| Functions  | >= 80% |
| Lines      | >= 80% |

Check coverage:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## CI/CD Integration

For GitHub Actions or similar:

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: folkify_db_test
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432

  redis:
    image: redis:7
    ports:
      - 6379:6379

steps:
  - name: Run migrations
    run: npx prisma migrate deploy

  - name: Run tests
    run: npm test

  - name: Upload coverage
    run: npm run test:coverage
```

## Key Concepts

### Test Lifecycle

1. **beforeEach** - Clean database before each test
2. **Test execution** - Run test with real database
3. **afterAll** - Disconnect from database

### Test Isolation

Each test starts with a clean database state:

```typescript
beforeEach(async () => {
  await prisma.childTable.deleteMany();
  await prisma.parentTable.deleteMany();
});
```

### Connection Pooling

Prisma Client uses connection pooling (max 20 connections) for performance.

## Troubleshooting Guide

| Error                 | Solution           | Documentation                                                                      |
| --------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| Connection refused    | Start PostgreSQL   | [TEST_SETUP.md](./TEST_SETUP.md#issue-connection-refused-or-authentication-failed) |
| Authentication failed | Update `.env.test` | [TEST_SETUP.md](./TEST_SETUP.md#issue-connection-refused-or-authentication-failed) |
| Table does not exist  | Run migrations     | [TEST_SETUP.md](./TEST_SETUP.md#issue-table-does-not-exist)                        |
| Tests timeout         | Increase timeout   | [TEST_SETUP.md](./TEST_SETUP.md#issue-tests-timeout)                               |
| Foreign key violation | Fix cleanup order  | [TEST_SETUP.md](./TEST_SETUP.md#issue-foreign-key-constraint-violation)            |

## Getting Help

1. **Quick answer?** → [TESTING_QUICK_START.md](./TESTING_QUICK_START.md)
2. **Setup issue?** → [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)
3. **Understanding tests?** → [TEST_ARCHITECTURE.md](./TEST_ARCHITECTURE.md)
4. **Detailed guide?** → [TEST_SETUP.md](./TEST_SETUP.md)
5. **Troubleshooting?** → [TASK_29_TEST_FIXES.md](./TASK_29_TEST_FIXES.md)

## Summary

The Folkify Backend API uses **integration tests** with a real PostgreSQL database for high confidence in production behavior. Setup is straightforward using the provided scripts and documentation.

**Next Steps:**

1. Follow [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) for setup
2. Run `npm test` to validate
3. Check coverage with `npm run test:coverage`
4. Add tests for new features

## Files Created

This test documentation includes:

1. **TEST_CHECKLIST.md** - Step-by-step setup checklist
2. **TESTING_QUICK_START.md** - Quick reference card
3. **TEST_SETUP.md** - Comprehensive setup guide
4. **TEST_ARCHITECTURE.md** - Architecture diagrams and flow
5. **TASK_29_TEST_FIXES.md** - Problem analysis and solutions
6. **TEST_INFRASTRUCTURE_SUMMARY.md** - Complete infrastructure summary
7. **TEST_DOCUMENTATION_INDEX.md** - This file (navigation hub)
8. **scripts/setup-test-db.bat** - Windows setup script
9. **scripts/setup-test-db.sh** - Linux/Mac setup script

All documentation is comprehensive, well-organized, and easy to follow.

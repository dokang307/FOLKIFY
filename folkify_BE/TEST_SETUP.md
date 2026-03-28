# Test Setup Guide

This guide explains how to set up and run tests for the Folkify Backend API.

## Test Architecture

The project uses **integration tests** that require a real PostgreSQL database connection. This approach ensures that:

- Database queries work correctly with real PostgreSQL
- Prisma schema matches actual database structure
- Relationships and constraints are properly tested
- Real-world scenarios are validated

## Prerequisites

Before running tests, you need:

1. **PostgreSQL 14+** installed and running
2. **Redis 7+** installed and running (for queue tests)
3. **Node.js 20+** installed
4. **Test database** configured

## Step 1: Set Up Test Database

### Option A: Use Existing Database (Quick)

If you already have the `folkify_db` database set up, the tests will use it. Make sure your `.env.test` file has the correct `DATABASE_URL`.

### Option B: Create Separate Test Database (Recommended)

Create a dedicated test database to avoid interfering with development data:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE folkify_db_test;

# Grant privileges (if using a specific user)
GRANT ALL PRIVILEGES ON DATABASE folkify_db_test TO folkify_user;

# Exit
\q
```

Then update `.env.test`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/folkify_db_test
```

## Step 2: Run Migrations

Apply database migrations to the test database:

```bash
# Set environment to test
$env:NODE_ENV="test"  # PowerShell
# OR
export NODE_ENV=test  # Bash

# Run migrations
npx prisma migrate deploy

# OR reset and seed (WARNING: Deletes all data)
npx prisma migrate reset --force
```

## Step 3: Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- user.repository.test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Test Structure

```
src/
├── __mocks__/              # Mock implementations
│   └── @prisma/client.ts   # Prisma client mock (not used in integration tests)
├── controllers/            # Controller tests
│   └── *.controller.test.ts
├── services/               # Service tests
│   └── *.service.test.ts
├── repositories/           # Repository tests
│   └── *.repository.test.ts
├── middleware/             # Middleware tests
│   └── *.test.ts
└── utils/                  # Utility tests
    └── *.test.ts
```

## Test Database Lifecycle

Each test suite follows this pattern:

```typescript
describe('Test Suite', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.relatedTable.deleteMany();
    await prisma.mainTable.deleteMany();
  });

  afterAll(async () => {
    // Disconnect after all tests
    await prisma.$disconnect();
  });

  it('should test something', async () => {
    // Test implementation
  });
});
```

## Common Issues

### Issue: "Connection refused" or "Authentication failed"

**Solution:** Check your `.env.test` file and ensure:

- PostgreSQL is running: `pg_isready`
- DATABASE_URL is correct
- Password is correct
- Database exists

### Issue: "Table does not exist"

**Solution:** Run migrations:

```bash
npx prisma migrate deploy
```

### Issue: "Tests timeout"

**Solution:**

- Increase timeout in `jest.config.js` (currently 10000ms)
- Check if database is responding slowly
- Ensure Redis is running for queue tests

### Issue: "Foreign key constraint violation"

**Solution:**

- Check test cleanup order in `beforeEach`
- Delete child records before parent records
- Example: Delete `user_stats` before `user`

## Test Coverage

Current coverage targets:

- **Overall:** >= 80%
- **Statements:** >= 80%
- **Branches:** >= 75%
- **Functions:** >= 80%
- **Lines:** >= 80%

View coverage report:

```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

For CI/CD pipelines, use a test database service:

```yaml
# Example GitHub Actions
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
```

## Alternative: Unit Tests with Mocks

If you want to run tests without a database (faster but less comprehensive):

1. The project includes `jest-mock-extended` for mocking
2. Mock setup is in `src/__mocks__/@prisma/client.ts`
3. Currently not used because integration tests provide better coverage

To convert to unit tests:

- Mock Prisma client in each test file
- Mock external dependencies (Redis, file system, etc.)
- Focus on business logic rather than database operations

## Next Steps

After setting up tests:

1. Run full test suite: `npm test`
2. Check coverage: `npm test -- --coverage`
3. Fix any failing tests
4. Add new tests for new features
5. Maintain >= 80% coverage

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [fast-check Documentation](https://fast-check.dev/)

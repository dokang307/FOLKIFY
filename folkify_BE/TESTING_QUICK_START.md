# Testing Quick Start

## TL;DR

Tests require a PostgreSQL database. Run this once:

### Windows

```bash
scripts\setup-test-db.bat
```

### Linux/Mac

```bash
bash scripts/setup-test-db.sh
```

Then run tests:

```bash
npm test
```

## What You Need

- ✅ PostgreSQL running
- ✅ Correct password in `.env.test`
- ✅ Database migrations applied

## Common Commands

```bash
# Run all tests
npm test

# Run specific test
npm test -- user.repository.test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Reset test database
npx prisma migrate reset --force
```

## Troubleshooting

### "Connection refused"

→ Start PostgreSQL: `pg_isready` to check

### "Authentication failed"

→ Update password in `.env.test`

### "Table does not exist"

→ Run migrations: `npx prisma migrate deploy`

### "Tests timeout"

→ Check if PostgreSQL is slow or increase timeout in `jest.config.js`

## Full Documentation

See [TEST_SETUP.md](./TEST_SETUP.md) for complete guide.

## Test Types

This project uses **integration tests**:

- ✅ Tests real database operations
- ✅ Validates Prisma schema
- ✅ High confidence in production behavior
- ❌ Requires database setup
- ❌ Slower than unit tests

## Coverage Goals

- Overall: >= 80%
- Statements: >= 80%
- Branches: >= 75%
- Functions: >= 80%

Check coverage:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

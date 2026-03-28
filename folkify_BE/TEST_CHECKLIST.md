# Test Setup Checklist

Use this checklist to get tests running successfully.

## Prerequisites Checklist

- [ ] Node.js 20+ installed

  ```bash
  node --version  # Should show v20.x.x or higher
  ```

- [ ] PostgreSQL 14+ installed

  ```bash
  psql --version  # Should show 14.x or higher
  ```

- [ ] PostgreSQL service running

  ```bash
  pg_isready  # Should show "accepting connections"
  ```

- [ ] Redis 7+ installed (for queue tests)

  ```bash
  redis-cli --version  # Should show 7.x or higher
  ```

- [ ] Redis service running
  ```bash
  redis-cli ping  # Should return "PONG"
  ```

## Configuration Checklist

- [ ] `.env.test` file exists

  ```bash
  # Windows
  dir .env.test

  # Linux/Mac
  ls -la .env.test
  ```

- [ ] `DATABASE_URL` in `.env.test` is correct

  ```env
  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/folkify_db
  ```

  Replace `YOUR_PASSWORD` with your actual PostgreSQL password

- [ ] Can connect to PostgreSQL with credentials
  ```bash
  psql -U postgres -d postgres -c "SELECT 1"
  # Should return: 1
  ```

## Database Setup Checklist

- [ ] Test database exists

  ```bash
  psql -U postgres -lqt | cut -d \| -f 1 | grep -qw folkify_db && echo "Database exists" || echo "Database does not exist"
  ```

- [ ] If database doesn't exist, create it

  ```bash
  createdb -U postgres folkify_db
  ```

- [ ] Prisma Client is generated

  ```bash
  npx prisma generate
  ```

- [ ] Migrations are applied

  ```bash
  npx prisma migrate deploy
  ```

- [ ] Can query the database
  ```bash
  psql -U postgres -d folkify_db -c "\dt"
  # Should list all tables
  ```

## Quick Setup (Automated)

- [ ] Run setup script

  ```bash
  # Windows
  scripts\setup-test-db.bat

  # Linux/Mac
  bash scripts/setup-test-db.sh
  ```

## Test Execution Checklist

- [ ] Dependencies installed

  ```bash
  npm install
  ```

- [ ] Can run a single test

  ```bash
  npm test -- --testPathPattern="jwt.test"
  # Should pass (utility test doesn't need database)
  ```

- [ ] Can run repository tests

  ```bash
  npm test -- --testPathPattern="user.repository.test"
  # Should pass if database is set up correctly
  ```

- [ ] Can run all tests

  ```bash
  npm test
  # All tests should pass
  ```

- [ ] Can generate coverage report
  ```bash
  npm run test:coverage
  # Should generate coverage/ directory
  ```

## Troubleshooting Checklist

### If tests fail with "Connection refused"

- [ ] PostgreSQL is running

  ```bash
  pg_isready
  ```

- [ ] Port 5432 is not blocked by firewall

  ```bash
  # Windows
  netstat -an | findstr "5432"

  # Linux/Mac
  netstat -an | grep 5432
  ```

- [ ] Can connect manually
  ```bash
  psql -U postgres -d folkify_db
  ```

### If tests fail with "Authentication failed"

- [ ] Password in `.env.test` is correct

  ```bash
  # Test connection with password from .env.test
  psql postgresql://postgres:YOUR_PASSWORD@localhost:5432/folkify_db -c "SELECT 1"
  ```

- [ ] PostgreSQL pg_hba.conf allows password authentication
  ```bash
  # Check authentication method
  psql -U postgres -c "SHOW hba_file"
  # Open the file and ensure it has: host all all 127.0.0.1/32 md5
  ```

### If tests fail with "Table does not exist"

- [ ] Migrations are applied

  ```bash
  npx prisma migrate deploy
  ```

- [ ] Tables exist in database

  ```bash
  psql -U postgres -d folkify_db -c "\dt"
  ```

- [ ] Prisma Client is up to date
  ```bash
  npx prisma generate
  ```

### If tests timeout

- [ ] Increase timeout in `jest.config.js`

  ```javascript
  testTimeout: 30000, // Increase from 10000 to 30000
  ```

- [ ] Database is responding quickly

  ```bash
  psql -U postgres -d folkify_db -c "SELECT 1"
  # Should return immediately
  ```

- [ ] No long-running queries blocking tests
  ```bash
  psql -U postgres -d folkify_db -c "SELECT * FROM pg_stat_activity WHERE state = 'active'"
  ```

### If specific tests fail

- [ ] Check test cleanup order (child → parent)

  ```typescript
  beforeEach(async () => {
    // Delete child records first
    await prisma.userStats.deleteMany();
    // Then parent records
    await prisma.user.deleteMany();
  });
  ```

- [ ] Check for foreign key constraints

  ```bash
  psql -U postgres -d folkify_db -c "\d+ users"
  # Check foreign key constraints
  ```

- [ ] Run test in isolation
  ```bash
  npm test -- --testPathPattern="specific.test" --verbose
  ```

## Success Criteria

- [ ] All tests pass

  ```bash
  npm test
  # Test Suites: X passed, X total
  # Tests: Y passed, Y total
  ```

- [ ] Coverage meets targets (>= 80%)

  ```bash
  npm run test:coverage
  # Statements: >= 80%
  # Branches: >= 75%
  # Functions: >= 80%
  # Lines: >= 80%
  ```

- [ ] No warnings or errors in output

- [ ] Tests complete in reasonable time (< 60 seconds)

## Next Steps After Success

- [ ] Review coverage report

  ```bash
  # Windows
  start coverage/lcov-report/index.html

  # Linux
  xdg-open coverage/lcov-report/index.html

  # Mac
  open coverage/lcov-report/index.html
  ```

- [ ] Identify untested code

- [ ] Add tests for uncovered areas

- [ ] Set up CI/CD with database service

- [ ] Document any environment-specific setup

## Quick Reference

### Essential Commands

```bash
# Check prerequisites
node --version
psql --version
pg_isready
redis-cli ping

# Setup database
npx prisma generate
npx prisma migrate deploy

# Run tests
npm test                    # All tests
npm test -- user.repo       # Specific test
npm run test:coverage       # With coverage
npm run test:watch          # Watch mode

# Reset database
npx prisma migrate reset --force

# View database
npx prisma studio
```

### Essential Files

- `.env.test` - Test environment configuration
- `jest.config.js` - Jest configuration
- `src/test-setup.ts` - Global test setup
- `TEST_SETUP.md` - Detailed setup guide
- `TESTING_QUICK_START.md` - Quick reference

### Getting Help

1. Check `TEST_SETUP.md` for detailed instructions
2. Check `TASK_29_TEST_FIXES.md` for troubleshooting
3. Check `TEST_ARCHITECTURE.md` for architecture details
4. Check test output for specific error messages
5. Check PostgreSQL logs for database issues

## Completion

Once all checkboxes are checked, your test environment is ready!

Run `npm test` to validate everything works correctly.

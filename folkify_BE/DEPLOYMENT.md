# FOLKIFY Backend API - Deployment Guide

This guide covers deployment setup for the FOLKIFY Backend API using Docker and Docker Compose.

**Requirements:** 30.5, 30.6

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Supabase Database Deployment](#supabase-database-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Database Migrations](#database-migrations)
6. [Local Development Setup](#local-development-setup)
7. [Production Deployment](#production-deployment)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Docker** 24.0+ and **Docker Compose** 2.20+
- **Node.js** 20+ (for local development)
- **Supabase Account** with a PostgreSQL project (for production)
- **Redis** 7+ (if not using Docker)

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Supabase Configuration
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_PROJECT_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Database Configuration - Pooled Connection (Runtime)
# Uses PgBouncer on port 6543 for connection pooling
DATABASE_URL=postgresql://postgres.your-project-id:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Database Configuration - Direct Connection (Migrations)
# Bypasses PgBouncer on port 5432 for schema changes
DIRECT_URL=postgresql://postgres.your-project-id:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Redis Configuration
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration (REQUIRED - Generate secure keys)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# File Upload Configuration
MAX_AUDIO_SIZE=52428800
MAX_VIDEO_SIZE=209715200

# Email Configuration
EMAIL_MODE=console

# Logging Configuration
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Cache Configuration (seconds)
CACHE_TTL_INSTRUMENTS=1800
CACHE_TTL_LESSONS=600
CACHE_TTL_SHEETS=1800
CACHE_TTL_ANALYTICS=300

# Cronjob Configuration
PREMIUM_EXPIRATION_CRON=0 0 * * *

# BullMQ Configuration
QUEUE_RETRY_ATTEMPTS=3
QUEUE_RETRY_DELAY=2000
```

### Environment Variables Reference

| Variable                       | Description                          | Default                 | Required |
| ------------------------------ | ------------------------------------ | ----------------------- | -------- |
| `NODE_ENV`                     | Environment mode                     | `production`            | Yes      |
| `PORT`                         | API server port                      | `3000`                  | No       |
| `SUPABASE_PROJECT_ID`          | Supabase project identifier          | -                       | Yes      |
| `SUPABASE_PROJECT_URL`         | Supabase project URL                 | -                       | Yes      |
| `SUPABASE_ANON_KEY`            | Supabase anonymous key               | -                       | Yes      |
| `DATABASE_URL`                 | Pooled connection (port 6543)        | -                       | Yes      |
| `DIRECT_URL`                   | Direct connection (port 5432)        | -                       | Yes      |
| `REDIS_HOST`                   | Redis host (auto-set in Docker)      | `localhost`             | No       |
| `REDIS_PORT`                   | Redis port                           | `6379`                  | No       |
| `REDIS_PASSWORD`               | Redis password (optional)            | -                       | No       |
| `JWT_SECRET`                   | JWT signing secret (min 32 chars)    | -                       | Yes      |
| `JWT_ACCESS_EXPIRATION`        | Access token expiration              | `15m`                   | No       |
| `JWT_REFRESH_EXPIRATION`       | Refresh token expiration             | `7d`                    | No       |
| `FRONTEND_URL`                 | Frontend URL for CORS                | `http://localhost:5173` | Yes      |
| `MAX_AUDIO_SIZE`               | Max audio file size (bytes)          | `52428800` (50MB)       | No       |
| `MAX_VIDEO_SIZE`               | Max video file size (bytes)          | `209715200` (200MB)     | No       |
| `EMAIL_MODE`                   | Email mode (`console` or `smtp`)     | `console`               | No       |
| `LOG_LEVEL`                    | Logging level                        | `info`                  | No       |
| `RATE_LIMIT_WINDOW_MS`         | Rate limit window (ms)               | `900000` (15min)        | No       |
| `RATE_LIMIT_MAX_REQUESTS`      | Max requests per window              | `100`                   | No       |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | Max auth requests per window         | `5`                     | No       |
| `CACHE_TTL_*`                  | Cache TTL in seconds                 | Various                 | No       |
| `PREMIUM_EXPIRATION_CRON`      | Cron schedule for premium expiration | `0 0 * * *`             | No       |
| `QUEUE_RETRY_ATTEMPTS`         | Queue job retry attempts             | `3`                     | No       |
| `QUEUE_RETRY_DELAY`            | Queue job retry delay (ms)           | `2000`                  | No       |

---

## Supabase Database Deployment

The application uses Supabase as the managed PostgreSQL database provider. This section covers Supabase-specific deployment considerations.

### Obtaining Supabase Credentials

1. **Create a Supabase Project:**
   - Visit [https://supabase.com](https://supabase.com)
   - Sign up or log in to your account
   - Click "New Project"
   - Choose your organization and region (select the region closest to your users)
   - Set a strong database password (save this securely)

2. **Get Connection Strings:**
   - Navigate to Project Settings → Database
   - Find "Connection string" section
   - Copy the "Connection pooling" string (port 6543) for `DATABASE_URL`
   - Copy the "Direct connection" string (port 5432) for `DIRECT_URL`
   - Replace `[YOUR-PASSWORD]` with your database password

3. **Get API Keys:**
   - Navigate to Project Settings → API
   - Copy the "Project URL" for `SUPABASE_PROJECT_URL`
   - Copy the "anon public" key for `SUPABASE_ANON_KEY`
   - Extract project ID from the URL for `SUPABASE_PROJECT_ID`

### Connection String Format

**Pooled Connection (Runtime Queries):**

```bash
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

- Uses port 6543
- Includes `pgbouncer=true` parameter
- Used for all application queries
- Optimized for high concurrency

**Direct Connection (Migrations):**

```bash
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

- Uses port 5432
- No `pgbouncer` parameter
- Used for Prisma migrations only
- Required for schema changes

### Connection Pooling Best Practices

**PgBouncer Configuration:**

- Supabase uses PgBouncer in transaction mode for connection pooling
- Maximum recommended connections: 20 per application instance
- Connection timeout: 10 seconds (configured in Prisma)
- Idle connection timeout: 60 seconds (managed by Supabase)

**Application Configuration:**

```typescript
// Prisma automatically handles connection pooling
// No manual pool configuration needed when using Supabase
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Pooled connection
    },
  },
});
```

**Best Practices:**

1. Always use `DATABASE_URL` (port 6543) for runtime queries
2. Always use `DIRECT_URL` (port 5432) for migrations
3. Keep connection pool size ≤ 20 per instance
4. Monitor connection usage in Supabase dashboard
5. Implement connection retry logic for transient failures
6. Use connection pooling for all production deployments

### Monitoring Database Connections

**Supabase Dashboard:**

1. Navigate to your project dashboard
2. Go to Database → Connection Pooling
3. Monitor active connections, idle connections, and pool utilization
4. Set up alerts for connection pool exhaustion

**Connection Metrics:**

- Active connections: Current queries being executed
- Idle connections: Available connections in the pool
- Waiting connections: Queries waiting for available connection
- Max connections: Total connection limit (default: 60 for pooler)

**Performance Monitoring:**

- Query performance: Database → Query Performance
- Slow queries: Queries exceeding 1000ms are logged
- Connection errors: Check logs for P1001 (connection timeout) errors

### Supabase Maintenance Windows

Supabase performs periodic maintenance on database infrastructure:

**Handling Maintenance:**

1. Supabase notifies via email before scheduled maintenance
2. Implement graceful connection error handling
3. Use exponential backoff retry for connection failures
4. Health check endpoint will report unhealthy during maintenance
5. Application should return 503 Service Unavailable

**Example Error Handling:**

```typescript
try {
  await prisma.$connect();
} catch (error) {
  if (error.code === 'P1001') {
    logger.error('Cannot reach Supabase database', { error });
    // Implement retry logic with exponential backoff
  }
}
```

### Security Considerations

**Database Access:**

- Never expose `DIRECT_URL` in client-side code
- Use environment variables for all credentials
- Rotate database password periodically
- Enable SSL/TLS for all connections (enabled by default)

**Network Security:**

- Supabase uses SSL/TLS encryption for all connections
- Connection strings include SSL mode by default
- No additional SSL configuration required

**Access Control:**

- Use Supabase's built-in role-based access control
- Grant minimum required permissions to database users
- Audit database access logs regularly

### Troubleshooting Supabase Connections

**Connection Timeout:**

```
Error: P1001: Can't reach database server
```

- Check Supabase project status (not paused)
- Verify connection string format
- Check network connectivity
- Verify database password is correct

**Migration Failures:**

```
Error: Prepared statements not supported in transaction mode
```

- Ensure using `DIRECT_URL` (port 5432) for migrations
- Verify `directUrl` is configured in `prisma/schema.prisma`
- Run migrations with: `npx prisma migrate deploy`

**Pool Exhaustion:**

```
Error: P2024: Timed out fetching a new connection from the pool
```

- Monitor connection usage in Supabase dashboard
- Reduce connection pool size if needed
- Check for connection leaks in application code
- Implement connection timeout handling

### Rollback Procedures

If migration or deployment issues occur, follow these procedures to safely rollback:

#### 1. Database Schema Rollback

**Using Supabase Dashboard Backups:**

```bash
# Step 1: Navigate to Supabase Dashboard
# Go to Database → Backups
# Select the backup point before the migration
# Click "Restore" to rollback database schema and data

# Step 2: Verify database state
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  -c "SELECT version FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

**Using Prisma Migration Rollback:**

```bash
# If you need to rollback specific migrations
# Note: Prisma doesn't support automatic rollback, manual intervention required

# Step 1: Identify the migration to rollback
docker-compose exec api npx prisma migrate status

# Step 2: Create a new migration that reverses changes
# Manually write SQL to undo the changes
docker-compose exec api npx prisma migrate dev --name rollback_feature_name

# Step 3: Apply the rollback migration
docker-compose exec api npx prisma migrate deploy
```

**Using Manual SQL Rollback:**

```bash
# Step 1: Connect to Supabase database
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Step 2: Execute rollback SQL
# Example: Drop a table added in migration
DROP TABLE IF EXISTS new_table_name;

# Example: Revert column changes
ALTER TABLE users DROP COLUMN IF EXISTS new_column;

# Step 3: Update migration history
DELETE FROM _prisma_migrations WHERE migration_name = 'YYYYMMDDHHMMSS_migration_name';
```

#### 2. Application Rollback

**Docker Deployment Rollback:**

```bash
# Step 1: Stop current deployment
docker-compose down

# Step 2: Checkout previous version
git fetch --all
git checkout <previous-commit-hash>
# Or use tags: git checkout v1.2.3

# Step 3: Rebuild and restart
docker-compose build
docker-compose up -d

# Step 4: Verify services are running
docker-compose ps
```

**Container Image Rollback (if using registry):**

```bash
# Step 1: Pull previous image version
docker pull registry.example.com/folkify-api:v1.2.3

# Step 2: Update docker-compose.yml to use previous version
# image: registry.example.com/folkify-api:v1.2.3

# Step 3: Restart services
docker-compose up -d

# Step 4: Verify deployment
curl http://localhost:3000/api/health
```

#### 3. Environment Configuration Rollback

```bash
# Step 1: Restore previous .env file
cp .env.backup .env

# Step 2: Restart services to apply configuration
docker-compose restart api worker

# Step 3: Verify configuration
docker-compose exec api node -e "console.log(process.env.DATABASE_URL)"
```

#### 4. Data Rollback (if data was migrated)

**Restore from pg_dump backup:**

```bash
# Step 1: Stop application to prevent new writes
docker-compose stop api worker

# Step 2: Restore database from backup
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" < backup-before-migration.sql

# Step 3: Verify data integrity
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  -c "SELECT COUNT(*) FROM users;"

# Step 4: Restart application
docker-compose start api worker
```

**Restore from Supabase Point-in-Time Recovery:**

```bash
# Step 1: Navigate to Supabase Dashboard
# Go to Database → Backups
# Select "Point in Time Recovery" (available on Pro plan)
# Choose timestamp before migration
# Click "Restore"

# Step 2: Wait for restore to complete (may take several minutes)

# Step 3: Verify data
# Check critical tables and row counts
```

#### 5. Verification After Rollback

**Health Check:**

```bash
# Check API health
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","services":{"database":"healthy","redis":"healthy"}}
```

**Database Connection Test:**

```bash
# Test database connectivity
docker-compose exec api npx prisma db execute --stdin <<< "SELECT 1 as test"

# Test query execution
docker-compose exec api node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.user.count().then(count => console.log('User count:', count));
"
```

**API Endpoint Test:**

```bash
# Test critical endpoints
curl http://localhost:3000/api/instruments
curl http://localhost:3000/api/lessons

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Background Jobs Test:**

```bash
# Check worker is processing jobs
docker-compose logs -f worker

# Check queue status
docker-compose exec redis redis-cli LLEN bull:aiGrading:wait
docker-compose exec redis redis-cli LLEN bull:email:wait
```

#### 6. Rollback Decision Matrix

| Issue Type                  | Severity | Recommended Action                    | Rollback Type          |
| --------------------------- | -------- | ------------------------------------- | ---------------------- |
| Schema migration failed     | High     | Restore from backup                   | Database + Application |
| Data corruption detected    | Critical | Point-in-time recovery                | Database only          |
| API errors after deployment | High     | Revert application                    | Application only       |
| Performance degradation     | Medium   | Investigate first, rollback if needed | Application only       |
| Connection pool exhaustion  | Medium   | Adjust configuration                  | Configuration only     |
| Worker jobs failing         | Medium   | Check logs, restart worker            | Worker restart         |
| Minor UI issues             | Low      | Fix forward, no rollback              | None                   |

#### 7. Post-Rollback Actions

```bash
# Step 1: Document the issue
# Create incident report with:
# - What went wrong
# - When it was detected
# - What was rolled back
# - Current system state

# Step 2: Notify stakeholders
# Inform team and users about the rollback

# Step 3: Investigate root cause
# Review logs, error messages, and metrics
docker-compose logs api > rollback-investigation-api.log
docker-compose logs worker > rollback-investigation-worker.log

# Step 4: Plan fix
# Identify what needs to be changed
# Test in staging environment
# Schedule new deployment

# Step 5: Monitor system
# Watch for any lingering issues
# Check error rates and performance metrics
```

#### 8. Emergency Rollback Checklist

- [ ] Stop accepting new traffic (if possible)
- [ ] Notify team of rollback in progress
- [ ] Backup current state before rollback
- [ ] Execute rollback procedure
- [ ] Verify database connectivity
- [ ] Test critical API endpoints
- [ ] Check background job processing
- [ ] Monitor error logs for 30 minutes
- [ ] Notify team of rollback completion
- [ ] Document incident and root cause

---

## Data Migration Strategy

This section covers the process of migrating existing data from a local PostgreSQL database to Supabase. If you're starting fresh with Supabase, you can skip this section.

### Pre-Migration Checklist

Before migrating data, ensure:

- [ ] Supabase project is created and accessible
- [ ] Database schema is deployed to Supabase (via Prisma migrations)
- [ ] Backup of source database is created
- [ ] Downtime window is scheduled (if required)
- [ ] Rollback plan is documented
- [ ] Team is notified of migration schedule

### Migration Approaches

#### Approach 1: Zero-Downtime Migration (Recommended for Production)

This approach minimizes downtime by using dual-write strategy:

**Phase 1: Preparation**

```bash
# Step 1: Deploy schema to Supabase
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  npx prisma migrate deploy

# Step 2: Verify schema matches source database
npx prisma db pull --schema=./prisma/schema-source.prisma
npx prisma db pull --schema=./prisma/schema-target.prisma
diff prisma/schema-source.prisma prisma/schema-target.prisma
```

**Phase 2: Initial Data Copy**

```bash
# Step 1: Export data from local PostgreSQL
pg_dump -h localhost -U postgres -d folkify_db \
  --data-only \
  --no-owner \
  --no-privileges \
  --column-inserts \
  > data-export.sql

# Step 2: Import data to Supabase
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  < data-export.sql

# Step 3: Verify row counts match
# Source database
psql -h localhost -U postgres -d folkify_db -c "
  SELECT 'users' as table_name, COUNT(*) FROM users
  UNION ALL SELECT 'lessons', COUNT(*) FROM lessons
  UNION ALL SELECT 'instruments', COUNT(*) FROM instruments
  UNION ALL SELECT 'sheet_music', COUNT(*) FROM sheet_music;
"

# Target database (Supabase)
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" -c "
  SELECT 'users' as table_name, COUNT(*) FROM users
  UNION ALL SELECT 'lessons', COUNT(*) FROM lessons
  UNION ALL SELECT 'instruments', COUNT(*) FROM instruments
  UNION ALL SELECT 'sheet_music', COUNT(*) FROM sheet_music;
"
```

**Phase 3: Cutover**

```bash
# Step 1: Enable maintenance mode (optional)
# Display maintenance page to users

# Step 2: Stop application to prevent new writes
docker-compose stop api worker

# Step 3: Export incremental changes (data added since initial copy)
# Use timestamp-based filtering
pg_dump -h localhost -U postgres -d folkify_db \
  --data-only \
  --no-owner \
  --no-privileges \
  --column-inserts \
  --table=users \
  --table=lessons \
  > incremental-export.sql

# Step 4: Import incremental changes
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  < incremental-export.sql

# Step 5: Update .env to use Supabase connection strings
cp .env .env.backup
# Update DATABASE_URL and DIRECT_URL to Supabase

# Step 6: Restart application with Supabase configuration
docker-compose up -d

# Step 7: Verify application is working
curl http://localhost:3000/api/health
```

#### Approach 2: Maintenance Window Migration (Simpler)

This approach requires downtime but is simpler to execute:

**Step 1: Schedule Maintenance Window**

```bash
# Notify users of scheduled maintenance
# Recommended: 2-4 hours for medium-sized databases
```

**Step 2: Stop Application**

```bash
# Stop all services to prevent data changes
docker-compose down
```

**Step 3: Backup Source Database**

```bash
# Create full backup
pg_dump -h localhost -U postgres -d folkify_db \
  --format=custom \
  --file=folkify-backup-$(date +%Y%m%d-%H%M%S).dump

# Verify backup
pg_restore --list folkify-backup-*.dump | head -20
```

**Step 4: Export Data**

```bash
# Export schema and data
pg_dump -h localhost -U postgres -d folkify_db \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  > full-export.sql
```

**Step 5: Import to Supabase**

```bash
# Import to Supabase
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  < full-export.sql

# Check for errors
echo $?  # Should be 0 if successful
```

**Step 6: Verify Data Integrity**

```bash
# Run verification script (see Data Verification section below)
./scripts/verify-migration.sh
```

**Step 7: Update Configuration and Restart**

```bash
# Update .env with Supabase connection strings
cp .env .env.backup
# Edit .env: Update DATABASE_URL and DIRECT_URL

# Restart application
docker-compose up -d

# Verify health
curl http://localhost:3000/api/health
```

### Data Verification

Create a verification script to ensure data integrity:

**File: `scripts/verify-migration.sh`**

```bash
#!/bin/bash
set -e

SOURCE_DB="postgresql://postgres:password@localhost:5432/folkify_db"
TARGET_DB="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

echo "Verifying data migration..."

# Function to compare row counts
compare_counts() {
  local table=$1
  local source_count=$(psql "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM $table")
  local target_count=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM $table")

  source_count=$(echo $source_count | xargs)
  target_count=$(echo $target_count | xargs)

  if [ "$source_count" == "$target_count" ]; then
    echo "✓ $table: $source_count rows (match)"
  else
    echo "✗ $table: source=$source_count, target=$target_count (MISMATCH)"
    exit 1
  fi
}

# Verify all tables
compare_counts "users"
compare_counts "user_stats"
compare_counts "instruments"
compare_counts "lessons"
compare_counts "user_progress"
compare_counts "sheet_music"
compare_counts "user_purchases"
compare_counts "premium_subscriptions"
compare_counts "payment_transactions"
compare_counts "ai_grading_sessions"
compare_counts "practice_sessions"
compare_counts "admin_activity_logs"

echo ""
echo "Verifying foreign key constraints..."

# Check foreign key integrity
psql "$TARGET_DB" -c "
  SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
  FROM pg_constraint
  WHERE contype = 'f'
  ORDER BY conrelid::regclass::text;
"

echo ""
echo "Verifying unique constraints..."

# Check unique constraints
psql "$TARGET_DB" -c "
  SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name
  FROM pg_constraint
  WHERE contype = 'u'
  ORDER BY conrelid::regclass::text;
"

echo ""
echo "✓ Migration verification completed successfully!"
```

**Make script executable:**

```bash
chmod +x scripts/verify-migration.sh
```

**Run verification:**

```bash
./scripts/verify-migration.sh
```

### Handling Large Databases

For databases larger than 10GB, use these optimizations:

#### Parallel Export/Import

```bash
# Export with parallel jobs (faster)
pg_dump -h localhost -U postgres -d folkify_db \
  --format=directory \
  --jobs=4 \
  --file=folkify-export

# Import with parallel jobs
pg_restore -d "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  --jobs=4 \
  --no-owner \
  --no-privileges \
  folkify-export
```

#### Table-by-Table Migration

```bash
# Export tables individually
for table in users instruments lessons sheet_music; do
  echo "Exporting $table..."
  pg_dump -h localhost -U postgres -d folkify_db \
    --table=$table \
    --data-only \
    --no-owner \
    > export-$table.sql
done

# Import tables individually
for table in users instruments lessons sheet_music; do
  echo "Importing $table..."
  psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
    < export-$table.sql
done
```

#### Compression for Transfer

```bash
# Export with compression
pg_dump -h localhost -U postgres -d folkify_db \
  --format=custom \
  --compress=9 \
  --file=folkify-compressed.dump

# Import compressed dump
pg_restore -d "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  --no-owner \
  --no-privileges \
  folkify-compressed.dump
```

### Troubleshooting Migration Issues

#### Issue 1: Permission Errors

**Error:** `ERROR: permission denied for table users`

**Solution:**

```bash
# Ensure using direct connection (port 5432)
# Verify database user has necessary permissions
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;"
```

#### Issue 2: Constraint Violations

**Error:** `ERROR: duplicate key value violates unique constraint`

**Solution:**

```bash
# Clear target database before import
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  -c "TRUNCATE users, instruments, lessons CASCADE;"

# Re-import data
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  < data-export.sql
```

#### Issue 3: Sequence Out of Sync

**Error:** `ERROR: duplicate key value violates unique constraint "users_pkey"`

**Solution:**

```bash
# Reset sequences after import
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" <<EOF
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('instruments_id_seq', (SELECT MAX(id) FROM instruments));
SELECT setval('lessons_id_seq', (SELECT MAX(id) FROM lessons));
SELECT setval('sheet_music_id_seq', (SELECT MAX(id) FROM sheet_music));
EOF
```

#### Issue 4: Connection Timeout During Import

**Error:** `FATAL: terminating connection due to administrator command`

**Solution:**

```bash
# Use direct connection (port 5432) not pooled
# Increase statement timeout
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  -c "SET statement_timeout = '60min';" \
  -f data-export.sql
```

### Post-Migration Validation

After migration, perform these validation steps:

#### 1. Data Integrity Checks

```bash
# Check row counts
./scripts/verify-migration.sh

# Check for NULL values in required fields
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" -c "
  SELECT 'users' as table_name, COUNT(*) as null_emails
  FROM users WHERE email IS NULL
  UNION ALL
  SELECT 'lessons', COUNT(*) FROM lessons WHERE title IS NULL;
"

# Verify foreign key relationships
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" -c "
  SELECT COUNT(*) as orphaned_lessons
  FROM lessons l
  LEFT JOIN instruments i ON l.instrument_id = i.id
  WHERE i.id IS NULL;
"
```

#### 2. Application Testing

```bash
# Start application with Supabase
docker-compose up -d

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test data retrieval
curl http://localhost:3000/api/instruments
curl http://localhost:3000/api/lessons
curl http://localhost:3000/api/sheets

# Test data creation
curl -X POST http://localhost:3000/api/instruments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Test Instrument","category":"string"}'
```

#### 3. Performance Testing

```bash
# Compare query performance
# Run same queries against both databases and compare execution times

# Source database
psql -h localhost -U postgres -d folkify_db -c "
  EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
"

# Target database (Supabase)
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" -c "
  EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
"
```

#### 4. Background Jobs Testing

```bash
# Verify worker can process jobs
docker-compose logs -f worker

# Enqueue test job
curl -X POST http://localhost:3000/api/ai-grading/submit \
  -H "Authorization: Bearer <token>" \
  -F "audio=@test-audio.mp3"

# Check job processing
docker-compose exec redis redis-cli LLEN bull:aiGrading:completed
```

### Migration Rollback

If migration fails or issues are discovered:

#### Quick Rollback

```bash
# Step 1: Stop application
docker-compose down

# Step 2: Restore original .env
cp .env.backup .env

# Step 3: Restart with local PostgreSQL
docker-compose up -d postgres redis
docker-compose up -d api worker

# Step 4: Verify
curl http://localhost:3000/api/health
```

#### Data Rollback

```bash
# If data was corrupted in Supabase, restore from backup
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  < folkify-backup-YYYYMMDD-HHMMSS.dump
```

### Migration Checklist

Use this checklist to track migration progress:

- [ ] **Pre-Migration**
  - [ ] Supabase project created
  - [ ] Schema deployed to Supabase
  - [ ] Source database backed up
  - [ ] Verification script tested
  - [ ] Rollback plan documented
  - [ ] Team notified

- [ ] **Migration**
  - [ ] Application stopped (if maintenance window)
  - [ ] Data exported from source
  - [ ] Data imported to Supabase
  - [ ] Sequences reset
  - [ ] Configuration updated

- [ ] **Verification**
  - [ ] Row counts verified
  - [ ] Constraints verified
  - [ ] Foreign keys verified
  - [ ] Application tested
  - [ ] Performance tested
  - [ ] Background jobs tested

- [ ] **Post-Migration**
  - [ ] Monitor for 24 hours
  - [ ] Document any issues
  - [ ] Update documentation
  - [ ] Notify team of completion
  - [ ] Archive source database backup

---

## Docker Deployment

### Quick Start with Docker Compose

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd folkify_BE
   ```

2. **Create `.env` file:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and start services:**

   ```bash
   docker-compose up -d
   ```

4. **Run database migrations:**

   ```bash
   docker-compose exec api npx prisma migrate deploy
   ```

5. **Seed the database (optional):**

   ```bash
   docker-compose exec api npx prisma db seed
   ```

6. **Verify services are running:**

   ```bash
   docker-compose ps
   ```

7. **Access the API:**
   - API: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs
   - Health Check: http://localhost:3000/api/health

### Docker Compose Services

The `docker-compose.yml` defines three services:

1. **redis** - Redis 7 cache and queue
   - Port: 6379
   - Volume: `redis_data`
   - Health check enabled

2. **api** - Express API server
   - Port: 3000
   - Depends on: redis
   - Connects to: Supabase (external)
   - Volumes: `uploads_data`, `logs_data`

3. **worker** - Background job processor
   - No exposed ports
   - Depends on: redis
   - Connects to: Supabase (external)
   - Volumes: `uploads_data`, `logs_data`

**Note:** PostgreSQL is hosted on Supabase and not included in Docker Compose.

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api
docker-compose logs -f worker

# Restart a service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Execute command in container
docker-compose exec api sh
docker-compose exec api npm run test
```

---

## Database Migrations

### Running Migrations

**In Docker:**

```bash
# Deploy migrations
docker-compose exec api npx prisma migrate deploy

# Generate Prisma Client
docker-compose exec api npx prisma generate

# Seed database
docker-compose exec api npx prisma db seed
```

**Locally:**

```bash
# Create new migration
npm run prisma migrate dev --name migration_name

# Deploy migrations
npm run prisma migrate deploy

# Reset database (WARNING: deletes all data)
npm run prisma migrate reset

# Seed database
npm run prisma db seed
```

### Migration Best Practices

1. **Always backup production data before migrations**
2. **Test migrations in staging environment first**
3. **Use `prisma migrate deploy` in production (not `migrate dev`)**
4. **Review generated SQL before applying**
5. **Keep migrations small and focused**

---

## Local Development Setup

### Without Docker

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Setup Redis:**
   - Install Redis 7+
   - Start Redis: `redis-server`

3. **Setup Supabase:**
   - Create a Supabase project (see [Supabase Database Deployment](#supabase-database-deployment))
   - Obtain connection strings and API keys

4. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with Supabase credentials
   ```

5. **Run migrations:**

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

6. **Start development servers:**

   ```bash
   # Terminal 1: API server
   npm run dev

   # Terminal 2: Worker process
   npm run dev:worker
   ```

### With Docker (Hybrid)

Use Docker for Redis, run Node.js locally, connect to Supabase:

1. **Start only Redis service:**

   ```bash
   docker-compose up -d redis
   ```

2. **Configure `.env` for Supabase connection:**

   ```bash
   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. **Run migrations and start servers:**
   ```bash
   npx prisma migrate deploy
   npm run dev
   npm run dev:worker
   ```

### Local PostgreSQL for Testing (Optional)

For faster test execution in CI/CD, you can use local PostgreSQL:

1. **Install PostgreSQL 16+**

2. **Create test database:**

   ```bash
   createdb folkify_test
   ```

3. **Configure `.env.test`:**

   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/folkify_test
   DIRECT_URL=postgresql://user:password@localhost:5432/folkify_test
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Create Supabase project and obtain credentials
- [ ] Configure `DATABASE_URL` and `DIRECT_URL` with Supabase connection strings
- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Configure `SUPABASE_PROJECT_URL` and `SUPABASE_ANON_KEY`
- [ ] Configure `FRONTEND_URL` to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Configure `REDIS_PASSWORD` (recommended)
- [ ] Review rate limiting settings
- [ ] Configure email service (if using SMTP)
- [ ] Setup SSL/TLS certificates
- [ ] Configure reverse proxy (nginx/traefik)
- [ ] Setup monitoring and alerting
- [ ] Configure backup strategy
- [ ] Test Supabase connection from production environment

### Production Environment Variables

```bash
NODE_ENV=production
PORT=3000

# Supabase Configuration
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_PROJECT_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Database Configuration
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Redis Configuration
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# Security
JWT_SECRET=very-long-secure-random-string-min-32-chars
FRONTEND_URL=https://folkify.example.com

# Logging
LOG_LEVEL=warn
```

### Deployment Steps

1. **Build Docker image:**

   ```bash
   docker build -t folkify-api:latest .
   ```

2. **Push to registry (if using):**

   ```bash
   docker tag folkify-api:latest registry.example.com/folkify-api:latest
   docker push registry.example.com/folkify-api:latest
   ```

3. **Deploy with Docker Compose:**

   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

4. **Run migrations:**

   ```bash
   docker-compose exec api npx prisma migrate deploy
   ```

5. **Verify deployment:**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Reverse Proxy Configuration (nginx)

```nginx
server {
    listen 80;
    server_name api.folkify.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Monitoring & Logs

### Viewing Logs

```bash
# All services
docker-compose logs -f

# API service only
docker-compose logs -f api

# Worker service only
docker-compose logs -f worker

# Last 100 lines
docker-compose logs --tail=100 api

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00 api
```

### Log Files

Logs are stored in `/app/logs` inside containers and mounted to `logs_data` volume:

- `combined-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Error logs only
- `emails-YYYY-MM-DD.log` - Email logs

**Access log files:**

```bash
docker-compose exec api ls -la /app/logs
docker-compose exec api cat /app/logs/error-2024-01-01.log
```

### Health Checks

**API Health Endpoint:**

```bash
curl http://localhost:3000/api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "queues": "healthy"
  }
}
```

**Docker Health Status:**

```bash
docker-compose ps
```

### Metrics Endpoint

```bash
curl http://localhost:3000/api/health/metrics
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use`

**Solution:**

```bash
# Find process using port
lsof -i :3000
# Kill process or change PORT in .env
```

#### 2. Database Connection Failed

**Error:** `Can't reach database server`

**Solution:**

```bash
# Check Supabase project status in dashboard
# Verify it's not paused or in maintenance

# Verify DATABASE_URL and DIRECT_URL in .env
echo $DATABASE_URL
echo $DIRECT_URL

# Test connection
docker-compose exec api npx prisma db execute --stdin <<< "SELECT 1"

# Check Supabase dashboard for connection metrics
```

#### 3. Redis Connection Failed

**Error:** `Error connecting to Redis`

**Solution:**

```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Check REDIS_HOST and REDIS_PORT in .env
```

#### 4. Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**

```bash
# Generate Prisma Client
docker-compose exec api npx prisma generate

# Or rebuild image
docker-compose up -d --build
```

#### 5. Worker Not Processing Jobs

**Solution:**

```bash
# Check worker logs
docker-compose logs -f worker

# Restart worker
docker-compose restart worker

# Check Redis connection
docker-compose exec worker node -e "require('./dist/config/redis').redisClient.ping().then(console.log)"
```

#### 6. Permission Denied on Volumes

**Error:** `EACCES: permission denied`

**Solution:**

```bash
# Fix volume permissions
docker-compose exec api chown -R node:node /app/uploads /app/logs

# Or recreate volumes
docker-compose down -v
docker-compose up -d
```

### Debug Mode

Enable debug logging:

```bash
# Set in .env
LOG_LEVEL=debug

# Restart services
docker-compose restart api worker
```

### Database Inspection

```bash
# Connect to Supabase PostgreSQL via psql
# Get connection string from Supabase dashboard (Direct connection)
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Or use Supabase SQL Editor in dashboard
# Navigate to SQL Editor in Supabase dashboard

# List tables
\dt

# Describe table
\d users

# Query data
SELECT * FROM users LIMIT 10;
```

### Redis Inspection

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# List all keys
KEYS *

# Get queue info
LLEN bull:aiGrading:wait
LLEN bull:email:wait

# Monitor commands
MONITOR
```

---

## Backup & Restore

### Database Backup

Supabase provides automatic daily backups. For manual backups:

```bash
# Manual backup using pg_dump
pg_dump "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" > backup.sql

# Restore from backup
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" < backup.sql
```

**Supabase Dashboard Backups:**

1. Navigate to Database → Backups in Supabase dashboard
2. View automatic daily backups (retained for 7 days on free tier)
3. Restore from any backup point with one click
4. Download backups for external storage

### Volume Backup

```bash
# Backup uploads
docker run --rm -v folkify_be_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restore uploads
docker run --rm -v folkify_be_uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

---

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./DATABASE_SCHEMA_REFERENCE.md)
- [Queue System](./QUEUE_SYSTEM.md)
- [Quick Start Guide](./QUICK_START.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com)
- [BullMQ Documentation](https://docs.bullmq.io)

---

## Support

For issues and questions:

- Check [Troubleshooting](#troubleshooting) section
- Review logs: `docker-compose logs -f`
- Check health endpoint: `http://localhost:3000/api/health`

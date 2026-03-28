# FOLKIFY Deployment Troubleshooting Guide

This guide provides solutions to common deployment issues for the FOLKIFY application across Railway, Vercel, and Supabase.

## Table of Contents

1. [Build Failures](#build-failures)
2. [Migration Failures](#migration-failures)
3. [Health Check Failures](#health-check-failures)
4. [Database Connection Errors](#database-connection-errors)
5. [Redis Connection Errors](#redis-connection-errors)
6. [CORS Errors](#cors-errors)
7. [Worker Service Issues](#worker-service-issues)
8. [Environment Variable Errors](#environment-variable-errors)
9. [Rollback Procedures](#rollback-procedures)

---

## Build Failures

### Symptom: TypeScript Compilation Errors

**Error Message**:

```
error TS2304: Cannot find name 'X'
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Causes**:

- Missing type definitions
- Incorrect TypeScript configuration
- Type mismatches in code

**Solutions**:

1. **Check TypeScript version**:

   ```bash
   npm list typescript
   ```

   Ensure version matches `package.json`

2. **Install missing type definitions**:

   ```bash
   npm install --save-dev @types/node @types/express
   ```

3. **Verify tsconfig.json**:

   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true
     }
   }
   ```

4. **Clear build cache and rebuild**:

   ```bash
   rm -rf dist node_modules
   npm install
   npm run build
   ```

5. **Test locally before pushing**:
   ```bash
   npm run build
   npm test
   ```

### Symptom: Missing Dependencies

**Error Message**:

```
Cannot find module 'X'
Module not found: Error: Can't resolve 'X'
```

**Causes**:

- Dependency not listed in `package.json`
- Dependency installed as devDependency but needed in production
- npm install failed during build

**Solutions**:

1. **Verify package.json**:

   ```bash
   npm list <package-name>
   ```

2. **Install missing dependency**:

   ```bash
   npm install <package-name>
   ```

3. **Move from devDependencies to dependencies** (if needed):

   ```bash
   npm install --save <package-name>
   npm uninstall --save-dev <package-name>
   ```

4. **Check Railway build logs**:
   - Look for "npm install" output
   - Verify all dependencies installed successfully

5. **Lock dependency versions**:
   ```bash
   npm install --package-lock-only
   git add package-lock.json
   git commit -m "Lock dependency versions"
   ```

### Symptom: Prisma Generation Failure

**Error Message**:

```
Error: Prisma schema not found
Error: @prisma/client did not initialize yet
```

**Causes**:

- Prisma schema file missing or invalid
- Prisma generate not run during build
- Prisma version mismatch

**Solutions**:

1. **Verify schema file exists**:

   ```bash
   ls -la prisma/schema.prisma
   ```

2. **Validate schema**:

   ```bash
   npx prisma validate
   ```

3. **Check build command includes Prisma generate**:

   ```json
   {
     "build": {
       "buildCommand": "npm install && npm run build && npx prisma generate"
     }
   }
   ```

4. **Ensure Prisma versions match**:

   ```bash
   npm list prisma @prisma/client
   ```

   Both should be the same version

5. **Regenerate Prisma client locally**:
   ```bash
   npx prisma generate
   git add -f node_modules/.prisma
   ```

### Symptom: Out of Memory During Build

**Error Message**:

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Causes**:

- Large TypeScript project
- Insufficient memory allocation
- Memory leak in build process

**Solutions**:

1. **Increase Node.js memory limit**:
   Update `package.json`:

   ```json
   {
     "scripts": {
       "build": "node --max-old-space-size=4096 ./node_modules/.bin/tsc"
     }
   }
   ```

2. **Optimize TypeScript compilation**:
   In `tsconfig.json`:

   ```json
   {
     "compilerOptions": {
       "incremental": true,
       "skipLibCheck": true
     }
   }
   ```

3. **Split build into smaller steps**:
   ```json
   {
     "scripts": {
       "build": "npm run build:clean && npm run build:compile",
       "build:clean": "rm -rf dist",
       "build:compile": "tsc"
     }
   }
   ```

---

## Migration Failures

### Symptom: Migration Timeout

**Error Message**:

```
Error: Migration failed: Connection timeout
P1001: Can't reach database server
```

**Causes**:

- Database is unreachable
- Network connectivity issues
- Firewall blocking connection
- Incorrect connection string

**Solutions**:

1. **Verify DIRECT_URL is correct**:
   - Check port is 5432 (not 6543)
   - Verify password has no special characters that need escaping
   - Test connection string format:
     ```
     postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
     ```

2. **Test database connectivity**:

   ```bash
   # Using psql
   psql "postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   ```

3. **Check Supabase status**:
   - Go to Supabase dashboard
   - Verify project is active
   - Check for maintenance windows

4. **Increase timeout in Prisma**:
   In `schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DIRECT_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

5. **Retry deployment**:
   Railway will automatically retry, or manually trigger redeploy

### Symptom: Migration Constraint Violation

**Error Message**:

```
Error: Migration failed: Foreign key constraint violation
Error: Migration failed: Unique constraint violation
```

**Causes**:

- Existing data violates new constraints
- Migration order is incorrect
- Data migration not performed before schema change

**Solutions**:

1. **Review migration SQL**:

   ```bash
   cat prisma/migrations/<migration-name>/migration.sql
   ```

2. **Check existing data**:

   ```sql
   -- Connect to Supabase and check data
   SELECT * FROM <table> WHERE <constraint-column> IS NULL;
   ```

3. **Create data migration first**:

   ```bash
   # Create empty migration
   npx prisma migrate create --name fix_data

   # Edit migration.sql to update data
   # Then create schema migration
   npx prisma migrate create --name add_constraint
   ```

4. **Use multi-step migration**:
   - Step 1: Add column as nullable
   - Step 2: Populate data
   - Step 3: Make column required

5. **Rollback and fix**:
   See [Rollback Procedures](#rollback-procedures)

### Symptom: Migration Lock Timeout

**Error Message**:

```
Error: Migration failed: Timeout while waiting for migration lock
```

**Causes**:

- Another migration is running
- Stale lock from previous failed migration
- Long-running transaction holding lock

**Solutions**:

1. **Check for running migrations**:

   ```sql
   SELECT * FROM _prisma_migrations WHERE finished_at IS NULL;
   ```

2. **Clear stale locks**:

   ```sql
   -- Connect to Supabase SQL Editor
   UPDATE _prisma_migrations
   SET finished_at = NOW(),
       logs = 'Manually cleared stale lock'
   WHERE finished_at IS NULL
   AND started_at < NOW() - INTERVAL '10 minutes';
   ```

3. **Check for long-running queries**:

   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY duration DESC;
   ```

4. **Kill blocking query** (if safe):

   ```sql
   SELECT pg_terminate_backend(<pid>);
   ```

5. **Retry deployment**:
   After clearing locks, redeploy in Railway

### Symptom: Migration Prevents Startup

**Error Message**:

```
Error: Migration failed
Service failed to start
```

**Causes**:

- Start command uses `&&` operator
- Migration failure prevents server startup (by design)

**Solutions**:

1. **This is expected behavior** - migrations must succeed before startup

2. **Check migration logs**:
   - View Railway deployment logs
   - Look for specific migration error

3. **Fix migration issue**:
   - Address the root cause (see above solutions)
   - Push corrected migration

4. **Temporary workaround** (not recommended):
   - Temporarily remove `npx prisma migrate deploy &&` from start command
   - Deploy without migrations
   - Run migrations manually
   - Restore start command

5. **Rollback if needed**:
   See [Rollback Procedures](#rollback-procedures)

---

## Health Check Failures

### Symptom: Health Check Returns 503

**Error Message**:

```
Health check failed: HTTP 503 Service Unavailable
```

**Causes**:

- Database connection failed
- Redis connection failed
- Application not fully started

**Solutions**:

1. **Check health endpoint response**:

   ```bash
   curl -i https://<your-api-domain>.railway.app/api/health
   ```

2. **Review error details**:

   ```json
   {
     "status": "unhealthy",
     "services": {
       "database": "unhealthy",
       "redis": "healthy"
     },
     "errors": ["Database connection failed"]
   }
   ```

3. **Fix database connection**:
   - See [Database Connection Errors](#database-connection-errors)

4. **Fix Redis connection**:
   - See [Redis Connection Errors](#redis-connection-errors)

5. **Check application logs**:
   - View Railway logs for startup errors
   - Look for uncaught exceptions

### Symptom: Health Check Timeout

**Error Message**:

```
Health check timeout after 300 seconds
```

**Causes**:

- Application taking too long to start
- Health check endpoint is slow
- Database queries are slow

**Solutions**:

1. **Increase health check timeout**:
   In `railway.json`:

   ```json
   {
     "deploy": {
       "healthcheckTimeout": 600
     }
   }
   ```

2. **Optimize health check endpoint**:
   - Use connection pool check instead of query
   - Add timeout to health check queries
   - Cache health check results briefly

3. **Check database performance**:
   - Review slow query logs in Supabase
   - Add indexes if needed
   - Optimize health check queries

4. **Reduce startup time**:
   - Lazy load non-critical services
   - Defer background job initialization
   - Use connection pooling

### Symptom: Repeated Restarts

**Error Message**:

```
Service restarted due to health check failure (attempt 3/10)
```

**Causes**:

- Persistent health check failures
- Application crashes after startup
- Resource exhaustion (memory/CPU)

**Solutions**:

1. **Check restart pattern**:
   - View Railway deployment history
   - Look for crash logs before each restart

2. **Monitor resource usage**:
   - Check Railway metrics for memory/CPU spikes
   - Look for memory leaks

3. **Review application logs**:
   - Look for uncaught exceptions
   - Check for error patterns

4. **Increase restart policy retries** (temporary):
   In `railway.json`:

   ```json
   {
     "deploy": {
       "restartPolicyMaxRetries": 20
     }
   }
   ```

5. **Fix root cause**:
   - Address health check failures
   - Fix application crashes
   - Optimize resource usage

---

## Database Connection Errors

### Symptom: Connection Pool Exhausted

**Error Message**:

```
P2024: Timed out fetching a new connection from the pool
Error: Connection pool timeout
```

**Causes**:

- Too many concurrent connections
- Connection leaks (not released)
- Pool size too small
- Long-running queries

**Solutions**:

1. **Check connection pool configuration**:
   In `schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Increase pool size** (Supabase paid plans):
   - Go to Supabase → Database Settings
   - Increase connection limit

3. **Fix connection leaks**:

   ```typescript
   // Always use Prisma client properly
   try {
     const result = await prisma.user.findMany();
     return result;
   } finally {
     // Prisma handles connection release
   }
   ```

4. **Add connection timeout**:

   ```typescript
   // In database configuration
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   });
   ```

5. **Monitor active connections**:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

### Symptom: Authentication Failed

**Error Message**:

```
P1001: Authentication failed against database server
Error: password authentication failed
```

**Causes**:

- Incorrect password in connection string
- Password contains special characters not escaped
- Wrong database user

**Solutions**:

1. **Verify credentials in Supabase**:
   - Go to Supabase → Settings → Database
   - Reset database password if needed

2. **Escape special characters in password**:

   ```bash
   # URL encode special characters
   # @ becomes %40
   # : becomes %3A
   # / becomes %2F
   ```

3. **Test connection string**:

   ```bash
   psql "postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

4. **Update Railway environment variable**:
   - Copy correct connection string from Supabase
   - Update `DATABASE_URL` in Railway
   - Redeploy service

### Symptom: SSL Connection Error

**Error Message**:

```
Error: SSL connection required
Error: self signed certificate in certificate chain
```

**Causes**:

- SSL not configured in connection string
- Certificate validation issues

**Solutions**:

1. **Add SSL parameter to connection string**:

   ```
   postgresql://...?sslmode=require
   ```

2. **Disable SSL verification** (not recommended for production):

   ```
   postgresql://...?sslmode=no-verify
   ```

3. **Use Supabase provided connection string**:
   - Copy directly from Supabase dashboard
   - Don't modify SSL parameters

---

## Redis Connection Errors

### Symptom: Cannot Connect to Redis

**Error Message**:

```
Error: Redis connection failed
Error: connect ECONNREFUSED
```

**Causes**:

- Redis service not running
- Incorrect REDIS_HOST or REDIS_PORT
- Network connectivity issues

**Solutions**:

1. **Verify Redis service status**:
   - Check Railway dashboard
   - Ensure Redis service is "Active"

2. **Check environment variables**:

   ```bash
   # In Railway, verify:
   REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
   REDIS_PORT=6379
   ```

3. **Test Redis connection**:

   ```bash
   # Using Railway CLI
   railway run redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
   ```

4. **Restart Redis service**:
   - Go to Railway → Redis service
   - Click "Restart"

5. **Check Redis logs**:
   - View Railway Redis service logs
   - Look for startup errors

### Symptom: Redis Authentication Failed

**Error Message**:

```
Error: NOAUTH Authentication required
Error: invalid password
```

**Causes**:

- Redis password not set or incorrect
- Password environment variable missing

**Solutions**:

1. **Check if Redis requires password**:
   - Railway Redis may not require password
   - Try connecting without password first

2. **Set REDIS_PASSWORD if required**:

   ```bash
   REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
   ```

3. **Update Redis client configuration**:
   ```typescript
   const redis = new Redis({
     host: process.env.REDIS_HOST,
     port: parseInt(process.env.REDIS_PORT || '6379'),
     password: process.env.REDIS_PASSWORD || undefined,
   });
   ```

### Symptom: Queue Jobs Not Processing

**Error Message**:

```
Jobs stuck in queue
Worker not picking up jobs
```

**Causes**:

- Worker service not running
- Redis connection lost
- Queue name mismatch

**Solutions**:

1. **Check worker service status**:
   - Verify worker is "Active" in Railway
   - Check worker logs for errors

2. **Verify queue names match**:

   ```typescript
   // In API (enqueue)
   await aiGradingQueue.add('grade', data);

   // In Worker (process)
   aiGradingQueue.process('grade', async (job) => { ... });
   ```

3. **Check Redis queue length**:

   ```bash
   redis-cli LLEN bull:aiGrading:wait
   ```

4. **Clear stuck jobs** (if needed):

   ```bash
   redis-cli DEL bull:aiGrading:wait
   redis-cli DEL bull:aiGrading:active
   ```

5. **Restart worker service**:
   - Railway → Worker service → Restart

---

## CORS Errors

### Symptom: CORS Policy Blocking Requests

**Error Message** (in browser console):

```
Access to fetch at 'https://api.railway.app/...' from origin 'https://app.vercel.app'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Causes**:

- FRONTEND_URL not configured correctly
- CORS middleware not configured
- Preflight requests failing

**Solutions**:

1. **Verify FRONTEND_URL in Railway**:

   ```bash
   FRONTEND_URL=https://<your-app>.vercel.app
   ```

   - Must match exactly (including https://)
   - No trailing slash

2. **Check CORS middleware configuration**:

   ```typescript
   app.use(
     cors({
       origin: process.env.FRONTEND_URL,
       credentials: true,
     })
   );
   ```

3. **Allow multiple origins** (if needed):

   ```typescript
   const allowedOrigins = [
     process.env.FRONTEND_URL,
     'http://localhost:3000', // Development
   ];

   app.use(
     cors({
       origin: (origin, callback) => {
         if (!origin || allowedOrigins.includes(origin)) {
           callback(null, true);
         } else {
           callback(new Error('Not allowed by CORS'));
         }
       },
       credentials: true,
     })
   );
   ```

4. **Test CORS headers**:

   ```bash
   curl -H "Origin: https://<your-app>.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://<your-api>.railway.app/api/auth/login
   ```

5. **Redeploy API after changing FRONTEND_URL**:
   - Railway auto-redeploys on environment variable change

### Symptom: Credentials Not Sent

**Error Message**:

```
Credentials flag is 'true', but the 'Access-Control-Allow-Credentials' header is ''
```

**Causes**:

- CORS credentials not enabled
- Frontend not sending credentials

**Solutions**:

1. **Enable credentials in CORS middleware**:

   ```typescript
   app.use(
     cors({
       origin: process.env.FRONTEND_URL,
       credentials: true, // Enable this
     })
   );
   ```

2. **Send credentials from frontend**:
   ```javascript
   fetch('https://api.railway.app/api/endpoint', {
     method: 'POST',
     credentials: 'include', // Add this
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify(data),
   });
   ```

---

## Worker Service Issues

### Symptom: Worker Crashes on Startup

**Error Message**:

```
Worker exited with code 1
Error: Cannot find module 'worker'
```

**Causes**:

- Worker file not built
- Incorrect start command
- Missing dependencies

**Solutions**:

1. **Verify worker file exists**:

   ```bash
   ls -la dist/worker.js
   ```

2. **Check start command**:

   ```json
   {
     "scripts": {
       "start:worker": "node dist/worker.js"
     }
   }
   ```

3. **Verify build includes worker**:
   - Check `tsconfig.json` includes worker source
   - Ensure worker.ts is compiled to dist/

4. **Test worker locally**:

   ```bash
   npm run build
   npm run start:worker
   ```

5. **Check Railway worker service settings**:
   - Start command: `npm run start:worker`
   - Root directory: `folkify_BE`

### Symptom: Worker Not Processing Jobs

**Error Message**:

```
Worker running but jobs not being processed
Queue length increasing
```

**Causes**:

- Worker not connected to correct Redis
- Queue names don't match
- Worker crashed silently

**Solutions**:

1. **Check worker logs**:
   - Look for "Worker started" message
   - Look for "Connected to Redis" message
   - Look for job processing logs

2. **Verify Redis connection**:

   ```typescript
   // In worker.ts
   console.log('Connecting to Redis:', process.env.REDIS_HOST);
   ```

3. **Check queue registration**:

   ```typescript
   // Ensure worker is listening to correct queues
   aiGradingQueue.process(async (job) => {
     console.log('Processing job:', job.id);
     // ...
   });
   ```

4. **Monitor queue in Redis**:

   ```bash
   redis-cli LLEN bull:aiGrading:wait
   redis-cli LLEN bull:aiGrading:active
   ```

5. **Restart worker service**:
   - Railway → Worker service → Restart

---

## Environment Variable Errors

### Symptom: Missing Required Variable

**Error Message**:

```
Error: Environment variable DATABASE_URL is not defined
Error: Missing required environment variable: JWT_SECRET
```

**Causes**:

- Variable not set in Railway/Vercel
- Variable name typo
- Variable not loaded correctly

**Solutions**:

1. **Check variable is set**:
   - Railway → Service → Variables
   - Verify variable name matches exactly

2. **Verify variable in logs**:

   ```typescript
   console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
   ```

3. **Add missing variable**:
   - Copy from `.env.example`
   - Set in Railway/Vercel dashboard
   - Service auto-redeploys

4. **Check variable loading**:
   ```typescript
   // Ensure dotenv is loaded (for local dev)
   import 'dotenv/config';
   ```

### Symptom: Invalid Variable Format

**Error Message**:

```
Error: Invalid DATABASE_URL format
Error: JWT_SECRET must be at least 32 characters
```

**Causes**:

- Incorrect connection string format
- Value doesn't meet requirements
- Special characters not escaped

**Solutions**:

1. **Validate connection string format**:

   ```
   postgresql://user:password@host:port/database?options
   ```

2. **Check for special characters**:
   - URL encode passwords with special characters
   - Use quotes if needed

3. **Verify value meets requirements**:

   ```bash
   # JWT_SECRET minimum 32 characters
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Test variable locally**:
   ```bash
   export DATABASE_URL="postgresql://..."
   npm start
   ```

---

## Rollback Procedures

### Railway API/Worker Rollback

**When to Rollback**:

- New deployment is broken
- Critical bugs in production
- Health checks failing consistently
- Data corruption risk

**Rollback Steps**:

1. **Identify last known good deployment**:
   - Go to Railway → Service → Deployments
   - Find deployment before issues started
   - Note the commit SHA

2. **Redeploy previous version**:
   - Click on the good deployment
   - Click "Redeploy" button
   - Wait for deployment to complete

3. **Verify rollback success**:
   - Check health endpoint returns 200
   - Test critical API endpoints
   - Monitor logs for errors

4. **Notify team**:
   - Inform team of rollback
   - Document issue that caused rollback
   - Plan fix for next deployment

**Alternative: Git Revert**:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-sha>
git push --force origin main
```

### Vercel Frontend Rollback

**Rollback Steps**:

1. **Go to Vercel dashboard**:
   - Select project
   - Click "Deployments" tab

2. **Find last known good deployment**:
   - Look for deployment before issues
   - Check deployment preview if needed

3. **Promote to production**:
   - Click "..." menu on deployment
   - Select "Promote to Production"
   - Confirm promotion

4. **Verify rollback**:
   - Visit production URL
   - Test critical user flows
   - Check browser console for errors

### Database Migration Rollback

**⚠️ WARNING**: Database rollbacks are risky and can cause data loss.

**Rollback Steps**:

1. **Backup database first**:

   ```bash
   # In Supabase dashboard
   # Go to Database → Backups
   # Create manual backup
   ```

2. **Identify migration to rollback**:

   ```sql
   SELECT * FROM _prisma_migrations
   ORDER BY finished_at DESC
   LIMIT 5;
   ```

3. **Create rollback migration**:

   ```bash
   # Manually create migration to reverse changes
   npx prisma migrate create --name rollback_<original_migration>
   ```

4. **Write reverse SQL**:

   ```sql
   -- Example: If migration added column, remove it
   ALTER TABLE users DROP COLUMN new_column;
   ```

5. **Apply rollback migration**:

   ```bash
   npx prisma migrate deploy
   ```

6. **Verify database state**:
   - Check tables in Supabase
   - Run test queries
   - Verify application works

**Alternative: Restore from Backup**:

1. Go to Supabase → Database → Backups
2. Select backup before migration
3. Click "Restore"
4. Wait for restore to complete
5. Redeploy application

### Emergency Rollback Checklist

- [ ] Identify the issue and affected services
- [ ] Notify team of rollback in progress
- [ ] Backup database (if rolling back migrations)
- [ ] Rollback affected services (API, Worker, Frontend)
- [ ] Verify health checks pass
- [ ] Test critical user flows
- [ ] Monitor error logs for 30 minutes
- [ ] Document incident and root cause
- [ ] Plan fix for next deployment
- [ ] Update team on status

---

## Getting Help

If you've tried these solutions and still have issues:

1. **Check service status pages**:
   - Railway: https://status.railway.app/
   - Vercel: https://www.vercel-status.com/
   - Supabase: https://status.supabase.com/

2. **Review documentation**:
   - [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - [DEPLOYMENT_VERIFICATION.md](./DEPLOYMENT_VERIFICATION.md)

3. **Contact support**:
   - Railway: https://railway.app/help
   - Vercel: https://vercel.com/support
   - Supabase: https://supabase.com/support

4. **Community resources**:
   - Railway Discord: https://discord.gg/railway
   - Vercel Discord: https://discord.gg/vercel
   - Supabase Discord: https://discord.supabase.com/

---

**Last Updated**: 2024-01-15  
**Maintainer**: DevOps Team

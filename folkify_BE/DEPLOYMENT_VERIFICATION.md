# FOLKIFY Deployment Verification Checklist

This checklist helps you verify that your FOLKIFY deployment is working correctly across all services. Complete each section after deploying to ensure the system is fully operational.

## Table of Contents

1. [Railway API Service Verification](#railway-api-service-verification)
2. [Railway Worker Service Verification](#railway-worker-service-verification)
3. [Health Check Endpoint Testing](#health-check-endpoint-testing)
4. [Database Connectivity Testing](#database-connectivity-testing)
5. [Redis Connectivity Testing](#redis-connectivity-testing)
6. [API Endpoint Testing](#api-endpoint-testing)
7. [Frontend-to-Backend Communication Testing](#frontend-to-backend-communication-testing)
8. [Background Worker Job Processing Verification](#background-worker-job-processing-verification)

---

## Railway API Service Verification

### Deployment Status

- [ ] API service shows "Active" status in Railway dashboard
- [ ] Latest deployment completed successfully (green checkmark)
- [ ] No error messages in deployment logs
- [ ] Build command completed without errors
- [ ] Start command executed successfully
- [ ] Service has been running for at least 5 minutes without crashes

### Service Configuration

- [ ] Service name is correctly set (e.g., `folkify-api`)
- [ ] Root directory is set to `folkify_BE`
- [ ] Branch is set to `main`
- [ ] Public domain is generated and accessible
- [ ] Health check path is configured: `/api/health`
- [ ] Restart policy is set to `ON_FAILURE`

### Environment Variables

- [ ] All required environment variables are set (see `.env.example`)
- [ ] `NODE_ENV` is set to `production`
- [ ] `DATABASE_URL` is configured with port 6543 (pooled)
- [ ] `DIRECT_URL` is configured with port 5432 (direct)
- [ ] `JWT_SECRET` is set (minimum 32 characters)
- [ ] `REDIS_HOST` and `REDIS_PORT` are configured
- [ ] `FRONTEND_URL` matches Vercel domain
- [ ] No placeholder values remain (e.g., `<your-value>`)

### Public Access

- [ ] API domain is accessible via HTTPS
- [ ] Domain returns valid response (not 404 or 502)
- [ ] SSL certificate is valid (no browser warnings)
- [ ] Response time is reasonable (< 2 seconds for health check)

**Test Command**:

```bash
curl https://<your-api-domain>.railway.app/api/health
```

**Expected Response**:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  },
  "uptime": 300,
  "version": "1.0.0"
}
```

---

## Railway Worker Service Verification

### Deployment Status

- [ ] Worker service shows "Active" status in Railway dashboard
- [ ] Latest deployment completed successfully
- [ ] No error messages in deployment logs
- [ ] Start command `npm run start:worker` executed successfully
- [ ] Service has been running for at least 5 minutes without crashes
- [ ] No repeated restart loops in logs

### Service Configuration

- [ ] Service name is correctly set (e.g., `folkify-worker`)
- [ ] Root directory is set to `folkify_BE`
- [ ] Branch is set to `main`
- [ ] Start command is overridden to `npm run start:worker`
- [ ] No public domain (worker is internal service)

### Environment Variables

- [ ] All required worker environment variables are set
- [ ] `NODE_ENV` is set to `production`
- [ ] `DATABASE_URL` matches API service
- [ ] `REDIS_HOST` and `REDIS_PORT` match API service
- [ ] `QUEUE_RETRY_ATTEMPTS` and `QUEUE_RETRY_DELAY` are configured

### Worker Logs

- [ ] Logs show "Worker started successfully" or similar message
- [ ] Logs show connection to Redis established
- [ ] Logs show connection to database established
- [ ] No connection errors in recent logs
- [ ] Worker is listening to queues: `aiGrading`, `email`

**Check Logs**:

```bash
# View worker logs in Railway dashboard
# Look for messages like:
# "Worker started successfully"
# "Connected to Redis"
# "Listening to queues: aiGrading, email"
```

---

## Health Check Endpoint Testing

### Basic Health Check

- [ ] Health endpoint returns HTTP 200 OK
- [ ] Response contains `status: "healthy"`
- [ ] Response contains `timestamp` field
- [ ] Response contains `services` object
- [ ] Response contains `uptime` field
- [ ] Response contains `version` field

**Test Command**:

```bash
curl -i https://<your-api-domain>.railway.app/api/health
```

**Expected Headers**:

```
HTTP/2 200
content-type: application/json
```

### Service Health Status

- [ ] Database service status is `"healthy"`
- [ ] Redis service status is `"healthy"`
- [ ] No services show `"unhealthy"` status
- [ ] Uptime is greater than 0

### Health Check Monitoring

- [ ] Railway dashboard shows green health indicator
- [ ] No recent health check failures in logs
- [ ] Health checks passing consistently for 10+ minutes
- [ ] No automatic restarts due to health check failures

### Error Scenarios

Test that health check correctly reports unhealthy state:

- [ ] If database is unreachable, health check returns 503
- [ ] If Redis is unreachable, health check returns 503
- [ ] Unhealthy response includes error details in `errors` array

---

## Database Connectivity Testing

### Connection Verification

- [ ] API can connect to Supabase database
- [ ] Connection uses pooled connection (port 6543)
- [ ] No connection timeout errors in logs
- [ ] No authentication errors in logs
- [ ] Connection pool is not exhausted

**Test via Health Endpoint**:

```bash
curl https://<your-api-domain>.railway.app/api/health | jq '.services.database'
```

**Expected Output**:

```json
"healthy"
```

### Database Query Testing

- [ ] API can execute SELECT queries
- [ ] API can execute INSERT queries
- [ ] API can execute UPDATE queries
- [ ] API can execute DELETE queries
- [ ] Queries complete in reasonable time (< 1 second)

**Test Command** (using API endpoint):

```bash
# Test user registration (creates database record)
curl -X POST https://<your-api-domain>.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "fullName": "Test User",
    "role": "STUDENT"
  }'
```

**Expected Response**: HTTP 201 Created with user object

### Migration Status

- [ ] All migrations applied successfully
- [ ] `_prisma_migrations` table exists in database
- [ ] Latest migration is marked as applied
- [ ] No pending migrations
- [ ] No failed migrations

**Verify Migrations** (using Supabase dashboard):

1. Go to Supabase → SQL Editor
2. Run: `SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;`
3. Verify latest migrations are present and successful

### Connection Pool Health

- [ ] No "connection pool timeout" errors
- [ ] No "too many connections" errors
- [ ] Connection pool size is appropriate for load
- [ ] Connections are properly released after queries

---

## Redis Connectivity Testing

### Connection Verification

- [ ] API can connect to Railway Redis instance
- [ ] No connection errors in API logs
- [ ] No authentication errors in Redis logs
- [ ] Worker can connect to same Redis instance

**Test via Health Endpoint**:

```bash
curl https://<your-api-domain>.railway.app/api/health | jq '.services.redis'
```

**Expected Output**:

```json
"healthy"
```

### Cache Operations

- [ ] API can write to Redis cache
- [ ] API can read from Redis cache
- [ ] API can delete from Redis cache
- [ ] Cache TTL is working correctly
- [ ] Cache keys follow expected naming pattern

**Test Cache** (using API endpoints):

```bash
# First request (cache miss)
time curl https://<your-api-domain>.railway.app/api/instruments

# Second request (cache hit - should be faster)
time curl https://<your-api-domain>.railway.app/api/instruments
```

**Expected Behavior**: Second request is significantly faster (cached)

### Queue Operations

- [ ] Jobs can be enqueued to Redis
- [ ] Worker can dequeue jobs from Redis
- [ ] Job status can be queried
- [ ] Failed jobs are retried according to configuration
- [ ] Completed jobs are removed from queue

**Test Queue** (submit AI grading job):

```bash
# Submit practice session for grading
curl -X POST https://<your-api-domain>.railway.app/api/practice-sessions \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": 1,
    "audioFile": "<base64-audio-data>"
  }'
```

**Expected Behavior**: Job enqueued, worker processes it

### Redis Persistence

- [ ] Redis data persists across API restarts
- [ ] Redis data persists across worker restarts
- [ ] AOF (Append-Only File) is enabled
- [ ] No data loss on service restart

---

## API Endpoint Testing

### Authentication Endpoints

- [ ] `POST /api/auth/register` - User registration works
- [ ] `POST /api/auth/login` - User login works
- [ ] `POST /api/auth/refresh` - Token refresh works
- [ ] `POST /api/auth/logout` - User logout works
- [ ] JWT tokens are generated correctly
- [ ] JWT tokens are validated correctly

**Test Registration**:

```bash
curl -X POST https://<your-api-domain>.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify@example.com",
    "password": "SecurePass123!",
    "fullName": "Verification User",
    "role": "STUDENT"
  }'
```

**Expected Response**: HTTP 201 with user object and tokens

**Test Login**:

```bash
curl -X POST https://<your-api-domain>.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response**: HTTP 200 with tokens

### Public Endpoints

- [ ] `GET /api/instruments` - Returns instrument list
- [ ] `GET /api/instruments/:id` - Returns single instrument
- [ ] `GET /api/lessons` - Returns lesson list
- [ ] `GET /api/lessons/:id` - Returns single lesson
- [ ] `GET /api/sheets` - Returns sheet music list
- [ ] Responses are properly formatted JSON
- [ ] Responses include appropriate status codes

**Test Public Endpoint**:

```bash
curl https://<your-api-domain>.railway.app/api/instruments
```

**Expected Response**: HTTP 200 with array of instruments

### Protected Endpoints

- [ ] Protected endpoints require authentication
- [ ] Invalid tokens are rejected (HTTP 401)
- [ ] Expired tokens are rejected (HTTP 401)
- [ ] Valid tokens grant access
- [ ] Role-based access control works correctly

**Test Protected Endpoint** (without token):

```bash
curl https://<your-api-domain>.railway.app/api/practice-sessions
```

**Expected Response**: HTTP 401 Unauthorized

**Test Protected Endpoint** (with token):

```bash
curl https://<your-api-domain>.railway.app/api/practice-sessions \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Expected Response**: HTTP 200 with data

### Admin Endpoints

- [ ] Admin endpoints require admin role
- [ ] Non-admin users are rejected (HTTP 403)
- [ ] Admin users can access admin endpoints
- [ ] `GET /api/admin/users` - Returns user list
- [ ] `GET /api/admin/analytics` - Returns analytics data

**Test Admin Endpoint** (with student token):

```bash
curl https://<your-api-domain>.railway.app/api/admin/users \
  -H "Authorization: Bearer <student-jwt-token>"
```

**Expected Response**: HTTP 403 Forbidden

### Error Handling

- [ ] Invalid requests return appropriate error codes
- [ ] Error responses include error messages
- [ ] Validation errors return HTTP 400
- [ ] Not found errors return HTTP 404
- [ ] Server errors return HTTP 500
- [ ] Error responses follow consistent format

### Rate Limiting

- [ ] Rate limiting is active on API endpoints
- [ ] Excessive requests return HTTP 429
- [ ] Rate limit headers are present in responses
- [ ] Rate limits reset after time window

**Test Rate Limiting**:

```bash
# Send multiple rapid requests
for i in {1..150}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://<your-api-domain>.railway.app/api/instruments
done
```

**Expected Behavior**: Some requests return HTTP 429 after limit exceeded

---

## Frontend-to-Backend Communication Testing

### CORS Configuration

- [ ] Frontend can make requests to backend
- [ ] No CORS errors in browser console
- [ ] Preflight OPTIONS requests succeed
- [ ] Credentials are sent correctly
- [ ] CORS headers are present in responses

**Test CORS** (from browser console on Vercel domain):

```javascript
fetch('https://<your-api-domain>.railway.app/api/instruments')
  .then((res) => res.json())
  .then((data) => console.log('Success:', data))
  .catch((err) => console.error('CORS Error:', err));
```

**Expected Behavior**: No CORS errors, data returned successfully

### API Integration

- [ ] Frontend can fetch data from backend
- [ ] Frontend can submit forms to backend
- [ ] Frontend can upload files to backend
- [ ] Frontend receives proper error messages
- [ ] Loading states work correctly
- [ ] Authentication flow works end-to-end

### Authentication Flow

- [ ] User can register from frontend
- [ ] User can login from frontend
- [ ] JWT tokens are stored correctly
- [ ] Tokens are sent with authenticated requests
- [ ] Token refresh works automatically
- [ ] User can logout from frontend

### Data Flow

- [ ] Frontend displays data from backend correctly
- [ ] Frontend updates reflect in backend
- [ ] Real-time updates work (if applicable)
- [ ] Error messages are displayed to users
- [ ] Success messages are displayed to users

### Performance

- [ ] API responses are fast (< 2 seconds)
- [ ] Images and media load correctly
- [ ] No timeout errors
- [ ] Network tab shows successful requests
- [ ] No excessive API calls

---

## Background Worker Job Processing Verification

### Worker Status

- [ ] Worker service is running continuously
- [ ] Worker logs show active job processing
- [ ] No repeated crashes in worker logs
- [ ] Worker reconnects to Redis after interruptions
- [ ] Worker reconnects to database after interruptions

### AI Grading Queue

- [ ] AI grading jobs are enqueued successfully
- [ ] Worker picks up AI grading jobs
- [ ] Jobs are processed within reasonable time (< 30 seconds)
- [ ] Job results are saved to database
- [ ] Users can retrieve grading results via API
- [ ] Failed jobs are retried according to configuration

**Test AI Grading**:

```bash
# 1. Submit practice session (creates AI grading job)
curl -X POST https://<your-api-domain>.railway.app/api/practice-sessions \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: multipart/form-data" \
  -F "lessonId=1" \
  -F "audioFile=@test-audio.mp3"

# 2. Check worker logs for job processing
# Look for: "Processing AI grading job"

# 3. Retrieve grading results
curl https://<your-api-domain>.railway.app/api/practice-sessions/<session-id> \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Expected Behavior**:

- Job enqueued immediately
- Worker processes within 30 seconds
- Results available via API

### Email Queue

- [ ] Email jobs are enqueued successfully
- [ ] Worker picks up email jobs
- [ ] Emails are processed (logged in console mode)
- [ ] Email logs appear in worker logs
- [ ] Failed email jobs are retried

**Test Email Queue**:

```bash
# Trigger email (e.g., user registration)
curl -X POST https://<your-api-domain>.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "emailtest@example.com",
    "password": "TestPass123!",
    "fullName": "Email Test",
    "role": "STUDENT"
  }'

# Check worker logs for email processing
# Look for: "Processing email job" or "Email sent to emailtest@example.com"
```

**Expected Behavior**: Email job logged in worker console

### Job Retry Logic

- [ ] Failed jobs are retried automatically
- [ ] Retry attempts match configuration (default: 3)
- [ ] Retry delay is applied between attempts
- [ ] Jobs fail permanently after max retries
- [ ] Failed jobs are logged with error details

### Queue Monitoring

- [ ] Queue length can be monitored
- [ ] Stuck jobs can be identified
- [ ] Failed jobs can be inspected
- [ ] Queue can be cleared if needed

**Monitor Queue** (using Redis CLI or Railway Redis dashboard):

```bash
# Check queue length
redis-cli LLEN bull:aiGrading:wait

# Check failed jobs
redis-cli LLEN bull:aiGrading:failed

# Check completed jobs
redis-cli LLEN bull:aiGrading:completed
```

### Performance

- [ ] Jobs are processed promptly (no long delays)
- [ ] Worker handles concurrent jobs correctly
- [ ] No memory leaks in worker process
- [ ] Worker CPU usage is reasonable
- [ ] Worker memory usage is stable

---

## Final Verification Summary

### All Services Operational

- [ ] Railway API service is healthy and responding
- [ ] Railway Worker service is processing jobs
- [ ] Vercel frontend is accessible and functional
- [ ] Supabase database is connected and responsive
- [ ] Railway Redis is connected and caching
- [ ] All health checks are passing

### End-to-End User Flow

- [ ] User can access frontend
- [ ] User can register account
- [ ] User can login
- [ ] User can browse content (instruments, lessons, sheets)
- [ ] User can submit practice sessions
- [ ] User receives AI grading results
- [ ] User can view their progress
- [ ] User can logout

### Monitoring and Alerts

- [ ] Deployment notifications are configured
- [ ] Error tracking is active
- [ ] Log aggregation is working
- [ ] Performance monitoring is enabled
- [ ] Uptime monitoring is configured

### Documentation

- [ ] Deployment guide is accessible to team
- [ ] Environment variables are documented
- [ ] Troubleshooting guide is available
- [ ] Rollback procedures are documented
- [ ] Team is trained on deployment process

---

## Troubleshooting

If any verification step fails, consult [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed resolution steps.

## Next Steps

After completing this verification:

1. ✅ Document any issues encountered and resolutions
2. ✅ Set up automated monitoring and alerts
3. ✅ Schedule regular health checks
4. ✅ Plan for scaling if needed
5. ✅ Review security configurations
6. ✅ Set up backup and disaster recovery procedures

---

**Verification Completed**: ******\_\_\_******  
**Verified By**: ******\_\_\_******  
**Date**: ******\_\_\_******  
**Notes**: ******\_\_\_******

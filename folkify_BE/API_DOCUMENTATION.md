# FOLKIFY Backend API Documentation

## Base URL

- Development: `http://localhost:3000`
- Production: `https://api.folkify.com`

## Interactive Documentation

Visit `/api/docs` for interactive Swagger UI documentation.

## Authentication

### JWT Bearer Token

All protected endpoints require a JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Types

- **Access Token**: 15 minutes expiration, used for API requests
- **Refresh Token**: 7 days expiration, used to obtain new access tokens

### Authentication Flow

1. Register or login to receive both tokens
2. Use access token for all protected API requests
3. When access token expires (401), use refresh token to get a new one
4. If refresh token expires, user must login again

## Account Types

### FREE (Default)

- Access to first 3 lessons per instrument
- Access to free sheet music
- No AI grading

### BASIC (Premium)

- Access to all lessons
- Access to all sheet music
- No AI grading
- Price: 149,000 VND/month

### PRO (Premium)

- All BASIC features
- Unlimited AI grading
- Price: 199,000 VND/month

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP
- Admin endpoints: 100 requests per 15 minutes per IP

## Error Codes

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `INVALID_CREDENTIALS` - Wrong email or password
- `EMAIL_EXISTS` - Email already registered
- `ACCOUNT_BANNED` - User account is banned
- `TOKEN_EXPIRED` - JWT token has expired
- `INVALID_TOKEN` - JWT token is invalid
- `PREMIUM_REQUIRED` - Feature requires premium subscription
- `PRO_REQUIRED` - Feature requires PRO subscription
- `ACCESS_DENIED` - User doesn't have permission
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed

## API Endpoints

### Authentication

#### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "account_type": "free",
      "account_status": "active",
      "role": "user"
    }
  }
}
```

#### POST /api/auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
Same as register response.

#### POST /api/auth/refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

#### GET /api/auth/me

Get current user profile and stats.

**Authentication:** Required

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "account_type": "free",
      "premium_expires_at": null
    },
    "stats": {
      "level": 5,
      "total_xp": 4500,
      "lessons_completed": 12,
      "total_practice_minutes": 180,
      "current_streak": 3,
      "longest_streak": 7
    }
  }
}
```

### Instruments

#### GET /api/instruments

Get all Vietnamese folk instruments.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Đàn Tranh",
      "english_name": "Vietnamese Zither",
      "region": "Miền Nam",
      "category": "Dây",
      "emoji": "🎵",
      "description": "Traditional 16-string zither",
      "difficulty": "Intermediate",
      "popularity": 95
    }
  ]
}
```

#### GET /api/instruments/:id

Get instrument details by ID.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Đàn Tranh",
    "english_name": "Vietnamese Zither",
    "description": "Detailed description...",
    "facts": ["Fact 1", "Fact 2"]
  }
}
```

### Lessons

#### GET /api/lessons/search

Search lessons with filters.

**Query Parameters:**

- `q` (string) - Search term
- `level` (string) - Beginner, Intermediate, Advanced
- `instrument_id` (uuid) - Filter by instrument
- `page` (integer) - Page number (default: 1)
- `limit` (integer) - Items per page (default: 20)

**Response (200):**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### GET /api/lessons/:id

Get lesson details with access control.

**Authentication:** Required

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Lesson Title",
    "duration": 30,
    "level": "Beginner",
    "is_premium": false,
    "xp": 100,
    "has_access": true,
    "requires_premium": false,
    "completed": false,
    "progress_percentage": 0,
    "steps": [...],
    "tips": [...]
  }
}
```

#### POST /api/lessons/:id/complete

Mark lesson as completed and earn XP.

**Authentication:** Required

**Response (200):**

```json
{
  "success": true,
  "data": {
    "xp_earned": 100,
    "new_total_xp": 4600,
    "new_level": 5,
    "level_up": false
  }
}
```

### Sheet Music

#### GET /api/sheets

Get all sheet music with filters.

**Query Parameters:**

- `instrument` (string) - Filter by instrument name
- `genre` (string) - Filter by genre
- `level` (string) - Beginner, Intermediate, Advanced
- `is_premium` (boolean) - Filter premium/free
- `page` (integer) - Page number
- `limit` (integer) - Items per page

#### GET /api/sheets/search

Search sheet music.

**Query Parameters:**
Same as GET /api/sheets plus:

- `q` (string) - Search term

#### GET /api/sheets/:id

Get sheet music details.

**Authentication:** Required

#### GET /api/sheets/:id/download

Download sheet music PDF file.

**Authentication:** Required
**Access Control:** Premium required for premium sheets

### Premium

#### GET /api/premium/plans

Get available premium plans (public).

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "plan_type": "basic",
      "name": "BASIC",
      "price_monthly": 149000,
      "features": ["All lessons", "All sheet music"]
    },
    {
      "plan_type": "pro",
      "name": "PRO",
      "price_monthly": 199000,
      "features": ["All BASIC features", "Unlimited AI grading"]
    }
  ]
}
```

#### GET /api/premium/status

Get current user's premium status.

**Authentication:** Required

**Response (200):**

```json
{
  "success": true,
  "data": {
    "is_premium": true,
    "account_type": "pro",
    "premium_started_at": "2024-01-01T00:00:00Z",
    "premium_expires_at": "2024-02-01T00:00:00Z",
    "days_remaining": 15
  }
}
```

### AI Grading (PRO Only)

#### POST /api/ai-grading/submit

Submit audio/video for AI grading.

**Authentication:** Required (PRO users only)
**Content-Type:** multipart/form-data

**Form Data:**

- `file` (file) - Audio (mp3, wav, m4a) or video (mp4, mov, avi)
- `lesson_id` (uuid, optional) - Associated lesson

**File Limits:**

- Audio: Max 50MB
- Video: Max 200MB

**Response (201):**

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "status": "pending",
    "message": "Your submission is being processed"
  }
}
```

#### GET /api/ai-grading/:id

Get AI grading result (polling endpoint).

**Authentication:** Required

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "ai_score": 85,
    "criteria_scores": {
      "rhythm": 88,
      "pitch": 82,
      "technique": 85,
      "expression": 85
    },
    "ai_feedback": "Good performance overall...",
    "improvement_suggestions": ["Practice rhythm exercises", "Focus on pitch accuracy"],
    "submitted_at": "2024-01-01T10:00:00Z",
    "completed_at": "2024-01-01T10:02:00Z"
  }
}
```

#### GET /api/ai-grading/history

Get AI grading history with pagination.

**Authentication:** Required

**Query Parameters:**

- `page` (integer) - Page number
- `limit` (integer) - Items per page

### Practice Sessions

#### POST /api/practice/start

Start a practice session.

**Authentication:** Required

**Request Body:**

```json
{
  "lesson_id": "uuid",
  "instrument_id": "uuid"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "started_at": "2024-01-01T10:00:00Z",
    "status": "active"
  }
}
```

#### POST /api/practice/end

End a practice session and earn XP.

**Authentication:** Required

**Request Body:**

```json
{
  "session_id": "uuid"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "duration_minutes": 45,
    "xp_earned": 45,
    "new_total_xp": 4645,
    "new_level": 5,
    "current_streak": 4
  }
}
```

#### GET /api/practice/history

Get practice session history.

**Authentication:** Required

**Query Parameters:**

- `page` (integer)
- `limit` (integer)
- `start_date` (ISO date)
- `end_date` (ISO date)

### Admin - User Management

**All admin endpoints require authentication and admin role.**

#### GET /api/admin/users

Get all users with filters and pagination.

**Query Parameters:**

- `account_type` (string) - free, basic, pro
- `account_status` (string) - active, banned, suspended
- `search` (string) - Search by email or name
- `page` (integer)
- `limit` (integer)

#### GET /api/admin/users/:id

Get detailed user information.

#### POST /api/admin/users/:id/upgrade

Manually upgrade user to premium.

**Request Body:**

```json
{
  "plan_type": "basic",
  "duration_months": 1,
  "notes": "Manual upgrade reason"
}
```

#### POST /api/admin/users/:id/ban

Ban a user.

**Request Body:**

```json
{
  "reason": "Ban reason"
}
```

#### POST /api/admin/users/:id/unban

Unban a user.

### Admin - Content Management

#### POST /api/admin/lessons/:id/set-premium

Set lesson premium status.

**Request Body:**

```json
{
  "is_premium": true
}
```

#### POST /api/admin/lessons/:id/publish

Publish a lesson.

#### POST /api/admin/lessons/:id/unpublish

Unpublish a lesson.

### Admin - Analytics

#### GET /api/admin/analytics/users

Get user statistics.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "total_users": 1000,
    "free_users_count": 800,
    "basic_users_count": 150,
    "pro_users_count": 50,
    "conversion_rate": "20.00"
  }
}
```

#### GET /api/admin/analytics/revenue

Get revenue statistics.

#### GET /api/admin/analytics/ai-grading

Get AI grading statistics.

#### GET /api/admin/analytics/users-expiring

Get users with expiring premium subscriptions.

**Query Parameters:**

- `days` (integer) - Days until expiration (default: 7)

#### GET /api/admin/analytics/revenue-report

Get detailed revenue report.

**Query Parameters:**

- `start_date` (ISO date)
- `end_date` (ISO date)

### Admin - Activity Logs

#### GET /api/admin/activity-logs

Get admin activity logs.

**Query Parameters:**

- `admin_id` (uuid)
- `action` (string)
- `resource_type` (string)
- `page` (integer)
- `limit` (integer)

### Admin - Cronjobs

#### POST /api/admin/cronjobs/trigger

Manually trigger premium expiration cronjob.

### Health & Metrics

#### GET /api/health

Check system health status.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T10:00:00Z",
    "uptime": 3600,
    "database": "connected",
    "redis": "connected",
    "queue": "connected"
  }
}
```

#### GET /api/metrics

Get current system metrics.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "requests": {
      "total": 10000,
      "success": 9500,
      "errors": 500
    },
    "response_times": {
      "avg": 150,
      "p95": 300,
      "p99": 500
    }
  }
}
```

## Webhooks & Background Jobs

### AI Grading Queue

AI grading submissions are processed asynchronously via BullMQ:

1. User submits file → Job added to queue → Returns session_id
2. Worker processes job → Calls mock AI service
3. Updates session status to 'completed' or 'failed'
4. Frontend polls GET /api/ai-grading/:id for results

### Email Notifications (Console Logging)

Email notifications are logged to console and files:

- Welcome email on registration
- Premium upgrade confirmation
- Premium expiration reminders (7 days before)
- Premium expired notification

### Cronjobs

- **Premium Expiration Check**: Runs daily at 00:00
  - Finds users with expired premium
  - Downgrades account_type to 'free'
  - Logs expiration notifications

## File Storage

### Local Storage Structure

```
/uploads/
  /ai-grading/{user_id}/{filename}
  /sheets/{sheet_id}/{filename}.pdf
  /images/{type}/{filename}
```

### Static File Serving

Files are served via Express static middleware at `/uploads/*`

### Cache Headers

- PDFs: 1 day
- Images: 7 days
- Audio/Video: 1 hour

## Caching Strategy

### Redis Cache

- Instruments: 30 minutes TTL
- Lessons: 10 minutes TTL
- Sheet Music: 30 minutes TTL
- Analytics: 5 minutes TTL

### Cache Invalidation

Cache is invalidated when:

- Lesson published/unpublished
- Sheet music created/updated
- Admin content changes

## Security

### Password Hashing

- Algorithm: bcrypt
- Salt rounds: 10

### JWT Tokens

- Algorithm: HS256
- Access token: 15 minutes
- Refresh token: 7 days

### Input Validation

- All inputs validated with Zod schemas
- SQL injection prevention via Prisma ORM
- XSS prevention via input sanitization

### CORS Policy

- Allowed origins: Frontend domain only
- Credentials: Allowed

## Development Notes

### Mock AI Service

The AI grading service returns random scores (60-95) for development:

- Rhythm: 60-95
- Pitch: 60-95
- Technique: 60-95
- Expression: 60-95
- Overall: Average of criteria scores

### Database

- PostgreSQL 16
- Prisma ORM
- Connection pooling: Max 20 connections

### Logging

- Winston logger with daily rotation
- Log files: error.log, combined.log, emails.log
- Log levels: ERROR, WARN, INFO, DEBUG

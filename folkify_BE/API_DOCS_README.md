# FOLKIFY API Documentation

This directory contains comprehensive API documentation for the FOLKIFY Backend API.

## Documentation Files

### 1. Interactive Swagger UI

**URL:** `http://localhost:3000/api/docs`

Access the interactive Swagger UI documentation when the server is running. This provides:

- Interactive API testing
- Request/response examples
- Schema definitions
- Authentication testing

### 2. API_DOCUMENTATION.md

Comprehensive markdown documentation including:

- All API endpoints with examples
- Authentication flow
- Error codes and responses
- Account types and access control
- Rate limiting
- File storage structure
- Caching strategy
- Security details

### 3. Postman Collection

**File:** `FOLKIFY_API.postman_collection.json`

Import this collection into Postman for easy API testing. Includes:

- All endpoints organized by category
- Example requests with sample data
- Environment variables for tokens
- Auto-save tokens from auth responses

#### How to Use Postman Collection:

1. **Generate the collection:**

   ```bash
   npm run generate:postman
   ```

2. **Import into Postman:**
   - Open Postman
   - Click "Import" button
   - Select `FOLKIFY_API.postman_collection.json`

3. **Setup Environment:**
   - Create a new environment in Postman
   - Add variables:
     - `baseUrl`: `http://localhost:3000`
     - `accessToken`: (will be auto-filled)
     - `refreshToken`: (will be auto-filled)
     - `userId`: (will be auto-filled)

4. **Test the API:**
   - Start with "Authentication > Register" or "Login"
   - Tokens will be automatically saved to environment
   - Other requests will use the saved token

### 4. OpenAPI Specification

**File:** `openapi.json`

Export the OpenAPI 3.0 specification:

```bash
npm run generate:openapi
```

This JSON file can be used with:

- API documentation generators
- Code generators
- API testing tools
- Third-party integrations

## Quick Start

### 1. Start the Server

```bash
npm run dev
```

### 2. Access Swagger UI

Open your browser and navigate to:

```
http://localhost:3000/api/docs
```

### 3. Test Authentication

1. Click on "Authentication" section
2. Try "POST /api/auth/register"
3. Click "Try it out"
4. Fill in the request body:
   ```json
   {
     "email": "test@example.com",
     "password": "password123",
     "full_name": "Test User"
   }
   ```
5. Click "Execute"
6. Copy the `accessToken` from the response
7. Click "Authorize" button at the top
8. Paste the token and click "Authorize"
9. Now you can test protected endpoints

## API Overview

### Base URL

- Development: `http://localhost:3000`
- Production: `https://api.folkify.com`

### Authentication

All protected endpoints require JWT Bearer token:

```
Authorization: Bearer <access_token>
```

### Account Types

- **FREE**: First 3 lessons per instrument, free sheets
- **BASIC**: All lessons and sheets (149,000 VND/month)
- **PRO**: BASIC + unlimited AI grading (199,000 VND/month)

### Main Endpoints

#### Public Endpoints (No Auth)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/instruments` - List instruments
- `GET /api/lessons/search` - Search lessons
- `GET /api/sheets` - List sheets
- `GET /api/premium/plans` - Get premium plans
- `GET /api/health` - Health check
- `GET /api/metrics` - System metrics
- `GET /api/docs` - Swagger UI

#### Protected Endpoints (Auth Required)

- `GET /api/auth/me` - Get current user
- `GET /api/lessons/:id` - Get lesson (access control)
- `POST /api/lessons/:id/complete` - Complete lesson
- `GET /api/sheets/:id` - Get sheet (access control)
- `GET /api/sheets/:id/download` - Download sheet
- `GET /api/premium/status` - Premium status
- `POST /api/ai-grading/submit` - Submit AI grading (PRO only)
- `GET /api/ai-grading/:id` - Get grading result
- `POST /api/practice/start` - Start practice session
- `POST /api/practice/end` - End practice session

#### Admin Endpoints (Admin Role Required)

- `GET /api/admin/users` - List users
- `POST /api/admin/users/:id/upgrade` - Upgrade user
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/lessons/:id/publish` - Publish lesson
- `GET /api/admin/analytics/users` - User statistics
- `GET /api/admin/analytics/revenue` - Revenue statistics

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

### Common Error Codes

- `INVALID_CREDENTIALS` - Wrong email/password
- `EMAIL_EXISTS` - Email already registered
- `TOKEN_EXPIRED` - JWT expired
- `PREMIUM_REQUIRED` - Need premium subscription
- `PRO_REQUIRED` - Need PRO subscription
- `ACCESS_DENIED` - Insufficient permissions

## Rate Limiting

- General API: 100 requests / 15 minutes
- Auth endpoints: 5 requests / 15 minutes
- Admin endpoints: 100 requests / 15 minutes

## File Uploads

### AI Grading Submissions

- **Endpoint:** `POST /api/ai-grading/submit`
- **Content-Type:** `multipart/form-data`
- **Audio formats:** mp3, wav, m4a (max 50MB)
- **Video formats:** mp4, mov, avi (max 200MB)

### Example with cURL:

```bash
curl -X POST http://localhost:3000/api/ai-grading/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/audio.mp3" \
  -F "lesson_id=LESSON_UUID"
```

## Pagination

All list endpoints support pagination:

```
?page=1&limit=20
```

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Caching

The API uses Redis caching:

- Instruments: 30 minutes
- Lessons: 10 minutes
- Sheets: 30 minutes
- Analytics: 5 minutes

Cache is automatically invalidated on content updates.

## Development Notes

### Mock AI Service

AI grading returns random scores (60-95) for development:

- Rhythm, Pitch, Technique, Expression: 60-95 each
- Overall score: Average of criteria scores
- Processing time: ~2 seconds

### Email Notifications

Emails are logged to console and files (not sent):

- Welcome email on registration
- Premium upgrade confirmation
- Premium expiration reminders
- Premium expired notification

### Cronjobs

- Premium expiration check: Daily at 00:00
- Downgrades expired premium users to FREE
- Logs notifications to console

## Support

For issues or questions:

- Email: support@folkify.com
- Documentation: http://localhost:3000/api/docs
- GitHub: [Repository URL]

## Version History

### v1.0.0 (Current)

- Initial release
- Full authentication system
- Premium subscriptions (BASIC/PRO)
- Lessons with access control
- Sheet music library
- AI grading service (mock)
- Practice session tracking
- Admin dashboard
- Analytics and reports
- Health checks and metrics

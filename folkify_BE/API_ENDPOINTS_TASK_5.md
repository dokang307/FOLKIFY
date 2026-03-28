# Task 5 API Endpoints Reference

## Authentication Endpoints

All endpoints are prefixed with `/api/auth`

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user account

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Validation Rules:**

- `email`: Must be valid email format
- `password`: Minimum 6 characters
- `fullName`: Required, non-empty string

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "account_type": "free",
      "account_status": "active",
      "premium_started_at": null,
      "premium_expires_at": null,
      "ban_reason": null,
      "last_login_at": null,
      "created_at": "2024-03-23T10:00:00.000Z",
      "updated_at": "2024-03-23T10:00:00.000Z",
      "deleted_at": null,
      "user_stats": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "level": 1,
        "total_xp": 0,
        "lessons_completed": 0,
        "total_practice_minutes": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "created_at": "2024-03-23T10:00:00.000Z",
        "updated_at": "2024-03-23T10:00:00.000Z"
      }
    }
  }
}
```

**Error Responses:**

400 Bad Request - Invalid input:

```json
{
  "success": false,
  "error": "Invalid email format",
  "code": "VALIDATION_ERROR"
}
```

409 Conflict - Email already exists:

```json
{
  "success": false,
  "error": "Email already exists",
  "code": "EMAIL_EXISTS"
}
```

---

### 2. Login User

**Endpoint:** `POST /api/auth/login`

**Description:** Login with email and password

**Rate Limit:** 5 attempts per 15 minutes per IP

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "account_type": "free",
      "account_status": "active",
      "last_login_at": "2024-03-23T10:05:00.000Z",
      "user_stats": {
        "level": 1,
        "total_xp": 0,
        "lessons_completed": 0
      }
    }
  }
}
```

**Error Responses:**

401 Unauthorized - Invalid credentials:

```json
{
  "success": false,
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

403 Forbidden - Account banned:

```json
{
  "success": false,
  "error": "Account has been banned",
  "code": "ACCOUNT_BANNED"
}
```

429 Too Many Requests - Rate limit exceeded:

```json
{
  "success": false,
  "error": "Too many login attempts, please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

### 3. Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`

**Description:** Get a new access token using refresh token

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

400 Bad Request - Missing refresh token:

```json
{
  "success": false,
  "error": "Refresh token is required",
  "code": "MISSING_REFRESH_TOKEN"
}
```

401 Unauthorized - Invalid or expired token:

```json
{
  "success": false,
  "error": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

403 Forbidden - User banned:

```json
{
  "success": false,
  "error": "Account has been banned",
  "code": "ACCOUNT_BANNED"
}
```

---

### 4. Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Get current authenticated user information

**Authentication:** Required (Bearer token)

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "account_type": "free",
      "account_status": "active",
      "premium_started_at": null,
      "premium_expires_at": null,
      "last_login_at": "2024-03-23T10:05:00.000Z",
      "created_at": "2024-03-23T10:00:00.000Z",
      "updated_at": "2024-03-23T10:05:00.000Z",
      "user_stats": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "level": 1,
        "total_xp": 0,
        "lessons_completed": 0,
        "total_practice_minutes": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "created_at": "2024-03-23T10:00:00.000Z",
        "updated_at": "2024-03-23T10:00:00.000Z"
      }
    }
  }
}
```

**Error Responses:**

401 Unauthorized - Missing or invalid token:

```json
{
  "success": false,
  "error": "Authorization header missing",
  "code": "NO_AUTH_HEADER"
}
```

404 Not Found - User not found:

```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

---

## Token Information

### Access Token

- **Expiration:** 15 minutes
- **Payload:**
  ```json
  {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "role": "user",
    "iat": 1711188000,
    "exp": 1711188900
  }
  ```

### Refresh Token

- **Expiration:** 7 days
- **Payload:**
  ```json
  {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "role": "user",
    "type": "refresh",
    "iat": 1711188000,
    "exp": 1711792800
  }
  ```

---

## Testing with cURL

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## Testing with Postman

1. **Import Collection**: Create a new collection named "Folkify Auth"

2. **Set Environment Variables**:
   - `base_url`: `http://localhost:3000`
   - `access_token`: (will be set automatically)
   - `refresh_token`: (will be set automatically)

3. **Register Request**:
   - Method: POST
   - URL: `{{base_url}}/api/auth/register`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "password123",
       "fullName": "Test User"
     }
     ```
   - Tests (to save tokens):
     ```javascript
     pm.environment.set('access_token', pm.response.json().data.accessToken);
     pm.environment.set('refresh_token', pm.response.json().data.refreshToken);
     ```

4. **Login Request**:
   - Method: POST
   - URL: `{{base_url}}/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```
   - Tests (to save tokens):
     ```javascript
     pm.environment.set('access_token', pm.response.json().data.accessToken);
     pm.environment.set('refresh_token', pm.response.json().data.refreshToken);
     ```

5. **Get Me Request**:
   - Method: GET
   - URL: `{{base_url}}/api/auth/me`
   - Headers:
     - `Authorization`: `Bearer {{access_token}}`

6. **Refresh Token Request**:
   - Method: POST
   - URL: `{{base_url}}/api/auth/refresh`
   - Body (JSON):
     ```json
     {
       "refreshToken": "{{refresh_token}}"
     }
     ```
   - Tests (to update access token):
     ```javascript
     pm.environment.set('access_token', pm.response.json().data.accessToken);
     ```

---

## Security Notes

1. **Password Security**: All passwords are hashed with bcrypt (salt rounds = 10)
2. **Token Security**: JWT tokens are signed with secret key from environment
3. **Rate Limiting**: Login endpoint is rate-limited to prevent brute force attacks
4. **Sensitive Data**: `password_hash` is never returned in API responses
5. **Banned Users**: Banned users cannot login or refresh tokens
6. **Token Validation**: All protected endpoints validate JWT signature and expiration

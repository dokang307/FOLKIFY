# AI Grading API Endpoints

## Overview

AI grading endpoints allow PRO users to submit audio/video recordings for automated feedback and scoring. The system uses a queue-based architecture for asynchronous processing.

## Base URL

```
http://localhost:3000/api/ai-grading
```

## Authentication

All endpoints require authentication via JWT Bearer token:

```
Authorization: Bearer {accessToken}
```

## Endpoints

### 1. Submit AI Grading

Submit an audio or video file for AI grading.

**Endpoint:** `POST /api/ai-grading/submit`

**Access:** PRO users only

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | Audio (mp3, wav, m4a) or video (mp4, mov, avi) file |
| lessonId | UUID | No | Associated lesson ID |

**File Constraints:**

- Audio files: Maximum 50MB
- Video files: Maximum 200MB
- Allowed types: mp3, wav, m4a, mp4, mov, avi

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "message": "Your submission is being processed"
  }
}
```

**Error Responses:**

_401 Unauthorized - Missing or invalid token_

```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

_403 Forbidden - Not a PRO user_

```json
{
  "success": false,
  "error": "AI grading is only available for PRO users",
  "code": "PRO_REQUIRED"
}
```

_400 Bad Request - No file uploaded_

```json
{
  "success": false,
  "error": "No file uploaded",
  "code": "NO_FILE"
}
```

_400 Bad Request - Invalid file type_

```json
{
  "success": false,
  "error": "Invalid file type. Allowed types: mp3, wav, m4a, mp4, mov, avi",
  "code": "INVALID_FILE_TYPE"
}
```

_400 Bad Request - File too large_

```json
{
  "success": false,
  "error": "Audio file too large. Maximum size: 50MB",
  "code": "FILE_TOO_LARGE"
}
```

**Example (cURL):**

```bash
curl -X POST http://localhost:3000/api/ai-grading/submit \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/recording.mp3" \
  -F "lessonId=550e8400-e29b-41d4-a716-446655440000"
```

**Example (JavaScript/Fetch):**

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('lessonId', 'lesson-uuid');

const response = await fetch('http://localhost:3000/api/ai-grading/submit', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  body: formData,
});

const result = await response.json();
console.log(result.data.sessionId); // Use this to poll for results
```

---

### 2. Get AI Grading Result

Retrieve the result of an AI grading session by ID. Use this endpoint to poll for results after submission.

**Endpoint:** `GET /api/ai-grading/:id`

**Access:** Authenticated users (must own the session)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | AI grading session ID |

**Success Response (200 OK):**

_Pending status:_

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "ai_score": null,
    "criteria_scores": null,
    "ai_feedback": null,
    "improvement_suggestions": null,
    "error_message": null,
    "submitted_at": "2024-01-15T10:30:00.000Z",
    "completed_at": null
  }
}
```

_Processing status:_

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "ai_score": null,
    "criteria_scores": null,
    "ai_feedback": null,
    "improvement_suggestions": null,
    "error_message": null,
    "submitted_at": "2024-01-15T10:30:00.000Z",
    "completed_at": null
  }
}
```

_Completed status:_

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "ai_score": 85,
    "criteria_scores": {
      "rhythm": 80,
      "pitch": 85,
      "technique": 90,
      "expression": 85
    },
    "ai_feedback": "Excellent performance! Your technique and musicality are impressive. Keep up the great work and continue refining your skills.",
    "improvement_suggestions": [
      "Practice with a metronome to improve rhythm accuracy and timing",
      "Continue practicing daily to maintain your skill level"
    ],
    "error_message": null,
    "submitted_at": "2024-01-15T10:30:00.000Z",
    "completed_at": "2024-01-15T10:35:00.000Z"
  }
}
```

_Failed status:_

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "failed",
    "ai_score": null,
    "criteria_scores": null,
    "ai_feedback": null,
    "improvement_suggestions": null,
    "error_message": "Processing failed: Invalid audio format",
    "submitted_at": "2024-01-15T10:30:00.000Z",
    "completed_at": null
  }
}
```

**Error Responses:**

_401 Unauthorized_

```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

_403 Forbidden - Not the owner_

```json
{
  "success": false,
  "error": "You do not have access to this session",
  "code": "ACCESS_DENIED"
}
```

_404 Not Found_

```json
{
  "success": false,
  "error": "AI grading session not found",
  "code": "SESSION_NOT_FOUND"
}
```

**Example (cURL):**

```bash
curl -X GET http://localhost:3000/api/ai-grading/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Example (JavaScript/Fetch with Polling):**

```javascript
async function pollForResult(sessionId, accessToken) {
  const maxAttempts = 30; // Poll for up to 5 minutes (30 * 10 seconds)
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`http://localhost:3000/api/ai-grading/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();

    if (result.data.status === 'completed') {
      return result.data; // Processing complete
    }

    if (result.data.status === 'failed') {
      throw new Error(result.data.error_message);
    }

    // Wait 10 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 10000));
    attempts++;
  }

  throw new Error('Timeout: Processing took too long');
}
```

---

### 3. Get AI Grading History

Retrieve the user's AI grading history with pagination.

**Endpoint:** `GET /api/ai-grading/history`

**Access:** Authenticated users

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number (minimum: 1) |
| limit | integer | 20 | Items per page (maximum: 100) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user-uuid",
      "lesson_id": "lesson-uuid",
      "file_path": "/uploads/ai-grading/user-uuid/file.mp3",
      "status": "completed",
      "ai_score": 85,
      "criteria_scores": {
        "rhythm": 80,
        "pitch": 85,
        "technique": 90,
        "expression": 85
      },
      "ai_feedback": "Good performance!",
      "improvement_suggestions": ["Practice rhythm", "Work on pitch"],
      "error_message": null,
      "submitted_at": "2024-01-15T10:30:00.000Z",
      "completed_at": "2024-01-15T10:35:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "user-uuid",
      "lesson_id": null,
      "file_path": "/uploads/ai-grading/user-uuid/file2.mp3",
      "status": "pending",
      "ai_score": null,
      "criteria_scores": null,
      "ai_feedback": null,
      "improvement_suggestions": null,
      "error_message": null,
      "submitted_at": "2024-01-15T11:00:00.000Z",
      "completed_at": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Error Responses:**

_401 Unauthorized_

```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

_400 Bad Request - Invalid pagination_

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR"
}
```

**Example (cURL):**

```bash
curl -X GET "http://localhost:3000/api/ai-grading/history?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Example (JavaScript/Fetch):**

```javascript
const response = await fetch('http://localhost:3000/api/ai-grading/history?page=1&limit=10', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const result = await response.json();
console.log(`Total sessions: ${result.pagination.total}`);
console.log(`Sessions:`, result.data);
```

---

## Status Flow

AI grading sessions progress through the following statuses:

1. **pending** - Session created, waiting for worker to pick up
2. **processing** - Worker is processing the file
3. **completed** - Processing finished successfully, results available
4. **failed** - Processing failed (after 3 retry attempts)

## Scoring System

The mock AI service generates scores in the following ranges:

- **Overall Score:** 60-95 (average of all criteria)
- **Criteria Scores:**
  - **Rhythm:** 60-95
  - **Pitch:** 60-95
  - **Technique:** 60-95
  - **Expression:** 60-95

## Rate Limiting

All endpoints are subject to rate limiting:

- **Limit:** 100 requests per 15 minutes per IP address
- **Response when exceeded:** 429 Too Many Requests

## Best Practices

### 1. Polling for Results

- Poll every 10-15 seconds to avoid rate limiting
- Implement exponential backoff if needed
- Set a maximum timeout (e.g., 5 minutes)

### 2. File Upload

- Validate file type and size on client side before upload
- Show upload progress to user
- Handle network errors gracefully

### 3. Error Handling

- Always check the `success` field in responses
- Display user-friendly error messages
- Log errors for debugging

### 4. User Experience

- Show loading state while processing
- Display progress indicator during polling
- Cache completed results to avoid unnecessary API calls

## Example: Complete Workflow

```javascript
// 1. Submit file for grading
async function submitForGrading(file, lessonId, accessToken) {
  const formData = new FormData();
  formData.append('file', file);
  if (lessonId) {
    formData.append('lessonId', lessonId);
  }

  const response = await fetch('http://localhost:3000/api/ai-grading/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const result = await response.json();
  return result.data.sessionId;
}

// 2. Poll for results
async function pollForResult(sessionId, accessToken) {
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`http://localhost:3000/api/ai-grading/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();

    if (result.data.status === 'completed') {
      return result.data;
    }

    if (result.data.status === 'failed') {
      throw new Error(result.data.error_message);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
    attempts++;
  }

  throw new Error('Timeout: Processing took too long');
}

// 3. Complete workflow
async function gradePerformance(file, lessonId, accessToken) {
  try {
    // Submit file
    console.log('Submitting file for grading...');
    const sessionId = await submitForGrading(file, lessonId, accessToken);

    // Poll for results
    console.log('Waiting for results...');
    const result = await pollForResult(sessionId, accessToken);

    // Display results
    console.log('Grading complete!');
    console.log(`Overall Score: ${result.ai_score}`);
    console.log('Criteria Scores:', result.criteria_scores);
    console.log('Feedback:', result.ai_feedback);
    console.log('Suggestions:', result.improvement_suggestions);

    return result;
  } catch (error) {
    console.error('Grading failed:', error.message);
    throw error;
  }
}
```

## Notes

- The current implementation uses a mock AI service that generates random scores (60-95) for development purposes
- In production, this would be replaced with a real AI grading service
- Processing typically takes 10-30 seconds depending on file size
- Files are stored locally at `/uploads/ai-grading/{user_id}/{filename}`
- Uploaded files can be accessed via `/uploads/ai-grading/{user_id}/{filename}` (requires authentication)

# Swagger UI Testing Guide

## How to Test the Swagger UI

### 1. Start the Development Server

```bash
cd folkify_BE
npm run dev
```

Wait for the server to start. You should see:

```
Server running on port 3000
FOLKIFY Backend API running on http://localhost:3000
```

### 2. Access Swagger UI

Open your browser and navigate to:

```
http://localhost:3000/api/docs
```

You should see the interactive Swagger UI with:

- FOLKIFY Backend API title
- API description
- List of all endpoints organized by tags
- Schemas section

### 3. Test Authentication Flow

#### Step 1: Register a New User

1. Expand the "Authentication" section
2. Click on "POST /api/auth/register"
3. Click "Try it out"
4. Edit the request body:
   ```json
   {
     "email": "test@example.com",
     "password": "password123",
     "full_name": "Test User"
   }
   ```
5. Click "Execute"
6. You should see a 201 response with:
   - accessToken
   - refreshToken
   - user object

#### Step 2: Authorize with Token

1. Copy the `accessToken` from the response
2. Scroll to the top and click the "Authorize" button (lock icon)
3. Paste the token in the "Value" field
4. Click "Authorize"
5. Click "Close"

Now you're authenticated and can test protected endpoints!

#### Step 3: Test Protected Endpoint

1. Expand "Authentication" section
2. Click on "GET /api/auth/me"
3. Click "Try it out"
4. Click "Execute"
5. You should see a 200 response with your user profile and stats

### 4. Test Other Endpoints

#### Get Instruments (Public)

1. Expand "Instruments" section
2. Click "GET /api/instruments"
3. Click "Try it out"
4. Click "Execute"
5. Should return list of instruments

#### Get Lesson (Protected)

1. Make sure you're authorized (see Step 2)
2. Expand "Lessons" section
3. Click "GET /api/lessons/{id}"
4. Click "Try it out"
5. Enter a lesson ID (get one from database or seed data)
6. Click "Execute"
7. Should return lesson details with access control info

#### Test Premium Plans (Public)

1. Expand "Premium" section
2. Click "GET /api/premium/plans"
3. Click "Try it out"
4. Click "Execute"
5. Should return BASIC and PRO plan details

### 5. Test Error Responses

#### Test 401 Unauthorized

1. Click "Authorize" button
2. Click "Logout"
3. Try any protected endpoint
4. Should return 401 error

#### Test 404 Not Found

1. Try GET /api/lessons/{id} with invalid UUID
2. Should return 404 error

#### Test 403 Forbidden (Premium Required)

1. Login as FREE user
2. Try to access a premium lesson (order_index >= 3)
3. Should return 403 error with "Premium required" message

### 6. Test File Upload (AI Grading)

**Note:** This requires a PRO account. You'll need to:

1. Have admin manually upgrade your account to PRO, OR
2. Use a seeded PRO user from the database

Steps:

1. Make sure you're authorized with a PRO user token
2. Expand "AI Grading" section
3. Click "POST /api/ai-grading/submit"
4. Click "Try it out"
5. Click "Choose File" and select an audio/video file
6. Optionally enter a lesson_id
7. Click "Execute"
8. Should return session_id with status "pending"
9. Copy the session_id
10. Use GET /api/ai-grading/{id} to poll for results

### 7. Test Admin Endpoints

**Note:** Requires admin role. Use seeded admin account.

1. Login with admin credentials
2. Authorize with admin token
3. Expand "Admin - Users" section
4. Try "GET /api/admin/users"
5. Should return list of users with pagination

### 8. Test Health Endpoints (Public)

#### Health Check

1. Expand "Health" section
2. Click "GET /api/health"
3. Click "Try it out"
4. Click "Execute"
5. Should return system health status

#### Metrics

1. Click "GET /api/metrics"
2. Click "Try it out"
3. Click "Execute"
4. Should return system metrics

## Expected Results

### Successful Tests

- ✅ Swagger UI loads at /api/docs
- ✅ All endpoints are visible and organized
- ✅ Can register and login
- ✅ Can authorize with token
- ✅ Protected endpoints work with valid token
- ✅ Public endpoints work without token
- ✅ Error responses are properly formatted
- ✅ Schemas are visible in documentation

### Common Issues

#### Issue: "Failed to fetch"

**Solution:** Make sure the server is running on port 3000

#### Issue: "401 Unauthorized"

**Solution:**

1. Make sure you clicked "Authorize" button
2. Token might be expired (15 minutes) - login again
3. Check token format (should be just the token, no "Bearer" prefix)

#### Issue: "403 Forbidden"

**Solution:**

- For premium content: Need BASIC or PRO account
- For AI grading: Need PRO account
- For admin endpoints: Need admin role

#### Issue: "429 Too Many Requests"

**Solution:** Rate limit exceeded. Wait 15 minutes or restart server.

## Verification Checklist

- [ ] Swagger UI accessible at /api/docs
- [ ] Can register new user
- [ ] Can login existing user
- [ ] Can authorize with token
- [ ] Can access protected endpoints
- [ ] Public endpoints work without auth
- [ ] Error responses are formatted correctly
- [ ] All endpoint categories visible
- [ ] Schemas documentation visible
- [ ] Can test file upload
- [ ] Health check works
- [ ] Metrics endpoint works

## Screenshots to Take (Optional)

1. Swagger UI homepage
2. Authentication section expanded
3. Successful register response
4. Authorize dialog with token
5. Successful protected endpoint call
6. Error response example
7. Schemas section

## Next Steps

After verifying Swagger UI works:

1. Test with Postman collection
2. Share documentation with frontend team
3. Update API_DOCUMENTATION.md if needed
4. Add more examples if needed

## Support

If you encounter issues:

1. Check server logs in terminal
2. Check browser console for errors
3. Verify database is running
4. Verify Redis is running
5. Check .env configuration

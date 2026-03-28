# FOLKIFY Backend API - Quick Start Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

## Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database:**

```bash
# Run the setup script
npm run setup:db

# Or manually:
npx prisma migrate dev
npx prisma db seed
```

## Running the Application

### Development Mode (Recommended)

**Terminal 1 - API Server:**

```bash
npm run dev
```

**Terminal 2 - Queue Workers:**

```bash
npm run dev:worker
```

### Production Mode

**Build:**

```bash
npm run build
```

**Terminal 1 - API Server:**

```bash
npm start
```

**Terminal 2 - Queue Workers:**

```bash
npm run start:worker
```

## Verify Installation

1. **Check server is running:**

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-25T...",
    "uptime": 123.45,
    "database": "connected",
    "redis": "connected",
    "workers": "running"
  }
}
```

2. **Access API documentation:**
   Open browser: http://localhost:3000/api/docs

3. **Test authentication:**

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

## Available Scripts

- `npm run dev` - Start API server in development mode
- `npm run dev:worker` - Start queue workers in development mode
- `npm run build` - Build for production
- `npm start` - Start API server in production mode
- `npm run start:worker` - Start queue workers in production mode
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm run generate:postman` - Generate Postman collection
- `npm run generate:openapi` - Generate OpenAPI spec

## Default Admin Account

After seeding the database:

- **Email:** admin@folkify.com
- **Password:** admin123

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check
- `GET /api/metrics` - Metrics
- `GET /api/docs` - API documentation
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/instruments` - List instruments
- `GET /api/premium/plans` - Premium plans

### Protected Endpoints (Require Authentication)

- `GET /api/auth/me` - Get current user
- `GET /api/lessons/:id` - Get lesson
- `POST /api/lessons/:id/complete` - Complete lesson
- `GET /api/sheets/:id` - Get sheet music
- `POST /api/practice/start` - Start practice session
- `POST /api/ai-grading/submit` - Submit AI grading (PRO only)

### Admin Endpoints (Require Admin Role)

- `GET /api/admin/users` - List users
- `POST /api/admin/users/:id/upgrade` - Upgrade user
- `GET /api/admin/analytics/users` - User statistics
- `GET /api/admin/analytics/revenue` - Revenue statistics

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Error

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run migrations: `npx prisma migrate dev`

### Redis Connection Error

- Verify Redis is running
- Check REDIS_HOST and REDIS_PORT in .env
- Test connection: `redis-cli ping`

### Workers Not Processing Jobs

- Ensure worker process is running: `npm run dev:worker`
- Check Redis connection
- Check worker logs in `logs/` directory

## Project Structure

```
folkify_BE/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── index.ts            # Server entry point
│   ├── worker.ts           # Worker entry point
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── repositories/       # Data access layer
│   ├── middleware/         # Express middleware
│   ├── routes/             # Route definitions
│   ├── workers/            # Queue workers
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
├── uploads/                # Local file storage
├── logs/                   # Application logs
└── dist/                   # Compiled JavaScript
```

## Next Steps

1. **Explore API Documentation:**
   - Visit http://localhost:3000/api/docs
   - Try out endpoints with Swagger UI

2. **Test Premium Features:**
   - Login as admin
   - Upgrade a user to PRO
   - Test AI grading submission

3. **Monitor Application:**
   - Check health: http://localhost:3000/api/health
   - Check metrics: http://localhost:3000/api/metrics
   - View logs: `tail -f logs/combined-*.log`

4. **Run Tests:**
   ```bash
   npm test
   ```

## Support

For issues or questions:

- Check logs in `logs/` directory
- Review API documentation at `/api/docs`
- Check database schema in `prisma/schema.prisma`

Happy coding! 🎵

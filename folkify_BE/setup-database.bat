@echo off
REM Database Setup Script for Folkify Backend API (Windows)
REM This script automates the database setup process

echo Starting Folkify Database Setup...
echo.

REM Check if .env file exists
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo WARNING: Please update the DATABASE_URL in .env file with your PostgreSQL credentials
    echo Example: DATABASE_URL=postgresql://username:password@localhost:5432/folkify_db
    echo.
    pause
    exit /b 1
)

echo .env file found
echo.

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Dependencies installed
echo.

REM Generate Prisma Client
echo Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo Failed to generate Prisma Client
    pause
    exit /b 1
)

echo Prisma Client generated
echo.

REM Run migrations
echo Running database migrations...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo Failed to run migrations
    echo Please check your DATABASE_URL in .env file
    pause
    exit /b 1
)

echo Migrations completed
echo.

REM Seed database
echo Seeding database with sample data...
call npx prisma db seed
if errorlevel 1 (
    echo Failed to seed database
    pause
    exit /b 1
)

echo Database seeded
echo.

echo ========================================
echo Database setup completed successfully!
echo ========================================
echo.
echo Sample data created:
echo   - Admin user: admin@folkify.com / admin123
echo   - 5 instruments with lessons and sheet music
echo   - 40 lessons (3 free + 5 premium per instrument)
echo   - 20 sheet music items
echo.
echo Next steps:
echo   1. Start the development server: npm run dev
echo   2. Open Prisma Studio: npx prisma studio
echo   3. Test the API endpoints
echo.
pause

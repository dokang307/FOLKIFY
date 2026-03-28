@echo off
REM Test Database Setup Script for Windows
REM This script sets up a test database for running integration tests

echo Setting up test database for Folkify Backend API...

REM Check if .env.test exists
if not exist .env.test (
    echo Error: .env.test file not found
    echo Please create .env.test file first
    exit /b 1
)

REM Load DATABASE_URL from .env.test
for /f "tokens=1,2 delims==" %%a in ('findstr /v "^#" .env.test ^| findstr "DATABASE_URL"') do set %%a=%%b

echo Database URL: %DATABASE_URL%

REM Check if PostgreSQL is running
pg_isready >nul 2>&1
if errorlevel 1 (
    echo Error: PostgreSQL is not running
    echo Please start PostgreSQL first
    exit /b 1
)

echo PostgreSQL is running

REM Run migrations
echo Running migrations...
call npx prisma migrate deploy

if errorlevel 1 (
    echo Error: Failed to run migrations
    echo Please check your DATABASE_URL in .env.test
    exit /b 1
)

echo.
echo Test database setup complete!
echo.
echo You can now run tests with: npm test
echo.

pause

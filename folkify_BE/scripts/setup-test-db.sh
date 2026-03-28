#!/bin/bash

# Test Database Setup Script
# This script sets up a test database for running integration tests

set -e

echo "🔧 Setting up test database for Folkify Backend API..."

# Load test environment variables
export $(cat .env.test | grep -v '^#' | xargs)

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')

echo "📊 Database: $DB_NAME"
echo "👤 User: $DB_USER"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

echo "✅ PostgreSQL is running"

# Check if database exists
if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "⚠️  Database $DB_NAME already exists"
    read -p "Do you want to reset it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Resetting database..."
        npx prisma migrate reset --force --skip-seed
    fi
else
    echo "📦 Creating database $DB_NAME..."
    createdb -U $DB_USER $DB_NAME || true
fi

# Run migrations
echo "🔄 Running migrations..."
npx prisma migrate deploy

# Optional: Seed test data
read -p "Do you want to seed test data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding test data..."
    npx prisma db seed
fi

echo "✅ Test database setup complete!"
echo ""
echo "You can now run tests with: npm test"

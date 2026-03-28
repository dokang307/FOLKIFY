#!/bin/bash

# Database Setup Script for Folkify Backend API
# This script automates the database setup process

set -e

echo "🚀 Starting Folkify Database Setup..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update the DATABASE_URL in .env file with your PostgreSQL credentials"
    echo "   Example: DATABASE_URL=postgresql://username:password@localhost:5432/folkify_db"
    exit 1
fi

echo "✅ .env file found"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Dependencies installed"

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "✅ Prisma Client generated"

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

echo "✅ Migrations completed"

# Seed database
echo "🌱 Seeding database with sample data..."
npx prisma db seed

echo "✅ Database seeded"

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "Sample data created:"
echo "  - Admin user: admin@folkify.com / admin123"
echo "  - 5 instruments with lessons and sheet music"
echo "  - 40 lessons (3 free + 5 premium per instrument)"
echo "  - 20 sheet music items"
echo ""
echo "Next steps:"
echo "  1. Start the development server: npm run dev"
echo "  2. Open Prisma Studio: npx prisma studio"
echo "  3. Test the API endpoints"
echo ""

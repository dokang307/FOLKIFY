#!/bin/bash
# Seed script for Supabase database
# This script runs Prisma's seed command to populate the Supabase database
# with initial data including admin user, instruments, lessons, and sheet music.

set -e

echo "========================================="
echo "Seeding Supabase database"
echo "========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo ""
  echo "DATABASE_URL is required for seeding the database."
  echo "It should use port 6543 with PgBouncer for optimal connection pooling."
  echo ""
  echo "Example format:"
  echo "DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
  echo ""
  exit 1
fi

# Validate DATABASE_URL format
if [[ ! "$DATABASE_URL" =~ :6543 ]]; then
  echo "⚠️  Warning: DATABASE_URL should use port 6543 for pooled connection"
  echo "Current DATABASE_URL uses a different port"
  echo ""
fi

if [[ ! "$DATABASE_URL" =~ pgbouncer=true ]]; then
  echo "⚠️  Warning: DATABASE_URL should include pgbouncer=true parameter"
  echo "This ensures optimal connection pooling through Supabase"
  echo ""
fi

echo "✓ DATABASE_URL is set"
echo ""

# Run seed script
echo "Running: npx prisma db seed"
echo ""
echo "This will create:"
echo "  - Admin user (admin@folkify.com)"
echo "  - 5 traditional Vietnamese instruments"
echo "  - 8 lessons per instrument (3 free, 5 premium)"
echo "  - 4 sheet music items per instrument"
echo ""

if npx prisma db seed; then
  echo ""
  echo "========================================="
  echo "✅ Database seeded successfully"
  echo "========================================="
  echo ""
  echo "Default admin credentials:"
  echo "  Email: admin@folkify.com"
  echo "  Password: admin123"
  echo ""
  echo "⚠️  Remember to change the admin password in production!"
  echo ""
  exit 0
else
  echo ""
  echo "========================================="
  echo "❌ Seeding failed"
  echo "========================================="
  echo ""
  echo "Common issues:"
  echo "1. Ensure DATABASE_URL is correctly configured"
  echo "2. Verify database is accessible and migrations are up to date"
  echo "3. Check that seed data doesn't conflict with existing data"
  echo "4. Review error messages above for specific issues"
  echo ""
  echo "Tip: Run migrations first with: bash scripts/migrate.sh"
  echo ""
  exit 1
fi

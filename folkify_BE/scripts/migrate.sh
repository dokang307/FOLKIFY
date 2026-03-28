#!/bin/bash
# Migration script for Supabase
# This script runs Prisma migrations against Supabase using the direct connection
# to bypass PgBouncer, which is required for schema changes.

set -e

echo "========================================="
echo "Running Prisma migrations against Supabase"
echo "========================================="

# Check if DIRECT_URL is set
if [ -z "$DIRECT_URL" ]; then
  echo "❌ Error: DIRECT_URL environment variable is not set"
  echo ""
  echo "DIRECT_URL is required for running migrations against Supabase."
  echo "It should use port 5432 to bypass PgBouncer for schema changes."
  echo ""
  echo "Example format:"
  echo "DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
  echo ""
  exit 1
fi

# Validate DIRECT_URL format
if [[ ! "$DIRECT_URL" =~ :5432 ]]; then
  echo "⚠️  Warning: DIRECT_URL should use port 5432 for direct connection"
  echo "Current DIRECT_URL: $DIRECT_URL"
  echo ""
fi

if [[ "$DIRECT_URL" =~ pgbouncer=true ]]; then
  echo "⚠️  Warning: DIRECT_URL should not include pgbouncer=true parameter"
  echo "Migrations require a direct connection bypassing PgBouncer"
  echo ""
fi

echo "✓ DIRECT_URL is set"
echo ""

# Run migrations using direct connection
echo "Running: npx prisma migrate deploy"
echo ""

if npx prisma migrate deploy; then
  echo ""
  echo "========================================="
  echo "✅ Migrations completed successfully"
  echo "========================================="
  exit 0
else
  echo ""
  echo "========================================="
  echo "❌ Migration failed"
  echo "========================================="
  echo ""
  echo "Common issues:"
  echo "1. Ensure DIRECT_URL uses port 5432 (not 6543)"
  echo "2. Verify database credentials are correct"
  echo "3. Check that database user has schema modification permissions"
  echo "4. Ensure PgBouncer is bypassed (no pgbouncer=true parameter)"
  echo ""
  exit 1
fi

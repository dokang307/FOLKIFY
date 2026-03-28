#!/bin/bash
set -e

# Data Migration Verification Script
# This script compares row counts and constraints between source and target databases

# Configuration
SOURCE_DB="${SOURCE_DB:-postgresql://postgres:password@localhost:5432/folkify_db}"
TARGET_DB="${TARGET_DB:-$DIRECT_URL}"

if [ -z "$TARGET_DB" ]; then
  echo "Error: TARGET_DB or DIRECT_URL environment variable must be set"
  echo "Usage: SOURCE_DB=<source-url> TARGET_DB=<target-url> ./verify-migration.sh"
  exit 1
fi

echo "=========================================="
echo "Data Migration Verification"
echo "=========================================="
echo ""
echo "Source: $SOURCE_DB"
echo "Target: $TARGET_DB"
echo ""

# Function to compare row counts
compare_counts() {
  local table=$1
  echo -n "Checking $table... "
  
  local source_count=$(psql "$SOURCE_DB" -t -c "SELECT COUNT(*) FROM $table" 2>/dev/null || echo "0")
  local target_count=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM $table" 2>/dev/null || echo "0")
  
  source_count=$(echo $source_count | xargs)
  target_count=$(echo $target_count | xargs)
  
  if [ "$source_count" == "$target_count" ]; then
    echo "✓ $source_count rows (match)"
    return 0
  else
    echo "✗ source=$source_count, target=$target_count (MISMATCH)"
    return 1
  fi
}

# Verify all tables
echo "Verifying row counts..."
echo "----------------------------------------"

TABLES=(
  "users"
  "user_stats"
  "instruments"
  "lessons"
  "user_progress"
  "sheet_music"
  "user_purchases"
  "premium_subscriptions"
  "payment_transactions"
  "ai_grading_sessions"
  "practice_sessions"
  "admin_activity_logs"
)

FAILED=0
for table in "${TABLES[@]}"; do
  if ! compare_counts "$table"; then
    FAILED=1
  fi
done

echo ""

if [ $FAILED -eq 1 ]; then
  echo "✗ Row count verification FAILED"
  exit 1
fi

echo "✓ All row counts match"
echo ""

# Verify foreign key constraints
echo "Verifying foreign key constraints..."
echo "----------------------------------------"

psql "$TARGET_DB" -c "
  SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
  FROM pg_constraint
  WHERE contype = 'f'
  ORDER BY conrelid::regclass::text;
" 2>/dev/null

echo ""

# Verify unique constraints
echo "Verifying unique constraints..."
echo "----------------------------------------"

psql "$TARGET_DB" -c "
  SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name
  FROM pg_constraint
  WHERE contype = 'u'
  ORDER BY conrelid::regclass::text;
" 2>/dev/null

echo ""

# Check for NULL values in critical fields
echo "Checking for NULL values in critical fields..."
echo "----------------------------------------"

psql "$TARGET_DB" -c "
  SELECT 'users.email' as field, COUNT(*) as null_count 
  FROM users WHERE email IS NULL
  UNION ALL
  SELECT 'users.password_hash', COUNT(*) FROM users WHERE password_hash IS NULL
  UNION ALL
  SELECT 'instruments.name', COUNT(*) FROM instruments WHERE name IS NULL
  UNION ALL
  SELECT 'lessons.title', COUNT(*) FROM lessons WHERE title IS NULL
  UNION ALL
  SELECT 'sheet_music.title', COUNT(*) FROM sheet_music WHERE title IS NULL;
" 2>/dev/null

echo ""

# Check for orphaned records
echo "Checking for orphaned records..."
echo "----------------------------------------"

psql "$TARGET_DB" -c "
  SELECT 'lessons (orphaned from instruments)' as check_name, COUNT(*) as orphaned_count
  FROM lessons l
  LEFT JOIN instruments i ON l.instrument_id = i.id
  WHERE i.id IS NULL
  UNION ALL
  SELECT 'user_progress (orphaned from users)', COUNT(*)
  FROM user_progress up
  LEFT JOIN users u ON up.user_id = u.id
  WHERE u.id IS NULL
  UNION ALL
  SELECT 'user_progress (orphaned from lessons)', COUNT(*)
  FROM user_progress up
  LEFT JOIN lessons l ON up.lesson_id = l.id
  WHERE l.id IS NULL;
" 2>/dev/null

echo ""
echo "=========================================="
echo "✓ Migration verification completed!"
echo "=========================================="

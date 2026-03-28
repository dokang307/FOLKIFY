# Database Setup Guide

This guide will help you set up the Supabase PostgreSQL database for the Folkify Backend API.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier available at https://supabase.com)

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in (or create a free account)
2. Click "New Project" in your organization
3. Fill in the project details:
   - **Project Name**: Choose a name (e.g., "folkify-backend")
   - **Database Password**: Set a strong password (save this securely!)
   - **Region**: Choose the region closest to your users (e.g., "US East (North Virginia)")
   - **Pricing Plan**: Select "Free" for development or "Pro" for production
4. Click "Create new project" and wait for provisioning (1-2 minutes)

## Step 2: Obtain Supabase Credentials

Once your project is ready, gather the following credentials from the Supabase dashboard:

### Project Settings

Navigate to **Settings** → **General** to find:

- **Project ID**: Found in the "Reference ID" field (e.g., `fjaqliowdfxdwpfmjldr`)
- **Project URL**: Your project's API URL (e.g., `https://fjaqliowdfxdwpfmjldr.supabase.co`)

### API Keys

Navigate to **Settings** → **API** to find:

- **anon/public key**: Used for client-side requests (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Database Connection Strings

Navigate to **Settings** → **Database** to find your connection strings:

**Important**: Supabase provides two types of connection strings:

1. **Connection pooling (Port 6543)** - For application runtime queries
   - Uses PgBouncer for efficient connection pooling
   - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **Use this for**: Normal application queries, API requests

2. **Direct connection (Port 5432)** - For migrations and schema changes
   - Bypasses PgBouncer to allow schema modifications
   - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
   - **Use this for**: Prisma migrations, database schema changes

**Why two connection strings?**

PgBouncer (the connection pooler) operates in "transaction mode" which doesn't support certain PostgreSQL features needed for migrations (like prepared statements and advisory locks). Therefore:

- **Pooled connection (6543)**: Fast, efficient, handles high concurrency
- **Direct connection (5432)**: Full PostgreSQL features, required for schema changes

## Step 3: Configure Environment Variables

Update the `folkify_BE/.env` file with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_PROJECT_ID=your_project_reference_id
SUPABASE_PROJECT_URL=https://your_project_reference_id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Database Configuration - Pooled Connection (Runtime)
# Uses PgBouncer on port 6543 for connection pooling
# Replace [YOUR-PASSWORD] with your database password
DATABASE_URL=postgresql://postgres.your_project_reference_id:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Database Configuration - Direct Connection (Migrations)
# Bypasses PgBouncer on port 5432 for schema changes
# Replace [YOUR-PASSWORD] with your database password
DIRECT_URL=postgresql://postgres.your_project_reference_id:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Important Notes:**

- Replace `your_project_reference_id` with your actual Supabase project reference ID
- Replace `[YOUR-PASSWORD]` with your database password (set during project creation)
- Replace `us-east-1` with your project's region if different
- Both `DATABASE_URL` and `DIRECT_URL` use the same password
- The pooled connection (DATABASE_URL) must include `?pgbouncer=true`
- The direct connection (DIRECT_URL) should NOT include the pgbouncer parameter

**Example with actual values:**

```env
SUPABASE_PROJECT_ID=fjaqliowdfxdwpfmjldr
SUPABASE_PROJECT_URL=https://fjaqliowdfxdwpfmjldr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqYXFsaW93ZGZ4ZHdwZm1qbGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg3NjU0MzIsImV4cCI6MjAxNDM0MTQzMn0.abc123...

DATABASE_URL=postgresql://postgres.fjaqliowdfxdwpfmjldr:MySecurePass123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres.fjaqliowdfxdwpfmjldr:MySecurePass123!@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

## Step 4: Run Prisma Migrations

Navigate to the folkify_BE directory and run:

```bash
cd folkify_BE

# Generate Prisma Client
npx prisma generate

# Run migrations to create tables in Supabase
# This uses the DIRECT_URL connection (port 5432)
npx prisma migrate deploy

# Seed the database with sample data
npx prisma db seed
```

**Note**: We use `prisma migrate deploy` instead of `prisma migrate dev` for Supabase because:

- `migrate deploy` applies existing migrations without creating new ones
- It's designed for production/hosted databases
- It uses the `DIRECT_URL` connection to bypass PgBouncer

If you need to create a new migration during development:

```bash
# Create a new migration (uses DIRECT_URL)
npx prisma migrate dev --name your_migration_name
```

### Using Migration and Seed Scripts

For convenience, we provide shell scripts that automate the migration and seeding process with built-in validation and error handling.

#### Running Migrations with the Migration Script

The `scripts/migrate.sh` script provides a robust way to run migrations with automatic validation:

```bash
# Make the script executable (first time only)
chmod +x scripts/migrate.sh

# Run migrations
bash scripts/migrate.sh
```

**What the migration script does:**

1. Validates that `DIRECT_URL` environment variable is set
2. Checks that the connection uses port 5432 (direct connection)
3. Warns if `pgbouncer=true` parameter is present (should not be used for migrations)
4. Runs `npx prisma migrate deploy` to apply all pending migrations
5. Provides clear error messages if migration fails

**When to use the migration script:**

- Initial database setup on a new Supabase project
- Deploying schema changes to production
- Updating database schema after pulling new migrations
- CI/CD pipeline database setup

**Example output:**

```
=========================================
Running Prisma migrations against Supabase
=========================================
✓ DIRECT_URL is set

Running: npx prisma migrate deploy

Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres"

5 migrations found in prisma/migrations

Applying migration `20240101000000_init`
Applying migration `20240102000000_add_instruments`
...

=========================================
✅ Migrations completed successfully
=========================================
```

#### Seeding the Database with the Seed Script

The `scripts/seed-supabase.sh` script provides a robust way to seed the database:

```bash
# Make the script executable (first time only)
chmod +x scripts/seed-supabase.sh

# Run seeding
bash scripts/seed-supabase.sh
```

**What the seed script does:**

1. Validates that `DATABASE_URL` environment variable is set
2. Checks that the connection uses port 6543 (pooled connection)
3. Warns if `pgbouncer=true` parameter is missing
4. Runs `npx prisma db seed` to populate the database
5. Displays what data will be created
6. Shows default admin credentials after successful seeding

**When to use the seed script:**

- Initial database setup with sample data
- Development environment setup
- Testing with realistic data
- Resetting database to a known state

**Example output:**

```
=========================================
Seeding Supabase database
=========================================
✓ DATABASE_URL is set

Running: npx prisma db seed

This will create:
  - Admin user (admin@folkify.com)
  - 5 traditional Vietnamese instruments
  - 8 lessons per instrument (3 free, 5 premium)
  - 4 sheet music items per instrument

Running seed command...
🌱 Seeding database...
✓ Created admin user
✓ Created 5 instruments
✓ Created 40 lessons
✓ Created 20 sheet music items

=========================================
✅ Database seeded successfully
=========================================

Default admin credentials:
  Email: admin@folkify.com
  Password: admin123

⚠️  Remember to change the admin password in production!
```

#### Script Permissions

If you encounter permission errors when running the scripts, make them executable:

```bash
# Make both scripts executable
chmod +x scripts/migrate.sh scripts/seed-supabase.sh

# Or make all scripts in the directory executable
chmod +x scripts/*.sh
```

On Windows, you can run the scripts using Git Bash or WSL:

```bash
# Using Git Bash
bash scripts/migrate.sh
bash scripts/seed-supabase.sh

# Or use the Windows-compatible commands directly
npx prisma migrate deploy
npx prisma db seed
```

## Step 5: Verify Setup

Check if the database was set up correctly:

### Option 1: Prisma Studio

```bash
# Open Prisma Studio to view your data
npx prisma studio
```

This will open a browser window at http://localhost:5555 where you can view all your tables and data.

### Option 2: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** in the left sidebar
3. You should see all your tables (User, Instrument, Lesson, SheetMusic, etc.)
4. Click on any table to view its data

### Option 3: Test Database Connection

```bash
# Test the connection with a simple query
npx prisma db execute --stdin <<< "SELECT 1 as test;"
```

If successful, you should see output indicating the query executed.

## Sample Data Included

After seeding, your database will contain:

### Admin User

- **Email:** admin@folkify.com
- **Password:** admin123
- **Role:** admin
- **Account Type:** pro

### Instruments (5 total)

1. Đàn Tranh (Vietnamese Zither)
2. Sáo Trúc (Bamboo Flute)
3. Đàn Bầu (Monochord)
4. Đàn Nguyệt (Moon Lute)
5. Đàn Nhị (Two-String Fiddle)

### Lessons

- 3 free lessons per instrument (Beginner level)
- 5 premium lessons per instrument (Intermediate to Advanced)
- Total: 40 lessons

### Sheet Music

- 4 sheet music items per instrument
- 2 free, 2 premium per instrument
- Total: 20 sheet music items

## Troubleshooting

### Connection Error: "Can't reach database server"

If you get a connection error:

1. **Verify your connection strings**: Check that DATABASE_URL and DIRECT_URL are correctly formatted
2. **Check your password**: Ensure the password in the connection string matches your Supabase database password
3. **Verify project status**: Go to your Supabase dashboard and ensure the project is active (not paused)
4. **Check region**: Ensure the region in your connection string matches your project's region
5. **Network issues**: Verify your internet connection and that port 6543/5432 aren't blocked by firewall

### Connection Error: "P1001: Can't reach database server"

This Prisma error usually means:

- Incorrect connection string format
- Wrong password or project reference ID
- Supabase project is paused (free tier projects pause after inactivity)
- Network/firewall blocking the connection

**Solution**: Go to your Supabase dashboard and click "Restore" if the project is paused.

### Migration Errors: "prepared statement already exists"

This error occurs when using the pooled connection (port 6543) for migrations.

**Solution**: Ensure your `prisma/schema.prisma` includes the `directUrl` configuration:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

And verify that `DIRECT_URL` uses port 5432 without the `pgbouncer=true` parameter.

### Migration Errors: "permission denied for schema public"

This means the database user doesn't have sufficient permissions.

**Solution**: In Supabase, the default `postgres` user should have all permissions. If you created a custom user, grant permissions:

1. Go to **SQL Editor** in Supabase dashboard
2. Run:
   ```sql
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
   ```

### Migration Errors: "DIRECT_URL environment variable is not set"

This error occurs when running the migration script without the DIRECT_URL configured.

**Solution**:

1. Ensure your `.env` file includes the DIRECT_URL variable
2. Verify the DIRECT_URL uses port 5432 (direct connection)
3. Check that the `.env` file is in the correct directory (folkify_BE/)
4. Restart your terminal or reload environment variables

**Example DIRECT_URL:**

```bash
DIRECT_URL=postgresql://postgres.your_project_ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Migration Errors: "Migration failed with exit code 1"

This generic error can have multiple causes:

**Common causes and solutions:**

1. **Schema conflicts**: Existing tables or constraints conflict with migration
   - Solution: Check Supabase Table Editor for conflicting objects
   - Drop conflicting tables or run `npx prisma migrate reset` (WARNING: deletes all data)

2. **Network timeout**: Migration took too long and connection timed out
   - Solution: Check your internet connection and retry
   - Consider running migrations from a server closer to your Supabase region

3. **Invalid SQL in migration**: Migration file contains syntax errors
   - Solution: Review the migration file in `prisma/migrations/`
   - Fix SQL syntax errors or regenerate the migration

4. **Database locked**: Another process is modifying the schema
   - Solution: Wait for other operations to complete and retry
   - Check Supabase dashboard for active connections

### Seed Errors: "Unique constraint violation"

This error occurs when trying to seed data that already exists in the database.

**Solution**:

1. **Check existing data**: Use Prisma Studio or Supabase Table Editor to view existing records
2. **Clear existing data**: Delete conflicting records before seeding
3. **Reset database**: Run `npx prisma migrate reset` to start fresh (WARNING: deletes all data)
4. **Modify seed script**: Update `prisma/seed.ts` to handle existing data gracefully

**Example: Handling existing data in seed script**

```typescript
// Check if admin user already exists
const existingAdmin = await prisma.user.findUnique({
  where: { email: 'admin@folkify.com' }
});

if (!existingAdmin) {
  await prisma.user.create({
    data: { email: 'admin@folkify.com', ... }
  });
} else {
  console.log('Admin user already exists, skipping...');
}
```

### Seed Errors: "Foreign key constraint violation"

This error occurs when seed data references non-existent related records.

**Solution**:

1. **Check migration status**: Ensure all migrations have been applied

   ```bash
   npx prisma migrate status
   ```

2. **Verify table structure**: Check that all required tables exist in Supabase
3. **Review seed order**: Ensure seed script creates parent records before child records
4. **Check for missing data**: Verify all referenced IDs exist in the database

**Correct seed order:**

```typescript
// 1. Create independent entities first
const instruments = await createInstruments();

// 2. Create entities that depend on instruments
const lessons = await createLessons(instruments);

// 3. Create entities that depend on lessons
const progress = await createProgress(lessons);
```

### Seed Errors: "DATABASE_URL environment variable is not set"

This error occurs when running the seed script without DATABASE_URL configured.

**Solution**:

1. Ensure your `.env` file includes the DATABASE_URL variable
2. Verify the DATABASE_URL uses port 6543 (pooled connection)
3. Check that the `.env` file is in the correct directory (folkify_BE/)
4. Restart your terminal or reload environment variables

**Example DATABASE_URL:**

```bash
DATABASE_URL=postgresql://postgres.your_project_ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Script Permission Errors (Linux/Mac)

If you get "Permission denied" when running shell scripts:

**Solution**:

```bash
# Make scripts executable
chmod +x scripts/migrate.sh
chmod +x scripts/seed-supabase.sh

# Or make all scripts executable at once
chmod +x scripts/*.sh
```

### Script Errors on Windows

If shell scripts don't run on Windows:

**Solution**:

1. **Use Git Bash**: Install Git for Windows and run scripts in Git Bash

   ```bash
   bash scripts/migrate.sh
   bash scripts/seed-supabase.sh
   ```

2. **Use WSL**: Install Windows Subsystem for Linux and run scripts there

   ```bash
   wsl bash scripts/migrate.sh
   ```

3. **Run commands directly**: Skip the scripts and run Prisma commands directly
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Prisma Client Not Generated

If you get errors about missing Prisma Client:

**Solution**:

```bash
# Generate Prisma Client
npx prisma generate

# Verify generation was successful
ls node_modules/.prisma/client
```

### Slow Migration or Seed Performance

If migrations or seeding take too long:

**Causes and solutions:**

1. **Network latency**: Your location is far from Supabase region
   - Solution: Choose a Supabase region closer to you
   - Consider using a VPN or proxy closer to the region

2. **Large seed data**: Seed script creates too many records
   - Solution: Reduce the amount of seed data for development
   - Use batch operations instead of individual inserts

3. **Missing indexes**: Database lacks proper indexes for queries
   - Solution: Add indexes to frequently queried columns
   - Review slow query logs in Supabase dashboard

4. **Connection pooling issues**: Using wrong connection type
   - Solution: Use pooled connection (port 6543) for seeding
   - Use direct connection (port 5432) only for migrations

### Connection Pool Exhausted

If you see "connection pool timeout" errors:

1. **Check active connections**: Go to Supabase dashboard → **Database** → **Connection pooling**
2. **Review connection limits**: Free tier has limits on concurrent connections
3. **Optimize queries**: Ensure you're properly closing database connections
4. **Consider upgrading**: Pro tier offers more connections

### Slow Query Performance

If queries are slower than expected:

1. **Check database location**: Ensure your Supabase region is close to your application server
2. **Review indexes**: Add indexes for frequently queried columns
3. **Monitor in Supabase**: Use **Database** → **Query Performance** to identify slow queries
4. **Connection pooling**: Verify you're using the pooled connection (port 6543) for queries

## Reset Database

To completely reset your Supabase database:

```bash
# Reset database (WARNING: This will delete all data!)
npx prisma migrate reset

# This will:
# 1. Drop all tables and data
# 2. Recreate the database schema
# 3. Run all migrations
# 4. Run the seed script
```

**Alternative**: Reset via Supabase Dashboard

1. Go to **SQL Editor** in your Supabase dashboard
2. Run this SQL to drop all tables:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```
3. Then run migrations again: `npx prisma migrate deploy`

## Data Migration from Local PostgreSQL

If you have existing data in a local PostgreSQL database that you want to migrate to Supabase:

### Export from Local PostgreSQL

```bash
# Export schema and data
pg_dump -U your_user -d folkify_db -F c -f folkify_backup.dump

# Or export as SQL file
pg_dump -U your_user -d folkify_db > folkify_backup.sql
```

### Import to Supabase

**Option 1: Using pg_restore (for .dump files)**

```bash
# Get your Supabase direct connection string (port 5432)
# Then restore the backup
pg_restore -d "postgresql://postgres.your_project_ref:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres" -c folkify_backup.dump
```

**Option 2: Using psql (for .sql files)**

```bash
# Import SQL file
psql "postgresql://postgres.your_project_ref:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres" < folkify_backup.sql
```

**Option 3: Using Supabase Dashboard**

1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste your SQL export
3. Click "Run" to execute

### Verify Data Migration

After importing, verify your data:

```bash
# Check row counts
npx prisma studio

# Or run verification queries in Supabase SQL Editor
SELECT 'users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'instruments', COUNT(*) FROM "Instrument"
UNION ALL
SELECT 'lessons', COUNT(*) FROM "Lesson";
```

## Next Steps

After setting up the database:

1. Start the development server: `npm run dev`
2. Test the API endpoints
3. Check the logs for any errors
4. Monitor database usage in Supabase dashboard

## Supabase Dashboard Features

Take advantage of these Supabase features:

- **Table Editor**: View and edit data directly in the browser
- **SQL Editor**: Run custom SQL queries
- **Database Backups**: Configure automatic backups (Pro tier)
- **Query Performance**: Monitor slow queries and optimize
- **Connection Pooling**: View active connections and pool status
- **Logs**: View database logs for debugging

## Connection String Quick Reference

**For application runtime (queries):**

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**For migrations (schema changes):**

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

**Key differences:**

- Runtime uses port **6543** with `?pgbouncer=true`
- Migrations use port **5432** without pgbouncer parameter
- Both use the same password and project reference

For more information, see the main README.md file and DEPLOYMENT.md for production setup.

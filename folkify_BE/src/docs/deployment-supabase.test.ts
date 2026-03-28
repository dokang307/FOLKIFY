import fs from 'fs';
import path from 'path';

/**
 * Unit tests for DEPLOYMENT.md documentation
 * Validates that Supabase deployment documentation is complete
 *
 * Task 8: Update DEPLOYMENT.md documentation
 * - Sub-task 8.1: Add Supabase deployment section (COMPLETED)
 * - Sub-task 8.2: Add monitoring and rollback procedures (COMPLETED)
 * - Sub-task 8.3: Document data migration strategy (COMPLETED)
 */

describe('DEPLOYMENT.md - Supabase Documentation', () => {
  const deploymentPath = path.join(__dirname, '../../DEPLOYMENT.md');
  let deploymentContent: string;

  // Read the file once before all tests
  try {
    deploymentContent = fs.readFileSync(deploymentPath, 'utf-8');
  } catch (error) {
    deploymentContent = '';
  }

  describe('File Existence', () => {
    it('should have DEPLOYMENT.md file', () => {
      expect(fs.existsSync(deploymentPath)).toBe(true);
    });

    it('should not be empty', () => {
      expect(deploymentContent.length).toBeGreaterThan(0);
    });
  });

  describe('Sub-task 8.1: Supabase Deployment Section', () => {
    it('should have Supabase Database Deployment section', () => {
      expect(deploymentContent).toContain('## Supabase Database Deployment');
    });

    it('should document how to obtain Supabase credentials', () => {
      expect(deploymentContent).toContain('Obtaining Supabase Credentials');
      expect(deploymentContent).toContain('Create a Supabase Project');
      expect(deploymentContent).toContain('Get Connection Strings');
      expect(deploymentContent).toContain('Get API Keys');
    });

    it('should document connection string formats', () => {
      expect(deploymentContent).toContain('Connection String Format');
      expect(deploymentContent).toContain('Pooled Connection (Runtime Queries)');
      expect(deploymentContent).toContain('Direct Connection (Migrations)');
      expect(deploymentContent).toContain('port 6543');
      expect(deploymentContent).toContain('port 5432');
      expect(deploymentContent).toContain('pgbouncer=true');
    });

    it('should document connection pooling best practices', () => {
      expect(deploymentContent).toContain('Connection Pooling Best Practices');
      expect(deploymentContent).toContain('PgBouncer');
      expect(deploymentContent).toMatch(/connection.*pool/i);
    });

    it('should document monitoring database connections', () => {
      expect(deploymentContent).toContain('Monitoring Database Connections');
      expect(deploymentContent).toContain('Supabase Dashboard');
      expect(deploymentContent).toContain('Connection Metrics');
    });

    it('should document Supabase maintenance windows', () => {
      expect(deploymentContent).toContain('Supabase Maintenance Windows');
      expect(deploymentContent).toContain('Handling Maintenance');
    });

    it('should document security considerations', () => {
      expect(deploymentContent).toContain('Security Considerations');
      expect(deploymentContent).toContain('Database Access');
      expect(deploymentContent).toContain('DIRECT_URL');
    });

    it('should document troubleshooting Supabase connections', () => {
      expect(deploymentContent).toContain('Troubleshooting Supabase Connections');
      expect(deploymentContent).toContain('Connection Timeout');
      expect(deploymentContent).toContain('Migration Failures');
      expect(deploymentContent).toContain('Pool Exhaustion');
    });

    it('should remove references to self-hosted PostgreSQL', () => {
      // Should not have instructions for installing local PostgreSQL in main deployment section
      const supabaseSection =
        deploymentContent.split('## Supabase Database Deployment')[1]?.split('##')[0] || '';
      expect(supabaseSection).not.toContain('Install PostgreSQL');
      expect(supabaseSection).not.toContain('postgresql://localhost');
    });
  });

  describe('Sub-task 8.2: Monitoring and Rollback Procedures', () => {
    it('should have comprehensive rollback procedures section', () => {
      expect(deploymentContent).toContain('Rollback Procedures');
    });

    it('should document database schema rollback', () => {
      expect(deploymentContent).toContain('Database Schema Rollback');
      expect(deploymentContent).toContain('Using Supabase Dashboard Backups');
      expect(deploymentContent).toContain('Using Prisma Migration Rollback');
      expect(deploymentContent).toContain('Using Manual SQL Rollback');
    });

    it('should document application rollback', () => {
      expect(deploymentContent).toContain('Application Rollback');
      expect(deploymentContent).toContain('Docker Deployment Rollback');
      expect(deploymentContent).toContain('docker-compose down');
      expect(deploymentContent).toContain('git checkout');
    });

    it('should document environment configuration rollback', () => {
      expect(deploymentContent).toContain('Environment Configuration Rollback');
      expect(deploymentContent).toContain('.env.backup');
    });

    it('should document data rollback procedures', () => {
      expect(deploymentContent).toContain('Data Rollback');
      expect(deploymentContent).toContain('pg_dump');
      expect(deploymentContent).toContain('Point-in-Time Recovery');
    });

    it('should document verification after rollback', () => {
      expect(deploymentContent).toContain('Verification After Rollback');
      expect(deploymentContent).toContain('Health Check');
      expect(deploymentContent).toContain('Database Connection Test');
      expect(deploymentContent).toContain('API Endpoint Test');
    });

    it('should have rollback decision matrix', () => {
      expect(deploymentContent).toContain('Rollback Decision Matrix');
      expect(deploymentContent).toMatch(/Issue Type.*Severity.*Recommended Action/s);
    });

    it('should document post-rollback actions', () => {
      expect(deploymentContent).toContain('Post-Rollback Actions');
      expect(deploymentContent).toContain('Document the issue');
      expect(deploymentContent).toContain('Notify stakeholders');
      expect(deploymentContent).toContain('Investigate root cause');
    });

    it('should have emergency rollback checklist', () => {
      expect(deploymentContent).toContain('Emergency Rollback Checklist');
      expect(deploymentContent).toMatch(/\[ \].*Stop accepting new traffic/);
      expect(deploymentContent).toMatch(/\[ \].*Notify team/);
    });

    it('should document monitoring in Supabase dashboard', () => {
      expect(deploymentContent).toContain('Monitoring Database Connections');
      expect(deploymentContent).toContain('Supabase Dashboard');
      expect(deploymentContent).toContain('Connection Pooling');
      expect(deploymentContent).toContain('active connections');
    });

    it('should document performance monitoring', () => {
      expect(deploymentContent).toContain('Performance Monitoring');
      expect(deploymentContent).toContain('Query performance');
      expect(deploymentContent).toContain('Slow queries');
    });
  });

  describe('Sub-task 8.3: Data Migration Strategy', () => {
    it('should have data migration strategy section', () => {
      expect(deploymentContent).toContain('## Data Migration Strategy');
    });

    it('should have pre-migration checklist', () => {
      expect(deploymentContent).toContain('Pre-Migration Checklist');
      expect(deploymentContent).toMatch(/\[ \].*Supabase project is created/);
      expect(deploymentContent).toMatch(/\[ \].*Backup of source database/);
    });

    it('should document migration approaches', () => {
      expect(deploymentContent).toContain('Migration Approaches');
      expect(deploymentContent).toContain('Zero-Downtime Migration');
      expect(deploymentContent).toContain('Maintenance Window Migration');
    });

    it('should document data export process', () => {
      expect(deploymentContent).toContain('pg_dump');
      expect(deploymentContent).toContain('Export data from local PostgreSQL');
    });

    it('should document data import process', () => {
      expect(deploymentContent).toContain('Import data to Supabase');
      expect(deploymentContent).toContain('psql');
    });

    it('should document data verification steps', () => {
      expect(deploymentContent).toContain('Data Verification');
      expect(deploymentContent).toContain('verify-migration.sh');
      expect(deploymentContent).toContain('compare row counts');
    });

    it('should document handling large databases', () => {
      expect(deploymentContent).toContain('Handling Large Databases');
      expect(deploymentContent).toContain('Parallel Export/Import');
      expect(deploymentContent).toContain('Table-by-Table Migration');
    });

    it('should document troubleshooting migration issues', () => {
      expect(deploymentContent).toContain('Troubleshooting Migration Issues');
      expect(deploymentContent).toContain('Permission Errors');
      expect(deploymentContent).toContain('Constraint Violations');
      expect(deploymentContent).toContain('Sequence Out of Sync');
    });

    it('should document post-migration validation', () => {
      expect(deploymentContent).toContain('Post-Migration Validation');
      expect(deploymentContent).toContain('Data Integrity Checks');
      expect(deploymentContent).toContain('Application Testing');
      expect(deploymentContent).toContain('Performance Testing');
    });

    it('should document migration rollback', () => {
      expect(deploymentContent).toContain('Migration Rollback');
      expect(deploymentContent).toContain('Quick Rollback');
    });

    it('should have migration checklist', () => {
      expect(deploymentContent).toContain('Migration Checklist');
      expect(deploymentContent).toMatch(/\[ \].*Pre-Migration/);
      expect(deploymentContent).toMatch(/\[ \].*Migration/);
      expect(deploymentContent).toMatch(/\[ \].*Verification/);
      expect(deploymentContent).toMatch(/\[ \].*Post-Migration/);
    });

    it('should document pg_dump and pg_restore usage', () => {
      expect(deploymentContent).toContain('pg_dump');
      expect(deploymentContent).toContain('pg_restore');
    });

    it('should document data integrity preservation', () => {
      expect(deploymentContent).toContain('foreign key');
      expect(deploymentContent).toContain('unique constraint');
      expect(deploymentContent).toContain('Data Integrity');
    });
  });

  describe('Environment Variables', () => {
    it('should document DATABASE_URL for pooled connection', () => {
      expect(deploymentContent).toContain('DATABASE_URL');
      expect(deploymentContent).toMatch(/DATABASE_URL.*6543.*pgbouncer=true/s);
    });

    it('should document DIRECT_URL for migrations', () => {
      expect(deploymentContent).toContain('DIRECT_URL');
      expect(deploymentContent).toMatch(/DIRECT_URL.*5432/s);
    });

    it('should document Supabase environment variables', () => {
      expect(deploymentContent).toContain('SUPABASE_PROJECT_ID');
      expect(deploymentContent).toContain('SUPABASE_PROJECT_URL');
      expect(deploymentContent).toContain('SUPABASE_ANON_KEY');
    });
  });

  describe('Docker Configuration', () => {
    it('should document that PostgreSQL is not in Docker Compose', () => {
      expect(deploymentContent).toContain('PostgreSQL is hosted on Supabase');
      expect(deploymentContent).toMatch(/not included in Docker Compose/i);
    });

    it('should document Redis service is kept', () => {
      expect(deploymentContent).toContain('redis');
      expect(deploymentContent).toMatch(/Redis.*cache.*queue/i);
    });
  });

  describe('Production Deployment', () => {
    it('should have production deployment section', () => {
      expect(deploymentContent).toContain('## Production Deployment');
    });

    it('should have pre-deployment checklist', () => {
      expect(deploymentContent).toContain('Pre-Deployment Checklist');
      expect(deploymentContent).toMatch(/\[ \].*Create Supabase project/);
      expect(deploymentContent).toMatch(/\[ \].*Configure.*DATABASE_URL/);
    });

    it('should document production environment variables', () => {
      expect(deploymentContent).toContain('Production Environment Variables');
      expect(deploymentContent).toContain('NODE_ENV=production');
    });
  });

  describe('Backup and Restore', () => {
    it('should have backup and restore section', () => {
      expect(deploymentContent).toContain('Backup & Restore');
    });

    it('should document Supabase automatic backups', () => {
      expect(deploymentContent).toContain('Supabase provides automatic daily backups');
      expect(deploymentContent).toContain('Supabase Dashboard Backups');
    });

    it('should document manual backup procedures', () => {
      expect(deploymentContent).toContain('Manual backup');
      expect(deploymentContent).toContain('pg_dump');
    });
  });
});

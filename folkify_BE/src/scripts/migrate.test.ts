import fs from 'fs';
import path from 'path';

/**
 * Tests for the Supabase migration script
 * Validates: Requirements 5.3 - Migration script creation and validation
 */
describe('Supabase Migration Script', () => {
  const scriptPath = path.join(__dirname, '../../scripts/migrate.sh');

  it('should exist in the scripts directory', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('should have bash shebang', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content.startsWith('#!/bin/bash')).toBe(true);
  });

  it('should check for DIRECT_URL environment variable', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('if [ -z "$DIRECT_URL" ]');
    expect(content).toContain('DIRECT_URL environment variable is not set');
  });

  it('should validate DIRECT_URL uses port 5432', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain(':5432');
    expect(content).toContain('DIRECT_URL should use port 5432');
  });

  it('should warn if pgbouncer parameter is present in DIRECT_URL', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('pgbouncer=true');
    expect(content).toContain('DIRECT_URL should not include pgbouncer=true parameter');
  });

  it('should run prisma migrate deploy command', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('npx prisma migrate deploy');
  });

  it('should have error handling with exit codes', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('exit 1');
    expect(content).toContain('exit 0');
  });

  it('should provide helpful error messages', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('Common issues:');
    expect(content).toContain('Ensure DIRECT_URL uses port 5432');
    expect(content).toContain('Verify database credentials are correct');
    expect(content).toContain('Check that database user has schema modification permissions');
  });

  it('should have logging for migration progress', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('Running Prisma migrations against Supabase');
    expect(content).toContain('Migrations completed successfully');
    expect(content).toContain('Migration failed');
  });

  it('should use set -e for error handling', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('set -e');
  });
});

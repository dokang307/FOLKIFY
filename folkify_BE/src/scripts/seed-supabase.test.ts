import * as fs from 'fs';
import * as path from 'path';

describe('Seed Supabase Script', () => {
  const scriptPath = path.join(__dirname, '../../scripts/seed-supabase.sh');

  it('should exist', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('should have bash shebang', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content.startsWith('#!/bin/bash')).toBe(true);
  });

  it('should check for DATABASE_URL environment variable', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('if [ -z "$DATABASE_URL" ]');
    expect(content).toContain('DATABASE_URL environment variable is not set');
  });

  it('should validate DATABASE_URL format for port 6543', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain(':6543');
    expect(content).toContain('should use port 6543 for pooled connection');
  });

  it('should validate pgbouncer=true parameter', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('pgbouncer=true');
    expect(content).toContain('should include pgbouncer=true parameter');
  });

  it('should run npx prisma db seed command', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('npx prisma db seed');
  });

  it('should have error handling with exit codes', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('exit 0'); // Success case
    expect(content).toContain('exit 1'); // Error cases
  });

  it('should provide helpful error messages', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('Common issues:');
    expect(content).toContain('Ensure DATABASE_URL is correctly configured');
    expect(content).toContain('Run migrations first');
  });

  it('should display what data will be created', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('Admin user');
    expect(content).toContain('instruments');
    expect(content).toContain('lessons');
    expect(content).toContain('sheet music');
  });

  it('should display admin credentials after successful seed', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('admin@folkify.com');
    expect(content).toContain('admin123');
    expect(content).toContain('Remember to change the admin password');
  });

  it('should use set -e for error handling', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('set -e');
  });

  it('should have consistent formatting with migrate.sh', () => {
    const migrateScriptPath = path.join(__dirname, '../../scripts/migrate.sh');
    const seedContent = fs.readFileSync(scriptPath, 'utf8');
    const migrateContent = fs.readFileSync(migrateScriptPath, 'utf8');

    // Both should use similar structure
    expect(seedContent).toContain('=========================================');
    expect(migrateContent).toContain('=========================================');

    // Both should use emoji for status
    expect(seedContent).toContain('✅');
    expect(seedContent).toContain('❌');
    expect(migrateContent).toContain('✅');
    expect(migrateContent).toContain('❌');
  });
});

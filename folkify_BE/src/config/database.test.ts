import { validateSupabaseConfig } from './database';
import logger from '../utils/logger';

// Mock logger to prevent console output during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('validateSupabaseConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Required Environment Variables', () => {
    it('should throw error if DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      process.env.DIRECT_URL = 'postgresql://localhost:5432/db';

      expect(() => validateSupabaseConfig()).toThrow(
        'DATABASE_URL environment variable is required for Supabase connection'
      );
    });

    it('should throw error if DIRECT_URL is missing', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:6543/db?pgbouncer=true';
      delete process.env.DIRECT_URL;

      expect(() => validateSupabaseConfig()).toThrow(
        'DIRECT_URL environment variable is required for Prisma migrations'
      );
    });

    it('should throw error if DATABASE_URL is empty string', () => {
      process.env.DATABASE_URL = '';
      process.env.DIRECT_URL = 'postgresql://localhost:5432/db';

      expect(() => validateSupabaseConfig()).toThrow(
        'DATABASE_URL environment variable is required for Supabase connection'
      );
    });

    it('should throw error if DIRECT_URL is empty string', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:6543/db?pgbouncer=true';
      process.env.DIRECT_URL = '';

      expect(() => validateSupabaseConfig()).toThrow(
        'DIRECT_URL environment variable is required for Prisma migrations'
      );
    });
  });

  describe('Connection String Format Validation', () => {
    it('should throw error if DATABASE_URL is not a PostgreSQL connection string', () => {
      process.env.DATABASE_URL = 'mysql://localhost:3306/db';
      process.env.DIRECT_URL = 'postgresql://localhost:5432/db';

      expect(() => validateSupabaseConfig()).toThrow(
        'DATABASE_URL must be a valid PostgreSQL connection string'
      );
    });

    it('should throw error if DIRECT_URL is not a PostgreSQL connection string', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:6543/db?pgbouncer=true';
      process.env.DIRECT_URL = 'mysql://localhost:3306/db';

      expect(() => validateSupabaseConfig()).toThrow(
        'DIRECT_URL must be a valid PostgreSQL connection string'
      );
    });

    it('should accept valid PostgreSQL connection strings', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:6543/db?pgbouncer=true';
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db';

      expect(() => validateSupabaseConfig()).not.toThrow();
      expect(logger.info).toHaveBeenCalledWith('Supabase configuration validated successfully');
    });
  });

  describe('PgBouncer Parameter Warnings', () => {
    it('should warn if DATABASE_URL does not include pgbouncer=true', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:6543/db';
      process.env.DIRECT_URL = 'postgresql://localhost:5432/db';

      validateSupabaseConfig();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('DATABASE_URL should include pgbouncer=true parameter')
      );
    });

    it('should warn if DIRECT_URL includes pgbouncer parameter', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:6543/db?pgbouncer=true';
      process.env.DIRECT_URL = 'postgresql://localhost:5432/db?pgbouncer=true';

      validateSupabaseConfig();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('DIRECT_URL should not include pgbouncer parameter')
      );
    });

    it('should not warn when pgbouncer parameters are correct', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:6543/db?pgbouncer=true';
      process.env.DIRECT_URL = 'postgresql://localhost:5432/db';

      validateSupabaseConfig();

      expect(logger.warn).not.toHaveBeenCalledWith(expect.stringContaining('pgbouncer'));
    });
  });

  describe('Port Configuration Warnings', () => {
    it('should warn if DATABASE_URL uses port 5432', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db?pgbouncer=true';
      process.env.DIRECT_URL = 'postgresql://localhost:5432/db';

      validateSupabaseConfig();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('DATABASE_URL appears to use port 5432')
      );
    });

    it('should warn if DIRECT_URL uses port 6543', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:6543/db?pgbouncer=true';
      process.env.DIRECT_URL = 'postgresql://localhost:6543/db';

      validateSupabaseConfig();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('DIRECT_URL appears to use port 6543')
      );
    });

    it('should not warn when ports are correct', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:6543/db?pgbouncer=true';
      process.env.DIRECT_URL = 'postgresql://localhost:5432/db';

      validateSupabaseConfig();

      // Should only have the success info log, no warnings
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Supabase configuration validated successfully');
    });
  });

  describe('Supabase Connection String Format', () => {
    it('should validate correct Supabase pooled connection string', () => {
      process.env.DATABASE_URL =
        'postgresql://postgres.fjaqliowdfxdwpfmjldr:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
      process.env.DIRECT_URL =
        'postgresql://postgres.fjaqliowdfxdwpfmjldr:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

      expect(() => validateSupabaseConfig()).not.toThrow();
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Supabase configuration validated successfully');
    });

    it('should validate Supabase connection string with different regions', () => {
      process.env.DATABASE_URL =
        'postgresql://postgres.abc123:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
      process.env.DIRECT_URL =
        'postgresql://postgres.abc123:password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

      expect(() => validateSupabaseConfig()).not.toThrow();
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Warnings', () => {
    it('should emit multiple warnings when multiple issues are detected', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.DIRECT_URL = 'postgresql://localhost:6543/db?pgbouncer=true';

      validateSupabaseConfig();

      // Should warn about DATABASE_URL missing pgbouncer
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('DATABASE_URL should include pgbouncer=true parameter')
      );

      // Should warn about DATABASE_URL using wrong port
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('DATABASE_URL appears to use port 5432')
      );

      // Should warn about DIRECT_URL having pgbouncer
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('DIRECT_URL should not include pgbouncer parameter')
      );

      // Should warn about DIRECT_URL using wrong port
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('DIRECT_URL appears to use port 6543')
      );

      // Should still log success
      expect(logger.info).toHaveBeenCalledWith('Supabase configuration validated successfully');
    });
  });
});

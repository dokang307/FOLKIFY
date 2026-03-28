import { validateEnv } from './env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should validate valid environment variables', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      PORT: '3000',
      API_BASE_URL: 'http://localhost:3000',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      DIRECT_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes-12345',
      JWT_ACCESS_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION: '7d',
      FRONTEND_URL: 'http://localhost:5173',
      UPLOAD_DIR: './uploads',
      MAX_AUDIO_SIZE: '52428800',
      MAX_VIDEO_SIZE: '209715200',
      EMAIL_MODE: 'console',
      LOG_LEVEL: 'info',
      LOG_DIR: './logs',
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX_REQUESTS: '100',
      AUTH_RATE_LIMIT_MAX_REQUESTS: '5',
      CACHE_TTL_INSTRUMENTS: '1800',
      CACHE_TTL_LESSONS: '600',
      CACHE_TTL_SHEETS: '1800',
      CACHE_TTL_ANALYTICS: '300',
      PREMIUM_EXPIRATION_CRON: '0 0 * * *',
      QUEUE_RETRY_ATTEMPTS: '3',
      QUEUE_RETRY_DELAY: '2000',
    };

    const config = validateEnv();

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.DATABASE_URL).toBe('postgresql://user:password@localhost:5432/folkify_db');
    expect(config.DIRECT_URL).toBe('postgresql://user:password@localhost:5432/folkify_db');
    expect(config.JWT_SECRET).toBe('this-is-a-very-long-secret-key-for-testing-purposes-12345');
  });

  it('should throw error when DATABASE_URL is missing', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: '',
      DIRECT_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes-12345',
    };

    expect(() => validateEnv()).toThrow('Environment validation failed');
  });

  it('should throw error when DIRECT_URL is missing', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      DIRECT_URL: '',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes-12345',
    };

    expect(() => validateEnv()).toThrow('DIRECT_URL is required for Prisma migrations');
  });

  it('should throw error when JWT_SECRET is too short', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      DIRECT_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      JWT_SECRET: 'short',
    };

    expect(() => validateEnv()).toThrow('JWT_SECRET must be at least 32 characters');
  });

  it('should use default values for optional fields', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      DIRECT_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes-12345',
    };

    const config = validateEnv();

    expect(config.NODE_ENV).toBe('test');
    expect(config.PORT).toBe(3000);
    expect(config.REDIS_HOST).toBe('localhost');
    expect(config.REDIS_PORT).toBe(6379);
    expect(config.LOG_LEVEL).toBe('error'); // Updated to match .env.test
  });

  it('should transform string numbers to integers', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      DIRECT_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes-12345',
      PORT: '4000',
      REDIS_PORT: '6380',
      MAX_AUDIO_SIZE: '10000000',
    };

    const config = validateEnv();

    expect(config.PORT).toBe(4000);
    expect(config.REDIS_PORT).toBe(6380);
    expect(config.MAX_AUDIO_SIZE).toBe(10000000);
  });

  it('should validate NODE_ENV enum values', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'invalid',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      DIRECT_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes-12345',
    };

    expect(() => validateEnv()).toThrow();
  });

  it('should validate EMAIL_MODE enum values', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      DIRECT_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes-12345',
      EMAIL_MODE: 'invalid',
    };

    expect(() => validateEnv()).toThrow();
  });

  it('should validate URL formats', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      DIRECT_URL: 'postgresql://user:password@localhost:5432/folkify_db',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes-12345',
      API_BASE_URL: 'not-a-url',
    };

    expect(() => validateEnv()).toThrow();
  });

  it('should validate Supabase connection strings', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL:
        'postgresql://postgres.fjaqliowdfxdwpfmjldr:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
      DIRECT_URL:
        'postgresql://postgres.fjaqliowdfxdwpfmjldr:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
      JWT_SECRET: 'this-is-a-very-long-secret-key-for-testing-purposes-12345',
    };

    const config = validateEnv();

    expect(config.DATABASE_URL).toContain('pgbouncer=true');
    expect(config.DATABASE_URL).toContain(':6543');
    expect(config.DIRECT_URL).toContain(':5432');
    expect(config.DIRECT_URL).not.toContain('pgbouncer');
  });
});

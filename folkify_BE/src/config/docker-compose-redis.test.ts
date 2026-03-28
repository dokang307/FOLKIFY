/**
 * Docker Compose Redis Service Verification Test
 * Validates: Requirements 4.5
 *
 * This test verifies that the Redis service configuration remains intact
 * after PostgreSQL removal during Supabase migration.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Docker Compose Redis Service Configuration', () => {
  const dockerComposePath = path.join(__dirname, '..', '..', 'docker-compose.yml');
  let dockerComposeContent: string;

  beforeAll(() => {
    expect(fs.existsSync(dockerComposePath)).toBe(true);
    dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf-8');
    expect(dockerComposeContent).toBeDefined();
  });

  it('should load docker-compose.yml file', () => {
    expect(dockerComposeContent.length).toBeGreaterThan(0);
  });

  it('should have Redis service defined', () => {
    expect(dockerComposeContent).toContain('redis:');
    expect(dockerComposeContent).toMatch(/^\s+redis:/m);
  });

  it('should use correct Redis image', () => {
    expect(dockerComposeContent).toContain('image: redis:7-alpine');
  });

  it('should have correct container name', () => {
    expect(dockerComposeContent).toContain('container_name: folkify-redis');
  });

  it('should have restart policy configured', () => {
    expect(dockerComposeContent).toContain('restart: unless-stopped');
  });

  it('should have Redis command with appendonly and password support', () => {
    expect(dockerComposeContent).toContain('redis-server');
    expect(dockerComposeContent).toContain('--appendonly yes');
    expect(dockerComposeContent).toContain('--requirepass');
  });

  it('should expose Redis port 6379', () => {
    expect(dockerComposeContent).toMatch(/\$\{REDIS_PORT:-6379\}:6379/);
  });

  it('should have volume for data persistence', () => {
    expect(dockerComposeContent).toContain('redis_data:/data');
  });

  it('should have health check configured', () => {
    expect(dockerComposeContent).toContain('healthcheck:');
    expect(dockerComposeContent).toContain('redis-cli');
    expect(dockerComposeContent).toContain('ping');
    expect(dockerComposeContent).toMatch(/interval:\s*10s/);
    expect(dockerComposeContent).toMatch(/timeout:\s*5s/);
    expect(dockerComposeContent).toMatch(/retries:\s*5/);
    expect(dockerComposeContent).toMatch(/start_period:\s*10s/);
  });

  it('should be connected to folkify-network', () => {
    // Check Redis service has networks section
    const redisServiceMatch = dockerComposeContent.match(/redis:[\s\S]*?(?=\n  \w+:|$)/);
    expect(redisServiceMatch).toBeTruthy();
    if (redisServiceMatch) {
      expect(redisServiceMatch[0]).toContain('folkify-network');
    }
  });

  it('should have redis_data volume defined', () => {
    expect(dockerComposeContent).toContain('redis_data:');
    expect(dockerComposeContent).toMatch(/redis_data:[\s\S]*?driver:\s*local/);
  });

  it('should NOT have PostgreSQL service', () => {
    expect(dockerComposeContent).not.toMatch(/^\s+postgres:/m);
    expect(dockerComposeContent).not.toMatch(/^\s+db:/m);
    expect(dockerComposeContent).not.toMatch(/^\s+postgresql:/m);
  });

  it('should NOT have PostgreSQL volumes', () => {
    expect(dockerComposeContent).not.toContain('postgres_data:');
    expect(dockerComposeContent).not.toContain('db_data:');
    expect(dockerComposeContent).not.toContain('postgresql_data:');
  });

  it('should have API service depending on Redis', () => {
    const apiServiceMatch = dockerComposeContent.match(/api:[\s\S]*?(?=\n  \w+:|$)/);
    expect(apiServiceMatch).toBeTruthy();
    if (apiServiceMatch) {
      expect(apiServiceMatch[0]).toContain('depends_on:');
      expect(apiServiceMatch[0]).toContain('redis:');
      expect(apiServiceMatch[0]).toContain('condition: service_healthy');
    }
  });

  it('should have Worker service depending on Redis', () => {
    const workerServiceMatch = dockerComposeContent.match(/worker:[\s\S]*?(?=\n  \w+:|$)/);
    expect(workerServiceMatch).toBeTruthy();
    if (workerServiceMatch) {
      expect(workerServiceMatch[0]).toContain('depends_on:');
      expect(workerServiceMatch[0]).toContain('redis:');
      expect(workerServiceMatch[0]).toContain('condition: service_healthy');
    }
  });

  it('should have API service with Redis environment variables', () => {
    const apiServiceMatch = dockerComposeContent.match(/api:[\s\S]*?(?=\n  \w+:|$)/);
    expect(apiServiceMatch).toBeTruthy();
    if (apiServiceMatch) {
      expect(apiServiceMatch[0]).toContain('REDIS_HOST: redis');
      expect(apiServiceMatch[0]).toContain('REDIS_PORT: 6379');
      expect(apiServiceMatch[0]).toContain('REDIS_PASSWORD:');
    }
  });

  it('should have Worker service with Redis environment variables', () => {
    const workerServiceMatch = dockerComposeContent.match(/worker:[\s\S]*?(?=\n  \w+:|$)/);
    expect(workerServiceMatch).toBeTruthy();
    if (workerServiceMatch) {
      expect(workerServiceMatch[0]).toContain('REDIS_HOST: redis');
      expect(workerServiceMatch[0]).toContain('REDIS_PORT: 6379');
      expect(workerServiceMatch[0]).toContain('REDIS_PASSWORD:');
    }
  });

  it('should have comment indicating Supabase migration update', () => {
    expect(dockerComposeContent).toContain('Supabase database migration');
    expect(dockerComposeContent).toContain('Requirement 4.1, 4.4');
  });
});

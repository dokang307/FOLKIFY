import * as fs from 'fs';
import * as path from 'path';

/**
 * Property 5: Railway Configuration Completeness
 *
 * For any Railway service configuration file (railway.json), it should contain
 * all required fields: build.buildCommand, deploy.startCommand, and for API
 * services additionally deploy.healthcheckPath, deploy.healthcheckTimeout,
 * and deploy.restartPolicyType.
 *
 * Validates: Requirements 2.2, 2.4, 2.5, 2.7, 2.8, 10.3, 10.4, 10.5
 */

describe('Property 5: Railway Configuration Completeness', () => {
  const railwayConfigPath = path.join(__dirname, '../../railway.json');
  let railwayConfig: any;

  beforeEach(() => {
    if (fs.existsSync(railwayConfigPath)) {
      const content = fs.readFileSync(railwayConfigPath, 'utf-8');
      railwayConfig = JSON.parse(content);
    }
  });

  it('should have a railway.json configuration file', () => {
    expect(fs.existsSync(railwayConfigPath)).toBe(true);
  });

  describe('when railway.json exists', () => {
    it('should have build.buildCommand', () => {
      expect(railwayConfig.build).toBeDefined();
      expect(railwayConfig.build.buildCommand).toBeDefined();
      expect(typeof railwayConfig.build.buildCommand).toBe('string');
    });

    it('should have deploy.startCommand', () => {
      expect(railwayConfig.deploy).toBeDefined();
      expect(railwayConfig.deploy.startCommand).toBeDefined();
      expect(typeof railwayConfig.deploy.startCommand).toBe('string');
    });

    it('should have deploy.healthcheckPath for API service', () => {
      expect(railwayConfig.deploy.healthcheckPath).toBeDefined();
      expect(typeof railwayConfig.deploy.healthcheckPath).toBe('string');
      expect(railwayConfig.deploy.healthcheckPath).toMatch(/^\/api\//);
    });

    it('should have deploy.healthcheckTimeout', () => {
      expect(railwayConfig.deploy.healthcheckTimeout).toBeDefined();
      expect(typeof railwayConfig.deploy.healthcheckTimeout).toBe('number');
      expect(railwayConfig.deploy.healthcheckTimeout).toBeGreaterThan(0);
    });

    it('should have deploy.restartPolicyType', () => {
      expect(railwayConfig.deploy.restartPolicyType).toBeDefined();
      expect(typeof railwayConfig.deploy.restartPolicyType).toBe('string');
      expect(['ON_FAILURE', 'ALWAYS', 'NEVER']).toContain(railwayConfig.deploy.restartPolicyType);
    });
  });
});

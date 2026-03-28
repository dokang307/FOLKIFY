import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

/**
 * Property 10: CI Pipeline Configuration Completeness
 *
 * For any GitHub Actions CI workflow file (when automated testing is enabled),
 * it should include all required steps: test execution, linting checks,
 * TypeScript compilation verification, and conditional deployment prevention
 * on test failure.
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

describe('Property 10: CI Pipeline Configuration Completeness', () => {
  const ciFilePath = path.join(__dirname, '../../.github/workflows/ci.yml');

  it('should have a CI workflow file', () => {
    expect(fs.existsSync(ciFilePath)).toBe(true);
  });

  describe('when CI workflow exists', () => {
    let ciConfig: any;

    beforeEach(() => {
      if (fs.existsSync(ciFilePath)) {
        const ciContent = fs.readFileSync(ciFilePath, 'utf-8');
        ciConfig = yaml.parse(ciContent);
      }
    });

    it('should trigger on pull requests', () => {
      expect(ciConfig.on).toBeDefined();
      expect(ciConfig.on.pull_request).toBeDefined();
    });

    it('should trigger on pushes to main branch', () => {
      expect(ciConfig.on).toBeDefined();
      expect(ciConfig.on.push).toBeDefined();
      expect(ciConfig.on.push.branches).toContain('main');
    });

    it('should have a test job', () => {
      expect(ciConfig.jobs).toBeDefined();
      expect(ciConfig.jobs.test).toBeDefined();
    });

    it('should have a lint job', () => {
      expect(ciConfig.jobs).toBeDefined();
      expect(ciConfig.jobs.lint).toBeDefined();
    });

    it('should have a build job for TypeScript compilation', () => {
      expect(ciConfig.jobs).toBeDefined();
      expect(ciConfig.jobs.build).toBeDefined();
    });

    it('should run tests with npm test command', () => {
      const testJob = ciConfig.jobs.test;
      expect(testJob).toBeDefined();

      const testStep = testJob.steps.find(
        (step: any) => step.name?.includes('test') || step.run?.includes('npm test')
      );

      expect(testStep).toBeDefined();
      expect(testStep.run).toContain('npm test');
    });

    it('should run linting with npm run lint command', () => {
      const lintJob = ciConfig.jobs.lint;
      expect(lintJob).toBeDefined();

      const lintStep = lintJob.steps.find(
        (step: any) => step.name?.includes('lint') || step.run?.includes('npm run lint')
      );

      expect(lintStep).toBeDefined();
      expect(lintStep.run).toContain('npm run lint');
    });

    it('should run TypeScript compilation with npm run build command', () => {
      const buildJob = ciConfig.jobs.build;
      expect(buildJob).toBeDefined();

      const buildStep = buildJob.steps.find(
        (step: any) => step.name?.includes('Build') || step.run?.includes('npm run build')
      );

      expect(buildStep).toBeDefined();
      expect(buildStep.run).toContain('npm run build');
    });

    it('should have deployment gate that depends on test, lint, and build jobs', () => {
      const deploymentGate = ciConfig.jobs['deployment-gate'];
      expect(deploymentGate).toBeDefined();
      expect(deploymentGate.needs).toBeDefined();
      expect(deploymentGate.needs).toContain('test');
      expect(deploymentGate.needs).toContain('lint');
      expect(deploymentGate.needs).toContain('build');
    });

    it('should prevent deployment on test failure', () => {
      const deploymentGate = ciConfig.jobs['deployment-gate'];
      expect(deploymentGate).toBeDefined();

      // Should only run if previous jobs failed
      expect(deploymentGate.if).toBeDefined();
      expect(deploymentGate.if).toContain('failure()');

      // Should exit with error code
      const preventStep = deploymentGate.steps.find((step: any) => step.run?.includes('exit 1'));
      expect(preventStep).toBeDefined();
    });

    it('should use Node.js 20.x', () => {
      const jobs = Object.values(ciConfig.jobs);

      jobs.forEach((job: any) => {
        const nodeSetupStep = job.steps?.find((step: any) => step.uses?.includes('setup-node'));

        if (nodeSetupStep) {
          expect(nodeSetupStep.with['node-version']).toBe('20.x');
        }
      });
    });

    it('should setup PostgreSQL service for tests', () => {
      const testJob = ciConfig.jobs.test;
      expect(testJob.services).toBeDefined();
      expect(testJob.services.postgres).toBeDefined();
      expect(testJob.services.postgres.image).toContain('postgres');
    });

    it('should setup Redis service for tests', () => {
      const testJob = ciConfig.jobs.test;
      expect(testJob.services).toBeDefined();
      expect(testJob.services.redis).toBeDefined();
      expect(testJob.services.redis.image).toContain('redis');
    });

    it('should generate Prisma client before running tests', () => {
      const testJob = ciConfig.jobs.test;
      const prismaStep = testJob.steps.find((step: any) => step.run?.includes('prisma generate'));

      expect(prismaStep).toBeDefined();
    });

    it('should run database migrations before tests', () => {
      const testJob = ciConfig.jobs.test;
      const migrationStep = testJob.steps.find((step: any) => step.run?.includes('prisma migrate'));

      expect(migrationStep).toBeDefined();
    });

    it('should set required environment variables for tests', () => {
      const testJob = ciConfig.jobs.test;
      const testStep = testJob.steps.find((step: any) => step.run?.includes('npm test'));

      expect(testStep).toBeDefined();
      expect(testStep.env).toBeDefined();
      expect(testStep.env.DATABASE_URL).toBeDefined();
      expect(testStep.env.REDIS_HOST).toBeDefined();
      expect(testStep.env.JWT_SECRET).toBeDefined();
    });

    it('should use npm ci for dependency installation', () => {
      const jobs = Object.values(ciConfig.jobs);

      jobs.forEach((job: any) => {
        const installStep = job.steps?.find((step: any) => step.run?.includes('npm'));

        if (installStep && installStep.name?.includes('Install')) {
          expect(installStep.run).toContain('npm ci');
        }
      });
    });

    it('should cache npm dependencies', () => {
      const jobs = Object.values(ciConfig.jobs);

      jobs.forEach((job: any) => {
        const nodeSetupStep = job.steps?.find((step: any) => step.uses?.includes('setup-node'));

        if (nodeSetupStep) {
          expect(nodeSetupStep.with.cache).toBe('npm');
        }
      });
    });
  });
});

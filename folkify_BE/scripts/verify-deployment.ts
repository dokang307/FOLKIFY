#!/usr/bin/env ts-node

/**
 * Deployment Verification Script
 *
 * This script verifies that a deployed instance of the FOLKIFY API is functioning correctly.
 * It tests:
 * - Health check endpoint
 * - Database connectivity
 * - Redis connectivity
 * - API endpoint smoke tests
 *
 * Usage:
 *   ts-node scripts/verify-deployment.ts <API_URL>
 *
 * Example:
 *   ts-node scripts/verify-deployment.ts https://folkify-api.railway.app
 *   ts-node scripts/verify-deployment.ts http://localhost:3000
 */

import axios, { AxiosError } from 'axios';

// Node.js globals
declare const process: {
  argv: string[];
  exit: (code: number) => never;
};
declare const require: {
  main: any;
};
declare const module: {
  [key: string]: any;
};

interface VerificationResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration?: number;
  details?: any;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services?: {
    database?: string;
    redis?: string;
  };
  uptime?: number;
  version?: string;
}

class DeploymentVerifier {
  private apiUrl: string;
  private results: VerificationResult[] = [];
  private startTime: number = 0;

  constructor(apiUrl: string) {
    // Remove trailing slash
    this.apiUrl = apiUrl.replace(/\/$/, '');
  }

  /**
   * Run all verification tests
   */
  async verify(): Promise<boolean> {
    console.log('='.repeat(80));
    console.log('FOLKIFY API Deployment Verification');
    console.log('='.repeat(80));
    console.log(`Target: ${this.apiUrl}`);
    console.log(`Started: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
    console.log('');

    // Run all tests
    await this.testHealthCheck();
    await this.testDatabaseConnectivity();
    await this.testRedisConnectivity();
    await this.testAPIEndpoints();

    // Print results
    this.printResults();

    // Return overall status
    const allPassed = this.results.every((r) => r.status === 'PASS');
    return allPassed;
  }

  /**
   * Test 1: Health Check Endpoint
   * Validates: Requirements 8.3
   */
  private async testHealthCheck(): Promise<void> {
    const testName = 'Health Check Endpoint';
    console.log(`\n[TEST] ${testName}`);

    const startTime = Date.now();

    try {
      const response = await axios.get<HealthCheckResponse>(`${this.apiUrl}/api/health`, {
        timeout: 10000,
        validateStatus: () => true, // Don't throw on any status
      });

      const duration = Date.now() - startTime;

      if (response.status === 200) {
        const data = response.data;

        // Validate response structure
        if (data.status === 'healthy' && data.timestamp) {
          this.addResult({
            name: testName,
            status: 'PASS',
            message: `Health check returned 200 OK with healthy status`,
            duration,
            details: {
              status: data.status,
              uptime: data.uptime,
              version: data.version,
              services: data.services,
            },
          });
          console.log(`  ✓ Status: ${response.status}`);
          console.log(`  ✓ Health: ${data.status}`);
          console.log(`  ✓ Duration: ${duration}ms`);
        } else {
          this.addResult({
            name: testName,
            status: 'FAIL',
            message: `Health check returned 200 but invalid response structure`,
            duration,
            details: data,
          });
          console.log(`  ✗ Invalid response structure`);
        }
      } else {
        this.addResult({
          name: testName,
          status: 'FAIL',
          message: `Health check returned ${response.status} instead of 200`,
          duration,
          details: response.data,
        });
        console.log(`  ✗ Status: ${response.status}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = this.getErrorMessage(error);

      this.addResult({
        name: testName,
        status: 'FAIL',
        message: `Health check failed: ${message}`,
        duration,
      });
      console.log(`  ✗ Error: ${message}`);
    }
  }

  /**
   * Test 2: Database Connectivity
   * Validates: Requirements 8.4
   */
  private async testDatabaseConnectivity(): Promise<void> {
    const testName = 'Database Connectivity';
    console.log(`\n[TEST] ${testName}`);

    const startTime = Date.now();

    try {
      const response = await axios.get<HealthCheckResponse>(`${this.apiUrl}/api/health`, {
        timeout: 10000,
      });

      const duration = Date.now() - startTime;
      const dbStatus = response.data.services?.database;

      if (dbStatus === 'healthy') {
        this.addResult({
          name: testName,
          status: 'PASS',
          message: 'Database connectivity verified through health check',
          duration,
        });
        console.log(`  ✓ Database: ${dbStatus}`);
      } else {
        this.addResult({
          name: testName,
          status: 'FAIL',
          message: `Database status: ${dbStatus || 'unknown'}`,
          duration,
        });
        console.log(`  ✗ Database: ${dbStatus || 'unknown'}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = this.getErrorMessage(error);

      this.addResult({
        name: testName,
        status: 'FAIL',
        message: `Database connectivity test failed: ${message}`,
        duration,
      });
      console.log(`  ✗ Error: ${message}`);
    }
  }

  /**
   * Test 3: Redis Connectivity
   * Validates: Requirements 8.5
   */
  private async testRedisConnectivity(): Promise<void> {
    const testName = 'Redis Connectivity';
    console.log(`\n[TEST] ${testName}`);

    const startTime = Date.now();

    try {
      const response = await axios.get<HealthCheckResponse>(`${this.apiUrl}/api/health`, {
        timeout: 10000,
      });

      const duration = Date.now() - startTime;
      const redisStatus = response.data.services?.redis;

      if (redisStatus === 'healthy') {
        this.addResult({
          name: testName,
          status: 'PASS',
          message: 'Redis connectivity verified through health check',
          duration,
        });
        console.log(`  ✓ Redis: ${redisStatus}`);
      } else {
        this.addResult({
          name: testName,
          status: 'FAIL',
          message: `Redis status: ${redisStatus || 'unknown'}`,
          duration,
        });
        console.log(`  ✗ Redis: ${redisStatus || 'unknown'}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = this.getErrorMessage(error);

      this.addResult({
        name: testName,
        status: 'FAIL',
        message: `Redis connectivity test failed: ${message}`,
        duration,
      });
      console.log(`  ✗ Error: ${message}`);
    }
  }

  /**
   * Test 4: API Endpoint Smoke Tests
   * Validates: Requirements 8.6
   */
  private async testAPIEndpoints(): Promise<void> {
    console.log(`\n[TEST] API Endpoint Smoke Tests`);

    // Test public endpoints that don't require authentication
    await this.testEndpoint('GET /api/instruments', '/api/instruments');
    await this.testEndpoint('GET /api/lessons', '/api/lessons');
    await this.testEndpoint('GET /api/sheets', '/api/sheets');

    // Test authentication endpoint (should return 400 for missing credentials, not 500)
    await this.testAuthEndpoint('POST /api/auth/login', '/api/auth/login');
  }

  /**
   * Test a single API endpoint
   */
  private async testEndpoint(name: string, path: string): Promise<void> {
    const startTime = Date.now();

    try {
      const response = await axios.get(`${this.apiUrl}${path}`, {
        timeout: 10000,
        validateStatus: (status) => status < 500, // Accept any status < 500
      });

      const duration = Date.now() - startTime;

      if (response.status >= 200 && response.status < 400) {
        this.addResult({
          name,
          status: 'PASS',
          message: `Endpoint returned ${response.status}`,
          duration,
        });
        console.log(`  ✓ ${name}: ${response.status} (${duration}ms)`);
      } else {
        this.addResult({
          name,
          status: 'FAIL',
          message: `Endpoint returned ${response.status}`,
          duration,
        });
        console.log(`  ✗ ${name}: ${response.status} (${duration}ms)`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = this.getErrorMessage(error);

      this.addResult({
        name,
        status: 'FAIL',
        message: `Endpoint failed: ${message}`,
        duration,
      });
      console.log(`  ✗ ${name}: ${message} (${duration}ms)`);
    }
  }

  /**
   * Test authentication endpoint (expects 400 for missing credentials)
   */
  private async testAuthEndpoint(name: string, path: string): Promise<void> {
    const startTime = Date.now();

    try {
      const response = await axios.post(
        `${this.apiUrl}${path}`,
        {},
        {
          timeout: 10000,
          validateStatus: () => true, // Don't throw on any status
        }
      );

      const duration = Date.now() - startTime;

      // Auth endpoint should return 400 for missing credentials, not 500
      if (response.status === 400 || response.status === 422) {
        this.addResult({
          name,
          status: 'PASS',
          message: `Auth endpoint correctly validates input (${response.status})`,
          duration,
        });
        console.log(`  ✓ ${name}: ${response.status} (${duration}ms)`);
      } else if (response.status >= 500) {
        this.addResult({
          name,
          status: 'FAIL',
          message: `Auth endpoint returned server error ${response.status}`,
          duration,
        });
        console.log(`  ✗ ${name}: ${response.status} (${duration}ms)`);
      } else {
        this.addResult({
          name,
          status: 'PASS',
          message: `Auth endpoint returned ${response.status}`,
          duration,
        });
        console.log(`  ✓ ${name}: ${response.status} (${duration}ms)`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = this.getErrorMessage(error);

      this.addResult({
        name,
        status: 'FAIL',
        message: `Auth endpoint failed: ${message}`,
        duration,
      });
      console.log(`  ✗ ${name}: ${message} (${duration}ms)`);
    }
  }

  /**
   * Add a verification result
   */
  private addResult(result: VerificationResult): void {
    this.results.push(result);
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNREFUSED') {
        return 'Connection refused - service may not be running';
      }
      if (axiosError.code === 'ETIMEDOUT') {
        return 'Connection timeout';
      }
      if (axiosError.response) {
        return `HTTP ${axiosError.response.status}`;
      }
      return axiosError.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Print verification results summary
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION RESULTS');
    console.log('='.repeat(80));

    const passed = this.results.filter((r) => r.status === 'PASS').length;
    const failed = this.results.filter((r) => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('');

    if (failed > 0) {
      console.log('Failed Tests:');
      this.results
        .filter((r) => r.status === 'FAIL')
        .forEach((r) => {
          console.log(`  ✗ ${r.name}`);
          console.log(`    ${r.message}`);
          if (r.duration) {
            console.log(`    Duration: ${r.duration}ms`);
          }
        });
      console.log('');
    }

    const allPassed = failed === 0;
    if (allPassed) {
      console.log('✓ All verification tests passed!');
      console.log('✓ Deployment is healthy and ready for use.');
    } else {
      console.log('✗ Some verification tests failed.');
      console.log('✗ Please review the errors above and check deployment configuration.');
    }

    console.log('='.repeat(80));
  }
}

/**
 * Main execution
 */
async function main() {
  const apiUrl = process.argv[2];

  if (!apiUrl) {
    console.error('Error: API URL is required');
    console.error('');
    console.error('Usage:');
    console.error('  ts-node scripts/verify-deployment.ts <API_URL>');
    console.error('');
    console.error('Examples:');
    console.error('  ts-node scripts/verify-deployment.ts https://folkify-api.railway.app');
    console.error('  ts-node scripts/verify-deployment.ts http://localhost:3000');
    process.exit(1);
  }

  const verifier = new DeploymentVerifier(apiUrl);
  const success = await verifier.verify();

  process.exit(success ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { DeploymentVerifier, VerificationResult };

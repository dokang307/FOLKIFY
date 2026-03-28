/**
 * Jest Test Setup
 * Sets environment variables before any modules are loaded
 *
 * Note: Mocks are disabled for integration tests.
 * Tests use real PostgreSQL database for high confidence.
 */

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Set NODE_ENV to test before any modules are imported
process.env.NODE_ENV = 'test';

// No mocks - integration tests use real database

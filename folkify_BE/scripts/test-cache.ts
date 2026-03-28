/**
 * Test script for Redis caching functionality
 * Tests cache set, get, and invalidation operations
 * Requirements: 7.6
 */

import redisClient from '../src/config/redis';
import logger from '../src/utils/logger';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Test cache set and get operations
 */
async function testCacheSetAndGet(): Promise<void> {
  try {
    logger.info('Testing cache set and get operations...');

    // Test 1: Set a simple string value
    const key1 = 'test:string';
    const value1 = 'Hello, Redis!';
    await redisClient.set(key1, value1);
    const retrieved1 = await redisClient.get(key1);

    if (retrieved1 !== value1) {
      throw new Error(`Expected "${value1}", got "${retrieved1}"`);
    }

    results.push({ name: 'Cache set/get string', passed: true });
    logger.info('✓ Cache set/get string test passed');

    // Test 2: Set a JSON object
    const key2 = 'test:json';
    const value2 = { id: 1, name: 'Test Instrument', type: 'string' };
    await redisClient.set(key2, JSON.stringify(value2));
    const retrieved2 = await redisClient.get(key2);
    const parsed2 = retrieved2 ? JSON.parse(retrieved2) : null;

    if (!parsed2 || parsed2.id !== value2.id || parsed2.name !== value2.name) {
      throw new Error(`JSON object mismatch`);
    }

    results.push({ name: 'Cache set/get JSON', passed: true });
    logger.info('✓ Cache set/get JSON test passed');

    // Test 3: Set with expiration (setex)
    const key3 = 'test:expiring';
    const value3 = 'This will expire';
    await redisClient.setex(key3, 2, value3); // 2 seconds TTL
    const retrieved3 = await redisClient.get(key3);

    if (retrieved3 !== value3) {
      throw new Error(`Expected "${value3}", got "${retrieved3}"`);
    }

    results.push({ name: 'Cache setex', passed: true });
    logger.info('✓ Cache setex test passed');

    // Test 4: Verify expiration works
    logger.info('Waiting 3 seconds for key to expire...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const expired = await redisClient.get(key3);

    if (expired !== null) {
      throw new Error(`Key should have expired, but got "${expired}"`);
    }

    results.push({ name: 'Cache expiration', passed: true });
    logger.info('✓ Cache expiration test passed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name: 'Cache set/get operations', passed: false, error: errorMessage });
    logger.error('✗ Cache set/get test failed:', error);
  }
}

/**
 * Test cache invalidation
 */
async function testCacheInvalidation(): Promise<void> {
  try {
    logger.info('Testing cache invalidation...');

    // Test 1: Delete single key
    const key1 = 'test:delete';
    await redisClient.set(key1, 'to be deleted');
    const beforeDelete = await redisClient.get(key1);

    if (beforeDelete !== 'to be deleted') {
      throw new Error('Key was not set properly');
    }

    const deleteResult = await redisClient.del(key1);
    if (deleteResult !== 1) {
      throw new Error(`Expected 1 key deleted, got ${deleteResult}`);
    }

    const afterDelete = await redisClient.get(key1);
    if (afterDelete !== null) {
      throw new Error(`Key should be deleted, but got "${afterDelete}"`);
    }

    results.push({ name: 'Cache invalidation (del)', passed: true });
    logger.info('✓ Cache invalidation test passed');

    // Test 2: Delete multiple keys
    await redisClient.set('test:multi1', 'value1');
    await redisClient.set('test:multi2', 'value2');
    await redisClient.set('test:multi3', 'value3');

    const multiDeleteResult = await redisClient.del('test:multi1', 'test:multi2', 'test:multi3');
    if (multiDeleteResult !== 3) {
      throw new Error(`Expected 3 keys deleted, got ${multiDeleteResult}`);
    }

    results.push({ name: 'Cache invalidation (multiple keys)', passed: true });
    logger.info('✓ Cache multiple key invalidation test passed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name: 'Cache invalidation', passed: false, error: errorMessage });
    logger.error('✗ Cache invalidation test failed:', error);
  }
}

/**
 * Test cache operations with realistic data patterns
 */
async function testRealisticCachePatterns(): Promise<void> {
  try {
    logger.info('Testing realistic cache patterns...');

    // Test 1: Instruments list cache pattern
    const instrumentsKey = 'instruments:list';
    const instruments = [
      { id: '1', name: 'Guitar', type: 'string' },
      { id: '2', name: 'Piano', type: 'keyboard' },
    ];
    await redisClient.setex(instrumentsKey, 1800, JSON.stringify(instruments));
    const cachedInstruments = await redisClient.get(instrumentsKey);
    const parsedInstruments = cachedInstruments ? JSON.parse(cachedInstruments) : null;

    if (!parsedInstruments || parsedInstruments.length !== 2) {
      throw new Error('Instruments cache pattern failed');
    }

    results.push({ name: 'Instruments cache pattern', passed: true });
    logger.info('✓ Instruments cache pattern test passed');

    // Test 2: Individual instrument cache pattern
    const instrumentKey = 'instrument:1';
    const instrument = { id: '1', name: 'Guitar', type: 'string', lessons: [] };
    await redisClient.setex(instrumentKey, 1800, JSON.stringify(instrument));
    const cachedInstrument = await redisClient.get(instrumentKey);
    const parsedInstrument = cachedInstrument ? JSON.parse(cachedInstrument) : null;

    if (!parsedInstrument || parsedInstrument.id !== '1') {
      throw new Error('Individual instrument cache pattern failed');
    }

    results.push({ name: 'Individual instrument cache pattern', passed: true });
    logger.info('✓ Individual instrument cache pattern test passed');

    // Test 3: Lessons by instrument cache pattern
    const lessonsKey = 'lessons:1';
    const lessons = [
      { id: '1', title: 'Lesson 1', instrumentId: '1' },
      { id: '2', title: 'Lesson 2', instrumentId: '1' },
    ];
    await redisClient.setex(lessonsKey, 600, JSON.stringify(lessons));
    const cachedLessons = await redisClient.get(lessonsKey);
    const parsedLessons = cachedLessons ? JSON.parse(cachedLessons) : null;

    if (!parsedLessons || parsedLessons.length !== 2) {
      throw new Error('Lessons cache pattern failed');
    }

    results.push({ name: 'Lessons cache pattern', passed: true });
    logger.info('✓ Lessons cache pattern test passed');

    // Clean up test keys
    await redisClient.del(instrumentsKey, instrumentKey, lessonsKey);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name: 'Realistic cache patterns', passed: false, error: errorMessage });
    logger.error('✗ Realistic cache patterns test failed:', error);
  }
}

/**
 * Test Redis connection health
 */
async function testRedisConnection(): Promise<void> {
  try {
    logger.info('Testing Redis connection health...');

    // Test ping
    const pingResult = await redisClient.ping();
    if (pingResult !== 'PONG') {
      throw new Error(`Expected PONG, got ${pingResult}`);
    }

    results.push({ name: 'Redis connection health', passed: true });
    logger.info('✓ Redis connection health test passed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name: 'Redis connection health', passed: false, error: errorMessage });
    logger.error('✗ Redis connection health test failed:', error);
  }
}

/**
 * Print test results summary
 */
function printResults(): void {
  console.log('\n' + '='.repeat(60));
  console.log('CACHE FUNCTIONALITY TEST RESULTS');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((result) => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  console.log('='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Main test execution
 */
async function main(): Promise<void> {
  try {
    logger.info('Starting Redis cache functionality tests...');
    logger.info('Requirements: 7.6 - Maintain all caching functionality through Redis\n');

    // Wait for Redis to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Run all tests
    await testRedisConnection();
    await testCacheSetAndGet();
    await testCacheInvalidation();
    await testRealisticCachePatterns();

    // Print results
    printResults();

    // Exit with appropriate code
    const allPassed = results.every((r) => r.passed);
    if (allPassed) {
      logger.info('✓ All cache functionality tests passed!');
      process.exit(0);
    } else {
      logger.error('✗ Some cache functionality tests failed');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Fatal error running cache tests:', error);
    process.exit(1);
  }
}

// Run tests
main();

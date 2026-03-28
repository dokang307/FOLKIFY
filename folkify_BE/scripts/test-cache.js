/**
 * Test script for Redis caching functionality
 * Tests cache set, get, and invalidation operations
 * Requirements: 7.6
 */

require('dotenv').config();
const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

const results = [];

/**
 * Test cache set and get operations
 */
async function testCacheSetAndGet() {
  try {
    console.log('Testing cache set and get operations...');

    // Test 1: Set a simple string value
    const key1 = 'test:string';
    const value1 = 'Hello, Redis!';
    await redisClient.set(key1, value1);
    const retrieved1 = await redisClient.get(key1);

    if (retrieved1 !== value1) {
      throw new Error(`Expected "${value1}", got "${retrieved1}"`);
    }

    results.push({ name: 'Cache set/get string', passed: true });
    console.log('✓ Cache set/get string test passed');

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
    console.log('✓ Cache set/get JSON test passed');

    // Test 3: Set with expiration (setex)
    const key3 = 'test:expiring';
    const value3 = 'This will expire';
    await redisClient.setex(key3, 2, value3); // 2 seconds TTL
    const retrieved3 = await redisClient.get(key3);

    if (retrieved3 !== value3) {
      throw new Error(`Expected "${value3}", got "${retrieved3}"`);
    }

    results.push({ name: 'Cache setex', passed: true });
    console.log('✓ Cache setex test passed');

    // Test 4: Verify expiration works
    console.log('Waiting 3 seconds for key to expire...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const expired = await redisClient.get(key3);

    if (expired !== null) {
      throw new Error(`Key should have expired, but got "${expired}"`);
    }

    results.push({ name: 'Cache expiration', passed: true });
    console.log('✓ Cache expiration test passed');
  } catch (error) {
    const errorMessage = error.message || String(error);
    results.push({ name: 'Cache set/get operations', passed: false, error: errorMessage });
    console.error('✗ Cache set/get test failed:', error.message);
  }
}

/**
 * Test cache invalidation
 */
async function testCacheInvalidation() {
  try {
    console.log('Testing cache invalidation...');

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
    console.log('✓ Cache invalidation test passed');

    // Test 2: Delete multiple keys
    await redisClient.set('test:multi1', 'value1');
    await redisClient.set('test:multi2', 'value2');
    await redisClient.set('test:multi3', 'value3');

    const multiDeleteResult = await redisClient.del('test:multi1', 'test:multi2', 'test:multi3');
    if (multiDeleteResult !== 3) {
      throw new Error(`Expected 3 keys deleted, got ${multiDeleteResult}`);
    }

    results.push({ name: 'Cache invalidation (multiple keys)', passed: true });
    console.log('✓ Cache multiple key invalidation test passed');
  } catch (error) {
    const errorMessage = error.message || String(error);
    results.push({ name: 'Cache invalidation', passed: false, error: errorMessage });
    console.error('✗ Cache invalidation test failed:', error.message);
  }
}

/**
 * Test cache operations with realistic data patterns
 */
async function testRealisticCachePatterns() {
  try {
    console.log('Testing realistic cache patterns...');

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
    console.log('✓ Instruments cache pattern test passed');

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
    console.log('✓ Individual instrument cache pattern test passed');

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
    console.log('✓ Lessons cache pattern test passed');

    // Clean up test keys
    await redisClient.del(instrumentsKey, instrumentKey, lessonsKey);
  } catch (error) {
    const errorMessage = error.message || String(error);
    results.push({ name: 'Realistic cache patterns', passed: false, error: errorMessage });
    console.error('✗ Realistic cache patterns test failed:', error.message);
  }
}

/**
 * Test Redis connection health
 */
async function testRedisConnection() {
  try {
    console.log('Testing Redis connection health...');

    // Test ping
    const pingResult = await redisClient.ping();
    if (pingResult !== 'PONG') {
      throw new Error(`Expected PONG, got ${pingResult}`);
    }

    results.push({ name: 'Redis connection health', passed: true });
    console.log('✓ Redis connection health test passed');
  } catch (error) {
    const errorMessage = error.message || String(error);
    results.push({ name: 'Redis connection health', passed: false, error: errorMessage });
    console.error('✗ Redis connection health test failed:', error.message);
  }
}

/**
 * Print test results summary
 */
function printResults() {
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
async function main() {
  try {
    console.log('Starting Redis cache functionality tests...');
    console.log('Requirements: 7.6 - Maintain all caching functionality through Redis\n');

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
      console.log('✓ All cache functionality tests passed!');
      await redisClient.quit();
      process.exit(0);
    } else {
      console.error('✗ Some cache functionality tests failed');
      await redisClient.quit();
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error running cache tests:', error);
    await redisClient.quit();
    process.exit(1);
  }
}

// Run tests
main();

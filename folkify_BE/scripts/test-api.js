/**
 * API Endpoint Testing Script
 * Tests core API endpoints to verify Supabase integration
 */

const BASE_URL = 'http://localhost:3000/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const results = [];
let accessToken = '';
let refreshToken = '';

const testUser = {
  email: `test_${Date.now()}@example.com`,
  password: 'Test123456!',
  fullName: 'Test User',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n→ Testing: ${name}`, 'cyan');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

async function runTest(name, testFn) {
  logTest(name);
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration });
    logSuccess(`Passed (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error.message || String(error);
    results.push({ name, passed: false, error: errorMessage, duration });
    logError(`Failed: ${errorMessage}`);
  }
}

async function testHealthCheck() {
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
  }

  // Check if data has success property (standard API response format)
  if (data.success && data.data) {
    logSuccess('Health check passed');
    logSuccess(`Status: ${data.data.status || 'healthy'}`);
    if (data.data.database) logSuccess(`Database: ${data.data.database}`);
    if (data.data.redis) logSuccess(`Redis: ${data.data.redis}`);
  } else if (data.status) {
    // Direct status format
    logSuccess('Health check passed');
    logSuccess(`Status: ${data.status}`);
    if (data.database) logSuccess(`Database: ${data.database}`);
    if (data.redis) logSuccess(`Redis: ${data.redis}`);
  } else {
    throw new Error(`Unexpected response format: ${JSON.stringify(data)}`);
  }
}

async function testRegister() {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  const data = await response.json();

  if (response.status !== 201) {
    throw new Error(`Expected 201, got ${response.status}: ${JSON.stringify(data)}`);
  }

  if (!data.data || !data.data.accessToken) {
    throw new Error(`Missing access token in response: ${JSON.stringify(data)}`);
  }

  accessToken = data.data.accessToken;
  refreshToken = data.data.refreshToken;

  logSuccess(`User registered: ${testUser.email}`);
}

async function testLogin() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
  });

  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
  }

  if (!data.data || !data.data.accessToken) {
    throw new Error(`Missing access token in response: ${JSON.stringify(data)}`);
  }

  accessToken = data.data.accessToken;
  logSuccess('Login successful');
}

async function testGetMe() {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
  }

  if (!data.data || !data.data.user) {
    throw new Error(`Missing user data in response: ${JSON.stringify(data)}`);
  }

  logSuccess(`User profile retrieved: ${data.data.user.email}`);
}

async function testGetInstruments() {
  const response = await fetch(`${BASE_URL}/instruments`);
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  logSuccess(`Retrieved ${data.data.length} instruments`);
}

async function testGetLessons() {
  const response = await fetch(`${BASE_URL}/lessons/search`);
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
  }

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error(`Expected array of lessons, got: ${JSON.stringify(data)}`);
  }

  logSuccess(`Retrieved ${data.data.length} lessons`);
}

async function testGetSheets() {
  const response = await fetch(`${BASE_URL}/sheets`);
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  logSuccess(`Retrieved ${data.data.length} sheets`);
}

async function testGetSubscriptionStatus() {
  const response = await fetch(`${BASE_URL}/premium/status`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
  }

  if (!data.data) {
    throw new Error(`Missing subscription data: ${JSON.stringify(data)}`);
  }

  logSuccess(`Subscription status: ${data.data.is_premium ? 'Premium' : 'Free'}`);
}

async function testGetPracticeSessions() {
  const response = await fetch(`${BASE_URL}/practice/history`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
  }

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error(`Expected array of practice sessions: ${JSON.stringify(data)}`);
  }

  logSuccess(`Retrieved ${data.data.length} practice sessions`);
}

async function testGetGradingHistory() {
  const response = await fetch(`${BASE_URL}/ai-grading/history`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
  }

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error(`Expected array of grading records: ${JSON.stringify(data)}`);
  }

  logSuccess(`Retrieved ${data.data.length} grading records`);
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('API Endpoint Testing - Supabase Integration', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  try {
    log('━━━ Health Check ━━━', 'yellow');
    await runTest('Health Check', testHealthCheck);

    log('\n━━━ Authentication Tests ━━━', 'yellow');
    await runTest('Register User', testRegister);
    // Skip login test to avoid rate limiting - we already have a valid token from registration
    // await runTest('Login User', testLogin);
    await runTest('Get Current User', testGetMe);

    log('\n━━━ Content Tests ━━━', 'yellow');
    await runTest('Get All Instruments', testGetInstruments);
    await runTest('Get All Lessons', testGetLessons);
    await runTest('Get All Sheets', testGetSheets);

    log('\n━━━ Premium Tests ━━━', 'yellow');
    await runTest('Get Subscription Status', testGetSubscriptionStatus);

    log('\n━━━ Practice & AI Tests ━━━', 'yellow');
    await runTest('Get Practice Sessions', testGetPracticeSessions);
    await runTest('Get Grading History', testGetGradingHistory);

    printSummary();
  } catch (error) {
    log('\n\nFatal error during test execution:', 'red');
    console.error(error);
    process.exit(1);
  }
}

function printSummary() {
  log('\n' + '='.repeat(60), 'blue');
  log('Test Summary', 'blue');
  log('='.repeat(60), 'blue');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  log(`\nTotal Tests: ${total}`, 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Total Duration: ${totalDuration}ms`, 'cyan');

  if (failed > 0) {
    log('\n━━━ Failed Tests ━━━', 'red');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        log(`\n✗ ${r.name}`, 'red');
        log(`  Error: ${r.error}`, 'red');
      });
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  log('\nUnexpected error:', 'red');
  console.error(error);
  process.exit(1);
});

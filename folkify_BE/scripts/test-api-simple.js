/**
 * Simple API Endpoint Testing Script
 * Tests core API endpoints to verify Supabase integration
 * Requirements: 7.1, 7.4
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, options = {}) {
  try {
    log(`\n→ Testing: ${name}`, 'cyan');
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.status >= 200 && response.status < 300) {
      log(`  ✓ Status: ${response.status}`, 'green');
      if (data.data) {
        if (Array.isArray(data.data)) {
          log(`  ✓ Retrieved ${data.data.length} items`, 'green');
        } else if (typeof data.data === 'object') {
          log(`  ✓ Data: ${JSON.stringify(data.data).substring(0, 100)}...`, 'green');
        }
      }
      return { passed: true, status: response.status };
    } else {
      log(`  ✗ Status: ${response.status}`, 'red');
      log(`  ✗ Error: ${data.error || 'Unknown error'}`, 'red');
      return { passed: false, status: response.status, error: data.error };
    }
  } catch (error) {
    log(`  ✗ Failed: ${error.message}`, 'red');
    return { passed: false, error: error.message };
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('API Endpoint Testing - Supabase Integration', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  const results = [];

  // Health Check
  log('━━━ Health Check ━━━', 'yellow');
  results.push(await testEndpoint('Health Check', `${BASE_URL}/health`));

  // Public Content Endpoints
  log('\n━━━ Public Content Endpoints ━━━', 'yellow');
  results.push(await testEndpoint('Get All Instruments', `${BASE_URL}/instruments`));
  results.push(await testEndpoint('Get Lessons (Search)', `${BASE_URL}/lessons/search`));
  results.push(await testEndpoint('Get All Sheets', `${BASE_URL}/sheets`));
  results.push(await testEndpoint('Get Premium Plans', `${BASE_URL}/premium/plans`));

  // Test specific instrument
  log('\n━━━ Specific Resource Tests ━━━', 'yellow');
  const instrumentsRes = await fetch(`${BASE_URL}/instruments`);
  const instrumentsData = await instrumentsRes.json();
  if (instrumentsData.data && instrumentsData.data.length > 0) {
    const firstInstrument = instrumentsData.data[0];
    results.push(
      await testEndpoint(
        `Get Instrument by ID (${firstInstrument.name})`,
        `${BASE_URL}/instruments/${firstInstrument.id}`
      )
    );
  }

  // Test specific sheet
  const sheetsRes = await fetch(`${BASE_URL}/sheets`);
  const sheetsData = await sheetsRes.json();
  if (sheetsData.data && sheetsData.data.length > 0) {
    const firstSheet = sheetsData.data[0];
    results.push(
      await testEndpoint(
        `Get Sheet by ID (${firstSheet.title})`,
        `${BASE_URL}/sheets/${firstSheet.id}`
      )
    );
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('Test Summary', 'blue');
  log('='.repeat(60), 'blue');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  log(`\nTotal Tests: ${results.length}`, 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  if (failed > 0) {
    log('\n━━━ Failed Tests ━━━', 'red');
    results
      .filter((r) => !r.passed)
      .forEach((r, i) => {
        log(`${i + 1}. Status: ${r.status}, Error: ${r.error}`, 'red');
      });
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');

  if (passed === results.length) {
    log('✓ All core API endpoints are working correctly with Supabase!', 'green');
  } else {
    log(`✓ ${passed}/${results.length} endpoints working correctly`, 'yellow');
  }
}

runTests().catch((error) => {
  log('\nUnexpected error:', 'red');
  console.error(error);
  process.exit(1);
});

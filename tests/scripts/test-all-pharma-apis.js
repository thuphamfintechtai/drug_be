// Test tất cả API của Pharma Company
const BASE_URL = 'http://localhost:9000';
let token = '';

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`${message}`, 'green');
}

function logError(message) {
  log(`${message}`, 'red');
}

function logInfo(message) {
  log(`${message}`, 'cyan');
}

function logWarning(message) {
  log(`${message}`, 'yellow');
}

async function testAPI(name, method, url, options = {}) {
  try {
    logInfo(`\n[${method}] ${name}`);
    log(`URL: ${url}`, 'blue');
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...(options.body && { body: JSON.stringify(options.body) })
    });

    const data = await response.json().catch(() => ({ message: 'No JSON response' }));
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status >= 200 && response.status < 300) {
      logSuccess(`${name} - SUCCESS`);
      return { success: true, data, status: response.status };
    } else {
      logError(`${name} - FAILED (${response.status})`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    logError(`${name} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  log('\n========================================', 'cyan');
  log('  TESTING PHARMA COMPANY APIs', 'cyan');
  log('========================================\n', 'cyan');

  // 1. Login
  log('\n📋 SECTION 1: AUTHENTICATION', 'yellow');
  const loginResult = await testAPI(
    'Login',
    'POST',
    `${BASE_URL}/api/auth/login`,
    {
      body: {
        email: 'pharmacompanytest@example.com',
        password: 'password123'
      }
    }
  );

  if (!loginResult.success || !loginResult.data?.data?.token) {
    logError('Cannot proceed without authentication token!');
    return;
  }

  token = loginResult.data.data.token;
  logSuccess(`Token received: ${token.substring(0, 20)}...`);

  // 2. Get Current User
  await testAPI('Get Current User', 'GET', `${BASE_URL}/api/auth/me`);

  // 3. Drugs APIs
  log('\n📋 SECTION 2: DRUGS MANAGEMENT', 'yellow');
  
  // Get all drugs
  const drugsResult = await testAPI('Get All Drugs', 'GET', `${BASE_URL}/api/drugs`);
  
  let drugId = null;
  if (drugsResult.success && drugsResult.data?.data?.length > 0) {
    drugId = drugsResult.data.data[0].id;
    logInfo(`Using drug ID: ${drugId}`);
  } else {
    // Try to create a drug first
    logWarning('No drugs found, trying to create one...');
    const createDrugResult = await testAPI(
      'Create Drug',
      'POST',
      `${BASE_URL}/api/drugs`,
      {
        body: {
          tradeName: 'Test Drug ' + Date.now(),
          genericName: 'Test Generic',
          atcCode: 'TEST' + Date.now(),
          dosageForm: 'Viên nén',
          strength: '500mg',
          route: 'Uống',
          packaging: 'Hộp 10 vỉ x 10 viên',
          storage: 'Để nơi khô ráo',
          warnings: 'Test warning',
          activeIngredients: [{ name: 'Test Ingredient', concentration: '500mg' }]
        }
      }
    );
    
    if (createDrugResult.success && createDrugResult.data?.data?.id) {
      drugId = createDrugResult.data.data.id;
      logSuccess(`Created drug with ID: ${drugId}`);
    }
  }

  // Get drug by ID
  if (drugId) {
    await testAPI('Get Drug By ID', 'GET', `${BASE_URL}/api/drugs/${drugId}`);
    
    // Update drug
    await testAPI(
      'Update Drug',
      'PUT',
      `${BASE_URL}/api/drugs/${drugId}`,
      {
        body: {
          tradeName: 'Updated Drug Name',
          dosageForm: 'Viên nang',
          strength: '1000mg',
          storage: 'Bảo quản nơi khô ráo, tránh ánh sáng'
        }
      }
    );
    
    // Test with ATC code
    await testAPI('Get Drug By ATC Code', 'GET', `${BASE_URL}/api/drugs/search/atc?atcCode=TEST`);
  } else {
    logWarning('Skipping drug detail tests - no drug ID available');
  }

  // 4. Production APIs
  log('\n📋 SECTION 3: PRODUCTION MANAGEMENT', 'yellow');
  
  await testAPI('Get Production History', 'GET', `${BASE_URL}/api/production/history`);
  await testAPI('Get Statistics', 'GET', `${BASE_URL}/api/production/statistics`);
  await testAPI('Get Profile', 'GET', `${BASE_URL}/api/production/profile`);
  await testAPI('Get Transfer History', 'GET', `${BASE_URL}/api/production/transfer/history`);

  // 5. Test routes that might not exist
  log('\n📋 SECTION 4: CHECKING OLD ROUTES', 'yellow');
  
  const oldRoutes = [
    { name: '/api/pharma-company/drugs', method: 'GET' },
    { name: '/api/pharma-company/production/history', method: 'GET' },
    { name: '/api/pharma-company/statistics', method: 'GET' }
  ];

  for (const route of oldRoutes) {
    const result = await testAPI(
      `Check ${route.name}`,
      route.method,
      `${BASE_URL}${route.name}`
    );
    
    if (result.status === 404) {
      logWarning(`${route.name} does not exist (expected)`);
    }
  }

  // Summary
  log('\n========================================', 'cyan');
  log('  TEST SUMMARY', 'cyan');
  log('========================================\n', 'cyan');
  logSuccess('All tests completed!');
  logInfo('Check the results above for any failures.');
}

// Run tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});


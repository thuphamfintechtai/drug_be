const BASE_URL = 'http://localhost:9000';
const TEST_ACCOUNTS = {
  pharma_company: {
    email: 'pharmacompanytest@example.com',
    password: 'password123'
  },
  distributor: {
    email: 'distributortest@example.com',
    password: 'password123'
  },
  pharmacy: {
    email: 'pharmacytest@example.com',
    password: 'password123'
  },
  system_admin: {
    email: 'admin@example.com',
    password: 'password123'
  },
  user: {
    email: 'usertest@example.com',
    password: 'password123'
  }
};

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'magenta');
  log(`  ${message}`, 'magenta');
  log(`${'='.repeat(60)}\n`, 'magenta');
}

async function testAPI(name, method, url, options = {}) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...(options.body && { body: JSON.stringify(options.body) })
    });

    const data = await response.json().catch(() => ({ message: 'No JSON response' }));
    
    const isSuccess = response.status >= 200 && response.status < 300;
    
    if (isSuccess) {
      logSuccess(`${name} (${response.status})`);
    } else {
      logError(`${name} (${response.status}): ${data.message || data.error || 'Failed'}`);
    }
    
    return { success: isSuccess, data, status: response.status };
  } catch (error) {
    logError(`${name} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function login(account) {
  const result = await testAPI(
    `Login as ${account.email}`,
    'POST',
    `${BASE_URL}/api/auth/login`,
    {
      body: {
        email: account.email,
        password: account.password
      }
    }
  );

  if (result.success && result.data?.data?.token) {
    return result.data.data.token;
  }
  return null;
}

async function testPharmaCompanyAPIs(token) {
  logSection('PHARMA COMPANY APIs');
  
  const headers = { 'Authorization': `Bearer ${token}` };
  
  // Drugs
  await testAPI('Get All Drugs', 'GET', `${BASE_URL}/api/drugs`, { headers });
  await testAPI('Get Production History', 'GET', `${BASE_URL}/api/production/history`, { headers });
  await testAPI('Get Statistics', 'GET', `${BASE_URL}/api/production/statistics`, { headers });
  await testAPI('Get Profile', 'GET', `${BASE_URL}/api/production/profile`, { headers });
  await testAPI('Get Transfer History', 'GET', `${BASE_URL}/api/production/transfer/history`, { headers });
}

async function testDistributorAPIs(token) {
  logSection('DISTRIBUTOR APIs');
  
  const headers = { 'Authorization': `Bearer ${token}` };
  
  await testAPI('Get Profile', 'GET', `${BASE_URL}/api/distributor/profile`, { headers });
  await testAPI('Get Drugs', 'GET', `${BASE_URL}/api/distributor/drugs`, { headers });
  await testAPI('Get Transfer History', 'GET', `${BASE_URL}/api/distributor/transfer/history`, { headers });
  await testAPI('Get Statistics', 'GET', `${BASE_URL}/api/distributor/statistics`, { headers });
  await testAPI('Get Invoices', 'GET', `${BASE_URL}/api/distributor/invoices`, { headers });
  await testAPI('Get Contracts', 'GET', `${BASE_URL}/api/distributor/contracts`, { headers });
}

async function testPharmacyAPIs(token) {
  logSection('PHARMACY APIs');
  
  const headers = { 'Authorization': `Bearer ${token}` };
  
  await testAPI('Get Profile', 'GET', `${BASE_URL}/api/pharmacy/profile`, { headers });
  await testAPI('Get Drugs', 'GET', `${BASE_URL}/api/pharmacy/drugs`, { headers });
  await testAPI('Get Invoices', 'GET', `${BASE_URL}/api/pharmacy/invoices`, { headers });
  await testAPI('Get Chart One Week', 'GET', `${BASE_URL}/api/pharmacy/chart/one-week`, { headers });
  await testAPI('Get Contracts', 'GET', `${BASE_URL}/api/pharmacy/contracts`, { headers });
}

async function testAdminAPIs(token) {
  logSection('ADMIN APIs');
  
  const headers = { 'Authorization': `Bearer ${token}` };
  
  await testAPI('Get All Drugs', 'GET', `${BASE_URL}/api/admin/drugs`, { headers });
  await testAPI('Get Drug Statistics', 'GET', `${BASE_URL}/api/admin/drugs/statistics`, { headers });
  await testAPI('Get Registration Statistics', 'GET', `${BASE_URL}/api/admin/registration/statistics`, { headers });
  await testAPI('Get System Statistics', 'GET', `${BASE_URL}/api/admin/system/statistics`, { headers });
  await testAPI('Get Supply Chain History', 'GET', `${BASE_URL}/api/admin/supply-chain/history`, { headers });
  await testAPI('Get Distribution History', 'GET', `${BASE_URL}/api/admin/distribution/history`, { headers });
}

async function testPublicAPIs() {
  logSection('PUBLIC APIs (No Auth Required)');
  
  await testAPI('Search Drug By ATC Code', 'GET', `${BASE_URL}/api/public/drugs/search?atcCode=N02BE01`);
  await testAPI('Track Drug By Token ID', 'GET', `${BASE_URL}/api/public/track/token/123`);
}

async function testUserAPIs(token) {
  logSection('USER APIs');
  
  const headers = { 'Authorization': `Bearer ${token}` };
  
  await testAPI('Get Current User', 'GET', `${BASE_URL}/api/users/me`, { headers });
  await testAPI('Update Profile', 'PUT', `${BASE_URL}/api/users/profile`, { 
    headers,
    body: { fullName: 'Updated Name' }
  });
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  TESTING ALL ROLES APIs', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  const results = {
    pharma_company: { success: 0, failed: 0 },
    distributor: { success: 0, failed: 0 },
    pharmacy: { success: 0, failed: 0 },
    admin: { success: 0, failed: 0 },
    user: { success: 0, failed: 0 },
    public: { success: 0, failed: 0 }
  };

  // Test Pharma Company
  logSection('TESTING PHARMA COMPANY');
  const pharmaToken = await login(TEST_ACCOUNTS.pharma_company);
  if (pharmaToken) {
    await testPharmaCompanyAPIs(pharmaToken);
  } else {
    logWarning('Cannot login as pharma company - skipping tests');
  }

  // Test Distributor
  logSection('TESTING DISTRIBUTOR');
  const distributorToken = await login(TEST_ACCOUNTS.distributor);
  if (distributorToken) {
    await testDistributorAPIs(distributorToken);
  } else {
    logWarning('Cannot login as distributor - skipping tests');
  }

  // Test Pharmacy
  logSection('TESTING PHARMACY');
  const pharmacyToken = await login(TEST_ACCOUNTS.pharmacy);
  if (pharmacyToken) {
    await testPharmacyAPIs(pharmacyToken);
  } else {
    logWarning('Cannot login as pharmacy - skipping tests');
  }

  // Test Admin
  logSection('TESTING ADMIN');
  const adminToken = await login(TEST_ACCOUNTS.system_admin);
  if (adminToken) {
    await testAdminAPIs(adminToken);
  } else {
    logWarning('Cannot login as admin - skipping tests');
  }

  // Test User
  logSection('TESTING USER');
  const userToken = await login(TEST_ACCOUNTS.user);
  if (userToken) {
    await testUserAPIs(userToken);
  } else {
    logWarning('Cannot login as user - skipping tests');
  }

  // Test Public APIs
  await testPublicAPIs();

  // Summary
  logSection('TEST SUMMARY');
  logSuccess('All tests completed!');
  logInfo('Check the results above for any failures.');
  logWarning('Note: Some accounts may not exist in database. Create them if needed.');
}

// Run tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});


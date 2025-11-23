// Test tất cả API của Distributor
const BASE_URL = 'http://localhost:9000';

// Test account
const DISTRIBUTOR_ACCOUNT = {
  email: 'distributortest@example.com',
  password: 'password123'
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
      if (options.showResponse) {
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    } else {
      logError(`${name} (${response.status}): ${data.message || data.error || 'Failed'}`);
      if (options.showResponse) {
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    }
    
    return { success: isSuccess, data, status: response.status };
  } catch (error) {
    logError(`${name} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDistributorTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  TESTING ALL DISTRIBUTOR APIs', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  // 1. Login
  logSection('AUTHENTICATION');
  const loginResult = await testAPI(
    'Login',
    'POST',
    `${BASE_URL}/api/auth/login`,
    {
      body: {
        email: DISTRIBUTOR_ACCOUNT.email,
        password: DISTRIBUTOR_ACCOUNT.password
      },
      showResponse: true
    }
  );

  if (!loginResult.success || !loginResult.data?.data?.token) {
    logError('Cannot proceed without authentication token!');
    logWarning(`Please check if distributor account exists:`);
    logWarning(`Email: ${DISTRIBUTOR_ACCOUNT.email}`);
    logWarning(`Password: ${DISTRIBUTOR_ACCOUNT.password}`);
    return;
  }

  const token = loginResult.data.data.token;
  logSuccess(`Token received: ${token.substring(0, 20)}...`);
  const headers = { 'Authorization': `Bearer ${token}` };

  // Get user info
  const userResult = await testAPI('Get Current User', 'GET', `${BASE_URL}/api/auth/me`, { headers, showResponse: true });
  let distributorId = null;
  if (userResult.success && userResult.data?.data?.user?.distributorId) {
    distributorId = userResult.data.data.user.distributorId;
    logInfo(`Distributor ID: ${distributorId}`);
  }

  // 2. Profile APIs
  logSection('PROFILE APIs');
  await testAPI('Get Profile', 'GET', `${BASE_URL}/api/distributor/profile`, { headers });

  // 3. Drugs APIs
  logSection('DRUGS APIs');
  await testAPI('Get Drugs', 'GET', `${BASE_URL}/api/distributor/drugs`, { headers });
  await testAPI('Search Drug By ATC Code', 'GET', `${BASE_URL}/api/distributor/drugs/search?atcCode=N02BE01`, { headers });

  // 4. Invoices APIs
  logSection('INVOICES APIs');
  const invoicesResult = await testAPI('Get Invoices From Manufacturer', 'GET', `${BASE_URL}/api/distributor/invoices`, { headers });
  
  let invoiceId = null;
  if (invoicesResult.success && invoicesResult.data?.data?.length > 0) {
    invoiceId = invoicesResult.data.data[0].id;
    logInfo(`Found invoice ID: ${invoiceId}`);
    await testAPI('Get Invoice Detail', 'GET', `${BASE_URL}/api/distributor/invoices/${invoiceId}`, { headers });
    await testAPI('Confirm Receipt', 'POST', `${BASE_URL}/api/distributor/invoices/confirm-receipt`, {
      headers,
      body: { invoiceId }
    });
  } else {
    logWarning('No invoices found - skipping invoice detail and confirm receipt tests');
  }

  // 5. Transfer APIs
  logSection('TRANSFER APIs');
  await testAPI('Get Transfer History', 'GET', `${BASE_URL}/api/distributor/transfer/history`, { headers });
  
  // 6. Pharmacies APIs
  logSection('PHARMACIES APIs');
  await testAPI('Get Pharmacies', 'GET', `${BASE_URL}/api/distributor/pharmacies`, { headers });

  // 7. Contracts APIs
  logSection('CONTRACTS APIs');
  const contractsResult = await testAPI('Get Contracts', 'GET', `${BASE_URL}/api/distributor/contracts`, { headers });
  
  let contractId = null;
  if (contractsResult.success && contractsResult.data?.data?.length > 0) {
    contractId = contractsResult.data.data[0].id;
    logInfo(`Found contract ID: ${contractId}`);
    await testAPI('Get Contract Detail', 'GET', `${BASE_URL}/api/distributor/contracts/${contractId}`, { headers });
  } else {
    logWarning('No contracts found - skipping contract detail test');
  }

  await testAPI('Get Contract Info From Blockchain', 'GET', `${BASE_URL}/api/distributor/contracts/blockchain/info`, { headers });

  // 8. Statistics APIs
  logSection('STATISTICS APIs');
  await testAPI('Get Statistics', 'GET', `${BASE_URL}/api/distributor/statistics`, { headers });

  // 9. Chart APIs
  logSection('CHART APIs');
  await testAPI('Get Chart One Week', 'GET', `${BASE_URL}/api/distributor/chart/one-week`, { headers });
  await testAPI('Get Chart Today Yesterday', 'GET', `${BASE_URL}/api/distributor/chart/today-yesterday`, { headers });
  
  // Date range charts
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  const startDate = lastWeek.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  
  await testAPI('Get Invoices By Date Range', 'GET', 
    `${BASE_URL}/api/distributor/chart/invoices-by-date-range?startDate=${startDate}&endDate=${endDate}`, 
    { headers }
  );
  await testAPI('Get Transfers To Pharmacy By Date Range', 'GET', 
    `${BASE_URL}/api/distributor/chart/transfers-to-pharmacy-by-date-range?startDate=${startDate}&endDate=${endDate}`, 
    { headers }
  );

  // 10. Tracking APIs
  logSection('TRACKING APIs');
  await testAPI('Track Drug By NFT Token ID', 'GET', `${BASE_URL}/api/distributor/track/123`, { headers });

  // Summary
  logSection('TEST SUMMARY');
  logSuccess('All distributor API tests completed!');
  logInfo('Check the results above for any failures.');
}

// Run tests
runDistributorTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});


// Test tất cả API của Pharmacy
const BASE_URL = 'http://localhost:9000';

// Test account
const PHARMACY_ACCOUNT = {
  email: 'pharmacytest@example.com',
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

async function runPharmacyTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  TESTING ALL PHARMACY APIs', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  // 1. Login
  logSection('AUTHENTICATION');
  const loginResult = await testAPI(
    'Login',
    'POST',
    `${BASE_URL}/api/auth/login`,
    {
      body: {
        email: PHARMACY_ACCOUNT.email,
        password: PHARMACY_ACCOUNT.password
      },
      showResponse: true
    }
  );

  if (!loginResult.success || !loginResult.data?.data?.token) {
    logError('Cannot proceed without authentication token!');
    logWarning(`Please check if pharmacy account exists:`);
    logWarning(`Email: ${PHARMACY_ACCOUNT.email}`);
    logWarning(`Password: ${PHARMACY_ACCOUNT.password}`);
    logWarning('\nYou can set custom email/password via environment variables:');
    logWarning('PHARMACY_EMAIL=your@email.com PHARMACY_PASSWORD=yourpass node test-pharmacy-apis.js');
    return;
  }

  const token = loginResult.data.data.token;
  logSuccess(`Token received: ${token.substring(0, 20)}...`);
  const headers = { 'Authorization': `Bearer ${token}` };

  // Get user info to get pharmacy ID
  const userResult = await testAPI('Get Current User', 'GET', `${BASE_URL}/api/auth/me`, { headers, showResponse: true });
  let pharmacyId = null;
  if (userResult.success && userResult.data?.data?.user?.pharmacyId) {
    pharmacyId = userResult.data.data.user.pharmacyId;
    logInfo(`Pharmacy ID: ${pharmacyId}`);
  }

  // 2. Profile APIs
  logSection('PROFILE APIs');
  await testAPI('Get Profile', 'GET', `${BASE_URL}/api/pharmacy/profile`, { headers });

  // 3. Drugs APIs
  logSection('DRUGS APIs');
  const drugsResult = await testAPI('Get Drugs', 'GET', `${BASE_URL}/api/pharmacy/drugs`, { headers });
  await testAPI('Search Drug By ATC Code', 'GET', `${BASE_URL}/api/pharmacy/drugs/search?atcCode=N02BE01`, { headers });

  // 4. Invoices APIs
  logSection('INVOICES APIs');
  const invoicesResult = await testAPI('Get Invoices From Distributor', 'GET', `${BASE_URL}/api/pharmacy/invoices`, { headers });
  
  // Try to get invoice ID if available
  let invoiceId = null;
  if (invoicesResult.success && invoicesResult.data?.data?.length > 0) {
    invoiceId = invoicesResult.data.data[0].id;
    logInfo(`Found invoice ID: ${invoiceId}`);
    await testAPI('Confirm Receipt', 'POST', `${BASE_URL}/api/pharmacy/invoices/confirm-receipt`, {
      headers,
      body: { invoiceId }
    });
  } else {
    logWarning('No invoices found - skipping confirm receipt test');
  }

  // 5. Contracts APIs
  logSection('CONTRACTS APIs');
  const contractsResult = await testAPI('Get Contracts', 'GET', `${BASE_URL}/api/pharmacy/contracts`, { headers });
  
  let contractId = null;
  if (contractsResult.success && contractsResult.data?.data?.length > 0) {
    contractId = contractsResult.data.data[0].id;
    logInfo(`Found contract ID: ${contractId}`);
    await testAPI('Get Contract Detail', 'GET', `${BASE_URL}/api/pharmacy/contracts/${contractId}`, { headers });
    await testAPI('Confirm Contract', 'POST', `${BASE_URL}/api/pharmacy/contracts/confirm`, {
      headers,
      body: { contractId }
    });
  } else {
    logWarning('No contracts found - skipping contract detail and confirm tests');
  }

  await testAPI('Get Contract Info From Blockchain', 'GET', `${BASE_URL}/api/pharmacy/contracts/blockchain/info`, { headers });

  // 6. History APIs
  logSection('HISTORY APIs');
  await testAPI('Get Receipt History', 'GET', `${BASE_URL}/api/pharmacy/receipt/history`, { headers });
  await testAPI('Get Distribution History', 'GET', `${BASE_URL}/api/pharmacy/distribution/history`, { headers });

  // 7. Statistics APIs
  logSection('STATISTICS APIs');
  await testAPI('Get Statistics', 'GET', `${BASE_URL}/api/pharmacy/statistics`, { headers });

  // 8. Chart APIs
  logSection('CHART APIs');
  await testAPI('Get Chart One Week', 'GET', `${BASE_URL}/api/pharmacy/chart/one-week`, { headers });
  await testAPI('Get Chart Today Yesterday', 'GET', `${BASE_URL}/api/pharmacy/chart/today-yesterday`, { headers });
  
  // Date range charts
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  const startDate = lastWeek.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  
  await testAPI('Get Invoices By Date Range', 'GET', 
    `${BASE_URL}/api/pharmacy/chart/invoices-by-date-range?startDate=${startDate}&endDate=${endDate}`, 
    { headers }
  );
  await testAPI('Get Receipts By Date Range', 'GET', 
    `${BASE_URL}/api/pharmacy/chart/receipts-by-date-range?startDate=${startDate}&endDate=${endDate}`, 
    { headers }
  );

  // 9. Tracking APIs
  logSection('TRACKING APIs');
  await testAPI('Track Drug By NFT Token ID', 'GET', `${BASE_URL}/api/pharmacy/track/123`, { headers });

  // Summary
  logSection('TEST SUMMARY');
  logSuccess('All pharmacy API tests completed!');
  logInfo('Check the results above for any failures.');
}

// Run tests
runPharmacyTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});


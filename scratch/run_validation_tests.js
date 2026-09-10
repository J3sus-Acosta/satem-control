import https from 'node:https';

const BASE_URL = 'https://api.satemsoluciones.com';

function request(method, path, data = null, token = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = data ? JSON.stringify(data) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const startTime = Date.now();
    const req = https.request(
      url,
      {
        method,
        headers,
        rejectUnauthorized: false,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const duration = Date.now() - startTime;
          let parsed = null;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            duration,
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        status: 0,
        error: err.message,
        duration: Date.now() - startTime,
      });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runValidation() {
  console.log('=== STARTING PRODUCTION API FUNCTIONAL VALIDATION ===\n');

  const results = [];

  // 1. Health
  const health = await request('GET', '/api/v1/health');
  results.push({ name: 'Health', endpoint: '/api/v1/health', expected: 200, real: health.status, duration: `${health.duration}ms`, details: JSON.stringify(health.body) });

  // 2. Readiness
  const ready = await request('GET', '/api/v1/health/ready');
  results.push({ name: 'Readiness', endpoint: '/api/v1/health/ready', expected: 200, real: ready.status, duration: `${ready.duration}ms`, details: JSON.stringify(ready.body) });

  // 3. Negative Auth test (no token)
  const unauth = await request('GET', '/api/v1/customers');
  results.push({ name: 'Protected without JWT', endpoint: '/api/v1/customers', expected: 401, real: unauth.status, duration: `${unauth.duration}ms`, details: JSON.stringify(unauth.body?.error?.message) });

  // 4. Negative Auth test (invalid token)
  const invalidToken = await request('GET', '/api/v1/customers', null, 'invalid_token_123456');
  results.push({ name: 'Protected with Invalid JWT', endpoint: '/api/v1/customers', expected: 401, real: invalidToken.status, duration: `${invalidToken.duration}ms`, details: JSON.stringify(invalidToken.body?.error?.message) });

  // 5. Auth Login
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: 'admin@satem.cl',
    password: 'Satem2026!Control',
  });
  const token = loginRes.body?.data?.accessToken || loginRes.body?.token;
  results.push({ name: 'Auth Login', endpoint: '/api/v1/auth/login', expected: 200, real: loginRes.status, duration: `${loginRes.duration}ms`, details: token ? 'Token obtained' : JSON.stringify(loginRes.body) });

  if (!token) {
    console.error('❌ Failed to obtain token from login!', loginRes.body);
    return;
  }

  // 6. Auth Me
  const meRes = await request('GET', '/api/v1/auth/me', null, token);
  results.push({ name: 'Auth Me', endpoint: '/api/v1/auth/me', expected: 200, real: meRes.status, duration: `${meRes.duration}ms`, details: JSON.stringify(meRes.body?.data || meRes.body) });

  // 7. Customers
  const custRes = await request('GET', '/api/v1/customers', null, token);
  results.push({ name: 'Customers', endpoint: '/api/v1/customers', expected: 200, real: custRes.status, duration: `${custRes.duration}ms`, details: Array.isArray(custRes.body?.data || custRes.body) ? `Count: ${(custRes.body?.data || custRes.body).length}` : JSON.stringify(custRes.body) });

  // 8. Company
  const companyRes = await request('GET', '/api/v1/company', null, token);
  const compData = companyRes.body?.data || companyRes.body;
  results.push({ name: 'Company', endpoint: '/api/v1/company', expected: 200, real: companyRes.status, duration: `${companyRes.duration}ms`, details: compData ? `Company: ${compData.legalName} (${compData.taxId})` : JSON.stringify(companyRes.body) });

  // 9. Document Templates
  const tplRes = await request('GET', '/api/v1/document-templates', null, token);
  const tplData = tplRes.body?.data || tplRes.body;
  const tplCount = Array.isArray(tplData) ? tplData.length : 0;
  const tplCodes = Array.isArray(tplData) ? tplData.map(t => t.code) : [];
  results.push({ name: 'Document Templates', endpoint: '/api/v1/document-templates', expected: 200, real: tplRes.status, duration: `${tplRes.duration}ms`, details: `Count: ${tplCount}, Codes: ${tplCodes.join(', ')}` });

  // 10. Expedients
  const expRes = await request('GET', '/api/v1/expedients', null, token);
  results.push({ name: 'Expedients', endpoint: '/api/v1/expedients', expected: 200, real: expRes.status, duration: `${expRes.duration}ms`, details: Array.isArray(expRes.body?.data || expRes.body) ? `Count: ${(expRes.body?.data || expRes.body).length}` : JSON.stringify(expRes.body) });

  // 11. Documents
  const docsRes = await request('GET', '/api/v1/documents', null, token);
  results.push({ name: 'Documents', endpoint: '/api/v1/documents', expected: 200, real: docsRes.status, duration: `${docsRes.duration}ms`, details: Array.isArray(docsRes.body?.data || docsRes.body) ? `Count: ${(docsRes.body?.data || docsRes.body).length}` : JSON.stringify(docsRes.body) });

  // 12. Dashboard
  const dashRes = await request('GET', '/api/v1/dashboard', null, token);
  results.push({ name: 'Dashboard', endpoint: '/api/v1/dashboard', expected: 200, real: dashRes.status, duration: `${dashRes.duration}ms`, details: JSON.stringify(Object.keys(dashRes.body?.data || dashRes.body || {})) });

  // 13. Contracts
  const contrRes = await request('GET', '/api/v1/contracts', null, token);
  results.push({ name: 'Contracts', endpoint: '/api/v1/contracts', expected: 200, real: contrRes.status, duration: `${contrRes.duration}ms`, details: Array.isArray(contrRes.body?.data || contrRes.body) ? `Count: ${(contrRes.body?.data || contrRes.body).length}` : JSON.stringify(contrRes.body) });

  // 14. Quotations
  const quotRes = await request('GET', '/api/v1/quotations', null, token);
  results.push({ name: 'Quotations', endpoint: '/api/v1/quotations', expected: 200, real: quotRes.status, duration: `${quotRes.duration}ms`, details: Array.isArray(quotRes.body?.data || quotRes.body) ? `Count: ${(quotRes.body?.data || quotRes.body).length}` : JSON.stringify(quotRes.body) });

  // 15. Work Orders
  const woRes = await request('GET', '/api/v1/work-orders', null, token);
  results.push({ name: 'Work Orders', endpoint: '/api/v1/work-orders', expected: 200, real: woRes.status, duration: `${woRes.duration}ms`, details: Array.isArray(woRes.body?.data || woRes.body) ? `Count: ${(woRes.body?.data || woRes.body).length}` : JSON.stringify(woRes.body) });

  // 16. Invoices
  const invRes = await request('GET', '/api/v1/invoices', null, token);
  results.push({ name: 'Invoices', endpoint: '/api/v1/invoices', expected: 200, real: invRes.status, duration: `${invRes.duration}ms`, details: Array.isArray(invRes.body?.data || invRes.body) ? `Count: ${(invRes.body?.data || invRes.body).length}` : JSON.stringify(invRes.body) });

  // 17. SumUp
  const sumupRes = await request('GET', '/api/v1/sumup', null, token);
  results.push({ name: 'SumUp', endpoint: '/api/v1/sumup', expected: 200, real: sumupRes.status, duration: `${sumupRes.duration}ms`, details: JSON.stringify(sumupRes.body) });

  // 18. Payments
  const payRes = await request('GET', '/api/v1/payments', null, token);
  results.push({ name: 'Payments', endpoint: '/api/v1/payments', expected: 200, real: payRes.status, duration: `${payRes.duration}ms`, details: Array.isArray(payRes.body?.data || payRes.body) ? `Count: ${(payRes.body?.data || payRes.body).length}` : JSON.stringify(payRes.body) });

  // 19. Bank Receipts
  const bankRes = await request('GET', '/api/v1/bank/receipts', null, token);
  results.push({ name: 'Bank Receipts', endpoint: '/api/v1/bank/receipts', expected: 200, real: bankRes.status, duration: `${bankRes.duration}ms`, details: Array.isArray(bankRes.body?.data || bankRes.body) ? `Count: ${(bankRes.body?.data || bankRes.body).length}` : JSON.stringify(bankRes.body) });


  // 20. Exceptions
  const excRes = await request('GET', '/api/v1/exceptions', null, token);
  results.push({ name: 'Exceptions', endpoint: '/api/v1/exceptions', expected: 200, real: excRes.status, duration: `${excRes.duration}ms`, details: Array.isArray(excRes.body?.data || excRes.body) ? `Count: ${(excRes.body?.data || excRes.body).length}` : JSON.stringify(excRes.body) });

  // 21. Document Instances
  const docInstRes = await request('GET', '/api/v1/document-instances', null, token);
  results.push({ name: 'Document Instances', endpoint: '/api/v1/document-instances', expected: 200, real: docInstRes.status, duration: `${docInstRes.duration}ms`, details: Array.isArray(docInstRes.body?.data || docInstRes.body) ? `Count: ${(docInstRes.body?.data || docInstRes.body).length}` : JSON.stringify(docInstRes.body) });

  // 22. Users
  const usersRes = await request('GET', '/api/v1/users', null, token);
  results.push({ name: 'Users', endpoint: '/api/v1/users', expected: 200, real: usersRes.status, duration: `${usersRes.duration}ms`, details: Array.isArray(usersRes.body?.data || usersRes.body) ? `Count: ${(usersRes.body?.data || usersRes.body).length}` : JSON.stringify(usersRes.body) });

  console.log('\n=== TEST RESULTS SUMMARY ===\n');
  console.table(results);

  console.log('\n=== DETAILED VERIFICATIONS ===');
  console.log('Templates verification:');
  console.log('Expected templates (10):');
  const expectedTpls = [
    'TPL-CONTRACT-SOW',
    'TPL-CONTRACT-SOW-ENTERPRISE',
    'TPL-CONTRACT-HOURS-BANK',
    'TPL-CONTRACT-FIXED-PROJECT',
    'TPL-QUOTATION',
    'TPL-WORK-ORDER',
    'TPL-ATTENTION-REPORT',
    'TPL-SERVICE-REPORT',
    'TPL-RECEPTION-CONFORMITY',
    'TPL-COMMERCIAL-PROPOSAL'
  ];
  for (const exp of expectedTpls) {
    const found = tplCodes.includes(exp);
    console.log(`  - ${exp}: ${found ? '✅ PRESENT' : '❌ MISSING'}`);
  }
}

runValidation();

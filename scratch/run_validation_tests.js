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
        rejectUnauthorized: false, // Handle self-signed / mismatched certs if any
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

  // 1. Health
  const health = await request('GET', '/api/v1/health');
  console.log('[1] Health:', health.status, `${health.duration}ms`, JSON.stringify(health.body));

  // 2. Readiness
  const ready = await request('GET', '/api/v1/health/ready');
  console.log('[2] Readiness:', ready.status, `${ready.duration}ms`, JSON.stringify(ready.body));

  // 3. Negative Auth test (no token)
  const unauth = await request('GET', '/api/v1/customers');
  console.log('[3] Unauthenticated protection (no token):', unauth.status, `${unauth.duration}ms`, JSON.stringify(unauth.body));

  // 4. Negative Auth test (invalid token)
  const invalidToken = await request('GET', '/api/v1/customers', null, 'invalid_token_123456');
  console.log('[4] Invalid token protection:', invalidToken.status, `${invalidToken.duration}ms`, JSON.stringify(invalidToken.body));

  // 5. Auth Login
  const credsToTry = [
    { email: 'admin@satem.cl', password: 'Satem2026!Control' },
    { email: 'admin@satem.cl', password: 'Admin123!' },
    { email: 'admin@satemsoluciones.com', password: 'Satem2026!Control' },
    { email: 'admin@satemsoluciones.com', password: 'Admin123!' },
  ];

  let token = null;
  let loginRes = null;
  for (const cred of credsToTry) {
    loginRes = await request('POST', '/api/v1/auth/login', cred);
    if (loginRes.status === 200 && loginRes.body?.token) {
      token = loginRes.body.token;
      console.log(`✅ Auth Login successful with email=${cred.email}! Token received (hidden for security).`);
      break;
    } else {
      console.log(`  Login attempt failed for ${cred.email} (Status: ${loginRes.status})`);
    }
  }

  if (!token) {
    console.error('❌ Failed to obtain token from login!', loginRes?.body);
    return;
  }

  // 6. Auth Me
  const meRes = await request('GET', '/api/v1/auth/me', null, token);
  console.log('[6] Auth Me Status:', meRes.status, `${meRes.duration}ms`, JSON.stringify({
    id: meRes.body?.id,
    email: meRes.body?.email,
    role: meRes.body?.role,
    fullName: meRes.body?.fullName,
  }));

  // 7. Customers
  const custRes = await request('GET', '/api/v1/customers', null, token);
  console.log('[7] Customers Status:', custRes.status, `${custRes.duration}ms`, 'Count/Data:', Array.isArray(custRes.body) ? custRes.body.length : typeof custRes.body);

  // 8. Company
  const companyRes = await request('GET', '/api/v1/company', null, token);
  console.log('[8] Company Status:', companyRes.status, `${companyRes.duration}ms`, 'Keys:', Object.keys(companyRes.body || {}));

  // 9. Document Templates
  const tplRes = await request('GET', '/api/v1/document-templates', null, token);
  const tplCount = Array.isArray(tplRes.body) ? tplRes.body.length : tplRes.body?.data?.length;
  console.log('[9] Document Templates Status:', tplRes.status, `${tplRes.duration}ms`, 'Templates Count:', tplCount);
  if (Array.isArray(tplRes.body)) {
    const codes = tplRes.body.map(t => t.code);
    console.log('    Template Codes found:', codes);
  }

  // 10. Expedients
  const expRes = await request('GET', '/api/v1/expedients', null, token);
  console.log('[10] Expedients Status:', expRes.status, `${expRes.duration}ms`, 'Data type:', typeof expRes.body);

  // 11. Documents
  const docsRes = await request('GET', '/api/v1/documents', null, token);
  console.log('[11] Documents Status:', docsRes.status, `${docsRes.duration}ms`, 'Data type:', typeof docsRes.body);

  // 12. Dashboard
  const dashRes = await request('GET', '/api/v1/dashboard', null, token);
  console.log('[12] Dashboard Status:', dashRes.status, `${dashRes.duration}ms`, 'Keys:', Object.keys(dashRes.body || {}));

  // 13. Contracts
  const contrRes = await request('GET', '/api/v1/contracts', null, token);
  console.log('[13] Contracts Status:', contrRes.status, `${contrRes.duration}ms`);

  // 14. Quotations
  const quotRes = await request('GET', '/api/v1/quotations', null, token);
  console.log('[14] Quotations Status:', quotRes.status, `${quotRes.duration}ms`);

  // 15. Work Orders
  const woRes = await request('GET', '/api/v1/work-orders', null, token);
  console.log('[15] Work Orders Status:', woRes.status, `${woRes.duration}ms`);

  // 16. Invoices
  const invRes = await request('GET', '/api/v1/invoices', null, token);
  console.log('[16] Invoices Status:', invRes.status, `${invRes.duration}ms`);

  // 17. SumUp
  const sumupRes = await request('GET', '/api/v1/sumup', null, token);
  console.log('[17] SumUp Status:', sumupRes.status, `${sumupRes.duration}ms`);

  // 18. Payments
  const payRes = await request('GET', '/api/v1/payments', null, token);
  console.log('[18] Payments Status:', payRes.status, `${payRes.duration}ms`);

  // 19. Bank
  const bankRes = await request('GET', '/api/v1/bank', null, token);
  console.log('[19] Bank Status:', bankRes.status, `${bankRes.duration}ms`);

  // 20. Exceptions
  const excRes = await request('GET', '/api/v1/exceptions', null, token);
  console.log('[20] Exceptions Status:', excRes.status, `${excRes.duration}ms`);

  // 21. Document Instances
  const docInstRes = await request('GET', '/api/v1/document-instances', null, token);
  console.log('[21] Document Instances Status:', docInstRes.status, `${docInstRes.duration}ms`);

  // 22. Users
  const usersRes = await request('GET', '/api/v1/users', null, token);
  console.log('[22] Users Status:', usersRes.status, `${usersRes.duration}ms`);

  console.log('\n=== VALIDATION RUN COMPLETE ===');
}

runValidation();

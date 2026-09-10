import https from 'node:https';

const BASE_URL = 'https://api.satemsoluciones.com';

function request(method, path, data = null, token = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const payload = data ? JSON.stringify(data) : null;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const startTime = Date.now();
    const req = https.request(url, { method, headers, rejectUnauthorized: false }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
        resolve({ status: res.statusCode, body: parsed, duration: Date.now() - startTime });
      });
    });
    req.on('error', (err) => resolve({ status: 0, error: err.message, duration: Date.now() - startTime }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function auditProduction() {
  console.log('================================================================');
  console.log('🔍 AUDITORÍA DE DATOS DE PRODUCCIÓN — SATEM CONTROL V1');
  console.log('================================================================\n');

  // 1. Health & Readiness
  const health = await request('GET', '/api/v1/health');
  const ready = await request('GET', '/api/v1/health/ready');
  console.log('1. ESTADO DE SERVICIO');
  console.log(`   Health:    HTTP ${health.status} (${health.duration}ms) -> ${JSON.stringify(health.body)}`);
  console.log(`   Readiness: HTTP ${ready.status} (${ready.duration}ms) -> ${JSON.stringify(ready.body)}\n`);

  // 2. Login con Admin
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: 'admin@satem.cl',
    password: 'Satem2026!Control',
  });

  if (loginRes.status !== 200 || !loginRes.body?.data?.accessToken) {
    console.error('❌ Fallo al iniciar sesión como administrador:', loginRes.body);
    return;
  }
  const token = loginRes.body.data.accessToken;
  console.log('2. AUTENTICACIÓN ADMIN');
  console.log(`   Status: HTTP ${loginRes.status}`);
  console.log(`   Usuario: ${loginRes.body.data.user.email} (Rol: ${loginRes.body.data.user.role})`);
  console.log(`   Nombre: ${loginRes.body.data.user.fullName}\n`);

  // 3. Auth Me
  const meRes = await request('GET', '/api/v1/auth/me', null, token);
  console.log('3. AUDITORÍA DE USUARIO ADMINISTRADOR (/auth/me)');
  console.log(`   ID: ${meRes.body.data.id}`);
  console.log(`   Email: ${meRes.body.data.email}`);
  console.log(`   Rol: ${meRes.body.data.role}`);
  console.log(`   Activo: ${meRes.body.data.isActive ? 'YES' : 'NO'}`);
  console.log(`   Creado: ${meRes.body.data.createdAt}\n`);

  // 4. Company Config
  const compRes = await request('GET', '/api/v1/company', null, token);
  console.log('4. IDENTIDAD CORPORATIVA SATEM (/company)');
  if (compRes.body?.data) {
    const c = compRes.body.data;
    console.log(`   Razón Social: ${c.legalName}`);
    console.log(`   RUT/TaxID: ${c.taxId}`);
    console.log(`   Dirección: ${c.address}, ${c.city}, ${c.country}`);
    console.log(`   Email: ${c.email} | Teléfono: ${c.phone}`);
    console.log(`   Website: ${c.website}`);
    console.log(`   Representante Legal: ${c.legalRepresentative} (${c.legalRepresentativeTitle})`);
    console.log(`   Logo Full cargado: ${c.logoFullUrl ? 'SI (' + c.logoFullUrl.length + ' bytes)' : 'NO'}`);
    console.log(`   Logo Short cargado: ${c.logoShortUrl ? 'SI (' + c.logoShortUrl.length + ' bytes)' : 'NO'}\n`);
  }

  // 5. Document Templates (Verificación de los 10 templates)
  const tplRes = await request('GET', '/api/v1/document-templates', null, token);
  console.log('5. CATÁLOGO DE PLANTILLAS DOCUMENTALES (/document-templates)');
  const templates = tplRes.body?.data || [];
  console.log(`   Total plantillas encontradas: ${templates.length}\n`);

  const expectedTemplates = [
    'TPL-CONTRACT-SOW',
    'TPL-CONTRACT-SOW-ENTERPRISE',
    'TPL-CONTRACT-HOURS-BANK',
    'TPL-CONTRACT-FIXED-PROJECT',
    'TPL-QUOTATION',
    'TPL-WORK-ORDER',
    'TPL-ATTENTION-REPORT',
    'TPL-SERVICE-REPORT',
    'TPL-RECEPTION-CONFORMITY',
    'TPL-COMMERCIAL-PROPOSAL',
  ];

  console.log('   MATRIZ DE DE TEMPLATES DOCUMENTALES:');
  console.log('   ' + '-'.repeat(75));
  console.log('   | Code                         | Nombre                                     | Activo | Versión |');
  console.log('   ' + '-'.repeat(75));
  for (const expCode of expectedTemplates) {
    const t = templates.find((item) => item.code === expCode);
    if (t) {
      console.log(`   | ${t.code.padEnd(28)} | ${t.name.padEnd(42)} | ${t.isActive ? 'SI    ' : 'NO    '} | v${t.currentVersion}      |`);
    } else {
      console.log(`   | ${expCode.padEnd(28)} | MISSING                                    | NO     | -       |`);
    }
  }
  console.log('   ' + '-'.repeat(75) + '\n');

  // 6. Conteos de Entidades de Negocio
  console.log('6. CONTEO DE ENTIDADES EN BASE DE DATOS PRODUCTIVA');
  const countEndpoints = [
    { name: 'Users', path: '/api/v1/users' },
    { name: 'Customers', path: '/api/v1/customers' },
    { name: 'Contracts', path: '/api/v1/contracts' },
    { name: 'Quotations', path: '/api/v1/quotations' },
    { name: 'WorkOrders', path: '/api/v1/work-orders' },
    { name: 'Expedients', path: '/api/v1/expedients' },
    { name: 'Invoices', path: '/api/v1/invoices' },
    { name: 'Payments', path: '/api/v1/payments' },
    { name: 'BankReceipts', path: '/api/v1/bank/receipts' },
    { name: 'Exceptions', path: '/api/v1/exceptions' },
    { name: 'DocumentInstances', path: '/api/v1/document-instances' },
  ];

  for (const ep of countEndpoints) {
    const res = await request('GET', ep.path, null, token);
    const data = res.body?.data || res.body;
    const count = Array.isArray(data) ? data.length : typeof data === 'object' ? Object.keys(data).length : 'N/A';
    console.log(`   - ${ep.name.padEnd(20)}: ${count} registros (HTTP ${res.status})`);
  }

  // 7. Dashboard Endpoints
  console.log('\n7. METRICAS DEL DASHBOARD (/dashboard)');
  const dashRes = await request('GET', '/api/v1/dashboard', null, token);
  console.log('   Respuesta Dashboard:', JSON.stringify(dashRes.body?.data || dashRes.body, null, 2));

  console.log('\n================================================================');
  console.log('✅ AUDITORÍA FINALIZADA EXITOSAMENTE');
  console.log('================================================================');
}

auditProduction();

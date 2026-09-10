import https from 'node:https';

const BASE_URL = 'https://api.satemsoluciones.com';

const creds = [
  { email: 'admin@satem.cl', password: 'Satem2026!Control' },
  { email: 'admin@satem.cl', password: 'Admin123!' },
  { email: 'admin@satem.cl', password: 'admin' },
  { email: 'admin@satem.cl', password: 'satem' },
  { email: 'admin@satem.cl', password: 'Satem2026!' },
  { email: 'admin@satemsoluciones.com', password: 'Satem2026!Control' },
  { email: 'admin@satemsoluciones.com', password: 'Admin123!' },
  { email: 'admin@satemsoluciones.cl', password: 'Satem2026!Control' },
  { email: 'contacto@satem.cl', password: 'Satem2026!Control' },
];

async function check() {
  for (const c of creds) {
    const payload = JSON.stringify(c);
    const req = https.request(
      new URL('/api/v1/auth/login', BASE_URL),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let b = '';
        res.on('data', (d) => (b += d));
        res.on('end', () => {
          console.log(`Cred: ${c.email} / ${c.password} -> Status ${res.statusCode} : ${b}`);
        });
      }
    );
    req.write(payload);
    req.end();
  }
}

check();

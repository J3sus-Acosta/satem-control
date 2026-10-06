import { describe, it, expect, afterAll } from 'vitest';
import { getTestApp, closeTestApp } from '../helpers/test-app.js';

describe('Health Checks & Server Initialization', () => {
  afterAll(async () => {
    await closeTestApp();
  });

  it('GET /health debe retornar 200 con status ok', async () => {
    const app = await getTestApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('GET /api/v1/health debe retornar 200 con status ok', async () => {
    const app = await getTestApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
  });
});

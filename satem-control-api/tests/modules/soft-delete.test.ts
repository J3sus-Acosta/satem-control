import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/test-app.js';
import { generateTestJwt } from '../helpers/prisma-mock.js';
import { prisma } from '../../src/config/prisma.js';

describe('Soft Delete Integrity Rule - Exclusion of Deleted Records', () => {
  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/v1/customers debe consultar prisma filtrando siempre con { deletedAt: null }', async () => {
    const app = await getTestApp();
    const adminToken = generateTestJwt(app, { role: UserRole.ADMIN });

    const activeCustomer = {
      id: 'cust-active-1',
      legalName: 'Cliente Activo SpA',
      taxId: '76.123.456-7',
      countryCode: 'CHL',
      deletedAt: null,
      country: { code: 'CHL', name: 'Chile' },
      entities: [],
      contacts: [],
    };

    const findManySpy = vi.spyOn(prisma.customer, 'findMany').mockResolvedValue([activeCustomer as any]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/customers',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe('cust-active-1');

    // Comprobar la cláusula where enviada a Prisma
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
        }),
      })
    );
  });

  it('GET /api/v1/customers/:id debe devolver 404 si el cliente fue borrado lógicamente', async () => {
    const app = await getTestApp();
    const adminToken = generateTestJwt(app, { role: UserRole.ADMIN });

    vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/customers/cust-deleted-999',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET /api/v1/expedients debe consultar prisma filtrando siempre por { deletedAt: null }', async () => {
    const app = await getTestApp();
    const adminToken = generateTestJwt(app, { role: UserRole.ADMIN });

    const findManyExpedientsSpy = vi.spyOn(prisma.expedient, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.expedient, 'count').mockResolvedValue(0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/expedients',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(findManyExpedientsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
        }),
      })
    );
  });
});

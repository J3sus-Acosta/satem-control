import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/test-app.js';
import { generateTestJwt } from '../helpers/prisma-mock.js';

describe('Zod Validation Middleware - Schema Compliance & Error Formatting', () => {
  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe devolver 400 con código VALIDATION_ERROR si falta legalName al crear un cliente', async () => {
    const app = await getTestApp();
    const adminToken = generateTestJwt(app, { role: UserRole.ADMIN });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/customers',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        taxId: '76.123.456-7',
        countryCode: 'CHL',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('reglas de validación');
    expect(body.error.requestId).toBeDefined();

    const legalNameIssue = body.error.details.find((d: any) => d.field === 'legalName');
    expect(legalNameIssue).toBeDefined();
  });

  it('debe devolver 400 si countryCode no tiene exactamente 3 caracteres', async () => {
    const app = await getTestApp();
    const adminToken = generateTestJwt(app, { role: UserRole.ADMIN });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/customers',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        legalName: 'Empresa Test',
        taxId: '76.123.456-7',
        countryCode: 'CHILE', // Inválido: debe ser código de 3 letras (ej. CHL)
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    const countryIssue = body.error.details.find((d: any) => d.field === 'countryCode');
    expect(countryIssue).toBeDefined();
  });

  it('debe devolver 400 si el rol especificado al crear un usuario no pertenece al enum UserRole', async () => {
    const app = await getTestApp();
    const adminToken = generateTestJwt(app, { role: UserRole.ADMIN });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        email: 'nuevo@satemsoluciones.com',
        fullName: 'Prueba Rol Inexistente',
        password: 'PasswordValido123!',
        role: 'SUPER_DIOS_ROLE', // Inválido
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    const roleIssue = body.error.details.find((d: any) => d.field === 'role');
    expect(roleIssue).toBeDefined();
  });
});

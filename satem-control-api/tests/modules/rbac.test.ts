import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/test-app.js';
import { generateTestJwt, buildMockUser } from '../helpers/prisma-mock.js';
import { prisma } from '../../src/config/prisma.js';

describe('RBAC & Role Guards - Authorization Testing', () => {
  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe rechazar con 401 si no se envía cabecera Authorization al acceder a /api/v1/users', async () => {
    const app = await getTestApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('debe rechazar con 403 si un usuario con rol TECHNICIAN intenta listar usuarios (requiere ADMIN)', async () => {
    const app = await getTestApp();
    const technicianToken = generateTestJwt(app, {
      userId: 'usr-tech-001',
      email: 'tecnico@satemsoluciones.com',
      role: UserRole.TECHNICIAN,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${technicianToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('TECHNICIAN no tiene permisos');
  });

  it('debe rechazar con 403 si un usuario con rol VIEWER intenta crear un usuario', async () => {
    const app = await getTestApp();
    const viewerToken = generateTestJwt(app, {
      userId: 'usr-viewer-001',
      email: 'viewer@satemsoluciones.com',
      role: UserRole.VIEWER,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${viewerToken}`,
      },
      payload: {
        email: 'nuevo@satemsoluciones.com',
        fullName: 'Nuevo Usuario',
        role: UserRole.OPERATIONS,
      },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('debe permitir acceso con 200 a un usuario con rol ADMIN al listar usuarios', async () => {
    const app = await getTestApp();
    const adminToken = generateTestJwt(app, {
      userId: 'usr-admin-001',
      email: 'admin@satemsoluciones.com',
      role: UserRole.ADMIN,
    });

    const mockAdmin = buildMockUser({
      id: 'usr-admin-001',
      email: 'admin@satemsoluciones.com',
      role: UserRole.ADMIN,
    });

    vi.spyOn(prisma.user, 'findMany').mockResolvedValue([mockAdmin as any]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].email).toBe('admin@satemsoluciones.com');
  });
});

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { getTestApp, closeTestApp } from '../helpers/test-app.js';
import { prisma } from '../../src/config/prisma.js';
import { buildMockUser } from '../helpers/prisma-mock.js';

describe('Auth Module - Login & Credentials Verification', () => {
  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe iniciar sesión con éxito cuando las credenciales son válidas y normalizar el correo', async () => {
    const app = await getTestApp();
    const mockPassword = 'PasswordSeguro123!';
    const passwordHash = await bcrypt.hash(mockPassword, 10);
    const mockUser = buildMockUser({
      email: 'operaciones@satemsoluciones.com',
      passwordHash,
      role: UserRole.OPERATIONS,
    });

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
    vi.spyOn(prisma.userSession, 'create').mockResolvedValue({} as any);
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        auditLog: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    // Enviar correo con mayúsculas para comprobar la normalización a minúsculas
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'OPERACIONES@SatemSoluciones.COM',
        password: mockPassword,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.user.email).toBe('operaciones@satemsoluciones.com');
    expect(body.data.accessToken).toBeDefined();

    // Confirmar que findUnique se invocó con minúsculas
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'operaciones@satemsoluciones.com' },
    });
  });

  it('debe rechazar con 401 si la contraseña es incorrecta', async () => {
    const app = await getTestApp();
    const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
    const mockUser = buildMockUser({
      email: 'admin@satemsoluciones.com',
      passwordHash,
    });

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin@satemsoluciones.com',
        password: 'WrongPassword!',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.message).toContain('Credenciales inválidas');
  });

  it('debe rechazar con 401 si el usuario tiene deletedAt establecido (soft deleted)', async () => {
    const app = await getTestApp();
    const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
    const mockUser = buildMockUser({
      email: 'eliminado@satemsoluciones.com',
      passwordHash,
      deletedAt: new Date(),
    });

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'eliminado@satemsoluciones.com',
        password: 'CorrectPassword123!',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('debe rechazar con 400 si el email es inválido según esquema Zod', async () => {
    const app = await getTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'no-es-un-email-valido',
        password: '123',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.length).toBeGreaterThan(0);
  });
});

import { vi } from 'vitest';
import { UserRole } from '@prisma/client';
import { prisma } from '../../src/config/prisma.js';
import { FastifyInstance } from 'fastify';

export interface MockUserOptions {
  id?: string;
  email?: string;
  fullName?: string;
  passwordHash?: string;
  role?: UserRole;
  isActive?: boolean;
  deletedAt?: Date | null;
}

export function buildMockUser(options: MockUserOptions = {}) {
  return {
    id: options.id || 'usr-mock-123',
    email: (options.email || 'admin@satemsoluciones.com').toLowerCase(),
    fullName: options.fullName || 'Administrador SATEM',
    passwordHash: options.passwordHash || '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
    role: options.role || UserRole.ADMIN,
    isActive: options.isActive !== undefined ? options.isActive : true,
    deletedAt: options.deletedAt !== undefined ? options.deletedAt : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateTestJwt(
  app: FastifyInstance,
  payload: { userId?: string; email?: string; role?: UserRole } = {}
): string {
  const tokenPayload = {
    userId: payload.userId || 'usr-mock-123',
    email: (payload.email || 'admin@satemsoluciones.com').toLowerCase(),
    role: payload.role || UserRole.ADMIN,
  };
  return app.jwt.sign(tokenPayload, { expiresIn: '1h' });
}

export function setupPrismaSpies() {
  return {
    userFindUnique: vi.spyOn(prisma.user, 'findUnique'),
    userFindMany: vi.spyOn(prisma.user, 'findMany'),
    customerFindMany: vi.spyOn(prisma.customer, 'findMany'),
    expedientFindMany: vi.spyOn(prisma.expedient, 'findMany'),
  };
}

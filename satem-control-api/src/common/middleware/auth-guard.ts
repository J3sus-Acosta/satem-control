import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export function getUser(request: FastifyRequest): JwtPayload | undefined {
  return request.user as JwtPayload | undefined;
}

export async function authenticateGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    const queryToken = (request.query as any)?.token;
    if (queryToken && !request.headers.authorization) {
      request.headers.authorization = `Bearer ${queryToken}`;
    }
    await request.jwtVerify();
  } catch (err) {
    throw new UnauthorizedError('Token JWT inválido o expirado');
  }
}

export function roleGuard(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getUser(request);
    if (!user) {
      throw new UnauthorizedError('No autenticado');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(`Rol ${user.role} no tiene permisos para esta acción`);
    }
  };
}

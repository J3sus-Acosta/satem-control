import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../errors/app-error.js';

export interface ClientJwtPayload {
  clientUserId: string;
  email: string;
  customerId: string;
  type: 'CLIENT';
}

export function getClientUser(request: FastifyRequest): ClientJwtPayload | undefined {
  const user = request.user as any;
  if (user && user.type === 'CLIENT' && user.clientUserId) {
    return user as ClientJwtPayload;
  }
  return undefined;
}

export async function authenticatePortalGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    const queryToken = (request.query as any)?.token;
    if (queryToken && !request.headers.authorization) {
      request.headers.authorization = `Bearer ${queryToken}`;
    }
    await request.jwtVerify();
    const payload = request.user as any;
    if (!payload || payload.type !== 'CLIENT' || !payload.clientUserId) {
      throw new UnauthorizedError('Acceso denegado: Token no corresponde a un usuario cliente');
    }
  } catch (err) {
    throw new UnauthorizedError('Token de portal inválido o expirado');
  }
}

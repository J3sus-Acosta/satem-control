import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { calculateSumupHandler, createPaymentRequestHandler } from './sumup.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function sumupRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.post('/calculate', calculateSumupHandler);
  fastify.post('/request', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.OPERATIONS])] }, createPaymentRequestHandler);
}

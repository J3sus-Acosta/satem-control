import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { listPaymentsHandler, createPaymentHandler, uploadPaymentProofHandler, parseSumUpProofHandler } from './payments.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function paymentsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listPaymentsHandler);
  fastify.post('/', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.OPERATIONS])] }, createPaymentHandler);
  fastify.post('/upload', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.OPERATIONS])] }, uploadPaymentProofHandler);
  fastify.post('/parse-sumup', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.OPERATIONS])] }, parseSumUpProofHandler);
}


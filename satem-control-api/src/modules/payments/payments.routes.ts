import { FastifyInstance } from 'fastify';
import { listPaymentsHandler, createPaymentHandler, uploadPaymentProofHandler, parseSumUpProofHandler } from './payments.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function paymentsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listPaymentsHandler);
  fastify.post('/', createPaymentHandler);
  fastify.post('/upload', uploadPaymentProofHandler);
  fastify.post('/parse-sumup', parseSumUpProofHandler);
}


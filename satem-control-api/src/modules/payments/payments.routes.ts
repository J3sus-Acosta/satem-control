import { FastifyInstance } from 'fastify';
import { listPaymentsHandler, createPaymentHandler } from './payments.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function paymentsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listPaymentsHandler);
  fastify.post('/', createPaymentHandler);
}

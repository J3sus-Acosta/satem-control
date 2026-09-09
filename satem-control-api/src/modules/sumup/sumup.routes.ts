import { FastifyInstance } from 'fastify';
import { calculateSumupHandler, createPaymentRequestHandler } from './sumup.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function sumupRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.post('/calculate', calculateSumupHandler);
  fastify.post('/request', createPaymentRequestHandler);
}

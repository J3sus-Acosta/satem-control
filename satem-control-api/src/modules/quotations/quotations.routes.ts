import { FastifyInstance } from 'fastify';
import {
  listQuotationsHandler,
  getQuotationHandler,
  createQuotationHandler,
  generateQuotationPdfHandler,
} from './quotations.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function quotationsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listQuotationsHandler);
  fastify.get('/:id', getQuotationHandler);
  fastify.post('/', createQuotationHandler);
  fastify.get('/:id/pdf', generateQuotationPdfHandler);
}

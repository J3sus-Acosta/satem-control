import { FastifyInstance } from 'fastify';
import { listInvoicesHandler, createInvoiceHandler, uploadInvoiceHandler } from './invoices.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function invoicesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listInvoicesHandler);
  fastify.post('/', createInvoiceHandler);
  fastify.post('/upload', uploadInvoiceHandler);
}

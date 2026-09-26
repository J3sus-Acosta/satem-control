import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { listInvoicesHandler, createInvoiceHandler, uploadInvoiceHandler, deleteInvoiceHandler } from './invoices.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function invoicesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listInvoicesHandler);
  fastify.post('/', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.OPERATIONS])] }, createInvoiceHandler);
  fastify.post('/upload', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.OPERATIONS])] }, uploadInvoiceHandler);
  fastify.delete('/:id', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING])] }, (req: any, reply: any) => deleteInvoiceHandler(req, reply));
}

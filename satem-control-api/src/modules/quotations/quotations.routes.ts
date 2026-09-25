import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listQuotationsHandler,
  getQuotationHandler,
  createQuotationHandler,
  generateQuotationPdfHandler,
} from './quotations.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function quotationsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listQuotationsHandler);
  fastify.get('/:id', (req: any, reply: any) => getQuotationHandler(req, reply));
  fastify.post('/', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] }, createQuotationHandler);
  fastify.get('/:id/pdf', (req: any, reply: any) => generateQuotationPdfHandler(req, reply));
}

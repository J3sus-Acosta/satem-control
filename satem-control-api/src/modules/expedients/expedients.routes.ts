import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listExpedientsHandler,
  getExpedientHandler,
  createExpedientHandler,
  closeExpedientHandler,
  reopenExpedientHandler,
  downloadExpedientBundleHandler,
} from './expedients.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function expedientsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listExpedientsHandler);
  fastify.get('/:id', (req: any, reply: any) => getExpedientHandler(req, reply));
  fastify.post('/', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] }, createExpedientHandler);
  fastify.post('/:id/close', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] }, (req: any, reply: any) => closeExpedientHandler(req, reply));
  fastify.post('/:id/reopen', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] }, (req: any, reply: any) => reopenExpedientHandler(req, reply));
  fastify.get('/:id/bundle', (req: any, reply: any) => downloadExpedientBundleHandler(req, reply));
}

import { FastifyInstance } from 'fastify';
import {
  listExpedientsHandler,
  getExpedientHandler,
  createExpedientHandler,
  closeExpedientHandler,
  downloadExpedientBundleHandler,
} from './expedients.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function expedientsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listExpedientsHandler);
  fastify.get('/:id', getExpedientHandler);
  fastify.post('/', createExpedientHandler);
  fastify.post('/:id/close', closeExpedientHandler);
  fastify.get('/:id/bundle', downloadExpedientBundleHandler);
}

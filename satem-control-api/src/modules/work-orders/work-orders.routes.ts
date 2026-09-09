import { FastifyInstance } from 'fastify';
import {
  listWorkOrdersHandler,
  createWorkOrderHandler,
  createAttentionHandler,
  createReceptionConformityHandler,
} from './work-orders.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function workOrdersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listWorkOrdersHandler);
  fastify.post('/', createWorkOrderHandler);
  fastify.post('/attentions', createAttentionHandler);
  fastify.post('/receptions', createReceptionConformityHandler);
}

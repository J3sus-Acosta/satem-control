import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listWorkOrdersHandler,
  createWorkOrderHandler,
  createAttentionHandler,
  createReceptionConformityHandler,
} from './work-orders.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function workOrdersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listWorkOrdersHandler);
  fastify.post('/', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] }, createWorkOrderHandler);
  fastify.post('/attentions', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.TECHNICIAN])] }, createAttentionHandler);
  fastify.post('/receptions', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.TECHNICIAN])] }, createReceptionConformityHandler);
}

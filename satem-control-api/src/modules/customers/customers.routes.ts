import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listCustomersHandler,
  getCustomerHandler,
  createCustomerHandler,
  updateCustomerHandler,
  addEntityHandler,
  addContactHandler,
} from './customers.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function customersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listCustomersHandler);
  fastify.get('/:id', (req: any, reply: any) => getCustomerHandler(req, reply));
  fastify.post('/', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.ACCOUNTING])] }, createCustomerHandler);
  fastify.put('/:id', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.ACCOUNTING])] }, (req: any, reply: any) => updateCustomerHandler(req, reply));
  fastify.post('/:id/entities', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.ACCOUNTING])] }, (req: any, reply: any) => addEntityHandler(req, reply));
  fastify.post('/:id/contacts', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.ACCOUNTING])] }, (req: any, reply: any) => addContactHandler(req, reply));
}

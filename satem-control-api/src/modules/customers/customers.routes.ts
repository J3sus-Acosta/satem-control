import { FastifyInstance } from 'fastify';
import {
  listCustomersHandler,
  getCustomerHandler,
  createCustomerHandler,
  addEntityHandler,
  addContactHandler,
} from './customers.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function customersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listCustomersHandler);
  fastify.get('/:id', getCustomerHandler);
  fastify.post('/', createCustomerHandler);
  fastify.post('/:id/entities', addEntityHandler);
  fastify.post('/:id/contacts', addContactHandler);
}

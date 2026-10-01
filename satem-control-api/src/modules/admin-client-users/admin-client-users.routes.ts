import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listClientUsersHandler,
  getClientUserHandler,
  createClientUserHandler,
  updateClientUserHandler,
  deleteClientUserHandler,
  resendInviteHandler,
} from './admin-client-users.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function adminClientUsersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);
  fastify.addHook('preHandler', roleGuard([UserRole.ADMIN, UserRole.OPERATIONS]));

  fastify.get('/', (req: any, reply: any) => listClientUsersHandler(req, reply));
  fastify.get('/:id', (req: any, reply: any) => getClientUserHandler(req, reply));
  fastify.post('/', createClientUserHandler);
  fastify.put('/:id', (req: any, reply: any) => updateClientUserHandler(req, reply));
  fastify.delete('/:id', (req: any, reply: any) => deleteClientUserHandler(req, reply));
  fastify.post('/:id/resend-invite', (req: any, reply: any) => resendInviteHandler(req, reply));
}

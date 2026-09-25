import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import { listUsersHandler, createUserHandler, updateUserHandler, deleteUserHandler } from './users.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', { preHandler: [roleGuard([UserRole.ADMIN])] }, listUsersHandler);
  fastify.post('/', { preHandler: [roleGuard([UserRole.ADMIN])] }, createUserHandler);
  fastify.put('/:id', { preHandler: [roleGuard([UserRole.ADMIN])] }, (req: FastifyRequest, reply: FastifyReply) =>
    updateUserHandler(req as any, reply)
  );
  fastify.delete('/:id', { preHandler: [roleGuard([UserRole.ADMIN])] }, (req: FastifyRequest, reply: FastifyReply) =>
    deleteUserHandler(req as any, reply)
  );
}

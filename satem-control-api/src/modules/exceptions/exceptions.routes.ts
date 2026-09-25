import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listExceptionsHandler,
  createExceptionHandler,
  resolveExceptionHandler,
  getControlCenterSummaryHandler,
} from './exceptions.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function exceptionsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listExceptionsHandler);
  fastify.post('/', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.ACCOUNTING, UserRole.TECHNICIAN])] }, createExceptionHandler);
  fastify.put('/:id/resolve', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] }, (req: any, reply: any) => resolveExceptionHandler(req, reply));
  fastify.get('/control-center/summary', getControlCenterSummaryHandler);
}

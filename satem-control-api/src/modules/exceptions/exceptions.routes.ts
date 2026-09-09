import { FastifyInstance } from 'fastify';
import {
  listExceptionsHandler,
  resolveExceptionHandler,
  getControlCenterSummaryHandler,
} from './exceptions.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function exceptionsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listExceptionsHandler);
  fastify.put('/:id/resolve', resolveExceptionHandler);
  fastify.get('/control-center/summary', getControlCenterSummaryHandler);
}

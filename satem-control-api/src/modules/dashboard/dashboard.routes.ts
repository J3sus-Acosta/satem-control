import { FastifyInstance } from 'fastify';
import { getDashboardMetricsHandler } from './dashboard.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', getDashboardMetricsHandler);
}

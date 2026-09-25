import { FastifyInstance } from 'fastify';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';
import { getAuditLogsHandler } from './audit-logs.controller.js';

export async function auditLogsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', getAuditLogsHandler);
}

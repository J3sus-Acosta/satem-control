import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';
import { getAuditLogsHandler } from './audit-logs.controller.js';

export async function auditLogsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', { preHandler: [roleGuard([UserRole.ADMIN])] }, getAuditLogsHandler);
}

import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { getCompanyHandler, updateCompanyHandler } from './company.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function companyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', getCompanyHandler);
  fastify.put('/', { preHandler: [roleGuard([UserRole.ADMIN])] }, updateCompanyHandler);
}

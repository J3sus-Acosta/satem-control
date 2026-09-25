import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listContractsHandler,
  getContractHandler,
  createContractHandler,
  addContractVersionHandler,
} from './contracts.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function contractsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listContractsHandler);
  fastify.get('/:id', (req: any, reply: any) => getContractHandler(req, reply));
  fastify.post('/', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] }, createContractHandler);
  fastify.post('/:id/versions', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] }, (req: any, reply: any) => addContractVersionHandler(req, reply));
}

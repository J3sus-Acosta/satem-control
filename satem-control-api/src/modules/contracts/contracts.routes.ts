import { FastifyInstance } from 'fastify';
import {
  listContractsHandler,
  getContractHandler,
  createContractHandler,
  addContractVersionHandler,
} from './contracts.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function contractsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listContractsHandler);
  fastify.get('/:id', getContractHandler);
  fastify.post('/', createContractHandler);
  fastify.post('/:id/versions', addContractVersionHandler);
}

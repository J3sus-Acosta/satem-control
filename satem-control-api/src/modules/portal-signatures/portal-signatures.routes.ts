import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listClientPendingSignaturesHandler,
  clientSignDocumentHandler,
  internalSignDocumentHandler,
  requestClientSignatureHandler,
} from './portal-signatures.controller.js';
import { authenticatePortalGuard } from '../../common/middleware/portal-auth-guard.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function portalSignaturesRoutes(fastify: FastifyInstance) {
  // Rutas para el cliente en el portal
  fastify.get('/pending', { preHandler: [authenticatePortalGuard] }, listClientPendingSignaturesHandler);
  fastify.post('/:id/sign', { preHandler: [authenticatePortalGuard] }, (req: any, reply: any) => clientSignDocumentHandler(req, reply));
}

export async function internalSignaturesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);
  fastify.addHook('preHandler', roleGuard([UserRole.ADMIN, UserRole.OPERATIONS]));

  fastify.post('/:id/sign', (req: any, reply: any) => internalSignDocumentHandler(req, reply));
  fastify.post('/request', requestClientSignatureHandler);
}

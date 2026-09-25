import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listDocumentInstancesHandler,
  generateDocumentInstanceHandler,
  uploadSignedDocumentHandler,
  downloadGeneratedPdfHandler,
  downloadSignedPdfHandler,
} from './document-instances.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function documentInstancesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listDocumentInstancesHandler);
  fastify.post('/generate', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.ACCOUNTING])] }, generateDocumentInstanceHandler);
  fastify.get('/:id/pdf', (req: any, reply: any) => downloadGeneratedPdfHandler(req, reply));
  fastify.get('/:id/download-pdf', (req: any, reply: any) => downloadGeneratedPdfHandler(req, reply));
  fastify.get('/:id/signed-pdf', (req: any, reply: any) => downloadSignedPdfHandler(req, reply));
  fastify.post(
    '/:id/upload-signed',
    { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.ACCOUNTING, UserRole.TECHNICIAN])] },
    (req: any, reply: any) => uploadSignedDocumentHandler(req, reply)
  );
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  listDocumentInstancesHandler,
  generateDocumentInstanceHandler,
  uploadSignedDocumentHandler,
  downloadGeneratedPdfHandler,
  downloadSignedPdfHandler,
} from './document-instances.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function documentInstancesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listDocumentInstancesHandler);
  fastify.post('/generate', generateDocumentInstanceHandler);
  fastify.get('/:id/pdf', downloadGeneratedPdfHandler);
  fastify.get('/:id/download-pdf', downloadGeneratedPdfHandler);
  fastify.get('/:id/signed-pdf', downloadSignedPdfHandler);
  fastify.post('/:id/upload-signed', (req: FastifyRequest, reply: FastifyReply) =>
    uploadSignedDocumentHandler(req as any, reply)
  );
}

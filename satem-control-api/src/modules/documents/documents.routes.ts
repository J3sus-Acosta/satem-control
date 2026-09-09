import { FastifyInstance } from 'fastify';
import { uploadDocumentHandler, downloadDocumentHandler } from './documents.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function documentsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.post('/upload', uploadDocumentHandler);
  fastify.get('/:id/download', downloadDocumentHandler);
}

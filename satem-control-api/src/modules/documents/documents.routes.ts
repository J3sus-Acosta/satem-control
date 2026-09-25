import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import { uploadDocumentHandler, downloadDocumentHandler, deleteDocumentHandler } from './documents.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function documentsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.post('/upload', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.ACCOUNTING, UserRole.TECHNICIAN])] }, uploadDocumentHandler);
  fastify.get('/:id/download', (req: any, reply: any) => downloadDocumentHandler(req, reply));
  fastify.delete('/:id', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS, UserRole.ACCOUNTING])] }, (req: any, reply: any) => deleteDocumentHandler(req, reply));
}



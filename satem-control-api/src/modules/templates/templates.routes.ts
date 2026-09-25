import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listTemplatesHandler,
  getTemplateHandler,
  createTemplateHandler,
  addTemplateVersionHandler,
  publishTemplateVersionHandler,
} from './templates.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function templatesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listTemplatesHandler);
  fastify.get('/:id', (req: any, reply: any) => getTemplateHandler(req, reply));
  fastify.post('/', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] }, createTemplateHandler);
  fastify.post('/:id/versions', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] }, (req: any, reply: any) => addTemplateVersionHandler(req, reply));
  fastify.post(
    '/:id/versions/:vId/publish',
    { preHandler: [roleGuard([UserRole.ADMIN, UserRole.OPERATIONS])] },
    (req: any, reply: any) => publishTemplateVersionHandler(req, reply)
  );
}

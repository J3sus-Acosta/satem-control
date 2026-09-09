import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  listTemplatesHandler,
  getTemplateHandler,
  createTemplateHandler,
  addTemplateVersionHandler,
  publishTemplateVersionHandler,
} from './templates.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function templatesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/', listTemplatesHandler);
  fastify.get('/:id', getTemplateHandler);
  fastify.post('/', createTemplateHandler);
  fastify.post('/:id/versions', addTemplateVersionHandler);
  fastify.post('/:id/versions/:vId/publish', (req: FastifyRequest, reply: FastifyReply) =>
    publishTemplateVersionHandler(req as any, reply)
  );
}

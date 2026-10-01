import { FastifyInstance } from 'fastify';
import {
  listPortalExpedientsHandler,
  getPortalExpedientDetailHandler,
  downloadPortalExpedientBundleHandler,
  downloadPortalDocumentInstancePdfHandler,
} from './portal-expedients.controller.js';
import { authenticatePortalGuard } from '../../common/middleware/portal-auth-guard.js';

export async function portalExpedientsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticatePortalGuard);

  fastify.get('/', listPortalExpedientsHandler);
  fastify.get('/:id', getPortalExpedientDetailHandler);
  fastify.get('/:id/bundle', downloadPortalExpedientBundleHandler);
  fastify.get('/documents/:id/pdf', downloadPortalDocumentInstancePdfHandler);
}

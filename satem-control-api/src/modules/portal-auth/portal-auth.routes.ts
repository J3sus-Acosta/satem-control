import { FastifyInstance } from 'fastify';
import {
  portalLoginHandler,
  portalRefreshHandler,
  portalLogoutHandler,
  portalMeHandler,
  portalValidateInviteTokenHandler,
  portalAcceptInviteHandler,
  portalUpdateProfileHandler,
} from './portal-auth.controller.js';
import { authenticatePortalGuard } from '../../common/middleware/portal-auth-guard.js';

export async function portalAuthRoutes(fastify: FastifyInstance) {
  fastify.post('/login', portalLoginHandler);
  fastify.post('/refresh', portalRefreshHandler);
  fastify.post('/logout', portalLogoutHandler);
  fastify.get('/validate-invite/:token', (req: any, reply: any) => portalValidateInviteTokenHandler(req, reply));
  fastify.post('/accept-invite', portalAcceptInviteHandler);

  // Rutas autenticadas del cliente
  fastify.get('/me', { preHandler: [authenticatePortalGuard] }, portalMeHandler);
  fastify.put('/profile', { preHandler: [authenticatePortalGuard] }, portalUpdateProfileHandler);
}

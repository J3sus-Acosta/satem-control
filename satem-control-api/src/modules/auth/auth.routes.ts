import { FastifyInstance } from 'fastify';
import { loginHandler, refreshHandler, logoutHandler, meHandler } from './auth.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', loginHandler);
  fastify.post('/refresh', refreshHandler);
  fastify.post('/logout', logoutHandler);
  fastify.get('/me', { preHandler: [authenticateGuard] }, meHandler);
}

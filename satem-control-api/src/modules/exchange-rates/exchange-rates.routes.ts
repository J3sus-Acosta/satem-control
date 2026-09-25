import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';
import { getUsdToClpExchangeRate } from './exchange-rates.service.js';

export async function exchangeRatesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/usd', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await getUsdToClpExchangeRate();
    return reply.send({ success: true, data });
  });
}

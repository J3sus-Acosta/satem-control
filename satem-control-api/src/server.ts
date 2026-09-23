import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { errorHandler } from './common/middleware/error-handler.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { customersRoutes } from './modules/customers/customers.routes.js';
import { contractsRoutes } from './modules/contracts/contracts.routes.js';
import { quotationsRoutes } from './modules/quotations/quotations.routes.js';
import { expedientsRoutes } from './modules/expedients/expedients.routes.js';
import { workOrdersRoutes } from './modules/work-orders/work-orders.routes.js';
import { invoicesRoutes } from './modules/invoices/invoices.routes.js';
import { sumupRoutes } from './modules/sumup/sumup.routes.js';
import { paymentsRoutes } from './modules/payments/payments.routes.js';
import { bankRoutes } from './modules/bank/bank.routes.js';
import { exceptionsRoutes } from './modules/exceptions/exceptions.routes.js';
import { documentsRoutes } from './modules/documents/documents.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { companyRoutes } from './modules/company/company.routes.js';
import { templatesRoutes } from './modules/templates/templates.routes.js';
import { documentInstancesRoutes } from './modules/document-instances/document-instances.routes.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Permitir localhost, 127.0.0.1 y todas las IPs de red local (192.168.*, 172.*, 10.*)
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin) || origin === env.FRONTEND_URL) {
        return cb(null, true);
      }
      return cb(null, true);
    },
    credentials: true,
  });
  await fastify.register(cookie, {
    secret: env.COOKIE_SECRET,
  });
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
  });
  await fastify.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024,
    },
  });

  fastify.setErrorHandler(errorHandler);

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  fastify.get('/health/ready', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'connected' };
    } catch (err) {
      return reply.status(503).send({ status: 'not_ready', database: 'disconnected' });
    }
  });

  fastify.get('/api/v1/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  fastify.get('/api/v1/health/ready', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'connected' };
    } catch (err) {
      return reply.status(503).send({ status: 'not_ready', database: 'disconnected' });
    }
  });

  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(usersRoutes, { prefix: '/api/v1/users' });
  await fastify.register(customersRoutes, { prefix: '/api/v1/customers' });
  await fastify.register(contractsRoutes, { prefix: '/api/v1/contracts' });
  await fastify.register(quotationsRoutes, { prefix: '/api/v1/quotations' });
  await fastify.register(expedientsRoutes, { prefix: '/api/v1/expedients' });
  await fastify.register(workOrdersRoutes, { prefix: '/api/v1/work-orders' });
  await fastify.register(invoicesRoutes, { prefix: '/api/v1/invoices' });
  await fastify.register(sumupRoutes, { prefix: '/api/v1/sumup' });
  await fastify.register(paymentsRoutes, { prefix: '/api/v1/payments' });
  await fastify.register(bankRoutes, { prefix: '/api/v1/bank' });
  await fastify.register(exceptionsRoutes, { prefix: '/api/v1/exceptions' });
  await fastify.register(documentsRoutes, { prefix: '/api/v1/documents' });
  await fastify.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
  await fastify.register(companyRoutes, { prefix: '/api/v1/company' });
  await fastify.register(templatesRoutes, { prefix: '/api/v1/document-templates' });
  await fastify.register(documentInstancesRoutes, { prefix: '/api/v1/document-instances' });

  return fastify;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 SATEM Control API corriendo en http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

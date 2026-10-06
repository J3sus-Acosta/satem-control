import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server.js';

let appInstance: FastifyInstance | null = null;

export async function createTestApp(): Promise<FastifyInstance> {
  process.env.NODE_ENV = 'test';
  const app = await buildServer();
  await app.ready();
  return app;
}

export async function getTestApp(): Promise<FastifyInstance> {
  if (!appInstance) {
    appInstance = await createTestApp();
  }
  return appInstance;
}

export async function closeTestApp(): Promise<void> {
  if (appInstance) {
    await appInstance.close();
    appInstance = null;
  }
}

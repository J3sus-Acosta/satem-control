import { FastifyInstance } from 'fastify';
import {
  listBankReceiptsHandler,
  previewBankImportHandler,
  confirmBankImportHandler,
  reconcileHandler,
  autoMatchBankHandler,
} from './bank.controller.js';
import { authenticateGuard } from '../../common/middleware/auth-guard.js';

export async function bankRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/receipts', listBankReceiptsHandler);
  fastify.post('/import-preview', previewBankImportHandler);
  fastify.post('/import-confirm', confirmBankImportHandler);
  fastify.post('/reconcile', reconcileHandler);
  fastify.post('/auto-match', autoMatchBankHandler);
}

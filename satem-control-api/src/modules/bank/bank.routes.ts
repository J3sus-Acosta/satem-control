import { FastifyInstance } from 'fastify';
import { UserRole } from '@prisma/client';
import {
  listBankReceiptsHandler,
  previewBankImportHandler,
  confirmBankImportHandler,
  reconcileHandler,
  autoMatchBankHandler,
  deleteBankReceiptHandler,
} from './bank.controller.js';
import { authenticateGuard, roleGuard } from '../../common/middleware/auth-guard.js';

export async function bankRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateGuard);

  fastify.get('/receipts', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.OPERATIONS])] }, listBankReceiptsHandler);
  fastify.post('/import-preview', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING])] }, previewBankImportHandler);
  fastify.post('/import-confirm', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING])] }, confirmBankImportHandler);
  fastify.post('/reconcile', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING])] }, reconcileHandler);
  fastify.post('/auto-match', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING])] }, autoMatchBankHandler);
  fastify.delete('/receipts/:id', { preHandler: [roleGuard([UserRole.ADMIN, UserRole.ACCOUNTING])] }, (req: any, reply: any) => deleteBankReceiptHandler(req, reply));
}

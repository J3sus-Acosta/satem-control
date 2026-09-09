import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { Prisma, ReconciliationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, AppError } from '../../common/errors/app-error.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';

const confirmImportSchema = z.object({
  accountNumber: z.string().default('Santander CLP 123456789'),
  rows: z.array(
    z.object({
      transactionDate: z.string().transform((v) => new Date(v)),
      description: z.string().min(1),
      amountClp: z.number(),
      referenceNumber: z.string().optional(),
    })
  ).min(1, 'Debe incluir al menos 1 registro'),
  rawSourceFileId: z.string().uuid().optional(),
});

const reconcileSchema = z.object({
  bankReceiptId: z.string().uuid(),
  paymentAllocationId: z.string().uuid(),
  expectedAmountClp: z.number().positive(),
  receivedAmountClp: z.number().positive(),
  notes: z.string().optional(),
  expedientId: z.string().uuid().optional(),
});

export async function listBankReceiptsHandler(request: FastifyRequest, reply: FastifyReply) {
  const receipts = await prisma.bankReceipt.findMany({
    include: {
      reconciliations: { include: { paymentAllocation: { include: { payment: true } } } },
    },
    orderBy: { transactionDate: 'desc' },
  });

  return reply.send({ success: true, data: receipts });
}

export async function previewBankImportHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await request.file();
  if (!data) {
    throw new AppError('No se adjunto ningún archivo para la importación', 400);
  }

  const fileBuffer = await data.toBuffer();
  const fileContent = fileBuffer.toString('utf-8');

  let records: any[] = [];
  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw new AppError('Error al procesar la estructura del archivo CSV', 400);
  }

  const preview = [];
  for (const row of records) {
    const transactionDate = new Date(row.Fecha || row.fecha || row.Date || Date.now());
    const amountClp = parseFloat(row.Monto || row.monto || row.Amount || '0');
    const referenceNumber = row.Referencia || row.referencia || row.Ref || '';
    const description = row.Descripcion || row.descripcion || row.Detalle || 'Abono Santander';

    const existingMatch = await prisma.bankReceipt.findFirst({
      where: {
        transactionDate,
        amountClp,
        referenceNumber: referenceNumber || undefined,
      },
    });

    preview.push({
      transactionDate,
      description,
      amountClp,
      referenceNumber,
      isPossibleDuplicate: !!existingMatch,
    });
  }

  return reply.send({
    success: true,
    data: {
      totalRows: preview.length,
      duplicateRowsCount: preview.filter((p) => p.isPossibleDuplicate).length,
      rows: preview,
    },
  });
}

export async function confirmBankImportHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = confirmImportSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const imported = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdReceipts = [];
    for (const row of body.rows) {
      const code = await generateSequence(tx, 'BR');
      const item = await tx.bankReceipt.create({
        data: {
          code,
          bankName: 'Banco Santander Chile',
          accountNumber: body.accountNumber,
          transactionDate: row.transactionDate,
          description: row.description,
          amountClp: new Prisma.Decimal(row.amountClp),
          referenceNumber: row.referenceNumber || null,
          rawSourceFileId: body.rawSourceFileId || null,
          status: ReconciliationStatus.UNRECONCILED,
        },
      });
      createdReceipts.push(item);
    }

    await createAuditLog(tx, {
      userId,
      action: 'IMPORT_BANK_RECEIPTS',
      entity: 'BankReceipt',
      entityId: `BATCH_${createdReceipts.length}`,
      afterData: { count: createdReceipts.length },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return createdReceipts;
  });

  return reply.status(201).send({ success: true, data: imported });
}

export async function reconcileHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = reconcileSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const discrepancyAmountClp = Math.abs(body.expectedAmountClp - body.receivedAmountClp);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const reconciliation = await tx.bankReconciliation.create({
      data: {
        bankReceiptId: body.bankReceiptId,
        paymentAllocationId: body.paymentAllocationId,
        expectedAmountClp: new Prisma.Decimal(body.expectedAmountClp),
        receivedAmountClp: new Prisma.Decimal(body.receivedAmountClp),
        discrepancyAmountClp: new Prisma.Decimal(discrepancyAmountClp),
        notes: body.notes || null,
        reconciledById: userId,
      },
    });

    await tx.bankReceipt.update({
      where: { id: body.bankReceiptId },
      data: {
        status: discrepancyAmountClp > 0 ? ReconciliationStatus.DISCREPANCY : ReconciliationStatus.RECONCILED,
      },
    });

    if (body.expedientId) {
      await tx.expedientIntegrityItem.updateMany({
        where: { expedientId: body.expedientId, code: 'RECONCILIATION_COMPLETED' },
        data: { status: 'COMPLETED', completedAt: new Date(), completedById: userId },
      });
    }

    await createAuditLog(tx, {
      userId,
      action: 'RECONCILE_BANK_RECEIPT',
      entity: 'BankReconciliation',
      entityId: reconciliation.id,
      afterData: reconciliation,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reconciliation;
  });

  return reply.send({ success: true, data: result });
}

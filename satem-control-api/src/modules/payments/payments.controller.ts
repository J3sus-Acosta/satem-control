import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';

const createPaymentSchema = z.object({
  paymentRequestId: z.string().uuid().optional(),
  paymentDate: z.string().transform((v) => new Date(v)),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  paymentMethod: z.string().default('SumUp Link'),
  transactionRef: z.string().optional(),
  proofDocumentId: z.string().uuid().optional(),
  allocatedAmount: z.number().positive(),
  expedientId: z.string().uuid().optional(),
});

export async function listPaymentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const payments = await prisma.payment.findMany({
    where: { deletedAt: null },
    include: {
      paymentRequest: { include: { invoice: true } },
      allocations: { include: { reconciliations: true } },
      proofDocument: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: payments });
}

export async function createPaymentHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createPaymentSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const payment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const code = await generateSequence(tx, 'PAY');

    const created = await tx.payment.create({
      data: {
        code,
        paymentRequestId: body.paymentRequestId || null,
        paymentDate: body.paymentDate,
        amount: new Prisma.Decimal(body.amount),
        currency: body.currency,
        paymentMethod: body.paymentMethod,
        transactionRef: body.transactionRef || null,
        proofDocumentId: body.proofDocumentId || null,
        status: PaymentStatus.CONFIRMED,
        allocations: {
          create: [
            {
              allocatedAmount: new Prisma.Decimal(body.allocatedAmount),
            },
          ],
        },
      },
    });

    if (body.paymentRequestId) {
      await tx.paymentRequest.update({
        where: { id: body.paymentRequestId },
        data: { status: 'PAID', paymentDate: body.paymentDate },
      });
    }

    if (body.expedientId) {
      await tx.expedientIntegrityItem.updateMany({
        where: { expedientId: body.expedientId, code: 'PAYMENT_PROOF_PRESENT' },
        data: { status: 'COMPLETED', completedAt: new Date(), completedById: userId },
      });
    }

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_PAYMENT',
      entity: 'Payment',
      entityId: created.id,
      afterData: created,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: payment });
}

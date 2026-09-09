import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma, PaymentRequestStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';

const calculateSumupSchema = z.object({
  requestedAmount: z.number().positive(),
  exchangeRate: z.number().positive(),
  estimatedFeePercent: z.number().nonnegative().default(3.5),
});

const createPaymentRequestSchema = z.object({
  invoiceId: z.string().uuid(),
  requestedAmount: z.number().positive(),
  currency: z.string().default('USD'),
  exchangeRate: z.number().positive(),
  exchangeRateSource: z.string().default('Banco Central de Chile'),
  exchangeRateDate: z.string().transform((v) => new Date(v)),
  estimatedFeePercent: z.number().default(3.5),
  finalClpToCharge: z.number().positive(),
  isManualOverride: z.boolean().default(false),
  overrideReason: z.string().optional(),
  sumupLink: z.string().url().optional().or(z.literal('')),
  sumupTransactionId: z.string().optional(),
});

export async function calculateSumupHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = calculateSumupSchema.parse(request.body);

  const targetClpEquivalent = body.requestedAmount * body.exchangeRate;
  const feeDecimal = body.estimatedFeePercent / 100;
  const suggestedClpToCharge = Math.ceil(targetClpEquivalent / (1 - feeDecimal));

  return reply.send({
    success: true,
    data: {
      requestedAmount: body.requestedAmount,
      exchangeRate: body.exchangeRate,
      targetClpEquivalent,
      estimatedFeePercent: body.estimatedFeePercent,
      suggestedClpToCharge,
      feeAmountClpEstimated: Math.ceil(suggestedClpToCharge * feeDecimal),
    },
  });
}

export async function createPaymentRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createPaymentRequestSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const targetClpEquivalent = body.requestedAmount * body.exchangeRate;
  const feeDecimal = body.estimatedFeePercent / 100;
  const suggestedClpToCharge = Math.ceil(targetClpEquivalent / (1 - feeDecimal));

  const paymentRequest = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const code = await generateSequence(tx, 'SUM');

    const created = await tx.paymentRequest.create({
      data: {
        code,
        invoiceId: body.invoiceId,
        requestedAmount: new Prisma.Decimal(body.requestedAmount),
        currency: body.currency,
        exchangeRate: new Prisma.Decimal(body.exchangeRate),
        exchangeRateSource: body.exchangeRateSource,
        exchangeRateDate: body.exchangeRateDate,
        targetClpEquivalent: new Prisma.Decimal(targetClpEquivalent),
        estimatedFeePercent: new Prisma.Decimal(body.estimatedFeePercent),
        suggestedClpToCharge: new Prisma.Decimal(suggestedClpToCharge),
        finalClpToCharge: new Prisma.Decimal(body.finalClpToCharge),
        isManualOverride: body.isManualOverride,
        overrideReason: body.overrideReason || null,
        sumupLink: body.sumupLink || null,
        sumupTransactionId: body.sumupTransactionId || null,
        status: PaymentRequestStatus.LINK_GENERATED,
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_PAYMENT_REQUEST',
      entity: 'PaymentRequest',
      entityId: created.id,
      afterData: created,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: paymentRequest });
}

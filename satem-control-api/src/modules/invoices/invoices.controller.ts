import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma, TaxTreatment, InvoiceStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';

const createInvoiceSchema = z.object({
  expedientId: z.string().uuid(),
  siiFolio: z.number().int().positive('El Folio SII debe ser un número entero positivo'),
  siiDocType: z.number().int().default(110),
  issueDate: z.string().transform((v) => new Date(v)),
  currency: z.string().default('USD'),
  netAmount: z.number().positive(),
  vatAmount: z.number().default(0),
  totalAmount: z.number().positive(),
  taxTreatment: z.nativeEnum(TaxTreatment).default(TaxTreatment.EXPORT_SERVICE),
  pdfDocumentId: z.string().uuid().optional(),
  xmlDocumentId: z.string().uuid().optional(),
  attentionIds: z.array(z.string().uuid()).optional(),
});

export async function listInvoicesHandler(request: FastifyRequest, reply: FastifyReply) {
  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null },
    include: {
      expedient: { include: { customer: true } },
      attentions: true,
      paymentRequests: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: invoices });
}

export async function createInvoiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createInvoiceSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const code = await generateSequence(tx, 'FAC');

    const created = await tx.invoice.create({
      data: {
        code,
        siiFolio: body.siiFolio,
        siiDocType: body.siiDocType,
        expedientId: body.expedientId,
        issueDate: body.issueDate,
        currency: body.currency,
        netAmount: new Prisma.Decimal(body.netAmount),
        vatAmount: new Prisma.Decimal(body.vatAmount),
        totalAmount: new Prisma.Decimal(body.totalAmount),
        taxTreatment: body.taxTreatment,
        status: InvoiceStatus.ISSUED,
        pdfDocumentId: body.pdfDocumentId || null,
        xmlDocumentId: body.xmlDocumentId || null,
      },
    });

    if (body.attentionIds && body.attentionIds.length > 0) {
      await tx.attention.updateMany({
        where: { id: { in: body.attentionIds } },
        data: { invoiceId: created.id },
      });
    }

    await tx.expedientIntegrityItem.updateMany({
      where: { expedientId: body.expedientId, code: 'INVOICE_REGISTERED' },
      data: { status: 'COMPLETED', completedAt: new Date(), completedById: userId },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_INVOICE',
      entity: 'Invoice',
      entityId: created.id,
      afterData: created,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: invoice });
}

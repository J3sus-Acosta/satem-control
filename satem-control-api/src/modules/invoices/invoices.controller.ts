import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';
import { Prisma, TaxTreatment, InvoiceStatus, DocumentCategory } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError, NotFoundError } from '../../common/errors/app-error.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';

const createInvoiceSchema = z.object({
  expedientId: z.string().uuid(),
  siiFolio: z.coerce.number().int().positive('El Folio SII debe ser un número entero positivo'),
  siiDocType: z.coerce.number().int().default(110),
  issueDate: z.string().transform((v) => new Date(v)),
  currency: z.string().default('USD'),
  netAmount: z.coerce.number().positive(),
  vatAmount: z.coerce.number().default(0),
  totalAmount: z.coerce.number().positive(),
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
      pdfDocument: true,
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

    if (body.pdfDocumentId) {
      const existingLink = await tx.documentLink.findFirst({
        where: { documentId: body.pdfDocumentId, expedientId: body.expedientId },
      });
      if (!existingLink) {
        await tx.documentLink.create({
          data: {
            documentId: body.pdfDocumentId,
            entityType: 'EXPEDIENT',
            entityId: body.expedientId,
            expedientId: body.expedientId,
          },
        });
      }
    }

    const integrityItem = await tx.expedientIntegrityItem.findFirst({
      where: { expedientId: body.expedientId, code: 'INVOICE_REGISTERED' },
    });
    if (integrityItem) {
      await tx.expedientIntegrityItem.update({
        where: { id: integrityItem.id },
        data: {
          status: 'COMPLETED',
          documentId: body.pdfDocumentId || integrityItem.documentId,
          observation: `Factura SII N° ${body.siiFolio} registrada correctamente`,
          completedAt: new Date(),
          completedById: userId,
        },
      });
    } else {
      await tx.expedientIntegrityItem.create({
        data: {
          expedientId: body.expedientId,
          code: 'INVOICE_REGISTERED',
          name: 'Factura SII registrada',
          category: 'TAX',
          isRequired: true,
          status: 'COMPLETED',
          documentId: body.pdfDocumentId || null,
          observation: `Factura SII N° ${body.siiFolio} registrada correctamente`,
          completedAt: new Date(),
          completedById: userId,
        },
      });
    }

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

export async function uploadInvoiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as any)?.userId;

  let rawBuffer: Buffer | null = null;
  let filename = '';
  let mimetype = '';
  const fields: Record<string, any> = {};

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      filename = part.filename;
      mimetype = part.mimetype;
      rawBuffer = await part.toBuffer();
    } else {
      fields[part.fieldname] = (part as any).value;
    }
  }

  if (!rawBuffer) {
    throw new AppError('No se adjuntó ningún archivo de Factura SII', 400);
  }

  const expedientId = fields.expedientId;
  if (!expedientId) {
    throw new AppError('El parámetro expedientId es requerido', 400);
  }

  const expedient = await prisma.expedient.findUnique({
    where: { id: expedientId },
  });
  if (!expedient) {
    throw new AppError('Expediente no encontrado', 404);
  }

  const rawFolio = fields.siiFolio || fields.folio;
  const siiFolio = parseInt(rawFolio, 10);
  if (isNaN(siiFolio) || siiFolio <= 0) {
    throw new AppError('El Folio SII debe ser un número entero válido', 400);
  }

  const siiDocType = parseInt(fields.siiDocType || '110', 10);
  const issueDate = fields.issueDate ? new Date(fields.issueDate) : new Date();
  const currency = fields.currency || 'USD';
  const netAmount = parseFloat(fields.netAmount || fields.netAmountUsd || fields.totalAmount || '0');
  const vatAmount = parseFloat(fields.vatAmount || '0');
  const totalAmount = parseFloat(fields.totalAmount || fields.netAmount || fields.netAmountUsd || '0');
  const taxTreatment = (fields.taxTreatment as TaxTreatment) || expedient.taxTreatment || TaxTreatment.EXPORT_SERVICE;

  const fileSize = BigInt(rawBuffer.length);
  const sha256 = crypto.createHash('sha256').update(rawBuffer).digest('hex');

  const year = new Date().getFullYear();
  const targetDir = path.join(env.STORAGE_PATH, String(year), expedient.code, '06-Facturacion');
  fs.mkdirSync(targetDir, { recursive: true });

  const ext = path.extname(filename) || '.pdf';
  const internalName = `FAC_${siiFolio}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
  const storagePath = path.join(targetDir, internalName);

  fs.writeFileSync(storagePath, rawBuffer);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Crear Documento
    const document = await tx.document.create({
      data: {
        originalName: filename,
        internalName,
        mimeType: mimetype || 'application/pdf',
        fileSize,
        sha256,
        storagePath,
        category: DocumentCategory.INVOICE,
        uploadedById: userId,
        links: {
          create: [
            {
              entityType: 'EXPEDIENT',
              entityId: expedientId,
              expedientId: expedientId,
            },
          ],
        },
      },
    });

    // 2. Generar correlativo interno
    const code = await generateSequence(tx, 'FAC');

    // 3. Crear Registro de Factura
    const invoice = await tx.invoice.create({
      data: {
        code,
        siiFolio,
        siiDocType,
        expedientId,
        issueDate,
        currency,
        netAmount: new Prisma.Decimal(netAmount > 0 ? netAmount : 1),
        vatAmount: new Prisma.Decimal(vatAmount),
        totalAmount: new Prisma.Decimal(totalAmount > 0 ? totalAmount : (netAmount > 0 ? netAmount : 1)),
        taxTreatment,
        status: InvoiceStatus.ISSUED,
        pdfDocumentId: document.id,
      },
      include: {
        pdfDocument: true,
        expedient: true,
      },
    });

    // 4. Actualizar checklist de integridad del expediente (Upsert)
    const integrityItem = await tx.expedientIntegrityItem.findFirst({
      where: { expedientId, code: 'INVOICE_REGISTERED' },
    });
    if (integrityItem) {
      await tx.expedientIntegrityItem.update({
        where: { id: integrityItem.id },
        data: {
          status: 'COMPLETED',
          documentId: document.id,
          observation: `Factura SII N° ${siiFolio} cargada y verificada (Hash SHA-256: ${sha256.substring(0, 16)}...)`,
          completedAt: new Date(),
          completedById: userId,
        },
      });
    } else {
      await tx.expedientIntegrityItem.create({
        data: {
          expedientId,
          code: 'INVOICE_REGISTERED',
          name: 'Factura SII registrada',
          category: 'TAX',
          isRequired: true,
          status: 'COMPLETED',
          documentId: document.id,
          observation: `Factura SII N° ${siiFolio} cargada y verificada (Hash SHA-256: ${sha256.substring(0, 16)}...)`,
          completedAt: new Date(),
          completedById: userId,
        },
      });
    }

    // 5. Audit Log
    await createAuditLog(tx, {
      userId,
      action: 'UPLOAD_INVOICE',
      entity: 'Invoice',
      entityId: invoice.id,
      afterData: {
        code: invoice.code,
        siiFolio: invoice.siiFolio,
        documentId: document.id,
        originalName: filename,
        sha256,
      },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return { invoice, document };
  });

  return reply.status(201).send({
    success: true,
    data: result.invoice,
    message: `Factura SII Folio ${siiFolio} registrada y documento PDF incorporado exitosamente al expediente.`,
  });
}

export async function deleteInvoiceHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any)?.userId;
  const { id } = request.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { pdfDocument: true, xmlDocument: true },
  });

  if (!invoice) {
    throw new NotFoundError('Factura no encontrada');
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Desvincular de atenciones
    await tx.attention.updateMany({
      where: { invoiceId: id },
      data: { invoiceId: null },
    });

    // 2. Marcar factura como eliminada (Soft delete)
    await tx.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // 3. Verificar si quedan otras facturas activas para el expediente
    const remainingInvoices = await tx.invoice.findMany({
      where: { expedientId: invoice.expedientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (remainingInvoices.length > 0) {
      const latestInv = remainingInvoices[0];
      await tx.expedientIntegrityItem.updateMany({
        where: { expedientId: invoice.expedientId, code: 'INVOICE_REGISTERED' },
        data: {
          status: 'COMPLETED',
          documentId: latestInv.pdfDocumentId || null,
          observation: `Factura SII N° ${latestInv.siiFolio} registrada y verificada`,
        },
      });
    } else {
      await tx.expedientIntegrityItem.updateMany({
        where: { expedientId: invoice.expedientId, code: 'INVOICE_REGISTERED' },
        data: {
          status: 'PENDING',
          documentId: null,
          observation: null,
          completedAt: null,
          completedById: null,
        },
      });
    }

    // 4. Audit Log
    await createAuditLog(tx, {
      userId,
      action: 'DELETE_INVOICE',
      entity: 'Invoice',
      entityId: id,
      beforeData: {
        code: invoice.code,
        siiFolio: invoice.siiFolio,
        expedientId: invoice.expedientId,
      },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  });

  return reply.send({
    success: true,
    message: `Factura SII Folio ${invoice.siiFolio} (${invoice.code}) eliminada exitosamente.`,
  });
}


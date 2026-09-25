import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';
import { Prisma, PaymentStatus, DocumentCategory } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../common/errors/app-error.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';
import { convertImageToPdf } from '../../common/utils/image-to-pdf.js';
import { parseSumupPdfReport } from '../../common/utils/pdf-statement-parser.js';

const createPaymentSchema = z.object({
  paymentRequestId: z.string().uuid().optional(),
  paymentDate: z.string().transform((v) => new Date(v)),
  amount: z.coerce.number().positive(),
  currency: z.string().default('USD'),
  paymentMethod: z.string().default('SumUp Link'),
  transactionRef: z.string().optional(),
  proofDocumentId: z.string().uuid().optional(),
  allocatedAmount: z.coerce.number().positive().optional(),
  expedientId: z.string().uuid().optional(),
});

export async function listPaymentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const payments = await prisma.payment.findMany({
    where: { deletedAt: null },
    include: {
      paymentRequest: { include: { invoice: { include: { expedient: true } } } },
      allocations: { include: { reconciliations: true } },
      proofDocument: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: payments });
}

export async function parseSumUpProofHandler(request: FastifyRequest, reply: FastifyReply) {
  let rawBuffer: Buffer | null = null;
  let filename = '';

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      filename = part.filename;
      rawBuffer = await part.toBuffer();
    }
  }

  if (!rawBuffer) {
    throw new AppError('No se adjuntó ningún archivo para análisis', 400);
  }

  try {
    const parsed = await parseSumupPdfReport(rawBuffer);
    return reply.send({
      success: true,
      data: {
        isSumUpReport: parsed.grossAmount > 0 || parsed.netAmount > 0 || !!parsed.merchantId,
        grossAmount: parsed.grossAmount,
        feeAmount: parsed.feeAmount,
        netAmount: parsed.netAmount,
        referenceNumber: parsed.referenceNumber,
        periodDate: parsed.periodDate ? parsed.periodDate.toISOString().split('T')[0] : undefined,
        currency: parsed.currency || 'CLP',
        merchantId: parsed.merchantId,
        companyRut: parsed.companyRut,
      },
    });
  } catch (err: any) {
    return reply.send({
      success: true,
      data: {
        isSumUpReport: false,
        error: err.message,
      },
    });
  }
}

export async function createPaymentHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createPaymentSchema.parse(request.body);
  const userId = (request.user as any)?.userId;
  const allocAmount = body.allocatedAmount || body.amount;

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
              allocatedAmount: new Prisma.Decimal(allocAmount),
            },
          ],
        },
      },
      include: {
        proofDocument: true,
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
        data: {
          status: 'COMPLETED',
          documentId: body.proofDocumentId || null,
          observation: `Comprobante de pago ${body.paymentMethod} (${body.currency} ${body.amount}) registrado`,
          completedAt: new Date(),
          completedById: userId,
        },
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

export async function uploadPaymentProofHandler(request: FastifyRequest, reply: FastifyReply) {
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
    throw new AppError('No se adjuntó ningún archivo de comprobante de pago', 400);
  }

  const expedientId = fields.expedientId;
  if (!expedientId) {
    throw new AppError('El parámetro expedientId es requerido', 400);
  }

  const expedient = await prisma.expedient.findUnique({
    where: { id: expedientId },
    include: { customer: true },
  });
  if (!expedient) {
    throw new AppError('Expediente no encontrado', 404);
  }

  let amount = parseFloat(fields.amount || fields.totalAmount || '0');
  let currency = fields.currency || 'CLP';
  let paymentMethod = fields.paymentMethod || 'SumUp Link';
  let transactionRef = fields.transactionRef || fields.referenceNumber || null;
  let paymentDate = fields.paymentDate ? new Date(fields.paymentDate) : new Date();
  const paymentRequestId = fields.paymentRequestId || null;
  let allocatedAmount = parseFloat(fields.allocatedAmount || '0');

  // Auto-detección SumUp PDF si el archivo es un PDF y no se suministró todo manualmente
  const isPdf = filename.toLowerCase().endsWith('.pdf') || (rawBuffer.length > 4 && rawBuffer.toString('utf8', 0, 4) === '%PDF');
  if (isPdf) {
    try {
      const sumupData = await parseSumupPdfReport(rawBuffer);
      if (sumupData.grossAmount > 0 || sumupData.netAmount > 0) {
        if (!amount || amount <= 0) amount = sumupData.grossAmount;
        if (!allocatedAmount || allocatedAmount <= 0) allocatedAmount = sumupData.netAmount;
        if (!transactionRef && sumupData.referenceNumber) transactionRef = sumupData.referenceNumber;
        if (sumupData.periodDate && !fields.paymentDate) paymentDate = sumupData.periodDate;
        currency = 'CLP';
        paymentMethod = 'SumUp Link';
      }
    } catch {
      // Si no es SumUp PDF, continuar normalmente
    }
  }

  if (isNaN(amount) || amount <= 0) {
    throw new AppError('El monto pagado debe ser mayor a 0', 400);
  }
  if (!allocatedAmount || allocatedAmount <= 0) {
    allocatedAmount = amount;
  }

  const rawExt = path.extname(filename).toLowerCase();
  const isImage = mimetype.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].includes(rawExt);

  let finalBuffer = rawBuffer;
  let finalMime = mimetype || 'application/pdf';
  let finalOriginalName = filename;

  if (isImage) {
    // Convertir la imagen a un PDF oficial SATEM estandarizado
    const { pdfBuffer } = await convertImageToPdf({
      imageBuffer: rawBuffer,
      mimeType: mimetype || 'image/png',
      originalFileName: filename,
      docTitle: 'COMPROBANTE DE PAGO Y TRANSFERENCIA',
      docSubtitle: `Folio Expediente: ${expedient.code} • Cliente: ${expedient.customer?.legalName || 'N/A'}`,
      metadata: [
        { label: 'Expediente', value: `${expedient.code} — ${expedient.title}` },
        { label: 'Cliente', value: `${expedient.customer?.legalName || 'N/A'} (${expedient.customer?.taxId || 'N/A'})` },
        { label: 'Monto Total', value: `${currency} $${amount.toLocaleString('es-CL')}` },
        { label: 'Monto Neto Transferido', value: `${currency} $${allocatedAmount.toLocaleString('es-CL')}` },
        { label: 'Método de Pago', value: paymentMethod },
        { label: 'Fecha del Pago', value: paymentDate.toLocaleDateString('es-CL') },
        { label: 'N° Transacción / Ref', value: transactionRef || 'No informada' },
        { label: 'Fecha Registro', value: new Date().toLocaleString('es-CL') },
      ],
    });

    finalBuffer = pdfBuffer;
    finalMime = 'application/pdf';
    finalOriginalName = filename.replace(/\.[^/.]+$/, '') + '.pdf';
  }

  const fileSize = BigInt(finalBuffer.length);
  const sha256 = crypto.createHash('sha256').update(finalBuffer).digest('hex');

  const year = new Date().getFullYear();
  const targetDir = path.join(env.STORAGE_PATH, String(year), expedient.code, '08-Pagos');
  fs.mkdirSync(targetDir, { recursive: true });

  const cleanRef = transactionRef ? `_${transactionRef.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  const internalName = `PAGO${cleanRef}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.pdf`;
  const storagePath = path.join(targetDir, internalName);

  fs.writeFileSync(storagePath, finalBuffer);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Crear Documento en BD
    const document = await tx.document.create({
      data: {
        originalName: finalOriginalName,
        internalName,
        mimeType: finalMime,
        fileSize,
        sha256,
        storagePath,
        category: DocumentCategory.PAYMENT_PROOF,
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

    // 2. Generar correlativo de pago
    const code = await generateSequence(tx, 'PAY');

    // 3. Crear Registro de Pago
    const payment = await tx.payment.create({
      data: {
        code,
        paymentRequestId: paymentRequestId || null,
        paymentDate,
        amount: new Prisma.Decimal(amount),
        currency,
        paymentMethod,
        transactionRef,
        proofDocumentId: document.id,
        status: PaymentStatus.CONFIRMED,
        allocations: {
          create: [
            {
              allocatedAmount: new Prisma.Decimal(allocatedAmount),
            },
          ],
        },
      },
      include: {
        proofDocument: true,
      },
    });

    // 4. Si hay paymentRequestId, marcarlo como pagado
    if (paymentRequestId) {
      await tx.paymentRequest.update({
        where: { id: paymentRequestId },
        data: { status: 'PAID', paymentDate },
      });
    }

    // 5. Actualizar checklist de integridad
    await tx.expedientIntegrityItem.updateMany({
      where: { expedientId, code: 'PAYMENT_PROOF_PRESENT' },
      data: {
        status: 'COMPLETED',
        documentId: document.id,
        observation: `Informe de Depósito ${paymentMethod} (${currency} $${amount.toLocaleString('es-CL')}, Neto abonado $${allocatedAmount.toLocaleString('es-CL')}) integrado en PDF oficial (Hash SHA-256: ${sha256.substring(0, 16)}...)`,
        completedAt: new Date(),
        completedById: userId,
      },
    });

    // 6. Audit Log
    await createAuditLog(tx, {
      userId,
      action: 'UPLOAD_PAYMENT_PROOF',
      entity: 'Payment',
      entityId: payment.id,
      afterData: {
        code: payment.code,
        amount: payment.amount.toString(),
        allocatedAmount: allocatedAmount.toString(),
        currency,
        documentId: document.id,
        originalName: finalOriginalName,
        sha256,
      },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return { payment, document };
  });

  return reply.status(201).send({
    success: true,
    data: result.payment,
    message: `Informe de pago procesado e integrado exitosamente como PDF oficial en el expediente.`,
  });
}

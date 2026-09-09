import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { Prisma, ExpedientOrigin, ExpedientStatus, TaxTreatment } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, AppError } from '../../common/errors/app-error.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';

const createExpedientSchema = z.object({
  customerId: z.string().uuid(),
  customerEntityId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  quotationId: z.string().uuid().optional(),
  origin: z.nativeEnum(ExpedientOrigin).default(ExpedientOrigin.DIRECT_REQUEST),
  title: z.string().min(3),
  description: z.string().optional(),
  taxTreatment: z.nativeEnum(TaxTreatment).default(TaxTreatment.EXPORT_SERVICE),
  vatRate: z.number().default(0),
  taxJustification: z.string().optional(),
});

const closeExpedientSchema = z.object({
  status: z.enum(['CLOSED', 'CLOSED_WITH_EXCEPTION']),
  reason: z.string().min(5, 'Motivo de cierre requerido'),
});

export async function listExpedientsHandler(request: FastifyRequest, reply: FastifyReply) {
  const expedients = await prisma.expedient.findMany({
    where: { deletedAt: null },
    include: {
      customer: true,
      contract: true,
      workOrders: true,
      invoices: true,
      integrityItems: true,
      exceptions: { where: { status: 'OPEN' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: expedients });
}

export async function getExpedientHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const expedient = await prisma.expedient.findUnique({
    where: { id: request.params.id },
    include: {
      customer: { include: { country: true } },
      customerEntity: true,
      contract: { include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } } },
      quotation: { include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } } },
      workOrders: {
        include: {
          attentions: { include: { technicians: { include: { technician: true } }, serviceType: true } },
          receptionConformity: { include: { document: true } },
        },
      },
      invoices: {
        include: {
          pdfDocument: true,
          xmlDocument: true,
          paymentRequests: { include: { payments: { include: { allocations: { include: { reconciliations: true } } } } } },
        },
      },
      integrityItems: { include: { document: true } },
      exceptions: true,
      snapshots: { orderBy: { closedAt: 'desc' }, take: 1 },
      documentLinks: { include: { document: true } },
      documentInstances: true,
    },
  });

  if (!expedient || expedient.deletedAt) {
    throw new NotFoundError('Expediente no encontrado');
  }

  return reply.send({ success: true, data: expedient });
}

export async function createExpedientHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createExpedientSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const expedient = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const code = await generateSequence(tx, 'EXP');

    const created = await tx.expedient.create({
      data: {
        code,
        customerId: body.customerId,
        customerEntityId: body.customerEntityId || null,
        contractId: body.contractId || null,
        quotationId: body.quotationId || null,
        origin: body.origin,
        title: body.title,
        description: body.description || null,
        taxTreatment: body.taxTreatment,
        vatRate: new Prisma.Decimal(body.vatRate),
        taxJustification: body.taxJustification || null,
        status: ExpedientStatus.OPEN,
      },
    });

    const baseItems = [
      { code: 'CUSTOMER_DATA_COMPLETE', name: 'Datos del Cliente completos', category: 'DOCUMENTAL', isRequired: true },
      { code: 'WORK_ORDER_PRESENT', name: 'Orden de Trabajo autorizada', category: 'OPERATIONAL', isRequired: true },
      { code: 'ATTENTION_REGISTERED', name: 'Atención(es) técnica(s) ejecutadas', category: 'OPERATIONAL', isRequired: true },
      { code: 'RECEPTION_SIGNED', name: 'Recepción Conforme firmada por cliente', category: 'OPERATIONAL', isRequired: true },
    ];

    if (body.origin === ExpedientOrigin.QUOTE) {
      baseItems.push({ code: 'QUOTATION_PRESENT', name: 'Cotización aprobada registrada', category: 'DOCUMENTAL', isRequired: true });
    }

    if (body.taxTreatment !== TaxTreatment.NO_INVOICE) {
      baseItems.push({ code: 'INVOICE_REGISTERED', name: 'Factura SII registrada', category: 'TAX', isRequired: true });
      baseItems.push({ code: 'PAYMENT_PROOF_PRESENT', name: 'Comprobante de pago registrado', category: 'FINANCIAL', isRequired: true });
      baseItems.push({ code: 'RECONCILIATION_COMPLETED', name: 'Conciliación bancaria Santander', category: 'FINANCIAL', isRequired: true });
    }

    for (const item of baseItems) {
      await tx.expedientIntegrityItem.create({
        data: {
          expedientId: created.id,
          code: item.code,
          name: item.name,
          category: item.category,
          isRequired: item.isRequired,
          status: 'PENDING',
        },
      });
    }

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_EXPEDIENT',
      entity: 'Expedient',
      entityId: created.id,
      afterData: created,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: expedient });
}

export async function closeExpedientHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const body = closeExpedientSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const expedient = await prisma.expedient.findUnique({
    where: { id },
    include: {
      customer: true,
      contract: true,
      workOrders: { include: { attentions: true, receptionConformity: true } },
      invoices: true,
      integrityItems: true,
      exceptions: { where: { status: 'OPEN' } },
      documentInstances: true,
    },
  });

  if (!expedient || expedient.deletedAt) {
    throw new NotFoundError('Expediente no encontrado');
  }

  const isExceptionClose = body.status === 'CLOSED_WITH_EXCEPTION';

  if (!isExceptionClose) {
    const unfulfilledRequired = expedient.integrityItems.filter((i: any) => i.isRequired && i.status === 'PENDING');
    if (unfulfilledRequired.length > 0) {
      throw new AppError(
        'No se puede cerrar el expediente normalmente porque tiene ítems documentales/financieros pendientes. Use "Cierre con Excepción" especificando la justificación.',
        400,
        'INTEGRITY_INCOMPLETE'
      );
    }
  }

  const updatedExpedient = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const closed = await tx.expedient.update({
      where: { id },
      data: {
        status: isExceptionClose ? ExpedientStatus.CLOSED_WITH_EXCEPTION : ExpedientStatus.CLOSED,
        closedAt: new Date(),
        closedById: userId,
        closeReason: body.reason,
        closeHasException: isExceptionClose,
      },
    });

    const snapshotContent = JSON.stringify({
      expedient: closed,
      customer: expedient.customer,
      contract: expedient.contract,
      workOrders: expedient.workOrders,
      invoices: expedient.invoices,
      documentInstances: expedient.documentInstances,
      integrityChecklist: expedient.integrityItems,
      openExceptions: expedient.exceptions,
      closedAt: new Date().toISOString(),
      closedByUserId: userId,
      reason: body.reason,
    });

    const checksumSha256 = crypto.createHash('sha256').update(snapshotContent).digest('hex');

    await tx.expedientSnapshot.create({
      data: {
        expedientId: id,
        snapshotData: JSON.parse(snapshotContent),
        checksumSha256,
        closedById: userId,
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CLOSE_EXPEDIENT',
      entity: 'Expedient',
      entityId: id,
      beforeData: { status: expedient.status },
      afterData: closed,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return closed;
  });

  return reply.send({ success: true, data: updatedExpedient });
}

export async function downloadExpedientBundleHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const expedient = await prisma.expedient.findUnique({
    where: { id: request.params.id },
    include: {
      documentLinks: { include: { document: true } },
      documentInstances: true,
    },
  });

  if (!expedient) {
    throw new NotFoundError('Expediente no encontrado');
  }

  reply.header('Content-Type', 'application/zip');
  reply.header('Content-Disposition', `attachment; filename="${expedient.code}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(reply.raw);

  // Definición de las 12 carpetas estandarizadas de SATEM
  const folders = [
    '01-Contrato',
    '02-Cotizacion',
    '03-Orden-Trabajo',
    '04-Atenciones',
    '05-Recepcion-Conforme',
    '06-Facturacion',
    '07-SumUp',
    '08-Pagos',
    '09-Banco',
    '10-Evidencias',
    '11-Reportes',
    '12-Otros',
  ];

  // Crear carpetas vacías requeridas en la raíz del ZIP
  for (const folder of folders) {
    archive.append('', { name: `${expedient.code}/${folder}/.keep` });
  }

  // 1. Agregar Instancias Documentales Generadas y Firmadas
  for (const inst of expedient.documentInstances) {
    let targetFolder = '12-Otros';
    if (inst.category === 'CONTRACT') targetFolder = '01-Contrato';
    else if (inst.category === 'QUOTATION') targetFolder = '02-Cotizacion';
    else if (inst.category === 'WORK_ORDER') targetFolder = '03-Orden-Trabajo';
    else if (inst.category === 'ATTENTION_REPORT' || inst.category === 'SERVICE_REPORT') targetFolder = '04-Atenciones';
    else if (inst.category === 'RECEPTION_CONFORMITY') targetFolder = '05-Recepcion-Conforme';

    if (fs.existsSync(inst.generatedPdfPath)) {
      archive.file(inst.generatedPdfPath, { name: `${expedient.code}/${targetFolder}/${inst.documentNumber}.pdf` });
    }
    if (inst.signedPdfPath && fs.existsSync(inst.signedPdfPath)) {
      archive.file(inst.signedPdfPath, { name: `${expedient.code}/${targetFolder}/${inst.documentNumber}-FIRMADO.pdf` });
    }
  }

  // 2. Agregar Documentos adjuntos tradicionales (Facturas, Evidencias, Bancos)
  for (const link of expedient.documentLinks) {
    if (fs.existsSync(link.document.storagePath)) {
      let targetFolder = '10-Evidencias';
      const cat = link.document.category;
      if (cat === 'INVOICE') targetFolder = '06-Facturacion';
      else if (cat === 'SUMUP_PROOF') targetFolder = '07-SumUp';
      else if (cat === 'PAYMENT_PROOF') targetFolder = '08-Pagos';
      else if (cat === 'BANK_RECEIPT') targetFolder = '09-Banco';
      else if (cat === 'REPORT') targetFolder = '11-Reportes';

      archive.file(link.document.storagePath, { name: `${expedient.code}/${targetFolder}/${link.document.originalName}` });
    }
  }

  await archive.finalize();
}

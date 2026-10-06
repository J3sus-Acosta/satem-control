import { FastifyRequest, FastifyReply } from 'fastify';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../common/errors/app-error.js';
import { resolveStoragePath } from '../../common/utils/storage-path.js';
import { unifyWorkOrders } from '../expedients/expedients.controller.js';

async function getClientEntityRestrictions(clientUserId: string) {
  const access = await prisma.clientUserEntityAccess.findMany({
    where: { clientUserId },
  });
  return access.map((a) => a.customerEntityId);
}

export async function listPortalExpedientsHandler(
  request: FastifyRequest<{ Querystring: { search?: string; status?: string } }>,
  reply: FastifyReply
) {
  const clientUser = (request.user as any);
  const { search, status } = request.query;

  const allowedEntityIds = await getClientEntityRestrictions(clientUser.clientUserId);

  const where: any = {
    customerId: clientUser.customerId,
    deletedAt: null,
  };

  if (allowedEntityIds.length > 0) {
    where.OR = [
      { customerEntityId: { in: allowedEntityIds } },
      { customerEntityId: null },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { code: { contains: search } },
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      },
    ];
  }

  const expedients = await prisma.expedient.findMany({
    where,
    include: {
      customerEntity: { select: { id: true, name: true } },
      contract: { select: { id: true, code: true, title: true, type: true } },
      workOrders: {
        where: { deletedAt: null },
        include: { receptionConformity: true },
      },
      documentInstances: {
        select: {
          id: true,
          documentNumber: true,
          category: true,
          workOrderId: true,
          expedientId: true,
          status: true,
          signedAt: true,
          signedPdfPath: true,
          generatedPdfPath: true,
          generatedAt: true,
          template: { select: { id: true, code: true, name: true, category: true } },
        },
      },
      _count: {
        select: {
          workOrders: true,
          attentions: true,
          documentInstances: true,
          documentLinks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({
    success: true,
    data: expedients.map((exp) => {
      const unifiedWos = unifyWorkOrders(exp.workOrders || [], exp.documentInstances || [], exp);
      return {
        id: exp.id,
        code: exp.code,
        title: exp.title,
        description: exp.description,
        status: exp.status,
        origin: exp.origin,
        createdAt: exp.createdAt,
        closedAt: exp.closedAt,
        customerEntity: exp.customerEntity,
        contract: exp.contract,
        stats: {
          workOrdersCount: unifiedWos.length,
          attentionsCount: exp._count.attentions,
          documentsCount: exp._count.documentInstances + exp._count.documentLinks,
        },
      };
    }),
  });
}

export async function getPortalExpedientDetailHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const clientUser = (request.user as any);
  const { id } = request.params;

  const allowedEntityIds = await getClientEntityRestrictions(clientUser.clientUserId);

  const expedient = await prisma.expedient.findFirst({
    where: {
      id,
      customerId: clientUser.customerId,
      deletedAt: null,
    },
    include: {
      customer: { select: { id: true, legalName: true, taxId: true, email: true } },
      customerEntity: { select: { id: true, name: true, taxId: true } },
      contract: { select: { id: true, code: true, title: true, type: true, startDate: true, endDate: true } },
      workOrders: {
        where: { deletedAt: null },
        include: {
          receptionConformity: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      attentions: {
        where: { deletedAt: null },
        include: {
          serviceType: { select: { id: true, name: true, code: true } },
          technicians: {
            include: {
              technician: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { attentionDate: 'desc' },
      },
      integrityItems: {
        orderBy: { code: 'asc' },
      },
    },
  });

  if (!expedient) {
    throw new NotFoundError('Expediente no encontrado o no tiene acceso a él');
  }

  if (allowedEntityIds.length > 0 && expedient.customerEntityId && !allowedEntityIds.includes(expedient.customerEntityId)) {
    throw new ForbiddenError('No tiene permisos para ver este expediente según las restricciones de su cuenta');
  }

  // Cargar instancias documentales vinculadas
  const orConditions: any[] = [{ expedientId: expedient.id }];
  if (expedient.contractId) orConditions.push({ contractId: expedient.contractId });
  if (expedient.quotationId) orConditions.push({ quotationId: expedient.quotationId });

  const documentInstances = await prisma.documentInstance.findMany({
    where: { OR: orConditions },
    include: {
      template: { select: { id: true, code: true, name: true, category: true } },
      signatures: true,
    },
    orderBy: { generatedAt: 'desc' },
  });

  // Cargar documentos subidos (evidencias, respaldos)
  const documentLinks = await prisma.documentLink.findMany({
    where: { expedientId: expedient.id },
    include: {
      document: {
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          fileSize: true,
          category: true,
          createdAt: true,
          sha256: true,
        },
      },
    },
  });

  const unifiedWorkOrders = unifyWorkOrders(expedient.workOrders, documentInstances, expedient);

  return reply.send({
    success: true,
    data: {
      expedient: {
        ...expedient,
        workOrders: unifiedWorkOrders,
      },
      documentInstances,
      attachedDocuments: documentLinks.map((l) => l.document),
    },
  });
}

export async function downloadPortalExpedientBundleHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const clientUser = (request.user as any);
  const { id } = request.params;

  const allowedEntityIds = await getClientEntityRestrictions(clientUser.clientUserId);

  const expedient = await prisma.expedient.findFirst({
    where: {
      id,
      customerId: clientUser.customerId,
      deletedAt: null,
    },
    include: {
      customer: true,
      contract: true,
      integrityItems: true,
      documentLinks: { include: { document: true } },
    },
  });

  if (!expedient) {
    throw new NotFoundError('Expediente no encontrado');
  }

  if (allowedEntityIds.length > 0 && expedient.customerEntityId && !allowedEntityIds.includes(expedient.customerEntityId)) {
    throw new ForbiddenError('No tiene permisos para descargar este expediente');
  }

  // Buscar todas las instancias vinculadas
  const orConditions: any[] = [{ expedientId: expedient.id }];
  if (expedient.contractId) orConditions.push({ contractId: expedient.contractId });
  if (expedient.quotationId) orConditions.push({ quotationId: expedient.quotationId });

  const docInstances = await prisma.documentInstance.findMany({
    where: { OR: orConditions },
    include: { template: true },
    orderBy: { generatedAt: 'asc' },
  });

  reply.header('Content-Type', 'application/zip');
  reply.header('Content-Disposition', `attachment; filename="${expedient.code}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      request.log.warn({ err }, 'Advertencia al archivar archivo en bundle del portal');
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    request.log.error({ err }, 'Error durante la compresión del bundle zip del portal');
    throw err;
  });

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

  for (const folder of folders) {
    archive.append('', { name: `${folder}/.keep` });
  }

  const manifestLines = [
    `========================================================================`,
    `SATEM SOLUCIONES INTELIGENTES SpA - BUNDLE OFICIAL DE EXPEDIENTE`,
    `========================================================================`,
    `Código Expediente: ${expedient.code}`,
    `Título: ${expedient.title}`,
    `Cliente: ${expedient.customer?.legalName || 'N/A'} (RUT: ${expedient.customer?.taxId || 'N/A'})`,
    `Fecha Emisión Bundle: ${new Date().toISOString()}`,
    `Estado del Expediente: ${expedient.status}`,
    `========================================================================\n`,
    `DOCUMENTOS INCLUIDOS EN ESTE PAQUETE:\n`,
  ];

  // Agregar instancias documentales generadas
  for (const inst of docInstances) {
    let targetFolder = '12-Otros';
    switch (inst.category) {
      case 'CONTRACT':
        targetFolder = '01-Contrato';
        break;
      case 'QUOTATION':
      case 'COMMERCIAL_PROPOSAL':
        targetFolder = '02-Cotizacion';
        break;
      case 'WORK_ORDER':
        targetFolder = '03-Orden-Trabajo';
        break;
      case 'ATTENTION_REPORT':
      case 'SERVICE_REPORT':
        targetFolder = '04-Atenciones';
        break;
      case 'RECEPTION_CONFORMITY':
        targetFolder = '05-Recepcion-Conforme';
        break;
    }

    const resolvedPdf = resolveStoragePath(inst.generatedPdfPath);
    if (resolvedPdf && fs.existsSync(resolvedPdf)) {
      const fileName = `${inst.documentNumber}.pdf`;
      archive.file(resolvedPdf, { name: `${targetFolder}/${fileName}` });
      manifestLines.push(`[${targetFolder}] ${fileName}`);
      manifestLines.push(`    * SHA-256 Original: ${inst.generatedPdfHash}`);
    }

    const resolvedSignedPdf = resolveStoragePath(inst.signedPdfPath);
    if (resolvedSignedPdf && fs.existsSync(resolvedSignedPdf)) {
      const signedFileName = `${inst.documentNumber}_FIRMADO.pdf`;
      archive.file(resolvedSignedPdf, { name: `${targetFolder}/${signedFileName}` });
      manifestLines.push(`[${targetFolder}] ${signedFileName}`);
      manifestLines.push(`    * SHA-256 Firma: ${inst.signedPdfHash || 'N/A'}`);
    }
  }

  // Agregar documentos adjuntos
  for (const link of expedient.documentLinks) {
    const doc = link.document;
    if (!doc) continue;

    let targetFolder = '10-Evidencias';
    switch (doc.category) {
      case 'CONTRACT':
      case 'SOW':
        targetFolder = '01-Contrato';
        break;
      case 'QUOTATION':
        targetFolder = '02-Cotizacion';
        break;
      case 'WORK_ORDER':
        targetFolder = '03-Orden-Trabajo';
        break;
      case 'ATTENTION':
        targetFolder = '04-Atenciones';
        break;
      case 'RECEPTION':
        targetFolder = '05-Recepcion-Conforme';
        break;
      case 'INVOICE':
        targetFolder = '06-Facturacion';
        break;
      case 'SUMUP_PROOF':
        targetFolder = '07-SumUp';
        break;
      case 'PAYMENT_PROOF':
        targetFolder = '08-Pagos';
        break;
      case 'BANK_RECEIPT':
        targetFolder = '09-Banco';
        break;
      case 'EVIDENCE':
        targetFolder = '10-Evidencias';
        break;
      case 'REPORT':
        targetFolder = '11-Reportes';
        break;
      default:
        targetFolder = '12-Otros';
    }

    const resolvedPath = resolveStoragePath(doc.storagePath);
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      const safeName = `${doc.id.slice(0, 8)}_${doc.originalName}`;
      archive.file(resolvedPath, { name: `${targetFolder}/${safeName}` });
      manifestLines.push(`[${targetFolder}] ${safeName} (SHA-256: ${doc.sha256})`);
    }
  }

  manifestLines.push(`\n========================================================================`);
  manifestLines.push(`Fin del manifiesto SATEM Control.`);
  archive.append(manifestLines.join('\n'), { name: 'MANIFIESTO_INTEGRIDAD.txt' });

  archive.pipe(reply.raw);
  await archive.finalize();
}

export async function downloadPortalDocumentInstancePdfHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const clientUser = (request.user as any);
  const { id } = request.params;

  const instance = await prisma.documentInstance.findFirst({
    where: {
      id,
      OR: [
        { customerId: clientUser.customerId },
        { expedient: { customerId: clientUser.customerId } },
      ],
    },
  });

  if (!instance) {
    throw new NotFoundError('Documento no encontrado o no tiene acceso');
  }

  const pdfPathToUse = instance.signedPdfPath || instance.generatedPdfPath;
  const physicalPath = resolveStoragePath(pdfPathToUse);

  if (!physicalPath || !fs.existsSync(physicalPath)) {
    throw new NotFoundError('El archivo PDF no existe físicamente en el servidor');
  }

  reply.header('Content-Type', 'application/pdf');
  reply.header('Content-Disposition', `inline; filename="${instance.documentNumber}${instance.signedPdfPath ? '_FIRMADO' : ''}.pdf"`);
  const stream = fs.createReadStream(physicalPath);
  return reply.send(stream);
}

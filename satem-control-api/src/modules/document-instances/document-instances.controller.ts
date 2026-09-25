import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { TemplateCategory, DocumentInstanceStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { NotFoundError, AppError } from '../../common/errors/app-error.js';
import { compileTemplate } from '../../common/utils/template-engine.js';
import { createAuditLog } from '../../common/utils/audit.js';
import { generateSequence, SequencePrefix } from '../../common/utils/sequence.js';

const generateDocumentSchema = z.object({
  templateId: z.string().uuid(),
  templateVersionId: z.string().uuid().optional(),
  documentNumber: z.string().optional(),
  customerId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  quotationId: z.string().uuid().optional(),
  expedientId: z.string().uuid().optional(),
  workOrderId: z.string().uuid().optional(),
  customVariables: z.record(z.any()).optional(),
  customHtml: z.string().optional(),
});

export async function listDocumentInstancesHandler(request: FastifyRequest, reply: FastifyReply) {
  const instances = await prisma.documentInstance.findMany({
    include: {
      template: true,
      customer: true,
      contract: true,
      expedient: true,
    },
    orderBy: { generatedAt: 'desc' },
  });

  return reply.send({ success: true, data: instances });
}

export async function generateDocumentInstanceHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = generateDocumentSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const template = await prisma.documentTemplate.findUnique({
    where: { id: body.templateId },
    include: { versions: { orderBy: { versionNumber: 'desc' } } },
  });

  if (!template) {
    throw new NotFoundError('Plantilla no encontrada');
  }

  const targetVersion = body.templateVersionId
    ? template.versions.find((v) => v.id === body.templateVersionId)
    : template.versions.find((v) => v.isPublished) || template.versions[0];

  if (!targetVersion) {
    throw new AppError('No existe una versión publicada para esta plantilla', 400);
  }

  const company: any = (await prisma.companyConfig.findUnique({ where: { id: 'DEFAULT' } })) || {};
  let customer: any = {};
  let contract: any = {};
  let expedient: any = {};

  if (body.customerId) {
    customer = (await prisma.customer.findUnique({ where: { id: body.customerId }, include: { country: true } })) || {};
  }
  if (body.contractId) {
    contract = (await prisma.contract.findUnique({ where: { id: body.contractId } })) || {};
  }
  if (body.expedientId) {
    expedient = (await prisma.expedient.findUnique({ where: { id: body.expedientId } })) || {};
  } else if (body.contractId) {
    const expFound = await prisma.expedient.findFirst({
      where: { contractId: body.contractId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (expFound) {
      expedient = expFound;
    }
  }

  // Generación automática del código/número correlativo oficial si no viene o es genérico
  const year = new Date().getFullYear();
  let finalDocNumber = body.documentNumber?.trim();
  if (!finalDocNumber || finalDocNumber === 'AUTO' || finalDocNumber === '' || finalDocNumber.startsWith('DOC-')) {
    const categoryPrefixMap: Record<TemplateCategory, SequencePrefix> = {
      CONTRACT: 'SOW',
      QUOTATION: 'COT',
      WORK_ORDER: 'OT',
      ATTENTION_REPORT: 'AT',
      RECEPTION_CONFORMITY: 'RC',
      SERVICE_REPORT: 'SRV',
      COMMERCIAL_PROPOSAL: 'PROP',
    };
    const prefix = categoryPrefixMap[template.category] || 'DOC';
    finalDocNumber = await prisma.$transaction(async (tx) => {
      return generateSequence(tx, prefix, year);
    });
  }

  const sanitizeCustomVars = { ...(body.customVariables || {}) };
  delete sanitizeCustomVars.empresa; // Strict protection: user cannot overwrite empresa.*

  const typeLabels: Record<string, string> = {
    HOURLY: 'Bolsa de Horas (Hourly)',
    PER_ATTENTION: 'Por Atención / Incidencia',
    ATTENTION_PACKAGE: 'Paquete de Atenciones',
    FIXED_PERIOD: 'Período Fijo / Retainer',
    RETAINER: 'Retainer Mensual',
    OTHER: 'Servicios Profesionales TI',
  };

  const modalityLabels: Record<string, string> = {
    RECURRING: 'Recurrente / Periódico',
    ONE_TIME: 'Servicio Único',
    OPEN_ENDED: 'Plazo Indefinido / Según Consumo',
  };

  const rawTotal = contract.totalAmount != null ? Number(contract.totalAmount) : (parseFloat(sanitizeCustomVars.contrato?.valor) || 0);
  const rawHours = contract.contractedHours != null ? Number(contract.contractedHours) : (parseFloat(sanitizeCustomVars.contrato?.horas) || 0);
  let calculatedRate = '';
  if (contract.rate != null) {
    calculatedRate = `$${Number(contract.rate).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${contract.currency || 'USD'}/hr`;
  } else if (rawHours > 0 && rawTotal > 0) {
    calculatedRate = `$${(rawTotal / rawHours).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${contract.currency || sanitizeCustomVars.contrato?.moneda || 'USD'}/hr`;
  }

  const formatDateStr = (d?: Date | string | null) => {
    if (!d) return '';
    try {
      const dateObj = typeof d === 'string' ? new Date(d) : d;
      if (isNaN(dateObj.getTime())) return String(d);
      return dateObj.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return String(d);
    }
  };

  const todayFormatted = formatDateStr(new Date());
  const startFormatted = contract.startDate ? formatDateStr(contract.startDate) : (sanitizeCustomVars.contrato?.fechaInicio ? formatDateStr(sanitizeCustomVars.contrato.fechaInicio) : todayFormatted);
  const endFormatted = contract.endDate ? formatDateStr(contract.endDate) : (sanitizeCustomVars.contrato?.fechaTermino ? formatDateStr(sanitizeCustomVars.contrato.fechaTermino) : 'Indefinida / Según horas consumidas');

  const formattedAmount = rawTotal > 0 ? rawTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (sanitizeCustomVars.contrato?.valor || '0.00');

  const defaultExportClause = 'Servicio prestado desde Chile y aprovechado íntegramente en el extranjero por el Cliente, exento de IVA conforme al Art. 12 letra E Nº 7 del D.L. 825 de la Ley sobre Impuesto a las Ventas y Servicios.';

  const variables: Record<string, any> = {
    ...sanitizeCustomVars,
    empresa: {
      nombre: company.legalName || 'SATEM Soluciones Inteligentes SpA',
      rut: company.taxId || '77.654.321-K',
      direccion: company.address || 'Av. Providencia 1234, Of. 601',
      ciudad: company.city || 'Santiago',
      pais: company.country || 'Chile',
      email: company.email || 'contacto@satem.cl',
      telefono: company.phone || '+56 2 2999 8888',
      website: company.website || 'https://www.satem.cl',
      representanteLegal: company.legalRepresentative || 'Representante Legal SATEM',
      cargoRepresentante: company.legalRepresentativeTitle || 'Gerente General',
      logoFull: company.logoFullUrl || '',
      logoShort: company.logoShortUrl || '',
    },
    cliente: {
      nombreLegal: customer.legalName || sanitizeCustomVars.cliente?.nombreLegal || '',
      taxId: customer.taxId || sanitizeCustomVars.cliente?.taxId || '',
      pais: customer.country?.name || customer.countryCode || sanitizeCustomVars.cliente?.pais || '',
      ciudad: customer.city || sanitizeCustomVars.cliente?.ciudad || '',
      direccion: customer.address || sanitizeCustomVars.cliente?.direccion || '',
      email: customer.email || sanitizeCustomVars.cliente?.email || '',
      contacto: (customer.contacts && customer.contacts[0]?.name) || sanitizeCustomVars.cliente?.contacto || customer.legalName || '',
    },
    contrato: {
      codigo: contract.code || finalDocNumber,
      titulo: contract.title || sanitizeCustomVars.contrato?.titulo || 'Statement of Work — Servicios Internacionales',
      descripcion: contract.description || sanitizeCustomVars.contrato?.descripcion || '',
      tipo: contract.type || sanitizeCustomVars.contrato?.tipo || 'HOURLY',
      tipoNombre: typeLabels[contract.type || sanitizeCustomVars.contrato?.tipo] || 'Bolsa de Horas (Hourly)',
      modalidad: contract.modality || sanitizeCustomVars.contrato?.modalidad || 'RECURRING',
      modalidadNombre: modalityLabels[contract.modality || sanitizeCustomVars.contrato?.modalidad] || 'Recurrente / Periódico',
      horas: rawHours > 0 ? String(rawHours) : sanitizeCustomVars.contrato?.horas || '0',
      valor: formattedAmount,
      moneda: contract.currency || sanitizeCustomVars.contrato?.moneda || 'USD',
      tarifaHora: calculatedRate || 'Según acuerdo',
      metodoPago: contract.paymentTerms || sanitizeCustomVars.contrato?.metodoPago || 'Zelle / SumUp / Wire Transfer en USD',
      fechaEmision: todayFormatted,
      fechaInicio: startFormatted,
      fechaTermino: endFormatted,
      clausulaExportacion: sanitizeCustomVars.contrato?.clausulaExportacion || defaultExportClause,
    },
    documento: {
      codigo: finalDocNumber,
      titulo: sanitizeCustomVars.documento?.titulo || template.name,
      fechaEmision: todayFormatted,
    },
    rc: {
      codigo: finalDocNumber,
      fechaEmision: todayFormatted,
    },
    cot: {
      codigo: finalDocNumber,
      fechaEmision: todayFormatted,
    },
    ot: {
      codigo: sanitizeCustomVars.ot?.codigo || finalDocNumber,
      fechaEmision: todayFormatted,
    },
    atencion: {
      codigo: sanitizeCustomVars.atencion?.codigo || finalDocNumber,
      fechaEmision: todayFormatted,
    },
    expediente: {
      codigo: expedient.code || sanitizeCustomVars.expediente?.codigo || 'EXP-AUTO',
      titulo: expedient.title || sanitizeCustomVars.expediente?.titulo || '',
    },
  };

  // Sanitizar HTML para prevenir inyección de scripts maliciosos y referencias a esquemas locales
  let rawCompiledHtml = body.customHtml && body.customHtml.trim().length > 0
    ? body.customHtml
    : compileTemplate(targetVersion.htmlTemplate, variables);

  const sanitizedHtml = rawCompiledHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/src=["']?(file|ftp|gopher):/gi, 'src="about:blank"')
    .replace(/href=["']?(file|ftp|gopher):/gi, 'href="#"');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setContent(sanitizedHtml, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '16mm',
      right: '16mm',
    },
    preferCSSPageSize: true,
  });
  await browser.close();

  const generatedPdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

  const expFolder = expedient.code ? expedient.code : 'GENERAL';
  
  const categoryFolderMap: Record<TemplateCategory, string> = {
    CONTRACT: '01-Contrato',
    QUOTATION: '02-Cotizaciones',
    WORK_ORDER: '04-Ordenes-de-Trabajo',
    ATTENTION_REPORT: '05-Atenciones-Tecnicas',
    SERVICE_REPORT: '05-Atenciones-Tecnicas',
    RECEPTION_CONFORMITY: '06-Recepciones-Conformes',
    COMMERCIAL_PROPOSAL: '03-Expediente-General',
  };
  const folderName = categoryFolderMap[template.category] || '12-Otros';
  const targetDir = path.join(env.STORAGE_PATH, String(year), expFolder, folderName);
  fs.mkdirSync(targetDir, { recursive: true });

  const pdfFileName = `${finalDocNumber}.pdf`;
  const generatedPdfPath = path.join(targetDir, pdfFileName);
  fs.writeFileSync(generatedPdfPath, pdfBuffer);

  const instance = await prisma.$transaction(async (tx) => {
    const created = await tx.documentInstance.create({
      data: {
        documentNumber: finalDocNumber,
        category: template.category,
        templateId: template.id,
        templateVersionId: targetVersion.id,
        customerId: body.customerId || null,
        contractId: body.contractId || null,
        quotationId: body.quotationId || null,
        expedientId: expedient.id || body.expedientId || null,
        workOrderId: body.workOrderId || null,
        status: DocumentInstanceStatus.GENERATED,
        dataSnapshot: JSON.parse(JSON.stringify(variables)),
        generatedHtml: sanitizedHtml,
        generatedPdfPath,
        generatedPdfHash,
        generatedById: userId,
      },
    });

    if (expedient.id) {
      if (template.category === TemplateCategory.CONTRACT) {
        await tx.expedientIntegrityItem.updateMany({
          where: { expedientId: expedient.id, code: 'CONTRACT_PRESENT' },
          data: {
            status: 'COMPLETED',
            observation: `Contrato emitido (${finalDocNumber})`,
            completedAt: new Date(),
            completedById: userId,
          },
        });
      } else if (template.category === TemplateCategory.WORK_ORDER) {
        await tx.expedientIntegrityItem.updateMany({
          where: { expedientId: expedient.id, code: 'WORK_ORDER_PRESENT' },
          data: {
            status: 'COMPLETED',
            observation: `Orden de Trabajo autorizada emitida (${finalDocNumber})`,
            completedAt: new Date(),
            completedById: userId,
          },
        });
      } else if (template.category === TemplateCategory.ATTENTION_REPORT || template.category === TemplateCategory.SERVICE_REPORT) {
        await tx.expedientIntegrityItem.updateMany({
          where: { expedientId: expedient.id, code: 'ATTENTION_REGISTERED' },
          data: {
            status: 'COMPLETED',
            observation: `Atención técnica registrada (${finalDocNumber})`,
            completedAt: new Date(),
            completedById: userId,
          },
        });
      } else if (template.category === TemplateCategory.QUOTATION) {
        await tx.expedientIntegrityItem.updateMany({
          where: { expedientId: expedient.id, code: 'QUOTATION_PRESENT' },
          data: {
            status: 'COMPLETED',
            observation: `Cotización emitida (${finalDocNumber})`,
            completedAt: new Date(),
            completedById: userId,
          },
        });
      }
    }

    await createAuditLog(tx, {
      userId,
      action: 'GENERATE_DOCUMENT_INSTANCE',
      entity: 'DocumentInstance',
      entityId: created.id,
      afterData: { documentNumber: created.documentNumber, generatedPdfHash },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: instance });
}

export async function uploadSignedDocumentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const data = await request.file();
  if (!data) {
    throw new AppError('No se adjuntó ningún archivo firmado', 400);
  }

  const userId = (request.user as any)?.userId;
  const instance = await prisma.documentInstance.findUnique({
    where: { id: request.params.id },
    include: { expedient: true, contract: true },
  });

  if (!instance) {
    throw new NotFoundError('Instancia documental no encontrada');
  }

  const fileBuffer = await data.toBuffer();
  const signedPdfHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  const dir = path.dirname(instance.generatedPdfPath);
  const signedFileName = `${instance.documentNumber}-FIRMADO.pdf`;
  const signedPdfPath = path.join(dir, signedFileName);

  fs.writeFileSync(signedPdfPath, fileBuffer);

  let targetExpedientId = instance.expedientId;
  if (!targetExpedientId && instance.contractId) {
    const foundExp = await prisma.expedient.findFirst({
      where: { contractId: instance.contractId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (foundExp) {
      targetExpedientId = foundExp.id;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.documentInstance.update({
      where: { id: instance.id },
      data: {
        signedPdfPath,
        signedPdfHash,
        signedAt: new Date(),
        signedUploadedById: userId,
        status: DocumentInstanceStatus.SIGNED,
        expedientId: targetExpedientId || instance.expedientId,
      },
      include: {
        template: true,
        customer: true,
        contract: true,
        expedient: true,
      },
    });

    // Crear registro en tabla Document y DocumentLink para soporte de auditoría
    const docInternalName = `DOC-SIGNED-${instance.documentNumber}-${Date.now()}.pdf`;
    const docRecord = await tx.document.create({
      data: {
        originalName: `${instance.documentNumber}-FIRMADO.pdf`,
        internalName: docInternalName,
        mimeType: 'application/pdf',
        fileSize: BigInt(fileBuffer.length),
        sha256: signedPdfHash,
        storagePath: signedPdfPath,
        category: instance.category === 'CONTRACT' ? 'CONTRACT' : (instance.category === 'QUOTATION' ? 'QUOTATION' : 'EVIDENCE'),
        uploadedById: userId,
      },
    });

    if (targetExpedientId) {
      await tx.documentLink.create({
        data: {
          documentId: docRecord.id,
          entityType: 'DocumentInstance',
          entityId: instance.id,
          expedientId: targetExpedientId,
        },
      });

      // Actualizar checklist de integridad del expediente
      if (instance.category === 'CONTRACT') {
        await tx.expedientIntegrityItem.updateMany({
          where: {
            expedientId: targetExpedientId,
            code: 'CONTRACT_PRESENT',
          },
          data: {
            status: 'COMPLETED',
            documentId: docRecord.id,
            observation: `Contrato SOW firmado por cliente cargado y verificado (Hash SHA-256: ${signedPdfHash.slice(0, 16)}...)`,
            completedAt: new Date(),
            completedById: userId,
          },
        });
      } else if (instance.category === 'WORK_ORDER') {
        await tx.expedientIntegrityItem.updateMany({
          where: {
            expedientId: targetExpedientId,
            code: 'WORK_ORDER_PRESENT',
          },
          data: {
            status: 'COMPLETED',
            documentId: docRecord.id,
            observation: `Orden de Trabajo autorizada y firmada por cliente (${instance.documentNumber}) cargada (Hash SHA-256: ${signedPdfHash.slice(0, 16)}...)`,
            completedAt: new Date(),
            completedById: userId,
          },
        });
      } else if (instance.category === 'RECEPTION_CONFORMITY') {
        await tx.expedientIntegrityItem.updateMany({
          where: {
            expedientId: targetExpedientId,
            code: 'RECEPTION_SIGNED',
          },
          data: {
            status: 'COMPLETED',
            documentId: docRecord.id,
            observation: `Recepción Conforme firmada por cliente cargada (Hash SHA-256: ${signedPdfHash.slice(0, 16)}...)`,
            completedAt: new Date(),
            completedById: userId,
          },
        });
      } else if (instance.category === 'ATTENTION_REPORT' || instance.category === 'SERVICE_REPORT') {
        await tx.expedientIntegrityItem.updateMany({
          where: {
            expedientId: targetExpedientId,
            code: 'ATTENTION_REGISTERED',
          },
          data: {
            status: 'COMPLETED',
            documentId: docRecord.id,
            observation: `Reporte de Atención firmado por cliente (${instance.documentNumber}) cargado (Hash SHA-256: ${signedPdfHash.slice(0, 16)}...)`,
            completedAt: new Date(),
            completedById: userId,
          },
        });
      }
    }

    await createAuditLog(tx, {
      userId,
      action: 'UPLOAD_SIGNED_DOCUMENT',
      entity: 'DocumentInstance',
      entityId: instance.id,
      afterData: {
        documentNumber: instance.documentNumber,
        signedPdfPath,
        signedPdfHash,
        expedientId: targetExpedientId,
      },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return item;
  });

  return reply.send({ success: true, data: updated });
}

export async function downloadGeneratedPdfHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const instance = await prisma.documentInstance.findUnique({
    where: { id: request.params.id },
  });

  if (!instance || !fs.existsSync(instance.generatedPdfPath)) {
    throw new NotFoundError('Archivo PDF generado no encontrado');
  }

  reply.header('Content-Type', 'application/pdf');
  reply.header('Content-Disposition', `inline; filename="${instance.documentNumber}.pdf"`);
  return reply.send(fs.createReadStream(instance.generatedPdfPath));
}

export async function downloadSignedPdfHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const instance = await prisma.documentInstance.findUnique({
    where: { id: request.params.id },
  });

  if (!instance || !instance.signedPdfPath || !fs.existsSync(instance.signedPdfPath)) {
    throw new NotFoundError('Archivo PDF firmado no encontrado para este documento');
  }

  reply.header('Content-Type', 'application/pdf');
  reply.header('Content-Disposition', `inline; filename="${instance.documentNumber}-FIRMADO.pdf"`);
  return reply.send(fs.createReadStream(instance.signedPdfPath));
}

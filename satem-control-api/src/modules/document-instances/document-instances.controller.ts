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

const generateDocumentSchema = z.object({
  templateId: z.string().uuid(),
  templateVersionId: z.string().uuid().optional(),
  documentNumber: z.string().min(3),
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

  const sanitizeCustomVars = { ...(body.customVariables || {}) };
  delete sanitizeCustomVars.empresa; // Strict protection: user cannot overwrite empresa.*

  const variables: Record<string, any> = {
    ...sanitizeCustomVars,
    empresa: {
      nombre: company.legalName || 'SATEM SpA',
      rut: company.taxId || '',
      direccion: company.address || '',
      ciudad: company.city || '',
      pais: company.country || '',
      email: company.email || '',
      telefono: company.phone || '',
      website: company.website || '',
      representanteLegal: company.legalRepresentative || '',
      cargoRepresentante: company.legalRepresentativeTitle || '',
      logoFull: company.logoFullUrl || '',
      logoShort: company.logoShortUrl || '',
    },
    cliente: {
      nombreLegal: customer.legalName || sanitizeCustomVars.cliente?.nombreLegal || '',
      taxId: customer.taxId || sanitizeCustomVars.cliente?.taxId || '',
      pais: customer.country?.name || customer.countryCode || sanitizeCustomVars.cliente?.pais || '',
      direccion: customer.address || sanitizeCustomVars.cliente?.direccion || '',
      email: customer.email || sanitizeCustomVars.cliente?.email || '',
    },
    contrato: {
      codigo: contract.code || body.documentNumber,
      titulo: contract.title || sanitizeCustomVars.contrato?.titulo || '',
      descripcion: contract.description || sanitizeCustomVars.contrato?.descripcion || '',
      tipo: contract.type || sanitizeCustomVars.contrato?.tipo || '',
      modalidad: contract.modality || sanitizeCustomVars.contrato?.modalidad || '',
      horas: contract.contractedHours ? String(contract.contractedHours) : sanitizeCustomVars.contrato?.horas || '',
      valor: contract.totalAmount ? String(contract.totalAmount) : sanitizeCustomVars.contrato?.valor || '',
      moneda: contract.currency || sanitizeCustomVars.contrato?.moneda || 'USD',
      metodoPago: contract.paymentTerms || sanitizeCustomVars.contrato?.metodoPago || 'Transferencia / SumUp',
    },
    expediente: {
      codigo: expedient.code || sanitizeCustomVars.expediente?.codigo || '',
      titulo: expedient.title || sanitizeCustomVars.expediente?.titulo || '',
    },
    ot: {
      codigo: sanitizeCustomVars.ot?.codigo || 'OT-2026-000001',
    },
    atencion: {
      codigo: sanitizeCustomVars.atencion?.codigo || 'AT-2026-000001',
    },
  };

  const compiledHtml = body.customHtml && body.customHtml.trim().length > 0
    ? body.customHtml
    : compileTemplate(targetVersion.htmlTemplate, variables);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(compiledHtml, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  const generatedPdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

  const year = new Date().getFullYear();
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

  const pdfFileName = `${body.documentNumber}.pdf`;
  const generatedPdfPath = path.join(targetDir, pdfFileName);
  fs.writeFileSync(generatedPdfPath, pdfBuffer);

  const instance = await prisma.$transaction(async (tx) => {
    const created = await tx.documentInstance.create({
      data: {
        documentNumber: body.documentNumber,
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
        generatedHtml: compiledHtml,
        generatedPdfPath,
        generatedPdfHash,
        generatedById: userId,
      },
    });

    if (expedient.id && template.category === TemplateCategory.CONTRACT) {
      await tx.expedientIntegrityItem.updateMany({
        where: {
          expedientId: expedient.id,
          code: 'CONTRACT_PRESENT',
        },
        data: { status: 'COMPLETED' },
      });
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

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.documentInstance.update({
      where: { id: instance.id },
      data: {
        signedPdfPath,
        signedPdfHash,
        signedAt: new Date(),
        signedUploadedById: userId,
        status: DocumentInstanceStatus.SIGNED,
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'UPLOAD_SIGNED_DOCUMENT',
      entity: 'DocumentInstance',
      entityId: instance.id,
      afterData: { signedPdfPath, signedPdfHash },
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

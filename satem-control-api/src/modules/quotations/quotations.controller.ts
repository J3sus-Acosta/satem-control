import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import puppeteer from 'puppeteer';
import { Prisma, QuotationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';

const quotationItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().default(0),
});

const createQuotationSchema = z.object({
  customerId: z.string().uuid(),
  contractId: z.string().uuid().optional(),
  currency: z.string().default('USD'),
  validUntil: z.string().transform((v) => new Date(v)),
  commercialTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'La cotización debe tener al menos 1 item'),
  manualOverride: z
    .object({
      subtotal: z.number(),
      vat: z.number(),
      total: z.number(),
      reason: z.string().min(5, 'Motivo de modificación manual requerido'),
    })
    .optional(),
});

export async function listQuotationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const quotations = await prisma.quotation.findMany({
    where: { deletedAt: null },
    include: {
      customer: true,
      contract: true,
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: { items: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: quotations });
}

export async function getQuotationHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: request.params.id },
    include: {
      customer: true,
      contract: true,
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: { items: true },
      },
    },
  });

  if (!quotation || quotation.deletedAt) {
    throw new NotFoundError('Cotización no encontrada');
  }

  return reply.send({ success: true, data: quotation });
}

export async function createQuotationHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createQuotationSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  let subtotalCalc = 0;
  const processedItems = body.items.map((item, index) => {
    const itemSubtotal = item.quantity * item.unitPrice - item.discount;
    subtotalCalc += itemSubtotal;
    return {
      itemOrder: index + 1,
      description: item.description,
      quantity: new Prisma.Decimal(item.quantity),
      unitPrice: new Prisma.Decimal(item.unitPrice),
      discount: new Prisma.Decimal(item.discount),
      subtotal: new Prisma.Decimal(itemSubtotal),
    };
  });

  const vatRate = 0.00;
  const vatCalc = subtotalCalc * vatRate;
  const totalCalc = subtotalCalc + vatCalc;

  const isOverride = !!body.manualOverride;
  const subtotalFinal = isOverride ? body.manualOverride!.subtotal : subtotalCalc;
  const vatFinal = isOverride ? body.manualOverride!.vat : vatCalc;
  const totalFinal = isOverride ? body.manualOverride!.total : totalCalc;

  const quotation = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const code = await generateSequence(tx, 'COT');

    const created = await tx.quotation.create({
      data: {
        code,
        customerId: body.customerId,
        contractId: body.contractId || null,
        currentVersion: 1,
        status: QuotationStatus.DRAFT,
      },
    });

    const versionCode = `${code}-V01`;
    await tx.quotationVersion.create({
      data: {
        quotationId: created.id,
        versionNumber: 1,
        versionCode,
        currency: body.currency,
        subtotalCalculated: new Prisma.Decimal(subtotalCalc),
        vatCalculated: new Prisma.Decimal(vatCalc),
        totalCalculated: new Prisma.Decimal(totalCalc),
        subtotalFinal: new Prisma.Decimal(subtotalFinal),
        vatFinal: new Prisma.Decimal(vatFinal),
        totalFinal: new Prisma.Decimal(totalFinal),
        isManualOverride: isOverride,
        overrideReason: isOverride ? body.manualOverride!.reason : null,
        validUntil: body.validUntil,
        commercialTerms: body.commercialTerms || null,
        notes: body.notes || null,
        createdById: userId,
        items: {
          create: processedItems,
        },
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_QUOTATION',
      entity: 'Quotation',
      entityId: created.id,
      afterData: created,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: quotation });
}

export async function generateQuotationPdfHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: request.params.id },
    include: {
      customer: { include: { country: true } },
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
        include: { items: true },
      },
    },
  });

  if (!quotation || quotation.versions.length === 0) {
    throw new NotFoundError('Cotización o versión no encontrada');
  }

  const activeVersion = quotation.versions[0];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Cotización ${activeVersion.versionCode}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #0284c7; }
        .items-table { width: 100%; margin-top: 30px; border-collapse: collapse; }
        .items-table th, .items-table td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
        .items-table th { background-color: #f1f5f9; }
        .totals { margin-top: 30px; float: right; width: 300px; }
        .totals table { width: 100%; border-collapse: collapse; }
        .totals td { padding: 6px; }
        .total-row { font-weight: bold; font-size: 16px; border-top: 2px solid #0f172a; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">SATEM Soluciones Inteligentes SpA</div>
          <div>Chile - Control de Operaciones Internacionales</div>
        </div>
        <div style="text-align: right;">
          <h2>COTIZACIÓN</h2>
          <div><strong>Código:</strong> ${activeVersion.versionCode}</div>
          <div><strong>Fecha:</strong> ${new Date(quotation.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <p style="margin-top: 20px;"><strong>Cliente:</strong> ${quotation.customer.legalName} (${quotation.customer.country.name})</p>

      <h3>Detalle de Servicios Cotizados (${activeVersion.currency})</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Descripción</th>
            <th>Cant.</th>
            <th>P. Unitario</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${activeVersion.items
            .map(
              (item: any) => `
            <tr>
              <td>${item.itemOrder}</td>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>${activeVersion.currency} ${item.unitPrice}</td>
              <td>${activeVersion.currency} ${item.subtotal}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr class="total-row">
            <td>Total:</td>
            <td style="text-align: right;">${activeVersion.currency} ${activeVersion.totalFinal}</td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
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

  reply.header('Content-Type', 'application/pdf');
  reply.header('Content-Disposition', `inline; filename="${activeVersion.versionCode}.pdf"`);
  return reply.send(pdfBuffer);
}

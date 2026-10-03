import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';
import * as xlsx from 'xlsx';
import { parse } from 'csv-parse/sync';
import { Prisma, ReconciliationStatus, DocumentCategory } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { NotFoundError, AppError } from '../../common/errors/app-error.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';
import { parseSantanderPdfCartola } from '../../common/utils/pdf-statement-parser.js';

const confirmImportSchema = z.object({
  accountNumber: z.string().default('Santander CLP 123456789'),
  rows: z.array(
    z.object({
      transactionDate: z.string().transform((v) => new Date(v)),
      description: z.string().min(1),
      amountClp: z.number(),
      referenceNumber: z.string().optional(),
    })
  ).min(1, 'Debe incluir al menos 1 registro'),
  rawSourceFileId: z.string().uuid().optional(),
});

const reconcileSchema = z.object({
  bankReceiptId: z.string().uuid(),
  paymentAllocationId: z.string().uuid().optional(),
  paymentId: z.string().uuid().optional(),
  expectedAmountClp: z.number().positive().optional(),
  receivedAmountClp: z.number().positive().optional(),
  notes: z.string().optional(),
  expedientId: z.string().uuid().optional(),
});

function parseSantanderAmount(val: any, cargoAbono?: string): number {
  if (typeof val === 'number') {
    let num = val;
    // Si SheetJS leyó decimales por el separador de punto en miles de Chile (ej. 24.337 -> 24337)
    if (!Number.isInteger(num) && Math.abs(num) < 100000 && Math.abs(num) > 0) {
      const str = val.toString();
      if (str.includes('.') && str.split('.')[1].length === 3) {
        num = Math.round(val * 1000);
      }
    }
    if (cargoAbono) {
      const ca = String(cargoAbono).trim().toUpperCase();
      if (ca === 'C' && num > 0) num = -num;
      if (ca === 'A' && num < 0) num = Math.abs(num);
    }
    return Math.round(num);
  }

  if (!val) return 0;
  let str = String(val).trim().replace(/[$|\s]/g, '');
  if (!str) return 0;

  const isNegative = str.startsWith('-') || str.startsWith('(');
  str = str.replace(/[\(\)\-]/g, '');

  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').split(',')[0];
  } else if (str.includes('.')) {
    str = str.replace(/\./g, '');
  } else if (str.includes(',')) {
    str = str.split(',')[0];
  }

  let num = parseInt(str, 10);
  if (isNaN(num)) return 0;
  if (isNegative) num = -num;

  if (cargoAbono) {
    const ca = String(cargoAbono).trim().toUpperCase();
    if (ca === 'C' && num > 0) num = -num;
    if (ca === 'A' && num < 0) num = Math.abs(num);
  }

  return num;
}

function parseChileanDate(val: any): Date | null {
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }
  if (!val) return null;

  if (typeof val === 'number') {
    try {
      const parsed = xlsx.SSF.parse_date_code(val);
      if (parsed) {
        return new Date(parsed.y, parsed.m - 1, parsed.d);
      }
    } catch {
      // fallback
    }
  }

  const str = String(val).trim();
  // DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmyMatch) {
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const month = parseInt(dmyMatch[2], 10) - 1;
    const day = parseInt(dmyMatch[1], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  // YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  const direct = new Date(str);
  if (!isNaN(direct.getTime())) return direct;

  return null;
}

async function updateExpedientIntegrityReconciliation(
  tx: Prisma.TransactionClient,
  expedientId: string,
  receiptCode: string,
  reconciledAmountClp: number,
  userId?: string,
  rawSourceFileId?: string | null
) {
  // 1. Vincular formalmente la cartola como documento del expediente si no está vinculada aún
  if (rawSourceFileId) {
    const existingLink = await tx.documentLink.findFirst({
      where: {
        documentId: rawSourceFileId,
        expedientId: expedientId,
      },
    });

    if (!existingLink) {
      await tx.documentLink.create({
        data: {
          documentId: rawSourceFileId,
          entityType: 'EXPEDIENT',
          entityId: expedientId,
          expedientId: expedientId,
        },
      });
    }
  }

  const expedient = await tx.expedient.findUnique({
    where: { id: expedientId },
    include: {
      contract: true,
      invoices: {
        include: {
          paymentRequests: {
            include: {
              payments: {
                include: {
                  allocations: {
                    include: { reconciliations: true },
                  },
                },
              },
            },
          },
        },
      },
      documentLinks: {
        include: {
          document: {
            include: {
              paymentProof: {
                include: {
                  allocations: {
                    include: { reconciliations: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!expedient) return;

  let totalReconciledClp = 0;
  let totalReconciledUsd = 0;
  const seenRecIds = new Set<string>();

  for (const inv of expedient.invoices) {
    for (const pr of inv.paymentRequests) {
      for (const p of pr.payments) {
        for (const alloc of p.allocations) {
          for (const rec of alloc.reconciliations) {
            if (!seenRecIds.has(rec.id)) {
              seenRecIds.add(rec.id);
              totalReconciledClp += Number(rec.receivedAmountClp || 0);
              const pUsd = Number(p.usdEquivalent || 0) || (p.currency === 'USD' ? Number(p.amount) : 0);
              totalReconciledUsd += pUsd;
            }
          }
        }
      }
    }
  }

  for (const link of expedient.documentLinks) {
    if (link.document?.paymentProof) {
      for (const p of link.document.paymentProof) {
        for (const alloc of p.allocations) {
          for (const rec of alloc.reconciliations) {
            if (!seenRecIds.has(rec.id)) {
              seenRecIds.add(rec.id);
              totalReconciledClp += Number(rec.receivedAmountClp || 0);
              const pUsd = Number(p.usdEquivalent || 0) || (p.currency === 'USD' ? Number(p.amount) : 0);
              totalReconciledUsd += pUsd;
            }
          }
        }
      }
    }
  }

  const contractAmount = Number(expedient.contract?.totalAmount || 0);
  const totalInvoiceAmount = expedient.invoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
  const currency = expedient.contract?.currency || expedient.invoices[0]?.currency || 'USD';

  let progressText = '';
  let isComplete = false;

  if (currency === 'USD' && (contractAmount > 0 || totalInvoiceAmount > 0)) {
    const targetUsd = contractAmount > 0 ? contractAmount : totalInvoiceAmount;
    let pct = Math.min(100, Math.round((totalReconciledUsd / targetUsd) * 100));
    if (pct >= 99) pct = 100;
    isComplete = pct >= 100 || (totalReconciledClp > 0 && targetUsd <= totalReconciledUsd);
    progressText = ` • Progreso: ${pct}% ($${totalReconciledUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / $${targetUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD) • Total Líquido Santander: $${totalReconciledClp.toLocaleString('es-CL')} CLP`;
  } else if (currency === 'CLP' && contractAmount > 0) {
    let pct = Math.min(100, Math.round((totalReconciledClp / contractAmount) * 100));
    if (pct >= 99) pct = 100;
    isComplete = pct >= 100;
    progressText = ` • Pagado y Conciliado: ${pct}% ($${totalReconciledClp.toLocaleString('es-CL')} / $${contractAmount.toLocaleString('es-CL')} CLP)`;
  } else if (totalReconciledClp > 0) {
    isComplete = true;
    progressText = ` • Total Conciliado en Banco: $${totalReconciledClp.toLocaleString('es-CL')} CLP`;
  }

  await tx.expedientIntegrityItem.updateMany({
    where: { expedientId, code: 'RECONCILIATION_COMPLETED' },
    data: {
      status: 'COMPLETED',
      documentId: rawSourceFileId || undefined,
      observation: `Conciliación bancaria Santander confirmada (${receiptCode})${progressText}`,
      completedAt: new Date(),
      completedById: userId,
    },
  });
}

export async function listBankReceiptsHandler(request: FastifyRequest, reply: FastifyReply) {
  const receipts = await prisma.bankReceipt.findMany({
    include: {
      rawSourceFile: true,
      reconciliations: {
        include: {
          paymentAllocation: {
            include: {
              payment: {
                include: {
                  proofDocument: {
                    include: {
                      links: {
                        include: {
                          expedient: {
                            include: { customer: true },
                          },
                        },
                      },
                    },
                  },
                  paymentRequest: {
                    include: {
                      invoice: {
                        include: {
                          expedient: {
                            include: { customer: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { transactionDate: 'desc' },
  });

  return reply.send({ success: true, data: receipts });
}

export async function previewBankImportHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as any)?.userId;
  let rawBuffer: Buffer | null = null;
  let filename = '';
  let mimetype = '';

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      filename = part.filename;
      mimetype = part.mimetype;
      rawBuffer = await part.toBuffer();
    }
  }

  if (!rawBuffer) {
    throw new AppError('No se adjuntó ningún archivo de cartola bancaria', 400);
  }

  const isPdf = filename.toLowerCase().endsWith('.pdf') || (rawBuffer.length > 4 && rawBuffer.toString('utf8', 0, 4) === '%PDF');

  // Guardar archivo físico y registrar Document para trazabilidad y visualización oficial
  const sha256 = crypto.createHash('sha256').update(rawBuffer).digest('hex');
  const year = new Date().getFullYear();
  const targetDir = path.join(env.STORAGE_PATH, String(year), 'BANK_CARTOLAS');
  fs.mkdirSync(targetDir, { recursive: true });

  const ext = path.extname(filename) || (isPdf ? '.pdf' : '.csv');
  const internalName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
  const storagePath = path.join(targetDir, internalName);
  fs.writeFileSync(storagePath, rawBuffer);

  let finalUserId = userId;
  if (!finalUserId) {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    finalUserId = admin?.id || 'SYSTEM';
  }

  const doc = await prisma.document.create({
    data: {
      originalName: filename || `Cartola_Santander_${Date.now()}${ext}`,
      internalName,
      mimeType: isPdf ? 'application/pdf' : (filename.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : (mimetype || 'text/csv')),
      fileSize: BigInt(rawBuffer.length),
      sha256,
      storagePath,
      category: DocumentCategory.BANK_RECEIPT,
      uploadedById: finalUserId,
    },
  });

  // 1. Si es PDF, parsear directamente con el motor de Cartola Santander
  if (isPdf) {
    try {
      const parsedCartola = await parseSantanderPdfCartola(rawBuffer);
      const preview = [];

      for (const mov of parsedCartola.movements) {
        const existingMatch = await prisma.bankReceipt.findFirst({
          where: {
            transactionDate: mov.transactionDate,
            amountClp: new Prisma.Decimal(mov.amountClp),
            referenceNumber: mov.referenceNumber || undefined,
          },
        });

        preview.push({
          transactionDate: mov.transactionDate,
          description: mov.description,
          amountClp: mov.amountClp,
          referenceNumber: mov.referenceNumber,
          isPossibleDuplicate: !!existingMatch,
        });
      }

      if (preview.length === 0) {
        throw new AppError('No se encontraron movimientos válidos en el PDF de la cartola Santander.', 400);
      }

      return reply.send({
        success: true,
        data: {
          accountNumber: parsedCartola.accountNumber || 'Santander Cta Cte 0-000-7790953-2 (SATEM SPA)',
          totalRows: preview.length,
          duplicateRowsCount: preview.filter((p) => p.isPossibleDuplicate).length,
          rows: preview,
          rawSourceFileId: doc.id,
          rawSourceFileName: doc.originalName,
        },
      });
    } catch (pdfErr: any) {
      if (pdfErr instanceof AppError) throw pdfErr;
      throw new AppError(`Error al procesar la cartola PDF de Santander: ${pdfErr.message}`, 400);
    }
  }

  let rows2D: any[][] = [];
  let detectedAccount = 'Santander Cta Cte 0-000-7790953-2 (SATEM SPA)';

  // 2. Intentar parsear como Excel (.xlsx, .xls) mediante SheetJS
  try {
    const workbook = xlsx.read(rawBuffer, { type: 'buffer', cellDates: true });
    if (workbook.SheetNames && workbook.SheetNames.length > 0) {
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      rows2D = xlsx.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];
    }
  } catch (excelErr) {
    // 3. Si falla Excel, intentar como texto CSV
    try {
      const fileContent = rawBuffer.toString('utf-8');
      rows2D = parse(fileContent, {
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (csvErr) {
      throw new AppError('No fue posible interpretar el archivo de cartola Santander.', 400);
    }
  }

  if (!rows2D || rows2D.length === 0) {
    throw new AppError('El archivo de cartola bancaria está vacío.', 400);
  }

  let headerRowIndex = -1;
  let montoCol = -1;
  let descCol = -1;
  let dateCol = -1;
  let docCol = -1;
  let cargoAbonoCol = -1;
  let movCol = -1;

  for (let r = 0; r < Math.min(rows2D.length, 30); r++) {
    const row = rows2D[r];
    if (!Array.isArray(row)) continue;

    let colMonto = -1;
    let colDesc = -1;
    let colDate = -1;
    let colDoc = -1;
    let colCargoAbono = -1;
    let colMov = -1;

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim().toLowerCase();

      if (cell.includes('cuenta') && c + 1 < row.length) {
        const nextCell = String(row[c + 1] || '').trim();
        if (nextCell) detectedAccount = `Santander Cta Cte ${nextCell}`;
      }

      if (cell === 'monto' || cell === 'abono' || cell === 'abonos' || cell === 'valor' || cell === 'importe') {
        colMonto = c;
      } else if (cell.includes('descrip') || cell.includes('concepto') || cell.includes('detalle')) {
        colDesc = c;
      } else if (cell.includes('fecha') || cell === 'fec.') {
        colDate = c;
      } else if (cell.includes('doc') || cell.includes('comprobante') || cell.includes('cheque/ref')) {
        colDoc = c;
      } else if (cell.includes('cargo/abono') || cell.includes('c/a') || cell.includes('tipo')) {
        colCargoAbono = c;
      } else if (cell.includes('movimiento') || cell.includes('n° mov') || cell.includes('nro mov') || cell.includes('correlativo')) {
        colMov = c;
      }
    }

    if (colMonto !== -1 && (colDesc !== -1 || colDate !== -1)) {
      headerRowIndex = r;
      montoCol = colMonto;
      descCol = colDesc;
      dateCol = colDate;
      cargoAbonoCol = colCargoAbono;
      docCol = colDoc;
      movCol = colMov;
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 11;
    montoCol = 0;
    descCol = 1;
    dateCol = 2;
    docCol = 4;
    cargoAbonoCol = 6;
    movCol = 7;
  }

  const preview = [];
  const startRow = headerRowIndex + 1;

  for (let i = startRow; i < rows2D.length; i++) {
    const row = rows2D[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rawDateVal = dateCol !== -1 ? row[dateCol] : null;
    const parsedDate = parseChileanDate(rawDateVal);
    if (!parsedDate) continue;

    const rawDesc = descCol !== -1 ? String(row[descCol] || '').trim() : 'Movimiento Santander';
    if (!rawDesc || /^(saldo\s*inicial|saldo\s*final|total|totales)/i.test(rawDesc)) {
      continue;
    }

    const cargoAbono = cargoAbonoCol !== -1 ? String(row[cargoAbonoCol] || '').trim() : '';
    const rawMonto = montoCol !== -1 ? row[montoCol] : 0;
    const amountClp = parseSantanderAmount(rawMonto, cargoAbono);

    if (amountClp === 0) continue;

    const rawDoc = docCol !== -1 ? String(row[docCol] || '').trim() : '';
    const rawMov = movCol !== -1 ? String(row[movCol] || '').trim() : '';
    const referenceNumber = (rawMov && rawMov !== '000000000' ? rawMov : '') || (rawDoc && rawDoc !== '000000000' ? rawDoc : '') || '';

    const existingMatch = await prisma.bankReceipt.findFirst({
      where: {
        transactionDate: parsedDate,
        amountClp: new Prisma.Decimal(amountClp),
        referenceNumber: referenceNumber || undefined,
      },
    });

    preview.push({
      transactionDate: parsedDate,
      description: rawDesc,
      amountClp,
      referenceNumber,
      isPossibleDuplicate: !!existingMatch,
    });
  }

  if (preview.length === 0) {
    throw new AppError('No se encontraron transacciones válidas en la cartola de Santander seleccionada.', 400);
  }

  return reply.send({
    success: true,
    data: {
      accountNumber: detectedAccount,
      totalRows: preview.length,
      duplicateRowsCount: preview.filter((p) => p.isPossibleDuplicate).length,
      rows: preview,
      rawSourceFileId: doc.id,
      rawSourceFileName: doc.originalName,
    },
  });
}

export async function confirmBankImportHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = confirmImportSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const imported = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdReceipts = [];
    for (const row of body.rows) {
      const code = await generateSequence(tx, 'BR');
      const item = await tx.bankReceipt.create({
        data: {
          code,
          bankName: 'Banco Santander Chile',
          accountNumber: body.accountNumber,
          transactionDate: row.transactionDate,
          description: row.description,
          amountClp: new Prisma.Decimal(row.amountClp),
          referenceNumber: row.referenceNumber || null,
          rawSourceFileId: body.rawSourceFileId || null,
          status: ReconciliationStatus.UNRECONCILED,
        },
      });
      createdReceipts.push(item);
    }

    await createAuditLog(tx, {
      userId,
      action: 'IMPORT_BANK_RECEIPTS',
      entity: 'BankReceipt',
      entityId: `BATCH_${createdReceipts.length}`,
      afterData: { count: createdReceipts.length, accountNumber: body.accountNumber, rawSourceFileId: body.rawSourceFileId },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return createdReceipts;
  });

  return reply.status(201).send({
    success: true,
    data: imported,
    message: `${imported.length} movimientos de cartola Santander importados exitosamente.`,
  });
}

export async function deleteBankReceiptHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const userId = (request.user as any)?.userId;

  const receipt = await prisma.bankReceipt.findUnique({
    where: { id },
    include: { reconciliations: true },
  });

  if (!receipt) {
    throw new NotFoundError('Movimiento bancario no encontrado');
  }

  await prisma.$transaction(async (tx) => {
    if (receipt.reconciliations.length > 0) {
      await tx.bankReconciliation.deleteMany({
        where: { bankReceiptId: id },
      });
    }

    await tx.bankReceipt.delete({
      where: { id },
    });

    await createAuditLog(tx, {
      userId,
      action: 'DELETE_BANK_RECEIPT',
      entity: 'BankReceipt',
      entityId: id,
      beforeData: receipt,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  });

  return reply.send({ success: true, message: 'Movimiento bancario eliminado exitosamente' });
}

export async function reconcileHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = reconcileSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const receipt = await prisma.bankReceipt.findUnique({
    where: { id: body.bankReceiptId },
  });
  if (!receipt) {
    throw new NotFoundError('Movimiento bancario no encontrado');
  }

  let allocId = body.paymentAllocationId;
  if (!allocId && body.paymentId) {
    const paymentRec = await prisma.payment.findUnique({
      where: { id: body.paymentId },
      include: { allocations: true },
    });
    if (paymentRec?.allocations?.[0]) {
      allocId = paymentRec.allocations[0].id;
    }
  }

  if (!allocId) {
    throw new AppError('Debe especificar paymentAllocationId o paymentId', 400);
  }

  const alloc = await prisma.paymentAllocation.findUnique({
    where: { id: allocId },
    include: {
      payment: {
        include: {
          paymentRequest: { include: { invoice: true } },
          proofDocument: { include: { links: true } },
        },
      },
    },
  });
  if (!alloc) {
    throw new NotFoundError('Asignación de pago no encontrada');
  }

  const receivedAmountClp = body.receivedAmountClp || Number(receipt.amountClp);
  const expectedAmountClp = body.expectedAmountClp || Number(alloc.payment.amount) || Number(alloc.allocatedAmount);
  const diff = Math.abs(expectedAmountClp - receivedAmountClp);

  // Si la diferencia es menor al 15% (rango de comisión de pasarelas como SumUp/PayPal/Stripe) o menos de 5 CLP, es una conciliación válida con comisión
  const isSumUpOrFee = diff <= expectedAmountClp * 0.15 || diff <= 5;
  const discrepancyAmountClp = isSumUpOrFee ? 0 : diff;

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const reconciliation = await tx.bankReconciliation.create({
      data: {
        bankReceiptId: body.bankReceiptId,
        paymentAllocationId: allocId,
        expectedAmountClp: new Prisma.Decimal(expectedAmountClp),
        receivedAmountClp: new Prisma.Decimal(receivedAmountClp),
        discrepancyAmountClp: new Prisma.Decimal(discrepancyAmountClp),
        notes: body.notes || (diff > 0 ? `Conciliación SATEM (Diferencia/Comisión: $${diff.toLocaleString('es-CL')} CLP)` : 'Conciliación Manual SATEM'),
        reconciledById: userId,
      },
    });

    await tx.paymentAllocation.update({
      where: { id: allocId },
      data: { allocatedAmount: new Prisma.Decimal(receivedAmountClp) },
    });

    const updatedReceipt = await tx.bankReceipt.update({
      where: { id: body.bankReceiptId },
      data: {
        status: discrepancyAmountClp > 0 ? ReconciliationStatus.DISCREPANCY : ReconciliationStatus.RECONCILED,
      },
    });

    // Resolver expediente
    let targetExpedientId = body.expedientId;
    if (!targetExpedientId) {
      targetExpedientId =
        alloc?.payment?.paymentRequest?.invoice?.expedientId ||
        alloc?.payment?.proofDocument?.links?.find((l) => l.expedientId)?.expedientId ||
        alloc?.payment?.proofDocument?.links?.find((l) => l.entityType === 'EXPEDIENT')?.entityId ||
        undefined;
    }

    if (targetExpedientId) {
      await updateExpedientIntegrityReconciliation(tx, targetExpedientId, updatedReceipt.code, receivedAmountClp, userId, receipt.rawSourceFileId);
    }

    await createAuditLog(tx, {
      userId,
      action: 'RECONCILE_BANK_RECEIPT',
      entity: 'BankReconciliation',
      entityId: reconciliation.id,
      afterData: reconciliation,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reconciliation;
  });

  return reply.send({ success: true, data: result });
}

interface MatchCandidate {
  allocationId: string;
  paymentId: string;
  paymentCode: string;
  paymentMethod: string;
  transactionRef?: string | null;
  paymentDate: Date;
  grossAmount: number;
  currency: string;
  usdEquivalent?: number | null;
  customerName?: string;
  expedientCode?: string;
  expedientId?: string;
  invoiceFolio?: number;
  score: number;
  isExactRef: boolean;
  dateDiffDays: number;
  feeDifferenceClp: number;
  reasons: string[];
}

interface AnalyzedReceiptMatch {
  receipt: any;
  status: 'EXACT_MATCH' | 'HIGH_CONFIDENCE' | 'AMBIGUOUS' | 'NO_MATCH';
  suggestedCandidate?: MatchCandidate;
  candidates: MatchCandidate[];
  reconciliationNotes: string;
}

function analyzeReceiptMatches(receipts: any[], allocations: any[]): AnalyzedReceiptMatch[] {
  return receipts.map((receipt) => {
    const receiptAmount = Number(receipt.amountClp);
    const receiptDate = new Date(receipt.transactionDate).getTime();
    const receiptDesc = (receipt.description || '').toLowerCase();
    const receiptRef = (receipt.referenceNumber || '').trim().toLowerCase().replace(/^0+/, '');

    const candidates: MatchCandidate[] = [];

    for (const alloc of allocations) {
      const p = alloc.payment;
      const allocAmount = Number(alloc.allocatedAmount);
      const grossAmount = Number(p.amount);
      const pDate = new Date(p.paymentDate).getTime();
      const dateDiffDays = Math.round(Math.abs(receiptDate - pDate) / (1000 * 60 * 60 * 24));

      const exp = p.paymentRequest?.invoice?.expedient || p.proofDocument?.links?.find((l: any) => l.expedient)?.expedient;
      const customer = exp?.customer;
      const invoiceFolio = p.paymentRequest?.invoice?.siiFolio;
      const expCode = exp?.code;

      let score = 0;
      let isExactRef = false;
      const reasons: string[] = [];

      // 1. Coincidencia de Referencia / Link / PID única (+100 puntos)
      const pRef = (p.transactionRef || '').trim().toLowerCase().replace(/^0+/, '');
      const sumupTxId = (p.paymentRequest?.sumupTransactionId || '').trim().toLowerCase();
      const sumupLink = (p.paymentRequest?.sumupLink || '').trim().toLowerCase();

      if (pRef && receiptRef && (receiptRef === pRef || receiptRef.includes(pRef) || pRef.includes(receiptRef))) {
        score += 100;
        isExactRef = true;
        reasons.push(`Referencia bancaria coincide (${p.transactionRef})`);
      } else if (pRef && receiptDesc.includes(pRef)) {
        score += 100;
        isExactRef = true;
        reasons.push(`Glosa bancaria contiene referencia (${p.transactionRef})`);
      } else if (sumupTxId && receiptDesc.includes(sumupTxId)) {
        score += 100;
        isExactRef = true;
        reasons.push(`Glosa bancaria contiene ID SumUp (${sumupTxId})`);
      } else if (sumupLink && receiptDesc.includes(sumupLink)) {
        score += 100;
        isExactRef = true;
        reasons.push(`Glosa bancaria contiene Link de Pago (${sumupLink})`);
      } else if (expCode && receiptDesc.includes(expCode.toLowerCase())) {
        score += 80;
        isExactRef = true;
        reasons.push(`Glosa bancaria menciona Expediente ${expCode}`);
      } else if (invoiceFolio && receiptDesc.includes(String(invoiceFolio))) {
        score += 70;
        reasons.push(`Glosa bancaria menciona Folio Factura #${invoiceFolio}`);
      }

      // 2. Coincidencia de Método SumUp y Neto con Comisión (+50 puntos)
      const isSumUpBank = receiptDesc.includes('sumup');
      const isSumUpPayment =
        (p.paymentMethod || '').toLowerCase().includes('sumup') ||
        (p.transactionRef || '').toLowerCase().includes('pid') ||
        (p.proofDocument?.originalName || '').toLowerCase().includes('sumup');

      let isAmountCompatible = false;
      let feeDifferenceClp = 0;

      if (isSumUpBank && isSumUpPayment) {
        // En SumUp, el depósito neto está entre 80% y 101% del valor bruto
        if (receiptAmount <= grossAmount * 1.01 && receiptAmount >= grossAmount * 0.80) {
          score += 50;
          isAmountCompatible = true;
          feeDifferenceClp = Math.max(0, grossAmount - receiptAmount);
          reasons.push(`Monto neto SumUp compatible (Bruto: $${grossAmount.toLocaleString('es-CL')} / Comisión: $${feeDifferenceClp.toLocaleString('es-CL')} CLP)`);
        } else if (Math.abs(allocAmount - receiptAmount) <= 10) {
          score += 50;
          isAmountCompatible = true;
          reasons.push(`Monto liquidado coincide con asignación ($${allocAmount.toLocaleString('es-CL')} CLP)`);
        }
      } else {
        // Transferencia regular / Otro método
        if (Math.abs(allocAmount - receiptAmount) <= 5 || Math.abs(grossAmount - receiptAmount) <= 5) {
          score += 50;
          isAmountCompatible = true;
          reasons.push(`Monto exacto transferido ($${receiptAmount.toLocaleString('es-CL')} CLP)`);
        } else if (receiptAmount <= grossAmount * 1.05 && receiptAmount >= grossAmount * 0.80) {
          // Posible comisión de pasarela
          score += 25;
          isAmountCompatible = true;
          feeDifferenceClp = Math.max(0, grossAmount - receiptAmount);
          reasons.push(`Monto proporcional con posible comisión ($${feeDifferenceClp.toLocaleString('es-CL')} CLP)`);
        }
      }

      // 3. Proximidad de Fecha (+30 puntos max)
      if (isAmountCompatible || isExactRef) {
        if (dateDiffDays <= 1) {
          score += 30;
          reasons.push(`Fecha idéntica o inmediata (${dateDiffDays} día de diferencia)`);
        } else if (dateDiffDays <= 4) {
          score += 25;
          reasons.push(`Fecha cercana (${dateDiffDays} días de diferencia)`);
        } else if (dateDiffDays <= 10) {
          score += 15;
          reasons.push(`Ventana de liquidación (${dateDiffDays} días de diferencia)`);
        } else if (dateDiffDays <= 30) {
          score += 5;
          reasons.push(`Fecha en el mismo mes (${dateDiffDays} días de diferencia)`);
        } else {
          score -= 15;
          reasons.push(`Fecha lejana (${dateDiffDays} días de diferencia)`);
        }

        candidates.push({
          allocationId: alloc.id,
          paymentId: p.id,
          paymentCode: p.code,
          paymentMethod: p.paymentMethod || 'SumUp',
          transactionRef: p.transactionRef,
          paymentDate: p.paymentDate,
          grossAmount,
          currency: p.currency,
          usdEquivalent: p.usdEquivalent ? Number(p.usdEquivalent) : null,
          customerName: customer?.legalName || customer?.rut || 'Cliente SATEM',
          expedientCode: expCode,
          expedientId: exp?.id,
          invoiceFolio,
          score,
          isExactRef,
          dateDiffDays,
          feeDifferenceClp,
          reasons,
        });
      }
    }

    // Ordenar candidatos por puntaje descendente
    candidates.sort((a, b) => b.score - a.score);

    // Clasificación de certeza
    let status: 'EXACT_MATCH' | 'HIGH_CONFIDENCE' | 'AMBIGUOUS' | 'NO_MATCH' = 'NO_MATCH';
    let suggestedCandidate: MatchCandidate | undefined = undefined;
    let reconciliationNotes = 'Auto-Match SATEM';

    const topCandidate = candidates[0];

    if (topCandidate) {
      if (topCandidate.isExactRef) {
        status = 'EXACT_MATCH';
        suggestedCandidate = topCandidate;
        reconciliationNotes = `Auto-Match Referencia Exacta (${topCandidate.paymentCode} - ${topCandidate.customerName || 'SATEM'})`;
      } else if (candidates.length === 1 && topCandidate.score >= 60 && topCandidate.dateDiffDays <= 15) {
        status = 'HIGH_CONFIDENCE';
        suggestedCandidate = topCandidate;
        const fee = topCandidate.feeDifferenceClp;
        reconciliationNotes = fee > 0
          ? `Auto-Match SumUp: Neto $${receiptAmount.toLocaleString('es-CL')} CLP (Comisión: $${fee.toLocaleString('es-CL')} CLP - ${topCandidate.customerName})`
          : `Auto-Match por Monto y Fecha (${topCandidate.paymentCode} - ${topCandidate.customerName})`;
      } else if (candidates.length > 1) {
        // Ambigüedad detectada: múltiples pagos candidatos con montos/fechas similares sin link único
        // Ver si el primer candidato supera al segundo por amplio margen (>30 pts)
        const secondCandidate = candidates[1];
        if (topCandidate.score - secondCandidate.score >= 35 && topCandidate.dateDiffDays <= 2) {
          status = 'HIGH_CONFIDENCE';
          suggestedCandidate = topCandidate;
          reconciliationNotes = `Auto-Match Probable (${topCandidate.paymentCode} - ${topCandidate.customerName})`;
        } else {
          status = 'AMBIGUOUS';
          // No auto-asignamos ciegamente para evitar colisión de contratos/links
          reconciliationNotes = `Requiere Confirmación: ${candidates.length} pagos candidatos detectados con montos similares`;
        }
      }
    }

    return {
      receipt,
      status,
      suggestedCandidate,
      candidates,
      reconciliationNotes,
    };
  });
}

export async function previewAutoMatchBankHandler(request: FastifyRequest, reply: FastifyReply) {
  const unreconciledReceipts = await prisma.bankReceipt.findMany({
    where: { status: ReconciliationStatus.UNRECONCILED },
    orderBy: { transactionDate: 'asc' },
  });

  const paymentAllocations = await prisma.paymentAllocation.findMany({
    where: { reconciliations: { none: {} } },
    include: {
      payment: {
        include: {
          proofDocument: { include: { links: true } },
          paymentRequest: {
            include: {
              invoice: {
                include: { expedient: { include: { customer: true } } },
              },
            },
          },
        },
      },
    },
  });

  const analyzed = analyzeReceiptMatches(unreconciledReceipts, paymentAllocations);

  const exactCount = analyzed.filter(a => a.status === 'EXACT_MATCH').length;
  const highConfidenceCount = analyzed.filter(a => a.status === 'HIGH_CONFIDENCE').length;
  const ambiguousCount = analyzed.filter(a => a.status === 'AMBIGUOUS').length;
  const noMatchCount = analyzed.filter(a => a.status === 'NO_MATCH').length;

  return reply.send({
    success: true,
    data: {
      items: analyzed,
      summary: {
        totalUnreconciledReceipts: unreconciledReceipts.length,
        totalUnreconciledPayments: paymentAllocations.length,
        exactMatchCount: exactCount,
        highConfidenceCount,
        ambiguousCount,
        noMatchCount,
        readyToReconcileCount: exactCount + highConfidenceCount,
      },
    },
  });
}

export async function confirmBatchAutoMatchHandler(request: FastifyRequest, reply: FastifyReply) {
  const batchSchema = z.object({
    matches: z.array(
      z.object({
        bankReceiptId: z.string().uuid(),
        paymentAllocationId: z.string().uuid().optional(),
        paymentId: z.string().uuid().optional(),
        notes: z.string().optional(),
      })
    ).min(1, 'Debe incluir al menos 1 coincidencia para conciliar'),
  });

  const body = batchSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  let reconciledCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const m of body.matches) {
      const receipt = await tx.bankReceipt.findUnique({
        where: { id: m.bankReceiptId },
      });
      if (!receipt || receipt.status === ReconciliationStatus.RECONCILED) {
        continue;
      }

      let allocId = m.paymentAllocationId;
      if (!allocId && m.paymentId) {
        const p = await tx.payment.findUnique({
          where: { id: m.paymentId },
          include: { allocations: true },
        });
        if (p?.allocations?.[0]) {
          allocId = p.allocations[0].id;
        }
      }

      if (!allocId) continue;

      const alloc = await tx.paymentAllocation.findUnique({
        where: { id: allocId },
        include: {
          payment: {
            include: {
              paymentRequest: { include: { invoice: true } },
              proofDocument: { include: { links: true } },
            },
          },
        },
      });

      if (!alloc) continue;

      const receiptAmount = Number(receipt.amountClp);
      const grossAmount = Number(alloc.payment.amount);
      const feeDiff = Math.max(0, grossAmount - receiptAmount);
      const notes = m.notes || (feeDiff > 0
        ? `Conciliado: Neto $${receiptAmount.toLocaleString('es-CL')} CLP (Comisión: $${feeDiff.toLocaleString('es-CL')} CLP)`
        : 'Conciliación Confirmada');

      await tx.bankReconciliation.create({
        data: {
          bankReceiptId: receipt.id,
          paymentAllocationId: alloc.id,
          expectedAmountClp: new Prisma.Decimal(grossAmount > 0 ? grossAmount : receiptAmount),
          receivedAmountClp: new Prisma.Decimal(receiptAmount),
          discrepancyAmountClp: new Prisma.Decimal(0),
          notes,
          reconciledById: userId || 'SYSTEM',
        },
      });

      await tx.paymentAllocation.update({
        where: { id: alloc.id },
        data: { allocatedAmount: new Prisma.Decimal(receiptAmount) },
      });

      await tx.bankReceipt.update({
        where: { id: receipt.id },
        data: { status: ReconciliationStatus.RECONCILED },
      });

      const expedId =
        alloc.payment.paymentRequest?.invoice?.expedientId ||
        alloc.payment.proofDocument?.links?.find((l) => l.expedientId)?.expedientId ||
        alloc.payment.proofDocument?.links?.find((l) => l.entityType === 'EXPEDIENT')?.entityId;

      if (expedId) {
        await updateExpedientIntegrityReconciliation(tx, expedId, receipt.code, receiptAmount, userId, receipt.rawSourceFileId);
      }

      reconciledCount++;
    }
  });

  return reply.send({
    success: true,
    data: {
      reconciledCount,
      message: `Se conciliaron exitosamente ${reconciledCount} abonos bancarios.`,
    },
  });
}

export async function autoMatchBankHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as any)?.userId;

  const unreconciledReceipts = await prisma.bankReceipt.findMany({
    where: { status: ReconciliationStatus.UNRECONCILED },
    orderBy: { transactionDate: 'asc' },
  });

  const paymentAllocations = await prisma.paymentAllocation.findMany({
    where: { reconciliations: { none: {} } },
    include: {
      payment: {
        include: {
          proofDocument: { include: { links: true } },
          paymentRequest: {
            include: {
              invoice: {
                include: { expedient: { include: { customer: true } } },
              },
            },
          },
        },
      },
    },
  });

  // Ejecutar análisis inteligente
  const analyzed = analyzeReceiptMatches(unreconciledReceipts, paymentAllocations);

  // Solo conciliar automáticamente coincidencias seguras (EXACT_MATCH o HIGH_CONFIDENCE)
  // NUNCA conciliar de forma ciega las marcadas como AMBIGUOUS
  const safeMatches = analyzed.filter(
    (a) => (a.status === 'EXACT_MATCH' || a.status === 'HIGH_CONFIDENCE') && a.suggestedCandidate
  );

  let matchCount = 0;

  if (safeMatches.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const m of safeMatches) {
        const candidate = m.suggestedCandidate!;
        const receipt = m.receipt;
        const receiptAmount = Number(receipt.amountClp);

        await tx.bankReconciliation.create({
          data: {
            bankReceiptId: receipt.id,
            paymentAllocationId: candidate.allocationId,
            expectedAmountClp: new Prisma.Decimal(candidate.grossAmount > 0 ? candidate.grossAmount : receiptAmount),
            receivedAmountClp: new Prisma.Decimal(receiptAmount),
            discrepancyAmountClp: new Prisma.Decimal(0),
            notes: m.reconciliationNotes,
            reconciledById: userId || 'SYSTEM',
          },
        });

        await tx.paymentAllocation.update({
          where: { id: candidate.allocationId },
          data: { allocatedAmount: new Prisma.Decimal(receiptAmount) },
        });

        await tx.bankReceipt.update({
          where: { id: receipt.id },
          data: { status: ReconciliationStatus.RECONCILED },
        });

        if (candidate.expedientId) {
          await updateExpedientIntegrityReconciliation(tx, candidate.expedientId, receipt.code, receiptAmount, userId, receipt.rawSourceFileId);
        }

        matchCount++;
      }
    });
  }

  const ambiguousCount = analyzed.filter(a => a.status === 'AMBIGUOUS').length;

  let message = '';
  if (matchCount > 0) {
    message = `Se conciliaron de forma segura ${matchCount} movimientos.`;
    if (ambiguousCount > 0) {
      message += ` Hay ${ambiguousCount} abonos con múltiples pagos de montos similares que requieren selección manual para evitar colisiones.`;
    }
  } else if (ambiguousCount > 0) {
    message = `Se detectaron ${ambiguousCount} abonos con múltiples candidatos de montos similares. Por favor selecciona el link/contrato correspondiente en el botón "Conciliar".`;
  } else {
    message = 'No se encontraron coincidencias automáticas seguras pendientes.';
  }

  return reply.send({
    success: true,
    data: {
      reconciledCount: matchCount,
      ambiguousCount,
      message,
    },
  });
}


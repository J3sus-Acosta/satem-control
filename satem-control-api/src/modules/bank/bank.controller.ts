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
  paymentAllocationId: z.string().uuid(),
  expectedAmountClp: z.number().positive(),
  receivedAmountClp: z.number().positive(),
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
  userId?: string
) {
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

  const discrepancyAmountClp = Math.abs(body.expectedAmountClp - body.receivedAmountClp);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const reconciliation = await tx.bankReconciliation.create({
      data: {
        bankReceiptId: body.bankReceiptId,
        paymentAllocationId: body.paymentAllocationId,
        expectedAmountClp: new Prisma.Decimal(body.expectedAmountClp),
        receivedAmountClp: new Prisma.Decimal(body.receivedAmountClp),
        discrepancyAmountClp: new Prisma.Decimal(discrepancyAmountClp),
        notes: body.notes || null,
        reconciledById: userId,
      },
    });

    const receipt = await tx.bankReceipt.update({
      where: { id: body.bankReceiptId },
      data: {
        status: discrepancyAmountClp > 0 ? ReconciliationStatus.DISCREPANCY : ReconciliationStatus.RECONCILED,
      },
    });

    // Resolver expediente
    let targetExpedientId = body.expedientId;
    if (!targetExpedientId) {
      const alloc = await tx.paymentAllocation.findUnique({
        where: { id: body.paymentAllocationId },
        include: {
          payment: {
            include: {
              paymentRequest: { include: { invoice: true } },
              proofDocument: { include: { links: true } },
            },
          },
        },
      });
      targetExpedientId =
        alloc?.payment?.paymentRequest?.invoice?.expedientId ||
        alloc?.payment?.proofDocument?.links?.find((l) => l.expedientId)?.expedientId ||
        undefined;
    }

    if (targetExpedientId) {
      await updateExpedientIntegrityReconciliation(tx, targetExpedientId, receipt.code, body.receivedAmountClp, userId);
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
                include: { expedient: true },
              },
            },
          },
        },
      },
    },
  });

  // Priorizar alocaciones que tengan expediente o documento vinculado
  paymentAllocations.sort((a, b) => {
    const aHasExp = (a.payment.paymentRequest?.invoice?.expedientId || a.payment.proofDocument?.links?.length) ? 1 : 0;
    const bHasExp = (b.payment.paymentRequest?.invoice?.expedientId || b.payment.proofDocument?.links?.length) ? 1 : 0;
    return bHasExp - aHasExp;
  });

  let matchCount = 0;

  for (const receipt of unreconciledReceipts) {
    const receiptAmount = Number(receipt.amountClp);
    if (receiptAmount <= 0) continue;

    const match = paymentAllocations.find((alloc) => {
      const p = alloc.payment;

      if (receipt.referenceNumber && p.transactionRef) {
        const refR = receipt.referenceNumber.trim().toLowerCase();
        const refP = p.transactionRef.trim().toLowerCase();
        if (refR.includes(refP) || refP.includes(refR)) {
          return true;
        }
      }

      const isSumUpBank = receipt.description.toLowerCase().includes('sumup');
      const isSumUpPayment = (p.paymentMethod || '').toLowerCase().includes('sumup') || (p.transactionRef || '').toLowerCase().includes('pid');

      const allocAmount = Number(alloc.allocatedAmount);
      const grossAmount = Number(p.amount);

      if (Math.abs(allocAmount - receiptAmount) < 1) {
        return true;
      }

      if (isSumUpBank && isSumUpPayment && (Math.abs(allocAmount - receiptAmount) < 1 || Math.abs(grossAmount - receiptAmount) < 1)) {
        return true;
      }

      return false;
    });

    if (match) {
      const expedId =
        match.payment.paymentRequest?.invoice?.expedientId ||
        match.payment.proofDocument?.links?.find((l) => l.expedientId)?.expedientId ||
        match.payment.proofDocument?.links?.find((l) => l.entityType === 'EXPEDIENT')?.entityId;

      await prisma.$transaction(async (tx) => {
        await tx.bankReconciliation.create({
          data: {
            bankReceiptId: receipt.id,
            paymentAllocationId: match.id,
            expectedAmountClp: new Prisma.Decimal(receiptAmount),
            receivedAmountClp: new Prisma.Decimal(receiptAmount),
            discrepancyAmountClp: new Prisma.Decimal(0),
            notes: 'Auto-Match Automático SATEM',
            reconciledById: userId || 'SYSTEM',
          },
        });

        await tx.bankReceipt.update({
          where: { id: receipt.id },
          data: { status: ReconciliationStatus.RECONCILED },
        });

        if (expedId) {
          await updateExpedientIntegrityReconciliation(tx, expedId, receipt.code, receiptAmount, userId);
        }
      });

      matchCount++;
      const idx = paymentAllocations.indexOf(match);
      if (idx > -1) paymentAllocations.splice(idx, 1);
    }
  }

  return reply.send({
    success: true,
    data: {
      reconciledCount: matchCount,
      message: matchCount > 0 ? `Se conciliaron exitosamente ${matchCount} movimientos.` : 'No se encontraron coincidencias automáticas pendientes.',
    },
  });
}

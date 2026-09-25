import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as xlsx from 'xlsx';
import { parse } from 'csv-parse/sync';
import { Prisma, ReconciliationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
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

export async function listBankReceiptsHandler(request: FastifyRequest, reply: FastifyReply) {
  const receipts = await prisma.bankReceipt.findMany({
    include: {
      reconciliations: {
        include: {
          paymentAllocation: {
            include: {
              payment: {
                include: {
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
  let rawBuffer: Buffer | null = null;
  let filename = '';

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      filename = part.filename;
      rawBuffer = await part.toBuffer();
    }
  }

  if (!rawBuffer) {
    throw new AppError('No se adjuntó ningún archivo de cartola bancaria', 400);
  }

  const isPdf = filename.toLowerCase().endsWith('.pdf') || (rawBuffer.length > 4 && rawBuffer.toString('utf8', 0, 4) === '%PDF');

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

  // 4. Localizar fila de encabezados y mapear columnas exactas de Santander Chile
  let headerRowIndex = -1;
  let montoCol = -1;
  let descCol = -1;
  let dateCol = -1;
  let docCol = -1;
  let cargoAbonoCol = -1;
  let movCol = -1;

  for (let i = 0; i < Math.min(rows2D.length, 30); i++) {
    const row = rows2D[i];
    if (!Array.isArray(row)) continue;

    const rowStr = row.map((c) => String(c || '').trim()).join(' ').toLowerCase();

    // Detectar cuenta corriente en metadatos iniciales
    if (rowStr.includes('cuenta') && (rowStr.includes('corriente') || rowStr.includes('cte') || rowStr.includes('n°') || rowStr.includes('n°:'))) {
      const ctaMatch = rowStr.match(/(?:cuenta\s*corriente\s*n[°o\.]*\s*[:#]?\s*)([0-9\-]+)/i) || rowStr.match(/([0-9\-]{5,})/);
      if (ctaMatch && ctaMatch[1]) {
        detectedAccount = `Santander Cta Cte ${ctaMatch[1]}`;
      }
    }

    let colMonto = -1;
    let colDesc = -1;
    let colFecha = -1;
    let colDoc = -1;
    let colCargoAbono = -1;
    let colMov = -1;

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim().toLowerCase();
      if (!cell) continue;

      if (cell === 'monto' || cell === 'importe' || cell === 'valor') {
        colMonto = c;
      } else if (cell.includes('descripci') || cell.includes('detalle') || cell.includes('concepto')) {
        colDesc = c;
      } else if (cell === 'fecha' || cell === 'fec.' || cell === 'date') {
        colFecha = c;
      } else if (cell.includes('cargo/abono') || cell === 'c/a' || cell === 'cargo / abono') {
        colCargoAbono = c;
      } else if (cell.includes('documento') || cell === 'n° documento' || cell === 'doc') {
        colDoc = c;
      } else if (cell.includes('movimiento') && (cell.includes('n°') || cell.includes('nro') || cell.includes('num'))) {
        colMov = c;
      }
    }

    if (colMonto !== -1 && (colDesc !== -1 || colFecha !== -1)) {
      headerRowIndex = i;
      montoCol = colMonto;
      descCol = colDesc;
      dateCol = colFecha;
      cargoAbonoCol = colCargoAbono;
      docCol = colDoc;
      movCol = colMov;
      break;
    }
  }

  // Fallback a columnas estándar Santander (A: MONTO, B: DESCRIPCION, C: FECHA, D: SALDO, E: N° DOC, G: CARGO/ABONO, H: N° MOV)
  if (headerRowIndex === -1) {
    headerRowIndex = 11; // Fila 12 (0-indexed 11)
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
    if (!parsedDate) continue; // Saltar filas que no son transacciones (totales, saldos, etc.)

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
      afterData: { count: createdReceipts.length, accountNumber: body.accountNumber },
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

    await tx.bankReceipt.update({
      where: { id: body.bankReceiptId },
      data: {
        status: discrepancyAmountClp > 0 ? ReconciliationStatus.DISCREPANCY : ReconciliationStatus.RECONCILED,
      },
    });

    if (body.expedientId) {
      await tx.expedientIntegrityItem.updateMany({
        where: { expedientId: body.expedientId, code: 'RECONCILIATION_COMPLETED' },
        data: {
          status: 'COMPLETED',
          observation: `Conciliación bancaria Santander efectuada exitosamente`,
          completedAt: new Date(),
          completedById: userId,
        },
      });
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

  // 1. Obtener recibos bancarios sin conciliar
  const unreconciledReceipts = await prisma.bankReceipt.findMany({
    where: { status: ReconciliationStatus.UNRECONCILED },
    orderBy: { transactionDate: 'asc' },
  });

  // 2. Obtener pagos y asignaciones disponibles
  const paymentAllocations = await prisma.paymentAllocation.findMany({
    where: { reconciliations: { none: {} } },
    include: {
      payment: {
        include: {
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

  let matchCount = 0;

  for (const receipt of unreconciledReceipts) {
    const receiptAmount = Number(receipt.amountClp);
    if (receiptAmount <= 0) continue;

    // Buscar coincidencia por referencia exacta, por monto neto asignado o por identificación SumUp
    const match = paymentAllocations.find((alloc) => {
      const p = alloc.payment;

      // 1. Coincidencia por número de referencia bancaria o SumUp PID
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

      // 2. Coincidencia exacta de monto asignado (neto en Santander)
      if (Math.abs(allocAmount - receiptAmount) < 1) {
        return true;
      }

      // 3. Coincidencia de SumUp por monto bruto o neto
      if (isSumUpBank && isSumUpPayment && (Math.abs(allocAmount - receiptAmount) < 1 || Math.abs(grossAmount - receiptAmount) < 1)) {
        return true;
      }

      return false;
    });

    if (match) {
      const expedId = match.payment.paymentRequest?.invoice?.expedientId;
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
          await tx.expedientIntegrityItem.updateMany({
            where: { expedientId: expedId, code: 'RECONCILIATION_COMPLETED' },
            data: {
              status: 'COMPLETED',
              observation: `Conciliación bancaria Santander emparejada con abono (${receipt.code})`,
              completedAt: new Date(),
              completedById: userId,
            },
          });
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

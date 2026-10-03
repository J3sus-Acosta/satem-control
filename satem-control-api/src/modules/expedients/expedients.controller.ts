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
import { resolveStoragePath } from '../../common/utils/storage-path.js';

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
  try {
    const rawExpedients = await prisma.expedient.findMany({
      where: { deletedAt: null },
      include: {
        customer: { include: { country: true } },
        contract: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const fullExpedients = await Promise.all(
      rawExpedients.map(async (exp) => {
        let workOrders: any[] = [];
        let invoices: any[] = [];
        let integrityItems: any[] = [];
        let exceptions: any[] = [];

        try {
          workOrders = await prisma.workOrder.findMany({
            where: { expedientId: exp.id, deletedAt: null },
            include: {
              attentions: {
                where: { deletedAt: null },
                include: {
                  serviceType: true,
                  technicians: { include: { technician: true } },
                },
              },
              receptionConformity: { include: { document: true } },
            },
          });
        } catch (e) {
          request.log.warn({ err: e }, `Failed to load workOrders for expedient ${exp.id}`);
        }

        try {
          invoices = await prisma.invoice.findMany({
            where: { expedientId: exp.id, deletedAt: null },
            include: { pdfDocument: true },
          });
        } catch (e) {
          request.log.warn({ err: e }, `Failed to load invoices for expedient ${exp.id}`);
        }

        try {
          integrityItems = await prisma.expedientIntegrityItem.findMany({
            where: { expedientId: exp.id },
            include: { document: true },
          });
        } catch (e) {
          request.log.warn({ err: e }, `Failed to load integrityItems for expedient ${exp.id}`);
        }

        try {
          exceptions = await prisma.systemException.findMany({
            where: { expedientId: exp.id, status: 'OPEN' },
          });
        } catch (e) {
          request.log.warn({ err: e }, `Failed to load exceptions for expedient ${exp.id}`);
        }

        let docInstances: any[] = [];
        let docLinks: any[] = [];
        try {
          const orConditions: any[] = [{ expedientId: exp.id }];
          if (exp.contractId) orConditions.push({ contractId: exp.contractId });
          if (exp.quotationId) orConditions.push({ quotationId: exp.quotationId });
          if (exp.customerId) orConditions.push({ customerId: exp.customerId });

          docInstances = await prisma.documentInstance.findMany({
            where: { OR: orConditions },
            include: { template: true },
            orderBy: { generatedAt: 'desc' },
          });
        } catch (e) {
          request.log.warn({ err: e }, `Failed to load docInstances for expedient ${exp.id}`);
        }

        try {
          docLinks = await prisma.documentLink.findMany({
            where: { expedientId: exp.id },
            include: { document: true },
          });
        } catch (e) {
          request.log.warn({ err: e }, `Failed to load docLinks for expedient ${exp.id}`);
        }

        return {
          ...exp,
          workOrders,
          invoices,
          integrityItems,
          exceptions,
          documentInstances: docInstances,
          documentLinks: docLinks,
        };
      })
    );

    return reply.send({ success: true, data: fullExpedients });
  } catch (err: any) {
    request.log.error({ err }, 'Error in listExpedientsHandler');
    throw err;
  }
}

export async function getExpedientHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const expedient = await prisma.expedient.findUnique({
    where: { id: request.params.id },
    include: {
      customer: { include: { country: true } },
      customerEntity: true,
      contract: true,
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
          paymentRequests: {
            include: {
              payments: {
                include: {
                  proofDocument: true,
                  allocations: {
                    include: {
                      reconciliations: {
                        include: { bankReceipt: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      integrityItems: { include: { document: true } },
      exceptions: true,
      snapshots: { select: { id: true, checksumSha256: true, closedAt: true, closedById: true } },
      documentLinks: {
        include: {
          document: {
            include: {
              paymentProof: {
                include: {
                  allocations: {
                    include: {
                      reconciliations: {
                        include: { bankReceipt: true },
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
  });

  if (!expedient || expedient.deletedAt) {
    throw new NotFoundError('Expediente no encontrado');
  }

  // Buscar todas las instancias vinculadas por expedientId o por contractId/quotationId/customerId
  const orConditions: any[] = [{ expedientId: expedient.id }];
  if (expedient.contractId) orConditions.push({ contractId: expedient.contractId });
  if (expedient.quotationId) orConditions.push({ quotationId: expedient.quotationId });
  if (expedient.customerId) orConditions.push({ customerId: expedient.customerId });

  const docInstances = await prisma.documentInstance.findMany({
    where: { OR: orConditions },
    include: { template: true },
    orderBy: { generatedAt: 'desc' },
  });

  // Sincronización e integridad automática protegida
  let needsIntegrityReload = false;
  try {
    // 1. Eliminar ítems obsoletos de ATTENTION_REGISTERED si existieran
    const deletedOld = await prisma.expedientIntegrityItem.deleteMany({
      where: { expedientId: expedient.id, code: 'ATTENTION_REGISTERED' },
    });
    if (deletedOld.count > 0) needsIntegrityReload = true;

    // 2. Auto-asegurar que existan los ítems base de integridad con upsert seguro
    const standardCodes = [
      { code: 'CUSTOMER_DATA_COMPLETE', name: 'Datos del Cliente completos', category: 'DOCUMENTAL', isRequired: true },
      { code: 'WORK_ORDER_PRESENT', name: 'Orden de Trabajo autorizada', category: 'OPERATIONAL', isRequired: true },
      { code: 'RECEPTION_SIGNED', name: 'Recepción Conforme firmada por cliente', category: 'OPERATIONAL', isRequired: true },
    ];
    if (expedient.taxTreatment !== TaxTreatment.NO_INVOICE) {
      standardCodes.push(
        { code: 'INVOICE_REGISTERED', name: 'Factura SII registrada', category: 'TAX', isRequired: true },
        { code: 'PAYMENT_PROOF_PRESENT', name: 'Comprobante de pago registrado', category: 'FINANCIAL', isRequired: true },
        { code: 'RECONCILIATION_COMPLETED', name: 'Conciliación bancaria Santander', category: 'FINANCIAL', isRequired: true }
      );
    }

    for (const std of standardCodes) {
      const exists = (expedient.integrityItems || []).some((i) => i.code === std.code);
      if (!exists) {
        await prisma.expedientIntegrityItem.upsert({
          where: {
            expedientId_code: {
              expedientId: expedient.id,
              code: std.code,
            },
          },
          update: {},
          create: {
            expedientId: expedient.id,
            code: std.code,
            name: std.name,
            category: std.category,
            isRequired: std.isRequired,
            status: 'PENDING',
          },
        });
        needsIntegrityReload = true;
      }
    }

    // 3. Auto-vincular documentos de Facturas en DocumentLinks si no están enlazados
    if (expedient.invoices && expedient.invoices.length > 0) {
      for (const inv of expedient.invoices) {
        const invDocId = inv.pdfDocumentId || inv.pdfDocument?.id;
        if (invDocId) {
          const docInDb = await prisma.document.findUnique({ where: { id: invDocId } });
          if (docInDb) {
            const linkExists = (expedient.documentLinks || []).some((l) => l.documentId === invDocId);
            if (!linkExists) {
              await prisma.documentLink.create({
                data: {
                  documentId: invDocId,
                  entityType: 'EXPEDIENT',
                  entityId: expedient.id,
                  expedientId: expedient.id,
                },
              });
            }
          }
        }
      }
    }

    // 4. Sincronización activa de ítems de integridad
    const currentItems = needsIntegrityReload
      ? await prisma.expedientIntegrityItem.findMany({ where: { expedientId: expedient.id }, include: { document: true } })
      : expedient.integrityItems;

    for (const item of currentItems) {
      if (item.code === 'ATTENTION_REGISTERED') continue;

      if (item.code === 'WORK_ORDER_PRESENT') {
        const wo = docInstances.find(
          (d) =>
            (d.category === 'WORK_ORDER' ||
              d.template?.category === 'WORK_ORDER' ||
              d.documentNumber?.startsWith('OT')) &&
            d.category !== 'RECEPTION_CONFORMITY' &&
            !d.documentNumber?.startsWith('RC') &&
            !d.documentNumber?.startsWith('REC')
        );
        const hasWoEntity = expedient.workOrders && expedient.workOrders.length > 0;
        const docNum = wo?.documentNumber || (hasWoEntity ? expedient.workOrders[0].code : 'OT');

        // La OT solo se considera completada si la instancia tiene status SIGNED y signedPdfPath,
        // o si existe un documento externo exclusivo de OT firmada cargado
        const isWoInstanceSigned = !!wo && (wo.status === 'SIGNED' && !!wo.signedPdfPath);

        let validWoDocId: string | null = null;
        if (item.documentId) {
          const doc = await prisma.document.findUnique({ where: { id: item.documentId } });
          if (doc) {
            const isInvalidDoc =
              doc.category === 'EVIDENCE' ||
              doc.category === 'BANK_RECEIPT' ||
              doc.category === 'PAYMENT_PROOF' ||
              doc.category === 'INVOICE' ||
              doc.originalName?.toUpperCase().includes('RC') ||
              doc.originalName?.toUpperCase().includes('RECEPCION') ||
              doc.originalName?.toUpperCase().includes('CARTOLA');

            if (!isInvalidDoc && (doc.category === 'WORK_ORDER' || doc.originalName?.toUpperCase().includes('OT') || doc.originalName?.toUpperCase().includes('ORDEN'))) {
              validWoDocId = doc.id;
            }
          }
        }

        const isWoSigned = isWoInstanceSigned || !!validWoDocId;

        if (isWoSigned) {
          const completedObs = `Orden de Trabajo autorizada y firmada por cliente (${docNum})`;
          if (item.status !== 'COMPLETED' || item.observation !== completedObs) {
            await prisma.expedientIntegrityItem.update({
              where: { id: item.id },
              data: {
                status: 'COMPLETED',
                documentId: validWoDocId || item.documentId || null,
                observation: completedObs,
                completedAt: wo?.signedAt || item.completedAt || new Date(),
              },
            });
            needsIntegrityReload = true;
          }
        } else {
          // Si NO está firmada, forzar estado PENDING y limpiar cualquier documentId cruzado
          const pendingObs = (wo || hasWoEntity)
            ? `Orden de Trabajo autorizada emitida (${docNum}) — Pendiente de firma`
            : 'Pendiente de autorización y emisión de Orden de Trabajo';

          if (item.status !== 'PENDING' || item.documentId !== null || item.observation !== pendingObs) {
            await prisma.expedientIntegrityItem.update({
              where: { id: item.id },
              data: {
                status: 'PENDING',
                documentId: null,
                observation: pendingObs,
                completedAt: null,
              },
            });
            needsIntegrityReload = true;
          }
        }
      } else if (item.code === 'CONTRACT_PRESENT') {
        const sow = docInstances.find(
          (d) =>
            (d.category === 'CONTRACT' ||
              d.template?.category === 'CONTRACT' ||
              d.template?.code?.toUpperCase().includes('SOW') ||
              d.documentNumber?.startsWith('SOW') ||
              d.documentNumber?.startsWith('CON')) &&
            d.category !== 'RECEPTION_CONFORMITY' &&
            d.category !== 'WORK_ORDER' &&
            d.category !== 'QUOTATION' &&
            d.category !== 'ATTENTION_REPORT' &&
            d.category !== 'SERVICE_REPORT' &&
            !d.documentNumber?.startsWith('RC') &&
            !d.documentNumber?.startsWith('REC') &&
            !d.documentNumber?.startsWith('OT') &&
            !d.documentNumber?.startsWith('COT')
        );

        // El SOW solo se considera completado si la instancia tiene status SIGNED y signedPdfPath,
        // o si existe un documento externo exclusivo de contrato firmado (descartando RC, OT, Cotización o Cartola)
        const isSowInstanceSigned = !!sow && (sow.status === 'SIGNED' && !!sow.signedPdfPath);

        let validContractDocId: string | null = null;
        if (item.documentId) {
          const doc = await prisma.document.findUnique({ where: { id: item.documentId } });
          if (doc) {
            const isInvalidDoc =
              doc.category === 'EVIDENCE' ||
              doc.category === 'BANK_RECEIPT' ||
              doc.category === 'PAYMENT_PROOF' ||
              doc.category === 'INVOICE' ||
              doc.originalName?.toUpperCase().includes('RC') ||
              doc.originalName?.toUpperCase().includes('RECEPCION') ||
              doc.originalName?.toUpperCase().includes('OT') ||
              doc.originalName?.toUpperCase().includes('CARTOLA');

            if (!isInvalidDoc && (doc.category === 'CONTRACT' || doc.originalName?.toUpperCase().includes('CONTRATO') || doc.originalName?.toUpperCase().includes('SOW'))) {
              validContractDocId = doc.id;
            }
          }
        }

        const isContractSigned = isSowInstanceSigned || !!validContractDocId;

        if (isContractSigned) {
          const docCode = sow?.documentNumber || expedient.contract?.code || 'SOW';
          if (item.status !== 'COMPLETED' || item.observation?.includes('Pendiente')) {
            await prisma.expedientIntegrityItem.update({
              where: { id: item.id },
              data: {
                status: 'COMPLETED',
                documentId: validContractDocId || item.documentId || null,
                observation: `Contrato SOW firmado por cliente cargado y verificado (${docCode})`,
                completedAt: sow?.signedAt || item.completedAt || new Date(),
              },
            });
            needsIntegrityReload = true;
          }
        } else {
          // Si NO está firmado, forzar estado PENDING y limpiar cualquier documentId cruzado
          const pendingObs = sow
            ? `Contrato SOW emitido (${sow.documentNumber}) — Pendiente de firma del cliente`
            : (expedient.contract?.code ? `Contrato SOW registrado (${expedient.contract.code}) — Pendiente de firma del cliente` : 'Pendiente de emisión y firma de Contrato SOW');

          if (item.status !== 'PENDING' || item.documentId !== null || item.observation !== pendingObs) {
            await prisma.expedientIntegrityItem.update({
              where: { id: item.id },
              data: {
                status: 'PENDING',
                documentId: null,
                observation: pendingObs,
                completedAt: null,
              },
            });
            needsIntegrityReload = true;
          }
        }
      } else if (item.code === 'RECEPTION_SIGNED') {
        const rc = docInstances.find(
          (d) =>
            (d.category === 'RECEPTION_CONFORMITY' ||
              d.template?.category === 'RECEPTION_CONFORMITY' ||
              d.documentNumber?.startsWith('RC') ||
              d.documentNumber?.startsWith('REC')) &&
            (d.status === 'SIGNED' || !!d.signedPdfPath)
        );

        const woWithRc = (expedient.workOrders || []).find((w: any) => !!w.receptionConformity);

        let rcDocId: string | null = null;
        if (item.documentId) {
          const doc = await prisma.document.findUnique({ where: { id: item.documentId } });
          if (doc) rcDocId = doc.id;
        }
        if (!rcDocId) {
          const rcLink = (expedient.documentLinks || []).find(
            (l: any) =>
              l.document?.category === 'RECEPTION' ||
              l.document?.category === 'RECEPTION_CONFORMITY' ||
              l.document?.originalName?.toUpperCase().includes('RC') ||
              l.document?.originalName?.toUpperCase().includes('RECEPCION')
          );
          if (rcLink) rcDocId = rcLink.documentId;
        }

        const isRcSigned = !!rc || !!woWithRc || !!rcDocId;

        if (isRcSigned) {
          const rcCode = rc?.documentNumber || woWithRc?.receptionConformity?.code || 'RC';
          const completedObs = `Recepción Conforme firmada por cliente cargada y verificada (${rcCode})`;
          if (item.status !== 'COMPLETED' || (!item.documentId && rcDocId) || item.observation !== completedObs) {
            await prisma.expedientIntegrityItem.update({
              where: { id: item.id },
              data: {
                status: 'COMPLETED',
                documentId: rcDocId || item.documentId || null,
                observation: completedObs,
                completedAt: rc?.signedAt || woWithRc?.receptionConformity?.receptionDate || item.completedAt || new Date(),
              },
            });
            needsIntegrityReload = true;
          }
        } else {
          if (item.status === 'COMPLETED') {
            await prisma.expedientIntegrityItem.update({
              where: { id: item.id },
              data: {
                status: 'PENDING',
                documentId: null,
                observation: 'Pendiente de emisión y firma de Recepción Conforme',
                completedAt: null,
              },
            });
            needsIntegrityReload = true;
          }
        }
      } else if (item.code === 'INVOICE_REGISTERED') {
        if (expedient.invoices && expedient.invoices.length > 0) {
          const inv = expedient.invoices[0];
          const invDocId = inv.pdfDocumentId || inv.pdfDocument?.id;
          let validDocId: string | null = null;
          if (invDocId) {
            const docExists = await prisma.document.findUnique({ where: { id: invDocId } });
            if (docExists) validDocId = invDocId;
          }
          if (item.status !== 'COMPLETED' || (!item.documentId && validDocId)) {
            await prisma.expedientIntegrityItem.update({
              where: { id: item.id },
              data: {
                status: 'COMPLETED',
                documentId: validDocId || item.documentId || null,
                observation: `Factura SII N° ${inv.siiFolio} registrada y verificada`,
                completedAt: item.completedAt || new Date(),
              },
            });
            needsIntegrityReload = true;
          }
        }
      } else if (item.code === 'PAYMENT_PROOF_PRESENT') {
        const payLink = (expedient.documentLinks || []).find(
          (l) => l.document?.category === 'PAYMENT_PROOF' || l.document?.category === 'SUMUP_PROOF'
        );
        if (payLink?.documentId) {
          if (item.status !== 'COMPLETED' || !item.documentId) {
            await prisma.expedientIntegrityItem.update({
              where: { id: item.id },
              data: {
                status: 'COMPLETED',
                documentId: payLink.documentId,
                observation: `Comprobante de pago registrado (${payLink.document?.originalName || 'Comprobante'})`,
                completedAt: item.completedAt || new Date(),
              },
            });
            needsIntegrityReload = true;
          }
        }
      } else if (item.code === 'RECONCILIATION_COMPLETED') {
        let totalReconciledClp = 0;
        let totalReconciledUsd = 0;
        const receiptCodes: string[] = [];
        const seenRecs = new Set<string>();

        for (const inv of expedient.invoices) {
          for (const pr of inv.paymentRequests) {
            for (const p of pr.payments) {
              for (const alloc of p.allocations) {
                for (const rec of alloc.reconciliations) {
                  if (!seenRecs.has(rec.id)) {
                    seenRecs.add(rec.id);
                    totalReconciledClp += Number(rec.receivedAmountClp || 0);
                    const pUsd = Number(p.usdEquivalent || 0) || (p.currency === 'USD' ? Number(p.amount) : 0);
                    totalReconciledUsd += pUsd;
                    if (rec.bankReceipt?.code && !receiptCodes.includes(rec.bankReceipt.code)) {
                      receiptCodes.push(rec.bankReceipt.code);
                    }
                  }
                }
              }
            }
          }
        }

        for (const link of expedient.documentLinks || []) {
          if (link.document?.paymentProof) {
            for (const p of link.document.paymentProof) {
              for (const alloc of p.allocations) {
                for (const rec of alloc.reconciliations) {
                  if (!seenRecs.has(rec.id)) {
                    seenRecs.add(rec.id);
                    totalReconciledClp += Number(rec.receivedAmountClp || 0);
                    const pUsd = Number(p.usdEquivalent || 0) || (p.currency === 'USD' ? Number(p.amount) : 0);
                    totalReconciledUsd += pUsd;
                    if (rec.bankReceipt?.code && !receiptCodes.includes(rec.bankReceipt.code)) {
                      receiptCodes.push(rec.bankReceipt.code);
                    }
                  }
                }
              }
            }
          }
        }

        if (totalReconciledClp > 0) {
          const contractAmount = Number(expedient.contract?.totalAmount || 0);
          const totalInvoiceAmount = expedient.invoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
          const currency = expedient.contract?.currency || expedient.invoices[0]?.currency || 'USD';
          const codesStr = receiptCodes.length > 0 ? receiptCodes.join(', ') : 'Santander';

          let progressText = '';
          if (currency === 'USD' && (contractAmount > 0 || totalInvoiceAmount > 0)) {
            const targetUsd = contractAmount > 0 ? contractAmount : totalInvoiceAmount;
            let pct = Math.min(100, Math.round((totalReconciledUsd / targetUsd) * 100));
            if (pct >= 99) pct = 100;
            progressText = `Conciliación bancaria Santander confirmada (${codesStr}) • Progreso: ${pct}% ($${totalReconciledUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / $${targetUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD) • Total Líquido Santander: $${totalReconciledClp.toLocaleString('es-CL')} CLP`;
          } else if (currency === 'CLP' && contractAmount > 0) {
            let pct = Math.min(100, Math.round((totalReconciledClp / contractAmount) * 100));
            if (pct >= 99) pct = 100;
            progressText = `Conciliación bancaria Santander confirmada (${codesStr}) • Pagado y Conciliado: ${pct}% ($${totalReconciledClp.toLocaleString('es-CL')} / $${contractAmount.toLocaleString('es-CL')} CLP)`;
          } else {
            progressText = `Conciliación bancaria Santander confirmada (${codesStr}) • Total Conciliado en Banco: $${totalReconciledClp.toLocaleString('es-CL')} CLP`;
          }

          if (item.status !== 'COMPLETED' || item.observation !== progressText) {
            await prisma.expedientIntegrityItem.update({
              where: { id: item.id },
              data: {
                status: 'COMPLETED',
                observation: progressText,
                completedAt: item.completedAt || new Date(),
              },
            });
            needsIntegrityReload = true;
          }
        }
      }
    }
  } catch (syncErr) {
    console.error('Warning: Error in integrity item auto-synchronization (non-fatal):', syncErr);
  }

  let finalIntegrityItems: any[] = [];
  try {
    finalIntegrityItems = await prisma.expedientIntegrityItem.findMany({
      where: { expedientId: expedient.id, code: { not: 'ATTENTION_REGISTERED' } },
      include: { document: true },
    });
  } catch {
    finalIntegrityItems = (expedient.integrityItems || []).filter((i) => i.code !== 'ATTENTION_REGISTERED');
  }

  let finalDocumentLinks = expedient.documentLinks || [];
  try {
    finalDocumentLinks = await prisma.documentLink.findMany({
      where: {
        OR: [
          { expedientId: expedient.id },
          { entityType: 'EXPEDIENT', entityId: expedient.id },
        ],
      },
      include: {
        document: {
          include: {
            paymentProof: {
              include: {
                allocations: {
                  include: {
                    reconciliations: {
                      include: { bankReceipt: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch {
    // fallback
  }

  return reply.send({
    success: true,
    data: {
      ...expedient,
      documentLinks: finalDocumentLinks,
      integrityItems: finalIntegrityItems,
      documentInstances: docInstances,
    },
  });
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

const reopenExpedientSchema = z.object({
  reason: z.string().min(3, 'Debe especificar el motivo de reapertura'),
});

export async function reopenExpedientHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const body = reopenExpedientSchema.parse(request.body || {});
  const userId = (request.user as any)?.userId;

  const expedient = await prisma.expedient.findUnique({ where: { id } });
  if (!expedient || expedient.deletedAt) {
    throw new NotFoundError('Expediente no encontrado');
  }

  const updatedExpedient = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const reopened = await tx.expedient.update({
      where: { id },
      data: {
        status: ExpedientStatus.OPEN,
        closedAt: null,
        closedById: null,
        closeReason: null,
        closeHasException: false,
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'REOPEN_EXPEDIENT',
      entity: 'Expedient',
      entityId: id,
      beforeData: { status: expedient.status, closedAt: expedient.closedAt, closeReason: expedient.closeReason },
      afterData: { status: ExpedientStatus.OPEN, reopenReason: body.reason },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reopened;
  });

  return reply.send({ success: true, data: updatedExpedient, message: 'Expediente reabierto exitosamente' });
}

export async function downloadExpedientBundleHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const expedient = await prisma.expedient.findUnique({
    where: { id: request.params.id },
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

  // Buscar todas las instancias vinculadas por expedientId o contractId/quotationId
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
      request.log.warn({ err }, 'Advertencia al archivar archivo en bundle');
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    request.log.error({ err }, 'Error durante la compresión del bundle zip');
    throw err;
  });

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

  const manifestLines: string[] = [
    '================================================================================',
    `SATEM CONTROL — MANIFIESTO OFICIAL DE AUDITORÍA Y TRAZABILIDAD DOCUMENTAL`,
    '================================================================================',
    `Folio Expediente : ${expedient.code}`,
    `Título Operación : ${expedient.title}`,
    `Cliente          : ${expedient.customer?.legalName || 'N/A'} (Tax ID: ${expedient.customer?.taxId || 'N/A'})`,
    `Tratamiento Trib : ${expedient.taxTreatment} (IVA: ${expedient.vatRate}%)`,
    `Estado Operación : ${expedient.status}`,
    `Fecha Emisión    : ${new Date().toISOString()}`,
    '================================================================================',
    'DOCUMENTOS OFICIALES, INSTANCIAS Y FIRMAS REGISTRADAS:',
    '--------------------------------------------------------------------------------',
  ];

  // 1. Agregar Instancias Documentales Generadas y Firmadas
  for (const inst of docInstances) {
    let targetFolder = '12-Otros';
    if (inst.category === 'CONTRACT') targetFolder = '01-Contrato';
    else if (inst.category === 'QUOTATION') targetFolder = '02-Cotizacion';
    else if (inst.category === 'WORK_ORDER') targetFolder = '03-Orden-Trabajo';
    else if (inst.category === 'ATTENTION_REPORT' || inst.category === 'SERVICE_REPORT') targetFolder = '04-Atenciones';
    else if (inst.category === 'RECEPTION_CONFORMITY') targetFolder = '05-Recepcion-Conforme';

    manifestLines.push(`• [${inst.category}] ${inst.documentNumber}`);
    manifestLines.push(`  - Estado: ${inst.status}`);
    manifestLines.push(`  - Plantilla: ${inst.template?.name || 'Documento Oficial'}`);
    manifestLines.push(`  - Generado: ${inst.generatedAt.toISOString()} | SHA-256: ${inst.generatedPdfHash}`);

    const resolvedPdf = resolveStoragePath(inst.generatedPdfPath);
    if (resolvedPdf) {
      archive.file(resolvedPdf, { name: `${expedient.code}/${targetFolder}/${inst.documentNumber}.pdf` });
    }

    const resolvedSignedPdf = resolveStoragePath(inst.signedPdfPath);
    if (resolvedSignedPdf) {
      manifestLines.push(`  - FIRMA CLIENTE REGISTRADA:`);
      manifestLines.push(`    * Archivo: ${inst.documentNumber}-FIRMADO.pdf`);
      manifestLines.push(`    * Fecha Firma: ${inst.signedAt ? inst.signedAt.toISOString() : 'N/A'}`);
      manifestLines.push(`    * SHA-256 Firma: ${inst.signedPdfHash || 'N/A'}`);

      archive.file(resolvedSignedPdf, { name: `${expedient.code}/${targetFolder}/${inst.documentNumber}-FIRMADO.pdf` });
    } else {
      manifestLines.push(`  - Firma Cliente: PENDIENTE DE CARGA`);
    }
    manifestLines.push('--------------------------------------------------------------------------------');
  }

  // 2. Agregar Documentos adjuntos tradicionales (Facturas, Evidencias, Bancos)
  for (const link of expedient.documentLinks) {
    const resolvedDoc = resolveStoragePath(link.document.storagePath);
    if (resolvedDoc) {
      let targetFolder = '10-Evidencias';
      const cat = link.document.category;
      if (cat === 'INVOICE') targetFolder = '06-Facturacion';
      else if (cat === 'SUMUP_PROOF') targetFolder = '07-SumUp';
      else if (cat === 'PAYMENT_PROOF') targetFolder = '08-Pagos';
      else if (cat === 'BANK_RECEIPT') targetFolder = '09-Banco';
      else if (cat === 'REPORT') targetFolder = '11-Reportes';

      const safeFileName = path.basename(link.document.originalName).replace(/[^a-zA-Z0-9._\-\s]/g, '_') || 'adjunto.pdf';
      manifestLines.push(`• [ADJUNTO ${cat}] ${safeFileName} (${link.document.sha256})`);
      archive.file(resolvedDoc, { name: `${expedient.code}/${targetFolder}/${safeFileName}` });
    }
  }

  manifestLines.push('================================================================================');
  manifestLines.push('FIN DEL MANIFIESTO DE AUDITORÍA SATEM CONTROL');
  manifestLines.push('================================================================================');

  archive.append(manifestLines.join('\r\n'), { name: `${expedient.code}/00-MANIFIESTO-AUDITORIA.txt` });

  // Finalizar el archivo y enviarlo directamente como Stream nativo a Fastify
  archive.finalize();
  return reply.send(archive);
}

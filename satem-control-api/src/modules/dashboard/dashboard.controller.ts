import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';

export async function getDashboardMetricsHandler(request: FastifyRequest, reply: FastifyReply) {
  const openExpedients = await prisma.expedient.count({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, deletedAt: null },
  });

  const activeContracts = await prisma.contract.count({
    where: { status: 'ACTIVE', deletedAt: null },
  });

  // Facturación segregada por moneda
  const invoicedUSD = await prisma.invoice.aggregate({
    _sum: { netAmount: true, totalAmount: true, vatAmount: true },
    where: {
      status: 'ISSUED',
      currency: 'USD',
      deletedAt: null,
    },
  });

  const invoicedCLP = await prisma.invoice.aggregate({
    _sum: { netAmount: true, totalAmount: true, vatAmount: true },
    where: { status: 'ISSUED', currency: 'CLP', deletedAt: null },
  });

  const totalInvoicesCount = await prisma.invoice.count({
    where: { deletedAt: null },
  });

  const nationalInvoicesCount = await prisma.invoice.count({
    where: {
      deletedAt: null,
      OR: [
        { currency: 'CLP' },
        { siiDocType: { in: [33, 34] } },
        { taxTreatment: { in: ['VAT_APPLIED', 'VAT_EXEMPT'] } },
      ],
    },
  });

  const exportInvoicesCount = await prisma.invoice.count({
    where: {
      deletedAt: null,
      AND: [
        { currency: 'USD' },
        { taxTreatment: 'EXPORT_SERVICE' },
      ],
    },
  });

  const paymentsUSD = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      status: 'CONFIRMED',
      currency: 'USD',
      deletedAt: null,
    },
  });

  const paymentsCLP = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'CONFIRMED', currency: 'CLP', deletedAt: null },
  });

  const openExceptions = await prisma.systemException.count({
    where: { status: 'OPEN' },
  });

  const completeExpedients = await prisma.expedient.count({
    where: { status: 'CLOSED', deletedAt: null },
  });

  return reply.send({
    success: true,
    data: {
      operations: {
        openExpedients,
        activeContracts,
        completeExpedients,
        totalInvoicesCount,
        nationalInvoicesCount,
        exportInvoicesCount,
      },
      financial: {
        totalNetInvoicedUSD: Number(invoicedUSD._sum.netAmount || 0),
        totalInvoicedUSD: Number(invoicedUSD._sum.totalAmount || 0),
        totalVatUSD: Number(invoicedUSD._sum.vatAmount || 0),
        totalPaymentsCollectedUSD: Number(paymentsUSD._sum.amount || 0),

        totalNetInvoicedCLP: Number(invoicedCLP._sum.netAmount || 0),
        totalInvoicedCLP: Number(invoicedCLP._sum.totalAmount || 0),
        totalVatCLP: Number(invoicedCLP._sum.vatAmount || 0),
        totalPaymentsCollectedCLP: Number(paymentsCLP._sum.amount || 0),
      },
      control: {
        openExceptions,
      },
    },
  });
}

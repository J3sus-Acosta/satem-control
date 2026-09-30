import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';

export async function getDashboardMetricsHandler(request: FastifyRequest, reply: FastifyReply) {
  const openExpedients = await prisma.expedient.count({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, deletedAt: null },
  });

  const activeContracts = await prisma.contract.count({
    where: { status: 'ACTIVE', deletedAt: null },
  });

  const totalInvoiced = await prisma.invoice.aggregate({
    _sum: { netAmount: true, totalAmount: true },
    where: { status: 'ISSUED', deletedAt: null },
  });

  const totalInvoicesCount = await prisma.invoice.count({
    where: { deletedAt: null },
  });

  const totalPayments = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'CONFIRMED', deletedAt: null },
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
      },
      financial: {
        totalNetInvoicedUSD: Number(totalInvoiced._sum.netAmount || 0),
        totalInvoicedUSD: Number(totalInvoiced._sum.totalAmount || 0),
        totalPaymentsCollectedUSD: Number(totalPayments._sum.amount || 0),
      },
      control: {
        openExceptions,
      },
    },
  });
}

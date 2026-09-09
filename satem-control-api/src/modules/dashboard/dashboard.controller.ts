import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';

export async function getDashboardMetricsHandler(request: FastifyRequest, reply: FastifyReply) {
  const openExpedients = await prisma.expedient.count({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
  });

  const activeContracts = await prisma.contract.count({
    where: { status: 'ACTIVE' },
  });

  const totalInvoiced = await prisma.invoice.aggregate({
    _sum: { netAmount: true, totalAmount: true },
    where: { status: 'ISSUED' },
  });

  const totalPayments = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'CONFIRMED' },
  });

  const openExceptions = await prisma.systemException.count({
    where: { status: 'OPEN' },
  });

  const completeExpedients = await prisma.expedient.count({
    where: { status: 'CLOSED' },
  });

  return reply.send({
    success: true,
    data: {
      operations: {
        openExpedients,
        activeContracts,
        completeExpedients,
      },
      financial: {
        totalNetInvoicedUSD: totalInvoiced._sum.netAmount || 0,
        totalInvoicedUSD: totalInvoiced._sum.totalAmount || 0,
        totalPaymentsCollectedUSD: totalPayments._sum.amount || 0,
      },
      control: {
        openExceptions,
      },
    },
  });
}

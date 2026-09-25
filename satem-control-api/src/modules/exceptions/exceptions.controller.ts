import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma, ExceptionStatus, ExceptionSeverity } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { createAuditLog } from '../../common/utils/audit.js';

const resolveExceptionSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']),
  resolutionNote: z.string().min(3, 'Nota de resolución requerida'),
});

const createExceptionSchema = z.object({
  expedientId: z.string().uuid().optional().nullable(),
  exceptionType: z.string().default('MANUAL_AUDIT_EXCEPTION'),
  severity: z.nativeEnum(ExceptionSeverity).default(ExceptionSeverity.WARNING),
  title: z.string().min(3, 'Título requerido'),
  description: z.string().min(3, 'Descripción requerida'),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
});

export async function createExceptionHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createExceptionSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const item = await tx.systemException.create({
      data: {
        expedientId: body.expedientId || null,
        exceptionType: body.exceptionType,
        severity: body.severity,
        title: body.title,
        description: body.description,
        entityType: body.entityType || (body.expedientId ? 'Expedient' : null),
        entityId: body.entityId || body.expedientId || null,
        status: ExceptionStatus.OPEN,
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_EXCEPTION',
      entity: 'SystemException',
      entityId: item.id,
      afterData: item,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return item;
  });

  return reply.status(201).send({ success: true, data: created });
}

export async function listExceptionsHandler(request: FastifyRequest, reply: FastifyReply) {
  const exceptions = await prisma.systemException.findMany({
    include: {
      expedient: { include: { customer: true } },
      resolvedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: exceptions });
}

export async function resolveExceptionHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const body = resolveExceptionSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const exception = await prisma.systemException.findUnique({ where: { id } });
  if (!exception) {
    throw new NotFoundError('Excepción no encontrada');
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const item = await tx.systemException.update({
      where: { id },
      data: {
        status: body.status as ExceptionStatus,
        resolvedAt: new Date(),
        resolvedById: userId,
        resolutionNote: body.resolutionNote,
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'RESOLVE_EXCEPTION',
      entity: 'SystemException',
      entityId: id,
      beforeData: { status: exception.status },
      afterData: item,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return item;
  });

  return reply.send({ success: true, data: updated });
}

export async function getControlCenterSummaryHandler(request: FastifyRequest, reply: FastifyReply) {
  const openExceptions = await prisma.systemException.findMany({
    where: { status: 'OPEN' },
  });

  const criticalCount = openExceptions.filter((e) => e.severity === ExceptionSeverity.CRITICAL).length;
  const warningCount = openExceptions.filter((e) => e.severity === ExceptionSeverity.WARNING).length;
  const infoCount = openExceptions.filter((e) => e.severity === ExceptionSeverity.INFO).length;

  const unreconciledPaymentsCount = await prisma.bankReceipt.count({
    where: { status: 'UNRECONCILED' },
  });

  const incompleteExpedientsCount = await prisma.expedient.count({
    where: { status: { in: ['DRAFT', 'OPEN', 'IN_PROGRESS'] } },
  });

  const closedWithExceptionCount = await prisma.expedient.count({
    where: { status: 'CLOSED_WITH_EXCEPTION' },
  });

  const expiringContractsCount = await prisma.contract.count({
    where: {
      status: 'ACTIVE',
      endDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return reply.send({
    success: true,
    data: {
      criticalCount,
      warningCount,
      infoCount,
      unreconciledPaymentsCount,
      incompleteExpedientsCount,
      closedWithExceptionCount,
      expiringContractsCount,
      openExceptions,
    },
  });
}

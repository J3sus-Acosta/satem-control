import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma, WorkOrderStatus, AttentionStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, AppError } from '../../common/errors/app-error.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';

const createWorkOrderSchema = z.object({
  expedientId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().optional(),
});

const createAttentionSchema = z.object({
  expedientId: z.string().uuid(),
  workOrderId: z.string().uuid(),
  contractId: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid(),
  attentionDate: z.string().transform((v) => new Date(v)),
  startTime: z.string().transform((v) => new Date(v)),
  endTime: z.string().transform((v) => new Date(v)),
  hoursWorked: z.number().positive('Las horas deben ser mayor a 0'),
  problem: z.string().min(3),
  workDone: z.string().min(3),
  result: z.string().min(3),
  technicianIds: z.array(z.string().uuid()).min(1, 'Debe asignar al menos 1 técnico'),
});

const createReceptionSchema = z.object({
  workOrderId: z.string().uuid(),
  receptionDate: z.string().transform((v) => new Date(v)),
  acceptedByName: z.string().min(2, 'Nombre de quien acepta requerido'),
  acceptedByRole: z.string().optional(),
  acceptedByEmail: z.string().email().optional().or(z.literal('')),
  comments: z.string().optional(),
  documentId: z.string().uuid().optional(),
});

export async function listWorkOrdersHandler(request: FastifyRequest, reply: FastifyReply) {
  const workOrders = await prisma.workOrder.findMany({
    where: { deletedAt: null },
    include: {
      expedient: { include: { customer: true } },
      attentions: { include: { technicians: { include: { technician: true } } } },
      receptionConformity: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: workOrders });
}

export async function createWorkOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createWorkOrderSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const workOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const code = await generateSequence(tx, 'OT');

    const created = await tx.workOrder.create({
      data: {
        code,
        expedientId: body.expedientId,
        title: body.title,
        description: body.description || null,
        status: WorkOrderStatus.AUTHORIZED,
      },
    });

    await tx.expedient.updateMany({
      where: { id: body.expedientId, status: 'OPEN' },
      data: { status: 'IN_PROGRESS' },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_WORK_ORDER',
      entity: 'WorkOrder',
      entityId: created.id,
      afterData: created,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: workOrder });
}

export async function createAttentionHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createAttentionSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const attention = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const code = await generateSequence(tx, 'AT');

    const created = await tx.attention.create({
      data: {
        code,
        expedientId: body.expedientId,
        workOrderId: body.workOrderId,
        contractId: body.contractId || null,
        serviceTypeId: body.serviceTypeId,
        attentionDate: body.attentionDate,
        startTime: body.startTime,
        endTime: body.endTime,
        hoursWorked: new Prisma.Decimal(body.hoursWorked),
        problem: body.problem,
        workDone: body.workDone,
        result: body.result,
        status: AttentionStatus.COMPLETED,
        technicians: {
          create: body.technicianIds.map((tUserId) => ({ userId: tUserId })),
        },
      },
    });

    if (body.contractId) {
      await tx.contract.update({
        where: { id: body.contractId },
        data: {
          consumedHours: { increment: body.hoursWorked },
          consumedAttentions: { increment: 1 },
        },
      });
    }

    await tx.expedientIntegrityItem.updateMany({
      where: { expedientId: body.expedientId, code: 'ATTENTION_REGISTERED' },
      data: { status: 'COMPLETED', completedAt: new Date(), completedById: userId },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_ATTENTION',
      entity: 'Attention',
      entityId: created.id,
      afterData: created,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: attention });
}

export async function createReceptionConformityHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createReceptionSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: body.workOrderId },
    include: { receptionConformity: true },
  });

  if (!workOrder || workOrder.deletedAt) {
    throw new NotFoundError('Orden de Trabajo no encontrada');
  }

  if (workOrder.receptionConformity) {
    throw new AppError('La Orden de Trabajo ya tiene una Recepción Conforme registrada', 400);
  }

  const reception = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const code = await generateSequence(tx, 'RC');

    const created = await tx.receptionConformity.create({
      data: {
        code,
        workOrderId: body.workOrderId,
        receptionDate: body.receptionDate,
        acceptedByName: body.acceptedByName,
        acceptedByRole: body.acceptedByRole || null,
        acceptedByEmail: body.acceptedByEmail || null,
        comments: body.comments || null,
        documentId: body.documentId || null,
      },
    });

    await tx.workOrder.update({
      where: { id: body.workOrderId },
      data: { status: WorkOrderStatus.CONFORMED },
    });

    await tx.expedientIntegrityItem.updateMany({
      where: { expedientId: workOrder.expedientId, code: 'RECEPTION_SIGNED' },
      data: { status: 'COMPLETED', completedAt: new Date(), completedById: userId },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_RECEPTION_CONFORMITY',
      entity: 'ReceptionConformity',
      entityId: created.id,
      afterData: created,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: reception });
}

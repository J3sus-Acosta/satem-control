import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma, ContractType, ContractModality, ContractStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { generateSequence } from '../../common/utils/sequence.js';
import { createAuditLog } from '../../common/utils/audit.js';

const createContractSchema = z.object({
  customerId: z.string().uuid(),
  customerEntityId: z.string().uuid().optional(),
  type: z.nativeEnum(ContractType),
  modality: z.nativeEnum(ContractModality),
  title: z.string().min(3),
  description: z.string().optional(),
  startDate: z.string().transform((v) => new Date(v)),
  endDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  currency: z.string().default('USD'),
  totalAmount: z.number().optional(),
  rate: z.number().optional(),
  contractedHours: z.number().optional(),
  contractedAttentions: z.number().optional(),
  paymentTerms: z.string().optional(),
});

const createVersionSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  startDate: z.string().transform((v) => new Date(v)),
  endDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  totalAmount: z.number().optional(),
  rate: z.number().optional(),
  contractedHours: z.number().optional(),
  contractedAttentions: z.number().optional(),
  changeReason: z.string().min(5, 'Debe especificar el motivo del cambio de versión'),
});

export async function listContractsHandler(request: FastifyRequest, reply: FastifyReply) {
  const contracts = await prisma.contract.findMany({
    where: { deletedAt: null },
    include: {
      customer: true,
      customerEntity: true,
      versions: { orderBy: { versionNumber: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: contracts });
}

export async function getContractHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const contract = await prisma.contract.findUnique({
    where: { id: request.params.id },
    include: {
      customer: true,
      customerEntity: true,
      versions: { orderBy: { versionNumber: 'desc' } },
      expedients: true,
      attentions: true,
    },
  });

  if (!contract || contract.deletedAt) {
    throw new NotFoundError('Contrato no encontrado');
  }

  const hoursLeft = contract.contractedHours
    ? Number(contract.contractedHours) - Number(contract.consumedHours)
    : null;

  const attentionsLeft = contract.contractedAttentions
    ? contract.contractedAttentions - contract.consumedAttentions
    : null;

  return reply.send({
    success: true,
    data: {
      ...contract,
      metrics: {
        hoursLeft,
        attentionsLeft,
        hoursPercentConsumed: contract.contractedHours
          ? (Number(contract.consumedHours) / Number(contract.contractedHours)) * 100
          : 0,
        attentionsPercentConsumed: contract.contractedAttentions
          ? (contract.consumedAttentions / contract.contractedAttentions) * 100
          : 0,
      },
    },
  });
}

export async function createContractHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createContractSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const contract = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const code = await generateSequence(tx, 'SOW');

    const created = await tx.contract.create({
      data: {
        code,
        customerId: body.customerId,
        customerEntityId: body.customerEntityId || null,
        type: body.type,
        modality: body.modality,
        title: body.title,
        description: body.description || null,
        startDate: body.startDate,
        endDate: body.endDate,
        currency: body.currency,
        totalAmount: body.totalAmount ? new Prisma.Decimal(body.totalAmount) : null,
        rate: body.rate ? new Prisma.Decimal(body.rate) : null,
        contractedHours: body.contractedHours ? new Prisma.Decimal(body.contractedHours) : null,
        contractedAttentions: body.contractedAttentions || null,
        paymentTerms: body.paymentTerms || null,
        status: ContractStatus.ACTIVE,
        currentVersion: 1,
      },
    });

    await tx.contractVersion.create({
      data: {
        contractId: created.id,
        versionNumber: 1,
        title: body.title,
        description: body.description || null,
        startDate: body.startDate,
        endDate: body.endDate,
        totalAmount: body.totalAmount ? new Prisma.Decimal(body.totalAmount) : null,
        rate: body.rate ? new Prisma.Decimal(body.rate) : null,
        contractedHours: body.contractedHours ? new Prisma.Decimal(body.contractedHours) : null,
        contractedAttentions: body.contractedAttentions || null,
        changeReason: 'Creación inicial del contrato',
        createdById: userId,
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_CONTRACT',
      entity: 'Contract',
      entityId: created.id,
      afterData: created,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: contract });
}

export async function addContractVersionHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = request.params;
  const body = createVersionSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const existingContract = await prisma.contract.findUnique({ where: { id } });
  if (!existingContract || existingContract.deletedAt) {
    throw new NotFoundError('Contrato no encontrado');
  }

  const nextVersionNumber = existingContract.currentVersion + 1;

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.contractVersion.create({
      data: {
        contractId: id,
        versionNumber: nextVersionNumber,
        title: body.title,
        description: body.description || null,
        startDate: body.startDate,
        endDate: body.endDate,
        totalAmount: body.totalAmount ? new Prisma.Decimal(body.totalAmount) : null,
        rate: body.rate ? new Prisma.Decimal(body.rate) : null,
        contractedHours: body.contractedHours ? new Prisma.Decimal(body.contractedHours) : null,
        contractedAttentions: body.contractedAttentions || null,
        changeReason: body.changeReason,
        createdById: userId,
      },
    });

    const contractUpdated = await tx.contract.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description || null,
        startDate: body.startDate,
        endDate: body.endDate,
        totalAmount: body.totalAmount ? new Prisma.Decimal(body.totalAmount) : null,
        rate: body.rate ? new Prisma.Decimal(body.rate) : null,
        contractedHours: body.contractedHours ? new Prisma.Decimal(body.contractedHours) : null,
        contractedAttentions: body.contractedAttentions || null,
        currentVersion: nextVersionNumber,
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'UPDATE_CONTRACT_VERSION',
      entity: 'Contract',
      entityId: id,
      beforeData: existingContract,
      afterData: contractUpdated,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return contractUpdated;
  });

  return reply.send({ success: true, data: updated });
}

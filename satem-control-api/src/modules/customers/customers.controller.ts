import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma, ContactType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { createAuditLog } from '../../common/utils/audit.js';

const createCustomerSchema = z.object({
  legalName: z.string().min(2, 'Razón Social requerida'),
  tradeName: z.string().optional(),
  taxId: z.string().min(3, 'Tax ID / RUT requerido'),
  countryCode: z.string().length(3),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  defaultCurrency: z.string().default('USD'),
  notes: z.string().optional(),
});

const createEntitySchema = z.object({
  name: z.string().min(2),
  taxId: z.string().optional(),
  address: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

const createContactSchema = z.object({
  name: z.string().min(2),
  title: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  contactType: z.nativeEnum(ContactType).default(ContactType.TECHNICAL),
  isPrimary: z.boolean().default(false),
});

export async function listCustomersHandler(request: FastifyRequest, reply: FastifyReply) {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    include: {
      country: true,
      entities: true,
      contacts: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: customers });
}

export async function getCustomerHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const customer = await prisma.customer.findUnique({
    where: { id: request.params.id },
    include: {
      country: true,
      entities: true,
      contacts: true,
      contracts: true,
      expedients: true,
    },
  });

  if (!customer || customer.deletedAt) {
    throw new NotFoundError('Cliente no encontrado');
  }

  return reply.send({ success: true, data: customer });
}

export async function createCustomerHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createCustomerSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const possibleDuplicate = await prisma.customer.findFirst({
    where: {
      OR: [
        { taxId: body.taxId },
        { legalName: body.legalName },
      ],
      deletedAt: null,
    },
  });

  const count = await prisma.customer.count();
  const code = `CUST-${String(count + 1).padStart(4, '0')}`;

  const newCustomer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const customer = await tx.customer.create({
      data: {
        code,
        legalName: body.legalName,
        tradeName: body.tradeName || null,
        taxId: body.taxId,
        countryCode: body.countryCode,
        address: body.address || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
        phone: body.phone || null,
        email: body.email || null,
        defaultCurrency: body.defaultCurrency,
        notes: body.notes || null,
      },
      include: { country: true },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer.id,
      afterData: customer,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return customer;
  });

  return reply.status(201).send({
    success: true,
    data: newCustomer,
    warning: possibleDuplicate ? 'Se detectó un cliente similar registrado previamente' : undefined,
  });
}

export async function addEntityHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = request.params;
  const body = createEntitySchema.parse(request.body);

  const entity = await prisma.customerEntity.create({
    data: {
      customerId: id,
      name: body.name,
      taxId: body.taxId || null,
      address: body.address || null,
      isPrimary: body.isPrimary,
    },
  });

  return reply.status(201).send({ success: true, data: entity });
}

export async function addContactHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = request.params;
  const body = createContactSchema.parse(request.body);

  const contact = await prisma.customerContact.create({
    data: {
      customerId: id,
      name: body.name,
      title: body.title || null,
      email: body.email,
      phone: body.phone || null,
      contactType: body.contactType,
      isPrimary: body.isPrimary,
    },
  });

  return reply.status(201).send({ success: true, data: contact });
}

const updateCustomerSchema = z.object({
  legalName: z.string().min(2, 'Razón Social requerida').optional(),
  tradeName: z.string().optional().nullable(),
  taxId: z.string().min(3, 'Tax ID / RUT requerido').optional(),
  countryCode: z.string().length(3).optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  defaultCurrency: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export async function updateCustomerHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = request.params;
  const body = updateCustomerSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const existing = await prisma.customer.findUnique({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new NotFoundError('Cliente no encontrado');
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const customer = await tx.customer.update({
      where: { id },
      data: {
        legalName: body.legalName ?? existing.legalName,
        tradeName: body.tradeName !== undefined ? body.tradeName : existing.tradeName,
        taxId: body.taxId ?? existing.taxId,
        countryCode: body.countryCode ?? existing.countryCode,
        address: body.address !== undefined ? body.address : existing.address,
        city: body.city !== undefined ? body.city : existing.city,
        postalCode: body.postalCode !== undefined ? body.postalCode : existing.postalCode,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: body.email !== undefined ? (body.email || null) : existing.email,
        defaultCurrency: body.defaultCurrency ?? existing.defaultCurrency,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
      include: { country: true, entities: true, contacts: true },
    });

    await createAuditLog(tx, {
      userId,
      action: 'UPDATE_CUSTOMER',
      entity: 'Customer',
      entityId: id,
      beforeData: existing,
      afterData: customer,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return customer;
  });

  return reply.send({ success: true, data: updated });
}

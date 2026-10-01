import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { createClientUserSchema, updateClientUserSchema, setEntityAccessSchema } from './admin-client-users.schema.js';
import { NotFoundError, ConflictError, AppError } from '../../common/errors/app-error.js';
import { createAuditLog } from '../../common/utils/audit.js';
import { emailService } from '../../common/services/email.service.js';

export async function listClientUsersHandler(
  request: FastifyRequest<{ Querystring: { customerId?: string; search?: string; isActive?: string } }>,
  reply: FastifyReply
) {
  const { customerId, search, isActive } = request.query;

  const where: any = {
    deletedAt: null,
  };

  if (customerId) {
    where.customerId = customerId;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { customer: { legalName: { contains: search } } },
    ];
  }

  const clientUsers = await prisma.clientUser.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          code: true,
          legalName: true,
          taxId: true,
        },
      },
      entityRestrictions: {
        include: {
          customerEntity: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({
    success: true,
    data: clientUsers.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      isActive: u.isActive,
      customerId: u.customerId,
      customer: u.customer,
      isInvitePending: Boolean(u.inviteToken),
      invitedAt: u.invitedAt,
      lastLoginAt: u.lastLoginAt,
      allowedEntities: u.entityRestrictions.map((r) => r.customerEntity),
      createdAt: u.createdAt,
    })),
  });
}

export async function getClientUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  const clientUser = await prisma.clientUser.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          entities: true,
          country: true,
        },
      },
      entityRestrictions: {
        include: { customerEntity: true },
      },
    },
  });

  if (!clientUser || clientUser.deletedAt) {
    throw new NotFoundError('Usuario cliente no encontrado');
  }

  return reply.send({
    success: true,
    data: {
      id: clientUser.id,
      email: clientUser.email,
      fullName: clientUser.fullName,
      phone: clientUser.phone,
      isActive: clientUser.isActive,
      customerId: clientUser.customerId,
      customer: clientUser.customer,
      isInvitePending: Boolean(clientUser.inviteToken),
      invitedAt: clientUser.invitedAt,
      lastLoginAt: clientUser.lastLoginAt,
      allowedEntities: clientUser.entityRestrictions.map((r) => r.customerEntity),
      createdAt: clientUser.createdAt,
      updatedAt: clientUser.updatedAt,
    },
  });
}

export async function createClientUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createClientUserSchema.parse(request.body);
  const internalUserId = (request.user as any)?.userId;

  const existing = await prisma.clientUser.findUnique({
    where: { email: body.email.toLowerCase().trim() },
  });

  if (existing && !existing.deletedAt) {
    throw new ConflictError('Ya existe un usuario cliente registrado con este correo electrónico');
  }

  const customer = await prisma.customer.findUnique({
    where: { id: body.customerId },
  });

  if (!customer) {
    throw new NotFoundError('El cliente (empresa) especificado no existe');
  }

  let passwordHash = '';
  let inviteToken: string | null = null;
  let invitedAt: Date | null = null;

  if (body.initialPassword) {
    passwordHash = await bcrypt.hash(body.initialPassword, 10);
  } else {
    inviteToken = crypto.randomBytes(32).toString('hex');
    invitedAt = new Date();
    // Default placeholder hash if no password initially
    passwordHash = await bcrypt.hash(crypto.randomBytes(20).toString('hex'), 10);
  }

  const clientUser = await prisma.$transaction(async (tx) => {
    let user;
    if (existing && existing.deletedAt) {
      user = await tx.clientUser.update({
        where: { id: existing.id },
        data: {
          fullName: body.fullName,
          phone: body.phone,
          customerId: body.customerId,
          passwordHash,
          isActive: true,
          inviteToken,
          invitedAt,
          deletedAt: null,
        },
      });
      await tx.clientUserEntityAccess.deleteMany({ where: { clientUserId: user.id } });
    } else {
      user = await tx.clientUser.create({
        data: {
          email: body.email.toLowerCase().trim(),
          fullName: body.fullName,
          phone: body.phone,
          customerId: body.customerId,
          passwordHash,
          isActive: true,
          inviteToken,
          invitedAt,
        },
      });
    }

    if (body.allowedEntityIds && body.allowedEntityIds.length > 0) {
      await tx.clientUserEntityAccess.createMany({
        data: body.allowedEntityIds.map((customerEntityId) => ({
          clientUserId: user.id,
          customerEntityId,
        })),
      });
    }

    await createAuditLog(tx, {
      userId: internalUserId,
      action: 'CREATE_CLIENT_USER',
      entity: 'ClientUser',
      entityId: user.id,
      afterData: { email: user.email, fullName: user.fullName, customerId: user.customerId },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return user;
  });

  // Enviar email de invitación si corresponde
  if (inviteToken && body.sendInviteEmail) {
    const inviteUrl = `${env.PORTAL_BASE_URL}/invite/${inviteToken}`;
    await emailService.sendInvitation(
      clientUser.email,
      inviteUrl,
      customer.legalName,
      clientUser.fullName
    );
  }

  return reply.status(201).send({
    success: true,
    data: {
      id: clientUser.id,
      email: clientUser.email,
      fullName: clientUser.fullName,
      customerId: clientUser.customerId,
      inviteToken,
    },
  });
}

export async function updateClientUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const body = updateClientUserSchema.parse(request.body);
  const internalUserId = (request.user as any)?.userId;

  const clientUser = await prisma.clientUser.findUnique({
    where: { id },
  });

  if (!clientUser || clientUser.deletedAt) {
    throw new NotFoundError('Usuario cliente no encontrado');
  }

  const updateData: any = {};
  if (body.fullName !== undefined) updateData.fullName = body.fullName;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  if (body.password) {
    updateData.passwordHash = await bcrypt.hash(body.password, 10);
    updateData.inviteToken = null; // Si se setea password directamente, limpiar invite
  }

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.clientUser.update({
      where: { id },
      data: updateData,
    });

    if (body.allowedEntityIds !== undefined) {
      await tx.clientUserEntityAccess.deleteMany({ where: { clientUserId: id } });
      if (body.allowedEntityIds.length > 0) {
        await tx.clientUserEntityAccess.createMany({
          data: body.allowedEntityIds.map((customerEntityId) => ({
            clientUserId: id,
            customerEntityId,
          })),
        });
      }
    }

    await createAuditLog(tx, {
      userId: internalUserId,
      action: 'UPDATE_CLIENT_USER',
      entity: 'ClientUser',
      entityId: id,
      beforeData: { fullName: clientUser.fullName, isActive: clientUser.isActive },
      afterData: updateData,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return user;
  });

  return reply.send({
    success: true,
    data: updated,
  });
}

export async function deleteClientUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const internalUserId = (request.user as any)?.userId;

  const clientUser = await prisma.clientUser.findUnique({
    where: { id },
  });

  if (!clientUser || clientUser.deletedAt) {
    throw new NotFoundError('Usuario cliente no encontrado');
  }

  await prisma.$transaction(async (tx) => {
    await tx.clientUser.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await tx.clientUserSession.updateMany({
      where: { clientUserId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await createAuditLog(tx, {
      userId: internalUserId,
      action: 'DELETE_CLIENT_USER',
      entity: 'ClientUser',
      entityId: id,
      beforeData: { email: clientUser.email, fullName: clientUser.fullName },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  });

  return reply.send({
    success: true,
    message: 'Usuario cliente desactivado exitosamente',
  });
}

export async function resendInviteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const internalUserId = (request.user as any)?.userId;

  const clientUser = await prisma.clientUser.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!clientUser || clientUser.deletedAt) {
    throw new NotFoundError('Usuario cliente no encontrado');
  }

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const invitedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.clientUser.update({
      where: { id },
      data: {
        inviteToken,
        invitedAt,
      },
    });

    await createAuditLog(tx, {
      userId: internalUserId,
      action: 'RESEND_CLIENT_INVITE',
      entity: 'ClientUser',
      entityId: id,
      afterData: { email: clientUser.email },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  });

  const inviteUrl = `${env.PORTAL_BASE_URL}/invite/${inviteToken}`;
  await emailService.sendInvitation(
    clientUser.email,
    inviteUrl,
    clientUser.customer?.legalName || 'SATEM Soluciones',
    clientUser.fullName
  );

  return reply.send({
    success: true,
    message: 'Invitación reenviada exitosamente por correo electrónico',
    data: { inviteUrl },
  });
}

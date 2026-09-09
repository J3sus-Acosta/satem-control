import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../common/errors/app-error.js';
import { createAuditLog } from '../../common/utils/audit.js';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.nativeEnum(UserRole).default(UserRole.OPERATIONS),
});

const updateUserSchema = z.object({
  fullName: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function listUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: users });
}

export async function createUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createUserSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const existing = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });

  if (existing) {
    throw new ConflictError('Ya existe un usuario con este correo electrónico');
  }

  const passwordHash = await bcrypt.hash(body.password, 10);

  const newUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        fullName: body.fullName,
        role: body.role,
      },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      afterData: user,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return user;
  });

  return reply.status(201).send({ success: true, data: newUser });
}

export async function updateUserHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = request.params;
  const body = updateUserSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser || existingUser.deletedAt) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const updateData: any = {};
  if (body.fullName) updateData.fullName = body.fullName;
  if (body.role) updateData.role = body.role;
  if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;
  if (body.password) updateData.passwordHash = await bcrypt.hash(body.password, 10);

  const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, fullName: true, role: true, isActive: true, updatedAt: true },
    });

    await createAuditLog(tx, {
      userId,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user.id,
      beforeData: { fullName: existingUser.fullName, role: existingUser.role, isActive: existingUser.isActive },
      afterData: user,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return user;
  });

  return reply.send({ success: true, data: updatedUser });
}

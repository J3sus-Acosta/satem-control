import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { portalLoginSchema, acceptInviteSchema, portalUpdateProfileSchema } from './portal-auth.schema.js';
import { UnauthorizedError, NotFoundError, AppError } from '../../common/errors/app-error.js';
import { createAuditLog } from '../../common/utils/audit.js';

export async function portalLoginHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = portalLoginSchema.parse(request.body);

  const clientUser = await prisma.clientUser.findUnique({
    where: { email: body.email.toLowerCase().trim() },
    include: { customer: true },
  });

  if (!clientUser || !clientUser.isActive || clientUser.deletedAt) {
    throw new UnauthorizedError('Credenciales inválidas o cuenta desactivada');
  }

  if (!clientUser.passwordHash) {
    throw new UnauthorizedError('Esta cuenta aún no ha sido activada. Revise su correo de invitación.');
  }

  const isPasswordValid = await bcrypt.compare(body.password, clientUser.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  const accessToken = request.server.jwt.sign(
    {
      clientUserId: clientUser.id,
      email: clientUser.email,
      customerId: clientUser.customerId,
      type: 'CLIENT',
    },
    { expiresIn: '30m' }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.clientUserSession.create({
    data: {
      clientUserId: clientUser.id,
      refreshToken,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || null,
      expiresAt,
    },
  });

  await prisma.clientUser.update({
    where: { id: clientUser.id },
    data: { lastLoginAt: new Date() },
  });

  reply.setCookie('portalRefreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/portal/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  });

  return reply.send({
    success: true,
    data: {
      accessToken,
      clientUser: {
        id: clientUser.id,
        email: clientUser.email,
        fullName: clientUser.fullName,
        customerId: clientUser.customerId,
        customerName: clientUser.customer?.legalName || '',
        customerTaxId: clientUser.customer?.taxId || '',
      },
    },
  });
}

export async function portalRefreshHandler(request: FastifyRequest, reply: FastifyReply) {
  const refreshTokenCookie = request.cookies.portalRefreshToken;
  if (!refreshTokenCookie) {
    throw new UnauthorizedError('Refresh token no encontrado');
  }

  const session = await prisma.clientUserSession.findUnique({
    where: { refreshToken: refreshTokenCookie },
    include: {
      clientUser: {
        include: { customer: true },
      },
    },
  });

  if (!session || session.revokedAt || new Date() > session.expiresAt || !session.clientUser.isActive || session.clientUser.deletedAt) {
    reply.clearCookie('portalRefreshToken', { path: '/api/v1/portal/auth/refresh' });
    throw new UnauthorizedError('Sesión de portal inválida o expirada');
  }

  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.clientUserSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  await prisma.clientUserSession.create({
    data: {
      clientUserId: session.clientUser.id,
      refreshToken: newRefreshToken,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || null,
      expiresAt: newExpiresAt,
    },
  });

  const accessToken = request.server.jwt.sign(
    {
      clientUserId: session.clientUser.id,
      email: session.clientUser.email,
      customerId: session.clientUser.customerId,
      type: 'CLIENT',
    },
    { expiresIn: '30m' }
  );

  reply.setCookie('portalRefreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/portal/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  });

  return reply.send({
    success: true,
    data: {
      accessToken,
      clientUser: {
        id: session.clientUser.id,
        email: session.clientUser.email,
        fullName: session.clientUser.fullName,
        customerId: session.clientUser.customerId,
        customerName: session.clientUser.customer?.legalName || '',
        customerTaxId: session.clientUser.customer?.taxId || '',
      },
    },
  });
}

export async function portalLogoutHandler(request: FastifyRequest, reply: FastifyReply) {
  const refreshTokenCookie = request.cookies.portalRefreshToken;
  if (refreshTokenCookie) {
    await prisma.clientUserSession.updateMany({
      where: { refreshToken: refreshTokenCookie, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  reply.clearCookie('portalRefreshToken', { path: '/api/v1/portal/auth/refresh' });

  return reply.send({
    success: true,
    data: { message: 'Sesión del portal cerrada exitosamente' },
  });
}

export async function portalMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const clientUserId = (request.user as any)?.clientUserId;
  if (!clientUserId) throw new UnauthorizedError();

  const clientUser = await prisma.clientUser.findUnique({
    where: { id: clientUserId },
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

  if (!clientUser || !clientUser.isActive || clientUser.deletedAt) {
    throw new UnauthorizedError('Usuario cliente no encontrado');
  }

  return reply.send({
    success: true,
    data: {
      id: clientUser.id,
      email: clientUser.email,
      fullName: clientUser.fullName,
      phone: clientUser.phone,
      customerId: clientUser.customerId,
      customer: clientUser.customer,
      allowedEntities: clientUser.entityRestrictions.map((r) => r.customerEntity),
      createdAt: clientUser.createdAt,
    },
  });
}

export async function portalValidateInviteTokenHandler(
  request: FastifyRequest<{ Params: { token: string } }>,
  reply: FastifyReply
) {
  const { token } = request.params;

  const clientUser = await prisma.clientUser.findUnique({
    where: { inviteToken: token },
    include: { customer: true },
  });

  if (!clientUser || !clientUser.isActive || clientUser.deletedAt) {
    throw new NotFoundError('El enlace de invitación no es válido o ya fue utilizado');
  }

  return reply.send({
    success: true,
    data: {
      email: clientUser.email,
      fullName: clientUser.fullName,
      customerName: clientUser.customer?.legalName || '',
    },
  });
}

export async function portalAcceptInviteHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = acceptInviteSchema.parse(request.body);

  const clientUser = await prisma.clientUser.findUnique({
    where: { inviteToken: body.token },
    include: { customer: true },
  });

  if (!clientUser || !clientUser.isActive || clientUser.deletedAt) {
    throw new AppError('El enlace de invitación no es válido o ha expirado', 400);
  }

  const passwordHash = await bcrypt.hash(body.password, 10);

  const updatedUser = await prisma.clientUser.update({
    where: { id: clientUser.id },
    data: {
      passwordHash,
      inviteToken: null,
      fullName: body.fullName || clientUser.fullName,
      phone: body.phone || clientUser.phone,
      lastLoginAt: new Date(),
    },
  });

  const accessToken = request.server.jwt.sign(
    {
      clientUserId: updatedUser.id,
      email: updatedUser.email,
      customerId: updatedUser.customerId,
      type: 'CLIENT',
    },
    { expiresIn: '30m' }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.clientUserSession.create({
    data: {
      clientUserId: updatedUser.id,
      refreshToken,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || null,
      expiresAt,
    },
  });

  reply.setCookie('portalRefreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/portal/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  });

  return reply.send({
    success: true,
    data: {
      accessToken,
      clientUser: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        customerId: updatedUser.customerId,
        customerName: clientUser.customer?.legalName || '',
      },
    },
  });
}

export async function portalUpdateProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const clientUserId = (request.user as any)?.clientUserId;
  if (!clientUserId) throw new UnauthorizedError();

  const body = portalUpdateProfileSchema.parse(request.body);

  const clientUser = await prisma.clientUser.findUnique({
    where: { id: clientUserId },
  });

  if (!clientUser) throw new NotFoundError('Usuario no encontrado');

  const updateData: any = {};
  if (body.fullName) updateData.fullName = body.fullName;
  if (body.phone !== undefined) updateData.phone = body.phone;

  if (body.newPassword) {
    if (!body.currentPassword) {
      throw new AppError('Debe ingresar su contraseña actual para cambiarla', 400);
    }
    const isCurrentValid = await bcrypt.compare(body.currentPassword, clientUser.passwordHash);
    if (!isCurrentValid) {
      throw new AppError('La contraseña actual es incorrecta', 400);
    }
    updateData.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  const updated = await prisma.clientUser.update({
    where: { id: clientUserId },
    data: updateData,
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      customerId: true,
    },
  });

  return reply.send({
    success: true,
    data: updated,
  });
}

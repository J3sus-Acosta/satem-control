import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { loginSchema } from './auth.schema.js';
import { UnauthorizedError } from '../../common/errors/app-error.js';
import { createAuditLog } from '../../common/utils/audit.js';

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = loginSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });

  if (!user || !user.isActive || user.deletedAt) {
    throw new UnauthorizedError('Credenciales inválidas o cuenta desactivada');
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  const accessToken = request.server.jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    { expiresIn: '15m' }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshToken,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || null,
      expiresAt,
    },
  });

  await prisma.$transaction(async (tx) => {
    await createAuditLog(tx, {
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || null,
    });
  });

  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  });

  return reply.send({
    success: true,
    data: {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    },
  });
}

export async function refreshHandler(request: FastifyRequest, reply: FastifyReply) {
  const refreshTokenCookie = request.cookies.refreshToken;
  if (!refreshTokenCookie) {
    throw new UnauthorizedError('Refresh token no encontrado');
  }

  const session = await prisma.userSession.findUnique({
    where: { refreshToken: refreshTokenCookie },
    include: { user: true },
  });

  if (!session || session.revokedAt || new Date() > session.expiresAt || !session.user.isActive) {
    reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    throw new UnauthorizedError('Sesión inválida o expirada');
  }

  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.userSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  await prisma.userSession.create({
    data: {
      userId: session.user.id,
      refreshToken: newRefreshToken,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || null,
      expiresAt: newExpiresAt,
    },
  });

  const accessToken = request.server.jwt.sign(
    { userId: session.user.id, email: session.user.email, role: session.user.role },
    { expiresIn: '15m' }
  );

  reply.setCookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  });

  return reply.send({
    success: true,
    data: {
      accessToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.fullName,
        role: session.user.role,
      },
    },
  });
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  const refreshTokenCookie = request.cookies.refreshToken;
  if (refreshTokenCookie) {
    await prisma.userSession.updateMany({
      where: { refreshToken: refreshTokenCookie, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });

  return reply.send({
    success: true,
    data: { message: 'Sesión cerrada exitosamente' },
  });
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as any)?.userId;
  if (!userId) throw new UnauthorizedError();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) throw new UnauthorizedError('Usuario no encontrado');

  return reply.send({
    success: true,
    data: user,
  });
}

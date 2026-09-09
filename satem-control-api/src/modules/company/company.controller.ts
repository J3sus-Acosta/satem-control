import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { createAuditLog } from '../../common/utils/audit.js';

const updateCompanySchema = z.object({
  legalName: z.string().min(2),
  taxId: z.string().min(3),
  address: z.string().min(2),
  city: z.string().min(2),
  country: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logoFullUrl: z.string().optional(),
  logoShortUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
  legalRepresentative: z.string().min(2),
  legalRepresentativeTitle: z.string().min(2),
});

export async function getCompanyHandler(request: FastifyRequest, reply: FastifyReply) {
  const config = await prisma.companyConfig.findUnique({
    where: { id: 'DEFAULT' },
  });

  return reply.send({ success: true, data: config });
}

export async function updateCompanyHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = updateCompanySchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.companyConfig.upsert({
      where: { id: 'DEFAULT' },
      update: body,
      create: { id: 'DEFAULT', ...body },
    });

    await createAuditLog(tx, {
      userId,
      action: 'UPDATE_COMPANY_CONFIG',
      entity: 'CompanyConfig',
      entityId: 'DEFAULT',
      afterData: item,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return item;
  });

  return reply.send({ success: true, data: updated });
}

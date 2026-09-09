import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { TemplateCategory } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { createAuditLog } from '../../common/utils/audit.js';

const createTemplateSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  description: z.string().optional(),
  category: z.nativeEnum(TemplateCategory),
  language: z.string().default('ES/EN'),
  htmlTemplate: z.string().min(10),
  cssStyles: z.string().optional(),
  fieldsSchema: z.any().optional(),
  variablesSchema: z.any().optional(),
});

const createVersionSchema = z.object({
  title: z.string().min(3),
  htmlTemplate: z.string().min(10),
  cssStyles: z.string().optional(),
  fieldsSchema: z.any().optional(),
  variablesSchema: z.any().optional(),
  changeReason: z.string().min(5, 'Motivo de cambio requerido'),
});

export async function listTemplatesHandler(request: FastifyRequest, reply: FastifyReply) {
  const templates = await prisma.documentTemplate.findMany({
    include: {
      versions: { orderBy: { versionNumber: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reply.send({ success: true, data: templates });
}

export async function getTemplateHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const template = await prisma.documentTemplate.findUnique({
    where: { id: request.params.id },
    include: {
      versions: { orderBy: { versionNumber: 'desc' } },
    },
  });

  if (!template) {
    throw new NotFoundError('Plantilla no encontrada');
  }

  return reply.send({ success: true, data: template });
}

export async function createTemplateHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = createTemplateSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const template = await prisma.$transaction(async (tx) => {
    const created = await tx.documentTemplate.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description || null,
        category: body.category,
        language: body.language,
        isActive: true,
        currentVersion: 1,
      },
    });

    await tx.documentTemplateVersion.create({
      data: {
        templateId: created.id,
        versionNumber: 1,
        title: `${body.name} v1.0`,
        htmlTemplate: body.htmlTemplate,
        cssStyles: body.cssStyles || null,
        fieldsSchema: body.fieldsSchema || null,
        variablesSchema: body.variablesSchema || null,
        changeReason: 'Versión inicial',
        isPublished: true,
        publishedAt: new Date(),
        publishedById: userId,
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_DOCUMENT_TEMPLATE',
      entity: 'DocumentTemplate',
      entityId: created.id,
      afterData: created,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return created;
  });

  return reply.status(201).send({ success: true, data: template });
}

export async function addTemplateVersionHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const body = createVersionSchema.parse(request.body);
  const userId = (request.user as any)?.userId;

  const template = await prisma.documentTemplate.findUnique({ where: { id } });
  if (!template) {
    throw new NotFoundError('Plantilla no encontrada');
  }

  const nextVersion = template.currentVersion + 1;

  const newVersion = await prisma.$transaction(async (tx) => {
    const version = await tx.documentTemplateVersion.create({
      data: {
        templateId: id,
        versionNumber: nextVersion,
        title: body.title,
        htmlTemplate: body.htmlTemplate,
        cssStyles: body.cssStyles || null,
        fieldsSchema: body.fieldsSchema || null,
        variablesSchema: body.variablesSchema || null,
        changeReason: body.changeReason,
        isPublished: false,
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'CREATE_TEMPLATE_VERSION',
      entity: 'DocumentTemplateVersion',
      entityId: version.id,
      afterData: version,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return version;
  });

  return reply.status(201).send({ success: true, data: newVersion });
}

export async function publishTemplateVersionHandler(
  request: FastifyRequest<{ Params: { id: string; vId: string } }>,
  reply: FastifyReply
) {
  const { id, vId } = request.params;
  const userId = (request.user as any)?.userId;

  const version = await prisma.documentTemplateVersion.findUnique({ where: { id: vId } });
  if (!version || version.templateId !== id) {
    throw new NotFoundError('Versión de plantilla no encontrada');
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Desmarcar versiones anteriores
    await tx.documentTemplateVersion.updateMany({
      where: { templateId: id },
      data: { isPublished: false },
    });

    const published = await tx.documentTemplateVersion.update({
      where: { id: vId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        publishedById: userId,
      },
    });

    await tx.documentTemplate.update({
      where: { id },
      data: { currentVersion: version.versionNumber },
    });

    await createAuditLog(tx, {
      userId,
      action: 'PUBLISH_TEMPLATE_VERSION',
      entity: 'DocumentTemplateVersion',
      entityId: vId,
      afterData: published,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return published;
  });

  return reply.send({ success: true, data: updated });
}

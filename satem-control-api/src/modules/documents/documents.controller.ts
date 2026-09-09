import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Prisma, DocumentCategory } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { NotFoundError, AppError } from '../../common/errors/app-error.js';
import { createAuditLog } from '../../common/utils/audit.js';

export async function uploadDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = await request.file();
  if (!data) {
    throw new AppError('No se adjuntó ningún archivo', 400);
  }

  const userId = (request.user as any)?.userId;
  const fields: any = data.fields;
  const entityType = fields.entityType?.value || 'EXPEDIENT';
  const entityId = fields.entityId?.value || 'GENERAL';
  const expedientId = fields.expedientId?.value || null;
  const category = (fields.category?.value as DocumentCategory) || DocumentCategory.EVIDENCE;

  const fileBuffer = await data.toBuffer();
  const fileSize = BigInt(fileBuffer.length);
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  const year = new Date().getFullYear();
  const expFolder = expedientId ? `EXP-${expedientId}` : 'GENERAL';
  const targetDir = path.join(env.STORAGE_PATH, String(year), expFolder, category.toLowerCase());

  fs.mkdirSync(targetDir, { recursive: true });

  const ext = path.extname(data.filename);
  const internalName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
  const storagePath = path.join(targetDir, internalName);

  fs.writeFileSync(storagePath, fileBuffer);

  const doc = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const document = await tx.document.create({
      data: {
        originalName: data.filename,
        internalName,
        mimeType: data.mimetype,
        fileSize,
        sha256,
        storagePath,
        category,
        uploadedById: userId,
        links: {
          create: [
            {
              entityType,
              entityId,
              expedientId,
            },
          ],
        },
      },
    });

    await createAuditLog(tx, {
      userId,
      action: 'UPLOAD_DOCUMENT',
      entity: 'Document',
      entityId: document.id,
      afterData: { originalName: data.filename, sha256, fileSize: fileSize.toString() },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return document;
  });

  return reply.status(201).send({
    success: true,
    data: {
      id: doc.id,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      sha256: doc.sha256,
      category: doc.category,
    },
  });
}

export async function downloadDocumentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const doc = await prisma.document.findUnique({
    where: { id: request.params.id },
  });

  if (!doc || !fs.existsSync(doc.storagePath)) {
    throw new NotFoundError('Documento no encontrado o archivo físico no existente');
  }

  reply.header('Content-Type', doc.mimeType);
  reply.header('Content-Disposition', `inline; filename="${doc.originalName}"`);
  const stream = fs.createReadStream(doc.storagePath);
  return reply.send(stream);
}

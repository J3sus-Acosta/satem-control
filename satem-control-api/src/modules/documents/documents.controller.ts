import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Prisma, DocumentCategory } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { NotFoundError, AppError } from '../../common/errors/app-error.js';
import { createAuditLog } from '../../common/utils/audit.js';
import { convertImageToPdf } from '../../common/utils/image-to-pdf.js';

export async function uploadDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as any)?.userId;

  let rawBuffer: Buffer | null = null;
  let filename = '';
  let mimetype = '';
  const fields: Record<string, any> = {};

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      filename = part.filename;
      mimetype = part.mimetype;
      rawBuffer = await part.toBuffer();
    } else {
      fields[part.fieldname] = (part as any).value;
    }
  }

  if (!rawBuffer) {
    throw new AppError('No se adjuntó ningún archivo', 400);
  }

  const entityType = fields.entityType || 'EXPEDIENT';
  const entityId = fields.entityId || 'GENERAL';
  const expedientId = fields.expedientId || null;
  const category = (fields.category as DocumentCategory) || DocumentCategory.EVIDENCE;

  const rawExt = path.extname(filename).toLowerCase();
  const isImage = mimetype.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].includes(rawExt);

  let finalBuffer = rawBuffer;
  let finalMime = mimetype || 'application/pdf';
  let finalOriginalName = filename;

  let expedientCode = 'GENERAL';
  let customerName = 'N/A';
  if (expedientId) {
    const exp = await prisma.expedient.findUnique({
      where: { id: expedientId },
      include: { customer: true },
    });
    if (exp) {
      expedientCode = exp.code;
      customerName = exp.customer?.legalName || 'N/A';
    }
  }

  if (isImage) {
    // Convertir la imagen a un PDF estandarizado
    const { pdfBuffer } = await convertImageToPdf({
      imageBuffer: rawBuffer,
      mimeType: mimetype || 'image/png',
      originalFileName: filename,
      docTitle: category === DocumentCategory.EVIDENCE ? 'EVIDENCIA FOTOGRÁFICA DE OPERACIÓN' : 'DOCUMENTO DE RESPALDO ADJUNTO',
      docSubtitle: `Expediente: ${expedientCode} • Cliente: ${customerName}`,
      metadata: [
        { label: 'Expediente', value: expedientCode },
        { label: 'Cliente', value: customerName },
        { label: 'Categoría', value: category },
        { label: 'Fecha Carga', value: new Date().toLocaleString('es-CL') },
      ],
    });

    finalBuffer = pdfBuffer;
    finalMime = 'application/pdf';
    finalOriginalName = filename.replace(/\.[^/.]+$/, '') + '.pdf';
  }

  const fileSize = BigInt(finalBuffer.length);
  const sha256 = crypto.createHash('sha256').update(finalBuffer).digest('hex');

  const year = new Date().getFullYear();
  const expFolder = expedientCode !== 'GENERAL' ? expedientCode : (expedientId ? `EXP-${expedientId}` : 'GENERAL');
  const targetDir = path.join(env.STORAGE_PATH, String(year), expFolder, category.toLowerCase());

  fs.mkdirSync(targetDir, { recursive: true });

  const ext = isImage ? '.pdf' : (path.extname(filename) || '.pdf');
  const internalName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
  const storagePath = path.join(targetDir, internalName);

  fs.writeFileSync(storagePath, finalBuffer);

  const doc = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const document = await tx.document.create({
      data: {
        originalName: finalOriginalName,
        internalName,
        mimeType: finalMime,
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
      afterData: { originalName: finalOriginalName, sha256, fileSize: fileSize.toString() },
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

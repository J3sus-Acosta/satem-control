import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { signDocumentSchema, requestSignatureSchema } from './portal-signatures.schema.js';
import { NotFoundError, AppError } from '../../common/errors/app-error.js';
import { stampSignatureOnPdf } from '../../common/utils/pdf-signer.js';
import { resolveStoragePath } from '../../common/utils/storage-path.js';
import { createAuditLog } from '../../common/utils/audit.js';
import { emailService } from '../../common/services/email.service.js';
import { SignatureRole, SignatureStatus, DocumentInstanceStatus } from '@prisma/client';

export async function listClientPendingSignaturesHandler(request: FastifyRequest, reply: FastifyReply) {
  const clientUser = (request.user as any);

  const pendingInstances = await prisma.documentInstance.findMany({
    where: {
      OR: [
        { customerId: clientUser.customerId },
        { expedient: { customerId: clientUser.customerId } },
      ],
      status: { in: [DocumentInstanceStatus.PENDING_SIGNATURE, DocumentInstanceStatus.GENERATED, DocumentInstanceStatus.SENT] },
    },
    include: {
      template: true,
      expedient: { select: { id: true, code: true, title: true } },
      signatures: true,
    },
    orderBy: { generatedAt: 'desc' },
  });

  return reply.send({
    success: true,
    data: pendingInstances,
  });
}

export async function clientSignDocumentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const clientUser = (request.user as any);
  const { id } = request.params;
  const body = signDocumentSchema.parse(request.body);

  const instance = await prisma.documentInstance.findFirst({
    where: {
      id,
      OR: [
        { customerId: clientUser.customerId },
        { expedient: { customerId: clientUser.customerId } },
      ],
    },
    include: {
      template: true,
      expedient: true,
      customer: true,
    },
  });

  if (!instance) {
    throw new NotFoundError('Documento no encontrado o no tiene permisos para firmarlo');
  }

  // Decodificar Base64 de la firma
  const base64Data = body.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
  const signaturePngBuffer = Buffer.from(base64Data, 'base64');

  // Guardar archivo de imagen de la firma
  const signaturesDir = path.join(env.STORAGE_PATH, 'signatures', String(new Date().getFullYear()));
  fs.mkdirSync(signaturesDir, { recursive: true });
  const sigFileName = `sig_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.png`;
  const signatureImagePath = path.join(signaturesDir, sigFileName);
  fs.writeFileSync(signatureImagePath, signaturePngBuffer);

  // Cargar PDF base (usar el PDF firmado si SATEM ya firmó antes, o el original)
  const sourcePdfPath = instance.signedPdfPath || instance.generatedPdfPath;
  const physicalSourcePath = resolveStoragePath(sourcePdfPath);

  if (!physicalSourcePath || !fs.existsSync(physicalSourcePath)) {
    throw new AppError('El archivo PDF base no fue encontrado en el servidor', 500);
  }

  const basePdfBuffer = fs.readFileSync(physicalSourcePath);

  // Obtener nombre del firmante
  const clientUserRecord = await prisma.clientUser.findUnique({
    where: { id: clientUser.clientUserId },
  });
  const signerName = body.signerName || clientUserRecord?.fullName || clientUser.email;

  // Estampar firma en PDF
  const { pdfBuffer: signedPdfBuffer, sha256: signedPdfHash } = await stampSignatureOnPdf({
    pdfBuffer: basePdfBuffer,
    signaturePngBuffer,
    signerName,
    signerRole: 'CLIENT',
    signerEmail: clientUser.email,
    ipAddress: request.ip,
    signedAt: new Date(),
  });

  // Guardar PDF firmado
  const signedDir = path.join(path.dirname(physicalSourcePath), 'signed');
  fs.mkdirSync(signedDir, { recursive: true });
  const signedPdfName = `${instance.documentNumber}_SIGNED_${Date.now()}.pdf`;
  const signedPdfPath = path.join(signedDir, signedPdfName);
  fs.writeFileSync(signedPdfPath, signedPdfBuffer);

  // Actualizar base de datos
  await prisma.$transaction(async (tx) => {
    // 1. Crear registro de firma
    await tx.documentSignature.create({
      data: {
        documentInstanceId: instance.id,
        role: SignatureRole.CLIENT,
        status: SignatureStatus.SIGNED,
        signerName,
        signerEmail: clientUser.email,
        signatureImagePath,
        signedAt: new Date(),
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || null,
        clientUserId: clientUser.clientUserId,
      },
    });

    // 2. Actualizar DocumentInstance
    await tx.documentInstance.update({
      where: { id: instance.id },
      data: {
        status: DocumentInstanceStatus.SIGNED,
        signedPdfPath,
        signedPdfHash,
        signedAt: new Date(),
      },
    });

    // 3. Auto-actualizar checklist de integridad de expediente si corresponde
    if (instance.expedientId) {
      if (instance.category === 'CONTRACT') {
        await tx.expedientIntegrityItem.updateMany({
          where: { expedientId: instance.expedientId, category: 'CONTRACT' },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            observation: `Contrato firmado digitalmente por cliente (Hash: ${signedPdfHash.slice(0, 16)}...)`,
          },
        });
      } else if (instance.category === 'WORK_ORDER') {
        await tx.expedientIntegrityItem.updateMany({
          where: { expedientId: instance.expedientId, category: 'WORK_ORDER' },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            observation: `OT ${instance.documentNumber} firmada digitalmente por cliente (Hash: ${signedPdfHash.slice(0, 16)}...)`,
          },
        });
      } else if (instance.category === 'RECEPTION_CONFORMITY') {
        await tx.expedientIntegrityItem.updateMany({
          where: { expedientId: instance.expedientId, category: 'RECEPTION_CONFORMITY' },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            observation: `Recepción Conforme firmada digitalmente por cliente (Hash: ${signedPdfHash.slice(0, 16)}...)`,
          },
        });
      }
    }
  });

  return reply.send({
    success: true,
    message: 'Documento firmado digitalmente con éxito',
    data: {
      documentNumber: instance.documentNumber,
      signedPdfHash,
      signedAt: new Date().toISOString(),
    },
  });
}

export async function internalSignDocumentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const internalUser = (request.user as any);
  const { id } = request.params;
  const body = signDocumentSchema.parse(request.body);

  const instance = await prisma.documentInstance.findUnique({
    where: { id },
    include: {
      template: true,
      expedient: true,
      customer: true,
    },
  });

  if (!instance) {
    throw new NotFoundError('Documento no encontrado');
  }

  const base64Data = body.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
  const signaturePngBuffer = Buffer.from(base64Data, 'base64');

  const signaturesDir = path.join(env.STORAGE_PATH, 'signatures', String(new Date().getFullYear()));
  fs.mkdirSync(signaturesDir, { recursive: true });
  const sigFileName = `satem_sig_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.png`;
  const signatureImagePath = path.join(signaturesDir, sigFileName);
  fs.writeFileSync(signatureImagePath, signaturePngBuffer);

  const sourcePdfPath = instance.signedPdfPath || instance.generatedPdfPath;
  const physicalSourcePath = resolveStoragePath(sourcePdfPath);

  if (!physicalSourcePath || !fs.existsSync(physicalSourcePath)) {
    throw new AppError('El archivo PDF base no fue encontrado en el servidor', 500);
  }

  const basePdfBuffer = fs.readFileSync(physicalSourcePath);

  const signerUser = await prisma.user.findUnique({
    where: { id: internalUser.userId },
  });
  const signerName = body.signerName || signerUser?.fullName || 'Representante SATEM';

  const { pdfBuffer: signedPdfBuffer, sha256: signedPdfHash } = await stampSignatureOnPdf({
    pdfBuffer: basePdfBuffer,
    signaturePngBuffer,
    signerName,
    signerRole: 'SATEM',
    signerEmail: internalUser.email,
    ipAddress: request.ip,
    signedAt: new Date(),
  });

  const signedDir = path.join(path.dirname(physicalSourcePath), 'signed');
  fs.mkdirSync(signedDir, { recursive: true });
  const signedPdfName = `${instance.documentNumber}_SATEM_SIGNED_${Date.now()}.pdf`;
  const signedPdfPath = path.join(signedDir, signedPdfName);
  fs.writeFileSync(signedPdfPath, signedPdfBuffer);

  await prisma.$transaction(async (tx) => {
    await tx.documentSignature.create({
      data: {
        documentInstanceId: instance.id,
        role: SignatureRole.SATEM,
        status: SignatureStatus.SIGNED,
        signerName,
        signerEmail: internalUser.email,
        signatureImagePath,
        signedAt: new Date(),
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || null,
        internalUserId: internalUser.userId,
      },
    });

    await tx.documentInstance.update({
      where: { id: instance.id },
      data: {
        signedPdfPath,
        signedPdfHash,
        signedAt: new Date(),
      },
    });

    await createAuditLog(tx, {
      userId: internalUser.userId,
      action: 'SIGN_DOCUMENT_SATEM',
      entity: 'DocumentInstance',
      entityId: instance.id,
      afterData: { signedPdfHash, signerName },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  });

  return reply.send({
    success: true,
    message: 'Documento firmado por SATEM exitosamente',
    data: {
      documentNumber: instance.documentNumber,
      signedPdfHash,
    },
  });
}

export async function requestClientSignatureHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const internalUser = (request.user as any);
  const body = requestSignatureSchema.parse(request.body);

  const instance = await prisma.documentInstance.findUnique({
    where: { id: body.documentInstanceId },
    include: {
      customer: {
        include: {
          clientUsers: {
            where: { isActive: true, deletedAt: null },
          },
        },
      },
      expedient: true,
      template: true,
    },
  });

  if (!instance) {
    throw new NotFoundError('Documento no encontrado');
  }

  await prisma.documentInstance.update({
    where: { id: instance.id },
    data: { status: DocumentInstanceStatus.PENDING_SIGNATURE },
  });

  if (body.notifyClientEmail && instance.customer?.clientUsers) {
    const signUrl = `${env.PORTAL_BASE_URL}/signatures`;
    for (const cu of instance.customer.clientUsers) {
      await emailService.sendSignatureRequest(
        cu.email,
        `${instance.template.name} (${instance.documentNumber})`,
        instance.expedient?.code || 'GENERAL',
        signUrl
      );
    }
  }

  return reply.send({
    success: true,
    message: 'Documento marcado para firma del cliente y notificaciones enviadas',
  });
}

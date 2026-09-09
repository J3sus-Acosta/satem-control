import { Prisma } from '@prisma/client';

export interface AuditParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(
  tx: Prisma.TransactionClient,
  params: AuditParams
): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: params.userId || null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      beforeData: params.beforeData ? (params.beforeData as Prisma.InputJsonValue) : Prisma.JsonNull,
      afterData: params.afterData ? (params.afterData as Prisma.InputJsonValue) : Prisma.JsonNull,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    },
  });
}

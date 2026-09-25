import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';

export async function getAuditLogsHandler(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { entity?: string; entityId?: string; limit?: string };
  const limit = query.limit ? parseInt(query.limit, 10) : 50;

  let whereClause: any = {};

  if (query.entity && query.entityId) {
    if (query.entity === 'Expedient') {
      // Obtener el expediente para recolectar IDs de entidades vinculadas y dar trazabilidad completa 360°
      const expedient = await prisma.expedient.findUnique({
        where: { id: query.entityId },
        include: {
          contract: true,
          workOrders: true,
          invoices: {
            include: {
              paymentRequests: {
                include: {
                  payments: true,
                },
              },
            },
          },
          exceptions: true,
          documentInstances: true,
        },
      });

      if (expedient) {
        const relatedIds: string[] = [expedient.id];
        if (expedient.contractId) relatedIds.push(expedient.contractId);
        expedient.workOrders?.forEach((wo) => relatedIds.push(wo.id));
        expedient.invoices?.forEach((inv) => {
          relatedIds.push(inv.id);
          inv.paymentRequests?.forEach((pr) => {
            relatedIds.push(pr.id);
            pr.payments?.forEach((pay) => relatedIds.push(pay.id));
          });
        });
        expedient.exceptions?.forEach((exc) => relatedIds.push(exc.id));
        expedient.documentInstances?.forEach((doc) => relatedIds.push(doc.id));

        whereClause = {
          entityId: { in: relatedIds },
        };
      } else {
        whereClause = {
          entity: query.entity,
          entityId: query.entityId,
        };
      }
    } else {
      whereClause = {
        entity: query.entity,
        entityId: query.entityId,
      };
    }
  } else if (query.entity) {
    whereClause.entity = query.entity;
  } else if (query.entityId) {
    whereClause.entityId = query.entityId;
  }

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return reply.send({
    success: true,
    data: logs,
  });
}

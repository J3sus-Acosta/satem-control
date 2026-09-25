import { PrismaClient } from '@prisma/client';

// Soporte global de serialización para BigInt en JSON (ej. Document.fileSize)
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Aumentar sort_buffer_size en MySQL para evitar errores 1038 en ordenamientos grandes
prisma.$executeRawUnsafe('SET GLOBAL sort_buffer_size = 4194304;').catch(() => {});


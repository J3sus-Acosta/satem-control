import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function runSafeMigrations() {
  console.log('[MIGRATION] Verificando estado de migraciones previas en la BD...');

  try {
    // 1. Limpiar registros de migraciones fallidas/bloqueadas en _prisma_migrations
    const cleaned = await prisma.$executeRawUnsafe(`
      DELETE FROM _prisma_migrations 
      WHERE finished_at IS NULL;
    `);
    if (cleaned > 0) {
      console.log(`[MIGRATION] 🧹 Se limpiaron ${cleaned} registro(s) de migraciones fallidas previas.`);
    }

    // 2. Auto-reparación preventiva de columnas en payments
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`payments\` ADD COLUMN \`usdEquivalent\` DECIMAL(14, 2) NULL;
      `);
      console.log('[MIGRATION] ➕ Columna usdEquivalent agregada a payments.');
    } catch {
      // Ignorar si ya existe
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`payments\` ADD COLUMN \`exchangeRate\` DECIMAL(12, 4) NULL;
      `);
      console.log('[MIGRATION] ➕ Columna exchangeRate agregada a payments.');
    } catch {
      // Ignorar si ya existe
    }

    // 3. Si la columna assignedUserId quedó creada de un intento anterior fallido,
    // se remueve para permitir que la migración se aplique de forma limpia y consistente.
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`system_exceptions\` DROP FOREIGN KEY \`system_exceptions_assignedUserId_fkey\`;
      `);
    } catch {
      // Ignorar si la FK no existe
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`system_exceptions\` DROP COLUMN \`assignedUserId\`;
      `);
      console.log('[MIGRATION] 🔄 Columna transitoria assignedUserId reseteada para reaplicación limpia.');
    } catch {
      // Ignorar si la columna no existe aún
    }
  } catch (err) {
    console.log('[MIGRATION] Estado inicial de BD verificado.');
  } finally {
    await prisma.$disconnect();
  }

  // 3. Ejecutar prisma migrate deploy
  console.log('[MIGRATION] Aplicando migraciones pendientes con Prisma...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('[MIGRATION] ✅ Migraciones aplicadas exitosamente.');
  } catch (err) {
    console.error('[MIGRATION] ❌ Error al aplicar migraciones:', err);
    process.exit(1);
  }
}

runSafeMigrations();

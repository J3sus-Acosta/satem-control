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

    // 2. Limpieza transitoria si la migración 20261001000000 falló a mitad de camino
    try {
      await prisma.$executeRawUnsafe(`
        DELETE FROM _prisma_migrations 
        WHERE migration_name LIKE '%20261001000000_add_payment_fields_and_portal%' AND rolled_back_at IS NOT NULL;
      `);
    } catch {
      // Ignorar si la tabla no existe
    }

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`payments\` DROP COLUMN \`usdEquivalent\`;`);
    } catch {
      // Ignorar si no existe
    }

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`payments\` DROP COLUMN \`exchangeRate\`;`);
    } catch {
      // Ignorar si no existe
    }

    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`document_signatures\`;`);
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`client_user_entity_access\`;`);
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`client_user_sessions\`;`);
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`client_users\`;`);
    } catch {
      // Ignorar si no existen
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
    } catch {
      // Ignorar si la columna no existe aún
    }
  } catch (err) {
    console.log('[MIGRATION] Estado inicial de BD verificado.');
  } finally {
    await prisma.$disconnect();
  }

  // 4. Ejecutar prisma migrate deploy
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

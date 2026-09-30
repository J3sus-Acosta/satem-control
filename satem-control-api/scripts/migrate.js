import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function runSafeMigrations() {
  console.log('[MIGRATION] Verificando estado de migraciones previas en la BD...');

  try {
    // 1. Limpiar registros de migraciones fallidas en MySQL si existen
    const cleaned = await prisma.$executeRawUnsafe(`
      DELETE FROM _prisma_migrations 
      WHERE finished_at IS NULL;
    `);
    if (cleaned > 0) {
      console.log(`[MIGRATION] 🧹 Se limpiaron ${cleaned} registro(s) de migraciones fallidas previas.`);
    }
  } catch (err) {
    // Si la tabla _prisma_migrations aún no existe (primera vez), se ignora
    console.log('[MIGRATION] Tabla _prisma_migrations lista para inicializar.');
  } finally {
    await prisma.$disconnect();
  }

  // 2. Ejecutar prisma migrate deploy
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

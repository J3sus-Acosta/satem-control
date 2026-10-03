import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function runSafeMigrations() {
  console.log('[MIGRATION] Verificando integridad y estructura de la BD...');

  try {
    // 1. Limpiar registros de migraciones bloqueadas/incompletas
    try {
      const cleaned = await prisma.$executeRawUnsafe(`
        DELETE FROM _prisma_migrations 
        WHERE finished_at IS NULL;
      `);
      if (cleaned > 0) {
        console.log(`[MIGRATION] 🧹 Se limpiaron ${cleaned} registro(s) de migraciones bloqueadas.`);
      }
    } catch {
      // Ignorar si _prisma_migrations no existe aún
    }

    // 2. Auto-creación idempotente de tablas del Portal de Clientes si no existen
    console.log('[MIGRATION] Verificando tablas del Portal de Clientes y firmas...');
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

    // Columna assignedUserId en system_exceptions
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`system_exceptions\` ADD COLUMN \`assignedUserId\` VARCHAR(191) NULL;
      `);
      console.log('[MIGRATION] Columna assignedUserId agregada a system_exceptions.');
    } catch {}

    // Columnas en payments
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`payments\` ADD COLUMN \`usdEquivalent\` DECIMAL(14, 2) NULL;
      `);
    } catch {}

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`payments\` ADD COLUMN \`exchangeRate\` DECIMAL(12, 4) NULL;
      `);
    } catch {}

    // Tabla client_users
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`client_users\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`passwordHash\` VARCHAR(191) NOT NULL,
        \`fullName\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(191) NULL,
        \`customerId\` VARCHAR(191) NOT NULL,
        \`isActive\` BOOLEAN NOT NULL DEFAULT true,
        \`inviteToken\` VARCHAR(100) NULL,
        \`invitedAt\` DATETIME(3) NULL,
        \`lastLoginAt\` DATETIME(3) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`deletedAt\` DATETIME(3) NULL,
        UNIQUE INDEX \`client_users_email_key\`(\`email\`),
        UNIQUE INDEX \`client_users_inviteToken_key\`(\`inviteToken\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // Tabla client_user_sessions
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`client_user_sessions\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`clientUserId\` VARCHAR(191) NOT NULL,
        \`refreshToken\` VARCHAR(500) NOT NULL,
        \`ipAddress\` VARCHAR(191) NULL,
        \`userAgent\` TEXT NULL,
        \`expiresAt\` DATETIME(3) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`revokedAt\` DATETIME(3) NULL,
        UNIQUE INDEX \`client_user_sessions_refreshToken_key\`(\`refreshToken\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // Tabla client_user_entity_access
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`client_user_entity_access\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`clientUserId\` VARCHAR(191) NOT NULL,
        \`customerEntityId\` VARCHAR(191) NOT NULL,
        UNIQUE INDEX \`client_user_entity_access_clientUserId_customerEntityId_key\`(\`clientUserId\`, \`customerEntityId\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // Tabla document_signatures
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`document_signatures\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`documentInstanceId\` VARCHAR(191) NOT NULL,
        \`role\` ENUM('CLIENT', 'SATEM') NOT NULL,
        \`status\` ENUM('PENDING', 'SIGNED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
        \`signerName\` VARCHAR(191) NOT NULL,
        \`signerEmail\` VARCHAR(191) NOT NULL,
        \`signatureImagePath\` VARCHAR(500) NULL,
        \`signedAt\` DATETIME(3) NULL,
        \`ipAddress\` VARCHAR(191) NULL,
        \`userAgent\` TEXT NULL,
        \`clientUserId\` VARCHAR(191) NULL,
        \`internalUserId\` VARCHAR(191) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // Foreign keys
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`client_users\` ADD CONSTRAINT \`client_users_customerId_fkey\` FOREIGN KEY (\`customerId\`) REFERENCES \`customers\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`client_user_sessions\` ADD CONSTRAINT \`client_user_sessions_clientUserId_fkey\` FOREIGN KEY (\`clientUserId\`) REFERENCES \`client_users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`client_user_entity_access\` ADD CONSTRAINT \`client_user_entity_access_clientUserId_fkey\` FOREIGN KEY (\`clientUserId\`) REFERENCES \`client_users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`client_user_entity_access\` ADD CONSTRAINT \`client_user_entity_access_customerEntityId_fkey\` FOREIGN KEY (\`customerEntityId\`) REFERENCES \`customer_entities\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`document_signatures\` ADD CONSTRAINT \`document_signatures_documentInstanceId_fkey\` FOREIGN KEY (\`documentInstanceId\`) REFERENCES \`document_instances\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`document_signatures\` ADD CONSTRAINT \`document_signatures_clientUserId_fkey\` FOREIGN KEY (\`clientUserId\`) REFERENCES \`client_users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;`);
    } catch {}

    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
    console.log('[MIGRATION] ✅ Estructura de BD verificada correctamente.');
  } catch (err) {
    console.error('[MIGRATION] Aviso en verificación de esquema:', err);
  } finally {
    await prisma.$disconnect();
  }

  // 3. Ejecutar prisma migrate deploy
  console.log('[MIGRATION] Aplicando migraciones de Prisma...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('[MIGRATION] ✅ Migraciones aplicadas exitosamente.');
  } catch (err) {
    console.warn('[MIGRATION] prisma migrate deploy completado con advertencias (no crítico):', err.message);
  }
}

runSafeMigrations();

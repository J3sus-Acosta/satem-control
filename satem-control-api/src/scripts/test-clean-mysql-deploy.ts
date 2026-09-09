import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

async function testCleanMysqlDeploy() {
  console.log('🧪 Iniciando Prueba de Despliegue sobre MySQL Limpio Aislado...\n');

  const baseDbUrl = process.env.DATABASE_URL || 'mysql://satem_user:satem_password_2026@localhost:3306/satem_control_db';
  const cleanDbName = `satem_clean_test_${Date.now()}`;
  const cleanDbUrl = baseDbUrl.replace(/\/satem_control_db\b/, `/${cleanDbName}`);

  console.log(`1️⃣ Creando Base de Datos MySQL Limpia: ${cleanDbName}`);
  
  // Conectar con la base principal para crear la base limpia
  const setupPrisma = new PrismaClient({ datasourceUrl: baseDbUrl });
  try {
    await setupPrisma.$executeRawUnsafe(`CREATE DATABASE \`${cleanDbName}\`;`);
    console.log(`   ✓ Base de datos vacía '${cleanDbName}' creada exitosamente.\n`);
  } finally {
    await setupPrisma.$disconnect();
  }

  // 2. Ejecutar prisma migrate deploy sobre la DB limpia
  console.log(`2️⃣ Ejecutando 'npx prisma migrate deploy' sobre '${cleanDbName}'...`);
  const startTime = Date.now();
  
  try {
    const deployOutput = execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: cleanDbUrl },
      encoding: 'utf-8',
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`   ✓ Migración completada en ${duration}s.`);
    console.log(`   [Salida]:\n${deployOutput.trim()}\n`);

    // 3. Comprobar prisma migrate status
    console.log(`3️⃣ Comprobando 'npx prisma migrate status' en '${cleanDbName}'...`);
    const statusOutput = execSync('npx prisma migrate status', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: cleanDbUrl },
      encoding: 'utf-8',
    });
    console.log(`   ✓ Estado de migración verificado.`);
    console.log(`   [Salida]:\n${statusOutput.trim()}\n`);

    // 4. Ejecutar seed sobre la DB limpia
    console.log(`4️⃣ Ejecutando 'npm run prisma:seed' sobre '${cleanDbName}'...`);
    const seedOutput = execSync('npx tsx prisma/seed.ts', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: cleanDbUrl },
      encoding: 'utf-8',
    });
    console.log(`   ✓ Seed oficial completado exitosamente.`);
    console.log(`   [Salida]:\n${seedOutput.trim()}\n`);

    // 5. Validar tablas y plantillas sembradas en la DB limpia
    console.log(`5️⃣ Verificando tablas y plantillas sembradas en '${cleanDbName}'...`);
    const cleanPrisma = new PrismaClient({ datasourceUrl: cleanDbUrl });
    try {
      const templates = await cleanPrisma.documentTemplate.findMany({
        include: { versions: true },
      });
      console.log(`   ✓ Plantillas sembradas en DB limpia: ${templates.length}/10`);
      
      const company = await cleanPrisma.companyConfig.findUnique({ where: { id: 'DEFAULT' } });
      console.log(`   ✓ Identidad Corporativa registrada: ${company?.legalName}`);
      
      if (templates.length !== 10 || !company) {
        throw new Error('Faltan plantillas o datos de empresa en la DB limpia');
      }
    } finally {
      await cleanPrisma.$disconnect();
    }

    console.log(`🎉 PRUEBA DE MYSQL LIMPIO FINALIZADA CON ÉXITO 100%!`);
    console.log(`   - Base de Datos Limpia: ${cleanDbName}`);
    console.log(`   - Comando: npx prisma migrate deploy`);
    console.log(`   - Sin dependencia de db push`);
    console.log(`   - Tiempo de Despliegue: ${duration}s`);
  } catch (err: any) {
    console.error('❌ Error en prueba de MySQL limpio:', err.message || err);
    process.exit(1);
  } finally {
    // Limpieza de la base de datos de prueba
    const cleanupPrisma = new PrismaClient({ datasourceUrl: baseDbUrl });
    try {
      await cleanupPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS \`${cleanDbName}\`;`);
      console.log(`\n🧹 Base de datos de prueba '${cleanDbName}' eliminada.`);
    } catch {
      // Ignore cleanup error
    } finally {
      await cleanupPrisma.$disconnect();
    }
  }
}

testCleanMysqlDeploy();

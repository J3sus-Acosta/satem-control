const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TABLES_TO_PURGE = [
  'bank_reconciliations',
  'bank_receipts',
  'payment_allocations',
  'payments',
  'payment_requests',
  'invoices',
  'expedient_integrity_items',
  'system_exceptions',
  'expedient_snapshots',
  'reception_conformities',
  'attention_technicians',
  'attentions',
  'work_orders',
  'expedients',
  'document_instances',
  'document_links',
  'documents',
  'quotation_items',
  'quotation_versions',
  'quotations',
  'contract_versions',
  'contracts',
  'customer_contacts',
  'customer_entities',
  'customers',
  'audit_logs',
  'user_sessions',
  'sequences',
];

async function purgeData() {
  console.log('🧹 [SATEM Control] Iniciando purga segura de datos de prueba...');
  console.log('🔒 Conservando: Identidad Corporativa (CompanyConfig), Plantillas (DocumentTemplate), Países, Tipos de Servicio y Usuarios.');

  try {
    // Desactivar temporalmente foreign keys
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    // Obtener las tablas que existen actualmente en la base de datos
    const dbTablesRaw = await prisma.$queryRawUnsafe('SHOW TABLES;');
    const existingTables = new Set();

    for (const row of dbTablesRaw) {
      const tableName = Object.values(row)[0];
      if (tableName) {
        existingTables.add(String(tableName).toLowerCase());
      }
    }

    console.log(`📊 Tablas detectadas en la base de datos: ${existingTables.size}`);

    for (const table of TABLES_TO_PURGE) {
      if (existingTables.has(table.toLowerCase())) {
        try {
          await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
          console.log(`  ✓ Tabla vaciada: ${table}`);
        } catch (err) {
          await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\`;`);
          console.log(`  ✓ Registros eliminados de: ${table}`);
        }
      } else {
        console.log(`  ℹ️  Omitida (no existe): ${table}`);
      }
    }

    // Reactivar foreign keys
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('\n=============================================================');
    console.log('✨ [SATEM Control] ¡Purga completada exitosamente!');
    console.log('📋 Estado del sistema:');
    console.log('   - Folios reiniciados: El próximo expediente, contrato o documento comenzará en 001.');
    console.log('   - Identidad Corporativa: Intacta (SATEM SpA, Rut, Representante, Logos).');
    console.log('   - Plantillas Documentales: Intactas (Las 7 plantillas oficiales listas).');
    console.log('   - Usuarios y Administradores: Conservados.');
    console.log('=============================================================');
  } catch (error) {
    console.error('❌ Error durante la purga de datos:', error);
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;').catch(() => {});
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

purgeData();

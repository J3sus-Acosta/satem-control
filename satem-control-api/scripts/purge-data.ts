import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeData() {
  console.log('🧹 [SATEM Control] Iniciando purga segura de datos de prueba...');
  console.log('🔒 Conservando: Identidad Corporativa (CompanyConfig), Plantillas (DocumentTemplate), Países, Tipos de Servicio y Usuarios.');

  try {
    // Desactivar temporalmente foreign keys para truncar/limpiar limpiamente en MySQL
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    console.log('🗑️  Limpiando conciliación bancaria y pagos...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE bank_reconciliations;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE bank_receipts;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE payment_allocations;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE sumup_transactions;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE payment_requests;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE payments;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE invoices;');

    console.log('🗑️  Limpiando expedientes, atenciones y órdenes de trabajo...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE expedient_integrity_items;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE system_exceptions;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE expedient_snapshots;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE reception_conformities;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE attention_technicians;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE attentions;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE work_orders;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE expedients;');

    console.log('🗑️  Limpiando instancias de documentos y almacenamiento de archivos...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE document_instances;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE document_links;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE documents;');

    console.log('🗑️  Limpiando cotizaciones y contratos...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE quotation_items;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE quotation_versions;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE quotations;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE contract_versions;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE contracts;');

    console.log('🗑️  Limpiando clientes y entidades asociadas...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE customer_contacts;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE customer_entities;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE customers;');

    console.log('🗑️  Limpiando auditoría y sesiones de prueba...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE user_sessions;');

    console.log('🔄 Reiniciando todas las secuencias y folios correlativos a 0 (el próximo será 001)...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE sequences;');

    // Reactivar foreign keys
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('=============================================================');
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

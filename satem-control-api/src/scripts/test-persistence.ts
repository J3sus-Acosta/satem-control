import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function testPersistence() {
  console.log('🔍 Iniciando Prueba de Persistencia de Archivos e Inmutabilidad de SHA-256...\n');

  const instances = await prisma.documentInstance.findMany({
    take: 10,
    orderBy: { generatedAt: 'desc' },
  });

  if (instances.length === 0) {
    console.log('⚠️ No hay instancias documentales para verificar. Ejecute primero el test E2E.');
    return;
  }

  let successCount = 0;

  for (const doc of instances) {
    console.log(`📄 Verificando Instancia: ${doc.documentNumber} (${doc.category})`);

    // 1. Verificación del PDF Generado Original
    if (!fs.existsSync(doc.generatedPdfPath)) {
      throw new Error(`❌ El archivo PDF original no existe en la ruta física: ${doc.generatedPdfPath}`);
    }

    const originalBuffer = fs.readFileSync(doc.generatedPdfPath);
    const computedOriginalHash = crypto.createHash('sha256').update(originalBuffer).digest('hex');

    if (computedOriginalHash !== doc.generatedPdfHash) {
      throw new Error(
        `❌ El hash SHA-256 del PDF original fue alterado! Esperado: ${doc.generatedPdfHash}, Calculado: ${computedOriginalHash}`
      );
    }
    console.log(`   ✓ PDF Original Físico OK | SHA-256 Coincide: ${computedOriginalHash.slice(0, 16)}...`);

    // 2. Verificación del PDF Firmado (si aplica)
    if (doc.signedPdfPath) {
      if (!fs.existsSync(doc.signedPdfPath)) {
        throw new Error(`❌ El archivo PDF firmado no existe en la ruta física: ${doc.signedPdfPath}`);
      }

      const signedBuffer = fs.readFileSync(doc.signedPdfPath);
      const computedSignedHash = crypto.createHash('sha256').update(signedBuffer).digest('hex');

      if (computedSignedHash !== doc.signedPdfHash) {
        throw new Error(
          `❌ El hash SHA-256 del PDF firmado fue alterado! Esperado: ${doc.signedPdfHash}, Calculado: ${computedSignedHash}`
        );
      }
      console.log(`   ✓ PDF Firmado Físico OK | SHA-256 Coincide: ${computedSignedHash.slice(0, 16)}...`);
    }

    successCount++;
    console.log('');
  }

  console.log(`🎉 PRUEBA DE PERSISTENCIA COMPLETADA CON ÉXITO!`);
  console.log(`   - Instancias Verificadas: ${successCount}/${instances.length}`);
  console.log(`   - Coincidencia Física & Hashes SHA-256: 100% OK`);
}

testPersistence()
  .catch((err) => {
    console.error('❌ Error en prueba de persistencia:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

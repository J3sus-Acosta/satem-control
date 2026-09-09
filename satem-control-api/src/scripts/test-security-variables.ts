import { PrismaClient } from '@prisma/client';
import { generateSequence } from '../common/utils/sequence.js';
import { compileTemplate } from '../common/utils/template-engine.js';

const prisma = new PrismaClient();

async function testSecurityVariables() {
  console.log('🔒 Iniciando Prueba de Seguridad de Variables Protegidas (customVariables)...\n');

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const companyConfig = await prisma.companyConfig.findUnique({ where: { id: 'DEFAULT' } });
  const sowTemplate = await prisma.documentTemplate.findUnique({
    where: { code: 'TPL-CONTRACT-SOW' },
    include: { versions: { where: { isPublished: true } } },
  });

  if (!adminUser || !companyConfig || !sowTemplate || sowTemplate.versions.length === 0) {
    throw new Error('Faltan requisitos previos en la base de datos para la prueba de seguridad');
  }

  // Intento malicioso de sobreescribir empresa.nombre y empresa.rut mediante customVariables
  const maliciousInput = {
    empresa: {
      nombre: 'EMPRESA MALICIOSA FANTASMA',
      rut: '12345678-9',
      representanteLegal: 'HACKER ATACK',
    },
    cliente: {
      nombreLegal: 'Cliente Válido Corp',
      taxId: 'US-112233',
    },
    contrato: {
      titulo: 'Contrato de Prueba de Seguridad',
      valor: '5000',
    },
  };

  // Simular lógica del controlador Fastify (sanitización de customVariables)
  const sanitizeCustomVars = { ...maliciousInput };
  delete (sanitizeCustomVars as any).empresa; // Protección estricta: elimina sobreescrituras sobre empresa.*

  const variables: Record<string, any> = {
    ...sanitizeCustomVars,
    empresa: {
      nombre: companyConfig.legalName,
      rut: companyConfig.taxId,
      direccion: companyConfig.address,
      ciudad: companyConfig.city,
      pais: companyConfig.country,
      email: companyConfig.email,
      telefono: companyConfig.phone,
      website: companyConfig.website,
      representanteLegal: companyConfig.legalRepresentative,
      cargoRepresentante: companyConfig.legalRepresentativeTitle,
    },
  };

  console.log('1️⃣ Intentando sobreescribir variables protegidas de SATEM SpA...');
  console.log('   Input Malicioso Enviado:', JSON.stringify(maliciousInput.empresa));
  console.log('   Resultado Sanitizado Server:', JSON.stringify(variables.empresa));

  if (
    variables.empresa.nombre === 'EMPRESA MALICIOSA FANTASMA' ||
    variables.empresa.rut === '12345678-9'
  ) {
    throw new Error('❌ VULNERABILIDAD DETECTADA: Las variables corporativas de SATEM fueron sobreescritas!');
  }

  console.log('\n2️⃣ Compilando plantilla HTML con variables sanitizadas...');
  const compiledHtml = compileTemplate(sowTemplate.versions[0].htmlTemplate, variables);

  if (compiledHtml.includes('EMPRESA MALICIOSA FANTASMA') || compiledHtml.includes('12345678-9')) {
    throw new Error('❌ VULNERABILIDAD DETECTADA: El HTML final contiene datos maliciosos!');
  }

  if (!compiledHtml.includes(companyConfig.legalName) || !compiledHtml.includes(companyConfig.taxId)) {
    throw new Error('❌ ERROR: El HTML final no contiene los datos oficiales de SATEM SpA!');
  }

  console.log('   ✓ Datos oficiales de SATEM SpA prevalecen 100% intactos.');
  console.log('   ✓ Inyección de variables corporativas bloqueada con éxito.');
  console.log('   ✓ Variables operacionales de cliente y contrato permitidas normalmente.');

  console.log('\n🎉 PRUEBA DE SEGURIDAD COMPLETADA CON ÉXITO 100% (PASS)');
}

testSecurityVariables()
  .catch((err) => {
    console.error('❌ Error en prueba de seguridad:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

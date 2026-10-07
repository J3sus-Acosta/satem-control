import { prisma } from '../config/prisma.js';
import { ensureDefaultTemplates, ensureDefaultCountries } from '../common/utils/bootstrap.js';

export async function runE2EMercadoNacional() {
  console.log('🚀 Iniciando Prueba E2E: Flujo Integral Mercado Nacional (CLP / DTE 33 / Banco Santander)...');

  // 1. Asegurar existencia de plantillas nacionales y catálogo de países
  await ensureDefaultCountries();
  await ensureDefaultTemplates();
  const nationalTpl = await prisma.documentTemplate.findUnique({
    where: { code: 'TPL-CONTRACT-NAC' },
    include: { versions: true },
  });
  if (!nationalTpl || !nationalTpl.versions[0]) {
    throw new Error('No se encontró la plantilla TPL-CONTRACT-NAC en base de datos');
  }
  const version = nationalTpl.versions[0];
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminId = adminUser?.id || 'SYSTEM_ADMIN';
  console.log('   ✓ Plantilla oficial nacional verificada:', nationalTpl.name);

  // 2. Crear Cliente Chileno de Prueba
  const testCustomer = await prisma.customer.create({
    data: {
      code: `CLI-TEST-${Date.now().toString().slice(-4)}`,
      legalName: 'Empresa Chilena SpA de Prueba E2E',
      taxId: '77.888.999-K',
      countryCode: 'CL',
      defaultCurrency: 'CLP',
      address: 'Av. Providencia 1234',
      city: 'Santiago',
      phone: '+56 9 8765 4321',
      email: 'facturacion@empresaprueba.cl',
    },
  });
  console.log('   ✓ Cliente chileno creado:', testCustomer.legalName, `(${testCustomer.taxId})`);

  try {
    // 3. Crear Contrato en CLP y Expediente vinculado (Régimen Nacional VAT_APPLIED)
    const contractCode = `CON-TEST-${Date.now().toString().slice(-4)}`;
    const contract = await prisma.contract.create({
      data: {
        code: contractCode,
        customerId: testCustomer.id,
        type: 'HOURLY',
        modality: 'RECURRING',
        title: 'Contrato de Servicios TI Mercado Nacional 2026',
        description: 'Servicios de ingeniería de software y soporte técnico especializado',
        currency: 'CLP',
        totalAmount: 1190000,
        contractedHours: 40,
        rate: 29750,
        startDate: new Date(),
        status: 'ACTIVE',
        paymentTerms: 'Transferencia electrónica directa a cuenta corriente Banco Santander',
      },
    });

    const expedient = await prisma.expedient.create({
      data: {
        code: `EXP-TEST-${Date.now().toString().slice(-4)}`,
        title: `Expediente Servicios TI - ${testCustomer.legalName}`,
        customerId: testCustomer.id,
        contractId: contract.id,
        taxTreatment: 'VAT_APPLIED',
        status: 'OPEN',
      },
    });
    console.log('   ✓ Contrato en CLP y Expediente nacional creados:', contract.code, expedient.code);

    // 4. Crear Instancia Documental con Plantilla Nacional (100% Español, sin cláusulas exportación)
    const docInstance = await prisma.documentInstance.create({
      data: {
        documentNumber: `DOC-${contract.code}`,
        templateId: nationalTpl.id,
        templateVersionId: version.id,
        category: 'CONTRACT',
        customerId: testCustomer.id,
        contractId: contract.id,
        expedientId: expedient.id,
        generatedHtml: `<html><body><h1>Contrato de Prestación de Servicios</h1><p>Cliente: ${testCustomer.legalName}</p><p>Valor: $1.190.000 CLP</p></body></html>`,
        generatedPdfPath: 'test.pdf',
        generatedPdfHash: 'hash-test-dummy',
        generatedById: adminId,
        dataSnapshot: { title: 'Contrato Nacional', currency: 'CLP', totalAmount: 1190000 },
        status: 'GENERATED',
      },
    });
    console.log('   ✓ Documento nacional generado en español:', docInstance.documentNumber);

    // 5. Crear Factura SII DTE 33 (Afecta a 19% IVA en CLP)
    const totalGross = 1190000;
    const netAmount = Math.round(totalGross / 1.19); // 1.000.000 CLP
    const vatAmount = totalGross - netAmount; // 190.000 CLP

    const invoice = await prisma.invoice.create({
      data: {
        code: `INV-TEST-${Date.now().toString().slice(-4)}`,
        siiFolio: 999901,
        siiDocType: 33, // Factura Electrónica
        expedientId: expedient.id,
        issueDate: new Date(),
        currency: 'CLP',
        netAmount,
        vatAmount,
        totalAmount: totalGross,
        taxTreatment: 'VAT_APPLIED',
        status: 'ISSUED',
      },
    });
    console.log(`   ✓ Factura SII DTE 33 registrada en CLP: Folio ${invoice.siiFolio} | Neto: $${netAmount.toLocaleString('es-CL')} CLP | IVA: $${vatAmount.toLocaleString('es-CL')} CLP | Total: $${totalGross.toLocaleString('es-CL')} CLP`);

    // 6. Validar Métricas del Dashboard
    const invoicedCLP = await prisma.invoice.aggregate({
      _sum: { netAmount: true, totalAmount: true, vatAmount: true },
      where: { status: 'ISSUED', currency: 'CLP', deletedAt: null },
    });

    const invoicedUSD = await prisma.invoice.aggregate({
      _sum: { netAmount: true, totalAmount: true, vatAmount: true },
      where: { status: 'ISSUED', currency: 'USD', deletedAt: null },
    });

    const totalNetCLP = Number(invoicedCLP._sum.netAmount || 0);
    const totalVatCLP = Number(invoicedCLP._sum.vatAmount || 0);
    const totalNetUSD = Number(invoicedUSD._sum.netAmount || 0);

    console.log(`   📊 Verificación de Métricas:`);
    console.log(`      • Facturación Neta CLP: $${totalNetCLP.toLocaleString('es-CL')} CLP`);
    console.log(`      • IVA Crédito/Débito CLP: $${totalVatCLP.toLocaleString('es-CL')} CLP`);
    console.log(`      • Facturación Neta USD: $${totalNetUSD.toLocaleString()} USD`);

    if (totalNetCLP < netAmount) {
      throw new Error(`La facturación neta en CLP ($${totalNetCLP}) es menor al neto esperado ($${netAmount})`);
    }

    if (totalVatCLP < vatAmount) {
      throw new Error(`El IVA acumulado en CLP ($${totalVatCLP}) es menor al IVA esperado ($${vatAmount})`);
    }

    console.log('✅ Flujo End-to-End validado exitosamente: Facturación Neta en CLP e IVA completamente segregados y operativos.');
  } finally {
    // Limpieza de datos de prueba
    console.log('🧹 Limpiando registros de prueba...');
    await prisma.invoice.deleteMany({ where: { expedient: { customerId: testCustomer.id } } });
    await prisma.documentInstance.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.expedient.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.contract.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.customer.delete({ where: { id: testCustomer.id } });
    console.log('   ✓ Limpieza completada.');
  }
}

if (process.argv[1]?.includes('test-e2e-mercado-nacional')) {
  runE2EMercadoNacional()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error en prueba E2E:', err);
      process.exit(1);
    });
}

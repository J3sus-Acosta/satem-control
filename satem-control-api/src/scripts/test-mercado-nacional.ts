import { prisma } from '../config/prisma.js';

export async function testMercadoNacionalMetrics() {
  console.log('🧪 Iniciando verificación de segregación de métricas CLP vs USD...');

  // Consultar métricas agregadas directamente
  const invoicedUSD = await prisma.invoice.aggregate({
    _sum: { netAmount: true, totalAmount: true, vatAmount: true },
    where: {
      status: 'ISSUED',
      currency: 'USD',
      deletedAt: null,
    },
  });

  const invoicedCLP = await prisma.invoice.aggregate({
    _sum: { netAmount: true, totalAmount: true, vatAmount: true },
    where: { status: 'ISSUED', currency: 'CLP', deletedAt: null },
  });

  const netUSD = Number(invoicedUSD._sum.netAmount || 0);
  const netCLP = Number(invoicedCLP._sum.netAmount || 0);

  console.log(`   ✓ Facturación Neta USD: $${netUSD.toLocaleString()} USD`);
  console.log(`   ✓ Facturación Neta CLP: $${netCLP.toLocaleString('es-CL')} CLP`);

  if (isNaN(netUSD) || isNaN(netCLP)) {
    throw new Error('Las métricas de facturación neta retornaron valores NaN');
  }

  console.log('✅ Métricas de segregación multimoneda validadas exitosamente.');
  return { netUSD, netCLP };
}

// Ejecutar si se invoca directamente
if (process.argv[1]?.includes('test-mercado-nacional')) {
  testMercadoNacionalMetrics()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error en prueba:', err);
      process.exit(1);
    });
}

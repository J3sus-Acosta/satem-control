import puppeteer from 'puppeteer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { compileTemplate } from '../common/utils/template-engine.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando regeneración completa de todos los PDFs existentes...');

  const instances = await prisma.documentInstance.findMany({
    include: {
      template: {
        include: {
          versions: { orderBy: { versionNumber: 'desc' } },
        },
      },
      customer: { include: { country: true } },
      contract: true,
      expedient: true,
    },
    orderBy: { generatedAt: 'asc' },
  });

  console.log(`📋 Total de instancias a procesar: ${instances.length}`);

  const company: any = (await prisma.companyConfig.findUnique({ where: { id: 'DEFAULT' } })) || {};

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < instances.length; i++) {
    const doc = instances[i];
    try {
      if (!doc.template || !doc.template.versions.length) {
        console.warn(`⚠️ [${i + 1}/${instances.length}] Saltando ${doc.documentNumber}: Sin plantilla vinculada`);
        continue;
      }

      const targetVersion =
        doc.template.versions.find((v) => v.id === doc.templateVersionId) ||
        doc.template.versions.find((v) => v.isPublished) ||
        doc.template.versions[0];

      if (!targetVersion || !targetVersion.htmlTemplate) {
        console.warn(`⚠️ [${i + 1}/${instances.length}] Saltando ${doc.documentNumber}: Sin versión HTML`);
        continue;
      }

      const existingSnapshot = (doc.dataSnapshot as any) || {};

      const typeLabels: Record<string, string> = {
        HOURLY: 'Bolsa de Horas (Hourly)',
        PER_ATTENTION: 'Por Atención / Incidencia',
        ATTENTION_PACKAGE: 'Paquete de Atenciones',
        FIXED_PERIOD: 'Período Fijo / Retainer',
        RETAINER: 'Retainer Mensual',
        OTHER: 'Servicios Profesionales TI',
      };

      const modalityLabels: Record<string, string> = {
        RECURRING: 'Recurrente / Periódico',
        ONE_TIME: 'Servicio Único',
        OPEN_ENDED: 'Plazo Indefinido / Según Consumo',
      };

      const formatDateStr = (d?: Date | string | null) => {
        if (!d) return '';
        try {
          const dateObj = typeof d === 'string' ? new Date(d) : d;
          if (isNaN(dateObj.getTime())) return String(d);
          return dateObj.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
        } catch {
          return String(d);
        }
      };

      const todayFormatted = formatDateStr(doc.generatedAt || new Date());
      const contract = doc.contract || {};
      const customer = doc.customer || {};
      const expedient = doc.expedient || {};

      const rawTotal = contract.totalAmount != null ? Number(contract.totalAmount) : (parseFloat(existingSnapshot.contrato?.valor) || 0);
      const rawHours = contract.contractedHours != null ? Number(contract.contractedHours) : (parseFloat(existingSnapshot.contrato?.horas) || 0);
      let calculatedRate = '';
      if (contract.rate != null) {
        calculatedRate = `$${Number(contract.rate).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${contract.currency || 'USD'}/hr`;
      } else if (rawHours > 0 && rawTotal > 0) {
        calculatedRate = `$${(rawTotal / rawHours).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${contract.currency || existingSnapshot.contrato?.moneda || 'USD'}/hr`;
      }

      const startFormatted = contract.startDate ? formatDateStr(contract.startDate) : (existingSnapshot.contrato?.fechaInicio || todayFormatted);
      const endFormatted = contract.endDate ? formatDateStr(contract.endDate) : (existingSnapshot.contrato?.fechaTermino || 'Indefinida / Según horas consumidas');
      const formattedAmount = rawTotal > 0 ? rawTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (existingSnapshot.contrato?.valor || '0.00');
      const defaultExportClause = 'Servicio prestado desde Chile y aprovechado íntegramente en el extranjero por el Cliente, exento de IVA conforme al Art. 12 letra E Nº 7 del D.L. 825 de la Ley sobre Impuesto a las Ventas y Servicios.';

      const variables: Record<string, any> = {
        ...existingSnapshot,
        empresa: {
          nombre: company.legalName || 'SATEM Soluciones Inteligentes SpA',
          rut: company.taxId || '77.654.321-K',
          direccion: company.address || 'Av. Providencia 1234, Of. 601',
          ciudad: company.city || 'Santiago',
          pais: company.country || 'Chile',
          email: company.email || 'contacto@satem.cl',
          telefono: company.phone || '+56 2 2999 8888',
          website: company.website || 'https://www.satem.cl',
          representanteLegal: company.legalRepresentative || 'Representante Legal SATEM',
          cargoRepresentante: company.legalRepresentativeTitle || 'Gerente General',
          logoFull: company.logoFullUrl || '',
          logoShort: company.logoShortUrl || '',
        },
        cliente: {
          nombreLegal: customer.legalName || existingSnapshot.cliente?.nombreLegal || 'Cliente SATEM',
          taxId: customer.taxId || existingSnapshot.cliente?.taxId || '',
          pais: customer.country?.name || customer.countryCode || existingSnapshot.cliente?.pais || '',
          ciudad: customer.city || existingSnapshot.cliente?.ciudad || '',
          direccion: customer.address || existingSnapshot.cliente?.direccion || '',
          email: customer.email || existingSnapshot.cliente?.email || '',
          contacto: existingSnapshot.cliente?.contacto || customer.legalName || '',
        },
        contrato: {
          codigo: contract.code || doc.documentNumber,
          titulo: contract.title || existingSnapshot.contrato?.titulo || doc.template.name,
          descripcion: contract.description || existingSnapshot.contrato?.descripcion || 'Prestación de servicios profesionales de consultoría técnica y desarrollo.',
          tipo: contract.type || existingSnapshot.contrato?.tipo || 'HOURLY',
          tipoNombre: typeLabels[contract.type || existingSnapshot.contrato?.tipo] || 'Bolsa de Horas (Hourly)',
          modalidad: contract.modality || existingSnapshot.contrato?.modalidad || 'RECURRING',
          modalidadNombre: modalityLabels[contract.modality || existingSnapshot.contrato?.modalidad] || 'Recurrente / Periódico',
          horas: rawHours > 0 ? String(rawHours) : existingSnapshot.contrato?.horas || '0',
          valor: formattedAmount,
          moneda: contract.currency || existingSnapshot.contrato?.moneda || 'USD',
          tarifaHora: calculatedRate || 'Según acuerdo',
          metodoPago: contract.paymentTerms || existingSnapshot.contrato?.metodoPago || 'Zelle / SumUp / Wire Transfer en USD',
          fechaEmision: todayFormatted,
          fechaInicio: startFormatted,
          fechaTermino: endFormatted,
          clausulaExportacion: existingSnapshot.contrato?.clausulaExportacion || defaultExportClause,
        },
        documento: {
          codigo: doc.documentNumber,
          titulo: doc.template.name,
          fechaEmision: todayFormatted,
        },
        rc: {
          codigo: doc.documentNumber,
          fechaEmision: todayFormatted,
        },
        cot: {
          codigo: doc.documentNumber,
          fechaEmision: todayFormatted,
        },
        ot: {
          codigo: doc.documentNumber,
          fechaEmision: todayFormatted,
        },
        atencion: {
          codigo: doc.documentNumber,
          fechaEmision: todayFormatted,
        },
        expediente: {
          codigo: expedient.code || existingSnapshot.expediente?.codigo || 'EXP-GENERAL',
          titulo: expedient.title || existingSnapshot.expediente?.titulo || '',
        },
      };

      const compiledHtml = compileTemplate(targetVersion.htmlTemplate, variables);

      await page.setContent(compiledHtml, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '18mm',
          bottom: '18mm',
          left: '16mm',
          right: '16mm',
        },
        preferCSSPageSize: true,
      });

      const newHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      if (doc.generatedPdfPath) {
        const dir = path.dirname(doc.generatedPdfPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(doc.generatedPdfPath, pdfBuffer);
      }

      await prisma.documentInstance.update({
        where: { id: doc.id },
        data: {
          generatedPdfHash: newHash,
          generatedHtml: compiledHtml,
          dataSnapshot: JSON.parse(JSON.stringify(variables)),
        },
      });

      successCount++;
      if (successCount % 10 === 0 || i === instances.length - 1) {
        console.log(`  ✓ [${i + 1}/${instances.length}] Procesado: ${doc.documentNumber}`);
      }
    } catch (err: any) {
      errorCount++;
      console.error(`  ❌ Error en documento ${doc.documentNumber}:`, err.message);
    }
  }

  await browser.close();
  console.log(`\n🎉 FINALIZADO: ${successCount} documentos regenerados con éxito (${errorCount} errores).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect().then(() => process.exit(0)));

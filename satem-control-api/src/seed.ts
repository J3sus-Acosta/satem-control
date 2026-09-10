import { PrismaClient, UserRole, TemplateCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { LOGO_SHORT_BASE64, LOGO_FULL_BASE64 } from './assets/logos.js';

const prisma = new PrismaClient();

const baseCss = `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0a2540; margin: 40px; font-size: 13px; line-height: 1.6; }
  .header { border-bottom: 3px solid #00a896; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .company-logo { height: 48px; max-width: 240px; object-fit: contain; }
  .company-sub { font-size: 11px; color: #475569; margin-top: 4px; }
  .doc-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; color: #0a2540; text-transform: uppercase; letter-spacing: 1px; }
  .section-title { font-size: 14px; font-weight: bold; color: #00a896; border-bottom: 1.5px solid #00a896; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; text-transform: uppercase; }
  .grid-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .grid-table td, .grid-table th { padding: 8px 12px; border: 1px solid #cbd5e1; vertical-align: top; }
  .grid-table th { background-color: #f0fdfa; font-weight: bold; text-align: left; color: #0a2540; }
  .grid-table .label { font-weight: bold; background-color: #f0fdfa; width: 30%; color: #0a2540; }
  .legal-clause { background-color: #f0fdfa; padding: 14px; border-left: 4px solid #00a896; font-size: 12px; margin: 16px 0; color: #0a2540; }
  .signatures { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
  .sig-box { width: 45%; text-align: center; border-top: 1px solid #00a896; padding-top: 8px; font-size: 12px; color: #0a2540; }
`;

const fieldsSchemaStandard = {
  lockedFields: [
    'empresa.nombre', 'empresa.rut', 'empresa.direccion', 'empresa.ciudad',
    'empresa.pais', 'empresa.email', 'empresa.telefono', 'empresa.website',
    'empresa.representanteLegal', 'empresa.cargoRepresentante', 'empresa.logoFull', 'empresa.logoShort'
  ],
  editableFields: [
    'cliente.nombreLegal', 'cliente.taxId', 'cliente.pais', 'cliente.direccion', 'cliente.email',
    'contrato.codigo', 'contrato.titulo', 'contrato.descripcion', 'contrato.horas', 'contrato.valor',
    'contrato.moneda', 'contrato.metodoPago', 'cotizacion.codigo', 'ot.codigo', 'atencion.codigo'
  ]
};

async function main() {
  console.log('🌱 Iniciando seed de datos e identidad corporativa SATEM Control V1 con Logos Oficiales...');

  // 1. Identidad Corporativa SATEM SpA
  await prisma.companyConfig.upsert({
    where: { id: 'DEFAULT' },
    update: {
      legalName: 'SATEM Soluciones Inteligentes SpA',
      taxId: '77.654.321-K',
      address: 'Av. Providencia 1234, Of. 601, Santiago',
      city: 'Santiago',
      country: 'Chile',
      email: 'contacto@satem.cl',
      phone: '+56 2 2999 8888',
      website: 'https://www.satem.cl',
      logoFullUrl: LOGO_FULL_BASE64,
      logoShortUrl: LOGO_SHORT_BASE64,
      legalRepresentative: 'Representante Legal SATEM',
      legalRepresentativeTitle: 'Gerente General',
    },
    create: {
      id: 'DEFAULT',
      legalName: 'SATEM Soluciones Inteligentes SpA',
      taxId: '77.654.321-K',
      address: 'Av. Providencia 1234, Of. 601, Santiago',
      city: 'Santiago',
      country: 'Chile',
      email: 'contacto@satem.cl',
      phone: '+56 2 2999 8888',
      website: 'https://www.satem.cl',
      logoFullUrl: LOGO_FULL_BASE64,
      logoShortUrl: LOGO_SHORT_BASE64,
      legalRepresentative: 'Representante Legal SATEM',
      legalRepresentativeTitle: 'Gerente General',
    },
  });
  console.log('✅ Identidad Corporativa SATEM SpA y Logos cargados.');

  // 2. Países
  const countries = [
    { code: 'CHL', name: 'Chile' }, { code: 'USA', name: 'Estados Unidos' },
    { code: 'PER', name: 'Perú' }, { code: 'COL', name: 'Colombia' },
    { code: 'MEX', name: 'México' }, { code: 'ARG', name: 'Argentina' },
    { code: 'BRA', name: 'Brasil' }, { code: 'ESP', name: 'España' },
  ];
  for (const country of countries) {
    await prisma.country.upsert({ where: { code: country.code }, update: { name: country.name }, create: country });
  }

  // 3. Tipos de servicio
  const serviceTypes = [
    { code: 'SER-INF', name: 'Soporte e Infraestructura', description: 'Administración de servidores, redes y cloud.' },
    { code: 'SER-DEV', name: 'Desarrollo de Software', description: 'Desarrollo a medida, APIs e integraciones.' },
    { code: 'SER-CONS', name: 'Consultoría Técnica', description: 'Arquitectura de sistemas y asesoría TI.' },
  ];
  for (const st of serviceTypes) {
    await prisma.serviceType.upsert({ where: { code: st.code }, update: { name: st.name }, create: st });
  }

  // 4. Usuarios
  const defaultPasswordHash = await bcrypt.hash('Satem2026!Control', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@satem.cl' },
    update: { fullName: 'Administrador SATEM', role: UserRole.ADMIN, passwordHash: defaultPasswordHash },
    create: { email: 'admin@satem.cl', fullName: 'Administrador SATEM', role: UserRole.ADMIN, passwordHash: defaultPasswordHash },
  });

  // 5. Sembrado de Plantillas con Branding Oficial SATEM (#00a896, #0a2540 y Logo Full)
  const templatesToSeed = [
    {
      code: 'TPL-CONTRACT-SOW',
      name: 'Contrato Servicios Internacionales (Bilingual SOW)',
      category: TemplateCategory.CONTRACT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub">RUT: {{empresa.rut}} | {{empresa.direccion}}, {{empresa.pais}}</div>
              <div class="company-sub">Email: {{empresa.email}} | Web: {{empresa.website}}</div>
            </div>
            <div style="text-align: right;">
              <h3 style="margin: 0; color: #00a896;">STATEMENT OF WORK</h3>
              <div style="font-size: 12px; color: #475569;">Código: {{contrato.codigo}}</div>
            </div>
          </div>
          <div class="doc-title">DECLARACIÓN DE TRABAJO / STATEMENT OF WORK — SERVICIOS INTERNACIONALES</div>
          <div class="section-title">1. IDENTIFICACIÓN DE LAS PARTES / PARTIES</div>
          <table class="grid-table">
            <tr><td class="label">Prestador (Chile):</td><td><strong>{{empresa.nombre}}</strong><br>RUT: {{empresa.rut}}<br>Representante: {{empresa.representanteLegal}}</td></tr>
            <tr><td class="label">Cliente Contratante:</td><td><strong>{{cliente.nombreLegal}}</strong><br>Tax ID: {{cliente.taxId}}<br>País: {{cliente.pais}} | Dirección: {{cliente.direccion}}</td></tr>
          </table>
          <div class="section-title">2. DESCRIPCIÓN Y ALCANCE DEL SERVICIO / SCOPE</div><p>{{contrato.descripcion}}</p>
          <div class="section-title">3. HONORARIOS Y FORMA DE PAGO / TERMS</div>
          <table class="grid-table">
            <tr><td class="label">Monto Contratado:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td></tr>
            <tr><td class="label">Bolsa / Horas:</td><td>{{contrato.horas}} Horas</td></tr>
            <tr><td class="label">Forma de Pago:</td><td>{{contrato.metodoPago}}</td></tr>
          </table>
          <div class="legal-clause"><strong>DECLARACIÓN TRIBUTARIA DE EXPORTACIÓN:</strong> Servicio prestado desde Chile y aprovechado íntegramente en el extranjero por {{cliente.nombreLegal}}, exento de IVA según normativa tributaria chilena.</div>
          <div class="signatures">
            <div class="sig-box"><strong>POR / FOR: {{empresa.nombre}}</strong><br><br><br>____________________________________<br>{{empresa.representanteLegal}}</div>
            <div class="sig-box"><strong>POR / FOR: {{cliente.nombreLegal}}</strong><br><br><br>____________________________________<br>Firma Autorizada Cliente</div>
          </div>
        </body></html>`
    },
    {
      code: 'TPL-CONTRACT-SOW-ENTERPRISE',
      name: 'Contrato Marco Enterprise Internacional',
      category: TemplateCategory.CONTRACT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><style>${baseCss}</style></head><body>
          <div class="header">
            <div><img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM" /></div>
            <div style="text-align: right;"><h3 style="margin: 0; color: #00a896;">ENTERPRISE AGREEMENT</h3></div>
          </div>
          <div class="doc-title">CONTRATO MARCO DE SERVICIOS TI ENTERPRISE</div>
          <p>Acuerdo suscrito entre {{empresa.nombre}} y {{cliente.nombreLegal}} (Tax ID: {{cliente.taxId}}).</p>
          <div class="signatures"><div class="sig-box">POR: {{empresa.nombre}}</div><div class="sig-box">POR: {{cliente.nombreLegal}}</div></div>
        </body></html>`
    },
    {
      code: 'TPL-CONTRACT-HOURS-BANK',
      name: 'Contrato Bolsa de Horas Soporte y Desarrollo',
      category: TemplateCategory.CONTRACT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><style>${baseCss}</style></head><body>
          <div class="header">
            <div><img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM" /></div>
            <div style="text-align: right;"><h3 style="margin: 0; color: #00a896;">HOURS BANK AGREEMENT</h3></div>
          </div>
          <div class="doc-title">CONTRATO BOLSA DE HORAS</div>
          <p>Bolsa Contratada: {{contrato.horas}} Horas para {{cliente.nombreLegal}}.</p>
        </body></html>`
    },
    {
      code: 'TPL-CONTRACT-FIXED-PROJECT',
      name: 'Contrato Proyecto Llave en Mano',
      category: TemplateCategory.CONTRACT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><style>${baseCss}</style></head><body>
          <div class="header">
            <div><img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM" /></div>
            <div style="text-align: right;"><h3 style="margin: 0; color: #00a896;">FIXED PRICE PROJECT</h3></div>
          </div>
          <div class="doc-title">CONTRATO DE PROYECTO CERRADO</div>
          <p>Proyecto: {{contrato.titulo}} — {{contrato.moneda}} {{contrato.valor}}</p>
        </body></html>`
    },
    {
      code: 'TPL-QUOTATION',
      name: 'Cotización Oficial de Servicios',
      category: TemplateCategory.QUOTATION,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><style>${baseCss}</style></head><body>
          <div class="header">
            <div><img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM" /></div>
            <div style="text-align: right;"><h3 style="margin: 0; color: #00a896;">COTIZACIÓN / QUOTATION</h3></div>
          </div>
          <div class="doc-title">COTIZACIÓN DE SERVICIOS TI</div>
          <p>Cliente: {{cliente.nombreLegal}} (Tax ID: {{cliente.taxId}})</p>
          <table class="grid-table">
            <tr><th>Descripción</th><th>Monto Total</th></tr>
            <tr><td>{{contrato.descripcion}}</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td></tr>
          </table>
        </body></html>`
    },
    {
      code: 'TPL-WORK-ORDER',
      name: 'Orden de Trabajo Autorizada (OT)',
      category: TemplateCategory.WORK_ORDER,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><style>${baseCss}</style></head><body>
          <div class="header">
            <div><img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM" /></div>
            <div style="text-align: right;"><h3 style="margin: 0; color: #00a896;">ORDEN DE TRABAJO</h3></div>
          </div>
          <div class="doc-title">ORDEN DE TRABAJO AUTORIZADA (OT)</div>
          <p>OT: {{ot.codigo}} — Cliente: {{cliente.nombreLegal}}</p>
        </body></html>`
    },
    {
      code: 'TPL-ATTENTION-REPORT',
      name: 'Informe de Atención Técnica',
      category: TemplateCategory.ATTENTION_REPORT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><style>${baseCss}</style></head><body>
          <div class="header">
            <div><img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM" /></div>
            <div style="text-align: right;"><h3 style="margin: 0; color: #00a896;">INFORME DE ATENCIÓN</h3></div>
          </div>
          <div class="doc-title">INFORME TÉCNICO DE ATENCIÓN</div>
          <p>Atención: {{atencion.codigo}} — Cliente: {{cliente.nombreLegal}}</p>
        </body></html>`
    },
    {
      code: 'TPL-SERVICE-REPORT',
      name: 'Informe de Servicio Ejecutivo',
      category: TemplateCategory.SERVICE_REPORT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><style>${baseCss}</style></head><body>
          <div class="header">
            <div><img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM" /></div>
            <div style="text-align: right;"><h3 style="margin: 0; color: #00a896;">INFORME DE SERVICIO</h3></div>
          </div>
          <div class="doc-title">INFORME DE SERVICIOS PRESTADOS</div>
          <p>Resumen de actividades para {{cliente.nombreLegal}}.</p>
        </body></html>`
    },
    {
      code: 'TPL-RECEPTION-CONFORMITY',
      name: 'Recepción Conforme de Servicios',
      category: TemplateCategory.RECEPTION_CONFORMITY,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><style>${baseCss}</style></head><body>
          <div class="header">
            <div><img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM" /></div>
            <div style="text-align: right;"><h3 style="margin: 0; color: #00a896;">RECEPCIÓN CONFORME</h3></div>
          </div>
          <div class="doc-title">ACTA DE RECEPCIÓN CONFORME</div>
          <p>Servicios recibidos a entera satisfacción por {{cliente.nombreLegal}}.</p>
          <div class="signatures"><div class="sig-box">Firma Cliente Autorizada</div></div>
        </body></html>`
    },
    {
      code: 'TPL-COMMERCIAL-PROPOSAL',
      name: 'Propuesta Comercial y Carta Presentación',
      category: TemplateCategory.COMMERCIAL_PROPOSAL,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><style>${baseCss}</style></head><body>
          <div class="header">
            <div><img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM" /></div>
            <div style="text-align: right;"><h3 style="margin: 0; color: #00a896;">PROPUESTA COMERCIAL</h3></div>
          </div>
          <div class="doc-title">PROPUESTA DE SERVICIOS SATEM</div>
          <p>Presentado a: {{cliente.nombreLegal}}</p>
        </body></html>`
    }
  ];

  for (const tpl of templatesToSeed) {
    const createdTpl = await prisma.documentTemplate.upsert({
      where: { code: tpl.code },
      update: { name: tpl.name, category: tpl.category },
      create: {
        code: tpl.code,
        name: tpl.name,
        description: `Plantilla oficial ${tpl.name}`,
        category: tpl.category,
        language: tpl.language,
        isActive: true,
        currentVersion: 1,
      },
    });

    await prisma.documentTemplateVersion.upsert({
      where: { templateId_versionNumber: { templateId: createdTpl.id, versionNumber: 1 } },
      update: { htmlTemplate: tpl.html, cssStyles: baseCss, fieldsSchema: fieldsSchemaStandard, isPublished: true },
      create: {
        templateId: createdTpl.id,
        versionNumber: 1,
        title: `Versión Oficial 1.0 - ${tpl.name}`,
        htmlTemplate: tpl.html,
        cssStyles: baseCss,
        fieldsSchema: fieldsSchemaStandard,
        changeReason: 'Versión inicial oficial de SATEM SpA con Branding Instagram',
        isPublished: true,
        publishedAt: new Date(),
        publishedById: adminUser.id,
      },
    });
  }

  console.log('✅ Catálogo completo de 7 tipos documentales con Branding Oficial SATEM sembrado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

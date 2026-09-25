import { PrismaClient, UserRole, TemplateCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { LOGO_SHORT_BASE64, LOGO_FULL_BASE64 } from '../src/assets/logos.js';

const prisma = new PrismaClient();

const baseCss = `
  @page {
    size: A4 portrait;
    margin: 18mm 16mm 18mm 16mm;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #0a2540;
    margin: 0;
    padding: 0;
    font-size: 11.5px;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header {
    border-bottom: 2px solid #00a896;
    padding-bottom: 10px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .company-logo { height: 42px; max-width: 210px; object-fit: contain; }
  .company-sub { font-size: 10px; color: #475569; margin-top: 2px; }
  .doc-title-container { margin: 10px 0 14px 0; text-align: center; page-break-inside: avoid; break-inside: avoid; }
  .doc-title { font-size: 15px; font-weight: bold; margin: 0; color: #0a2540; text-transform: uppercase; letter-spacing: 0.5px; }
  .doc-subtitle { font-size: 10px; color: #64748b; margin-top: 2px; font-weight: 600; }
  .header-meta { text-align: right; font-size: 10.5px; color: #334155; }
  .doc-badge { display: inline-block; background: #00a896; color: #fff; font-weight: bold; font-size: 9.5px; padding: 2px 7px; border-radius: 4px; margin-bottom: 3px; text-transform: uppercase; }
  .meta-line { margin-top: 1.5px; }
  .section-title {
    font-size: 11.5px;
    font-weight: bold;
    color: #00a896;
    border-bottom: 1.5px solid #00a896;
    padding-bottom: 2px;
    margin-top: 12px;
    margin-bottom: 6px;
    text-transform: uppercase;
    page-break-after: avoid;
    break-after: avoid;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .grid-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .grid-table tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .grid-table td, .grid-table th { padding: 5px 8px; border: 1px solid #cbd5e1; vertical-align: top; font-size: 11px; }
  .grid-table th { background-color: #f0fdfa; font-weight: bold; text-align: left; color: #0a2540; font-size: 10.5px; }
  .grid-table .label { font-weight: bold; background-color: #f8fafc; width: 28%; color: #334155; font-size: 10.5px; }
  .scope-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 8px 10px;
    font-size: 11px;
    line-height: 1.45;
    color: #1e293b;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .legal-clause {
    background-color: #f0fdfa;
    padding: 8px 10px;
    border-left: 4px solid #00a896;
    font-size: 10.5px;
    line-height: 1.4;
    margin: 8px 0;
    color: #0a2540;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .signatures {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .sig-box {
    width: 46%;
    text-align: center;
    border-top: 1px solid #94a3b8;
    padding-top: 5px;
    font-size: 10.5px;
    color: #0a2540;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .sig-space { height: 40px; }
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
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
              <div class="company-sub">{{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</div>
              <div class="company-sub">Email: {{empresa.email}} | Web: {{empresa.website}}</div>
            </div>
            <div class="header-meta">
              <div class="doc-badge">STATEMENT OF WORK (SOW)</div>
              <div class="meta-line"><strong>Folio Contrato:</strong> {{contrato.codigo}}</div>
              <div class="meta-line"><strong>Expediente:</strong> {{expediente.codigo}}</div>
              <div class="meta-line"><strong>Fecha Emisión:</strong> {{contrato.fechaEmision}}</div>
            </div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">{{contrato.titulo}}</h1>
            <div class="doc-subtitle">DECLARACIÓN DE TRABAJO Y PRESTACIÓN DE SERVICIOS INTERNACIONALES (ES/EN)</div>
          </div>
          <div class="section-title">1. IDENTIFICACIÓN DE LAS PARTES / PARTIES IDENTIFICATION</div>
          <table class="grid-table">
            <tr>
              <th style="width: 50%;">PRESTADOR DE SERVICIOS / SERVICE PROVIDER</th>
              <th style="width: 50%;">CLIENTE CONTRATANTE / CLIENT</th>
            </tr>
            <tr>
              <td>
                <strong>Razón Social:</strong> {{empresa.nombre}}<br>
                <strong>RUT / Tax ID:</strong> {{empresa.rut}}<br>
                <strong>Representante:</strong> {{empresa.representanteLegal}} ({{empresa.cargoRepresentante}})<br>
                <strong>Domicilio:</strong> {{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}<br>
                <strong>Contacto:</strong> {{empresa.email}} | {{empresa.telefono}}
              </td>
              <td>
                <strong>Razón Social:</strong> {{cliente.nombreLegal}}<br>
                <strong>Tax ID / RUT / EIN:</strong> {{cliente.taxId}}<br>
                <strong>País / Ciudad:</strong> {{cliente.pais}} {{cliente.ciudad}}<br>
                <strong>Domicilio:</strong> {{cliente.direccion}}<br>
                <strong>Contacto:</strong> {{cliente.email}}
              </td>
            </tr>
          </table>
          <div class="section-title">2. OBJETO Y ALCANCE DE LOS SERVICIOS / SCOPE OF SERVICES</div>
          <table class="grid-table">
            <tr>
              <td class="label">Tipo de Contrato:</td>
              <td><strong>{{contrato.tipoNombre}}</strong> (Modalidad: {{contrato.modalidadNombre}})</td>
            </tr>
            <tr>
              <td class="label">Título del Servicio:</td>
              <td><strong>{{contrato.titulo}}</strong></td>
            </tr>
          </table>
          <div style="font-weight: bold; margin-bottom: 4px; color: #0a2540; font-size: 11px;">Descripción Detallada del Alcance:</div>
          <div class="scope-box">{{contrato.descripcion}}</div>
          <div class="section-title">3. VIGENCIA Y PLAZOS DE EJECUCIÓN / TERM & EFFECTIVE DATES</div>
          <table class="grid-table">
            <tr>
              <td class="label">Fecha de Inicio:</td>
              <td>{{contrato.fechaInicio}}</td>
              <td class="label">Fecha de Término / Vigencia:</td>
              <td>{{contrato.fechaTermino}}</td>
            </tr>
            <tr>
              <td class="label">Régimen de Ejecución:</td>
              <td colspan="3">{{contrato.modalidadNombre}} — Conforme al consumo de horas y órdenes de trabajo autorizadas.</td>
            </tr>
          </table>
          <div class="section-title">4. HONORARIOS, UNIDADES Y FORMA DE PAGO / FEES & PAYMENT TERMS</div>
          <table class="grid-table">
            <tr>
              <td class="label">Moneda del Contrato:</td>
              <td><strong>{{contrato.moneda}}</strong></td>
              <td class="label">Monto Total Acordado:</td>
              <td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td>
            </tr>
            <tr>
              <td class="label">Bolsa / Horas Contratadas:</td>
              <td>{{contrato.horas}} Horas</td>
              <td class="label">Tarifa por Hora (Referencial):</td>
              <td>{{contrato.tarifaHora}}</td>
            </tr>
            <tr>
              <td class="label">Condiciones y Métodos de Pago:</td>
              <td colspan="3"><strong>{{contrato.metodoPago}}</strong></td>
            </tr>
          </table>
          <div class="section-title">5. DECLARACIÓN TRIBUTARIA DE EXPORTACIÓN / TAX EXEMPTION</div>
          <div class="legal-clause">
            <strong>DECLARACIÓN TRIBUTARIA DE EXPORTACIÓN DE SERVICIOS:</strong><br>
            {{contrato.clausulaExportacion}}
          </div>
          <div class="section-title">6. CONFIDENCIALIDAD, PROPIEDAD INTELECTUAL Y ACEPTACIÓN</div>
          <p style="font-size: 10px; color: #475569; margin: 4px 0 14px 0; text-align: justify;">
            Las partes acuerdan estricta confidencialidad respecto a la información técnica, comercial y operativa intercambiada. Toda propiedad intelectual desarrollada bajo el presente SOW pertenecerá al Cliente una vez completado el pago de los honorarios pactados. En señal de conformidad, las partes suscriben el presente instrumento.
          </p>
          <div class="signatures">
            <div class="sig-box">
              <strong>POR / FOR: {{empresa.nombre}}</strong><br>
              <span style="font-size: 9.5px; color: #64748b;">Prestador de Servicios (Chile)</span>
              <div class="sig-space"></div>
              ____________________________________________<br>
              <strong>{{empresa.representanteLegal}}</strong><br>
              {{empresa.cargoRepresentante}}<br>
              RUT: {{empresa.rut}}
            </div>
            <div class="sig-box">
              <strong>POR / FOR: {{cliente.nombreLegal}}</strong><br>
              <span style="font-size: 9.5px; color: #64748b;">Cliente Contratante</span>
              <div class="sig-space"></div>
              ____________________________________________<br>
              <strong>Firma Autorizada</strong><br>
              Tax ID / RUT: {{cliente.taxId}}<br>
              {{cliente.pais}}
            </div>
          </div>
        </body></html>`
    },
    {
      code: 'TPL-CONTRACT-SOW-ENTERPRISE',
      name: 'Contrato Marco Enterprise Internacional',
      category: TemplateCategory.CONTRACT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
              <div class="company-sub">{{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</div>
              <div class="company-sub">Email: {{empresa.email}} | Web: {{empresa.website}}</div>
            </div>
            <div class="header-meta">
              <div class="doc-badge">ENTERPRISE MASTER AGREEMENT</div>
              <div class="meta-line"><strong>Folio:</strong> {{contrato.codigo}}</div>
              <div class="meta-line"><strong>Expediente:</strong> {{expediente.codigo}}</div>
              <div class="meta-line"><strong>Fecha:</strong> {{contrato.fechaEmision}}</div>
            </div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">{{contrato.titulo}}</h1>
            <div class="doc-subtitle">CONTRATO MARCO DE SERVICIOS TECNOLÓGICOS ENTERPRISE INTERNACIONAL</div>
          </div>
          <div class="section-title">1. IDENTIFICACIÓN DE LAS PARTES</div>
          <table class="grid-table">
            <tr><td class="label">Prestador:</td><td><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}} | {{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</td></tr>
            <tr><td class="label">Cliente Enterprise:</td><td><strong>{{cliente.nombreLegal}}</strong> | Tax ID: {{cliente.taxId}} | {{cliente.pais}} | {{cliente.direccion}}</td></tr>
          </table>
          <div class="section-title">2. ALCANCE Y ESPECIFICACIÓN DEL SERVICIO</div>
          <div class="scope-box">{{contrato.descripcion}}</div>
          <div class="section-title">3. CONDICIONES ECONÓMICAS Y VIGENCIA</div>
          <table class="grid-table">
            <tr><td class="label">Monto Acordado:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td><td class="label">Horas / Capacidad:</td><td>{{contrato.horas}} Horas</td></tr>
            <tr><td class="label">Vigencia:</td><td>{{contrato.fechaInicio}} al {{contrato.fechaTermino}}</td><td class="label">Forma de Pago:</td><td>{{contrato.metodoPago}}</td></tr>
          </table>
          <div class="legal-clause"><strong>EXPORTACIÓN DE SERVICIOS:</strong> {{contrato.clausulaExportacion}}</div>
          <div class="signatures">
            <div class="sig-box"><strong>POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
            <div class="sig-box"><strong>POR: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Representante Legal Cliente</div>
          </div>
        </body></html>`
    },
    {
      code: 'TPL-CONTRACT-HOURS-BANK',
      name: 'Contrato Bolsa de Horas Soporte y Desarrollo',
      category: TemplateCategory.CONTRACT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
            </div>
            <div class="header-meta">
              <div class="doc-badge">BOLSA DE HORAS</div>
              <div class="meta-line"><strong>Código:</strong> {{contrato.codigo}}</div>
              <div class="meta-line"><strong>Fecha:</strong> {{contrato.fechaEmision}}</div>
            </div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">{{contrato.titulo}}</h1>
            <div class="doc-subtitle">CONTRATO DE BOLSA DE HORAS TI Y SOPORTE ESPECIALIZADO</div>
          </div>
          <div class="section-title">1. PARTES CONTRATANTES</div>
          <table class="grid-table">
            <tr><td class="label">Prestador:</td><td>{{empresa.nombre}} (RUT: {{empresa.rut}})</td></tr>
            <tr><td class="label">Cliente:</td><td>{{cliente.nombreLegal}} (Tax ID: {{cliente.taxId}} - {{cliente.pais}})</td></tr>
          </table>
          <div class="section-title">2. ALCANCE DE LA BOLSA DE HORAS</div>
          <div class="scope-box">{{contrato.descripcion}}</div>
          <div class="section-title">3. DETALLE DE HORAS Y TARIFA</div>
          <table class="grid-table">
            <tr><td class="label">Horas Contratadas:</td><td><strong>{{contrato.horas}} Horas</strong></td><td class="label">Tarifa Referencial:</td><td>{{contrato.tarifaHora}}</td></tr>
            <tr><td class="label">Valor Total:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td><td class="label">Forma de Pago:</td><td>{{contrato.metodoPago}}</td></tr>
            <tr><td class="label">Vigencia:</td><td colspan="3">{{contrato.fechaInicio}} hasta {{contrato.fechaTermino}}</td></tr>
          </table>
          <div class="legal-clause"><strong>CLÁUSULA TRIBUTARIA:</strong> {{contrato.clausulaExportacion}}</div>
          <div class="signatures">
            <div class="sig-box"><strong>POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
            <div class="sig-box"><strong>POR: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Firma Autorizada</div>
          </div>
        </body></html>`
    },
    {
      code: 'TPL-CONTRACT-FIXED-PROJECT',
      name: 'Contrato Proyecto Llave en Mano',
      category: TemplateCategory.CONTRACT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
            </div>
            <div class="header-meta">
              <div class="doc-badge">PROYECTO CERRADO</div>
              <div class="meta-line"><strong>Código:</strong> {{contrato.codigo}}</div>
              <div class="meta-line"><strong>Fecha:</strong> {{contrato.fechaEmision}}</div>
            </div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">{{contrato.titulo}}</h1>
            <div class="doc-subtitle">CONTRATO DE PROYECTO TI A PRECIO CERRADO / LLAVE EN MANO</div>
          </div>
          <div class="section-title">1. IDENTIFICACIÓN DE LAS PARTES</div>
          <table class="grid-table">
            <tr><td class="label">Prestador:</td><td>{{empresa.nombre}} (RUT: {{empresa.rut}})</td></tr>
            <tr><td class="label">Cliente:</td><td>{{cliente.nombreLegal}} (Tax ID: {{cliente.taxId}} - {{cliente.pais}})</td></tr>
          </table>
          <div class="section-title">2. ESPECIFICACIÓN DEL ENTREGABLE Y ALCANCE</div>
          <div class="scope-box">{{contrato.descripcion}}</div>
          <div class="section-title">3. CONDICIONES ECONÓMICAS Y PLAZOS</div>
          <table class="grid-table">
            <tr><td class="label">Precio Total Cerrado:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td><td class="label">Plazo de Ejecución:</td><td>{{contrato.fechaInicio}} al {{contrato.fechaTermino}}</td></tr>
            <tr><td class="label">Hitos / Forma de Pago:</td><td colspan="3">{{contrato.metodoPago}}</td></tr>
          </table>
          <div class="legal-clause"><strong>CLÁUSULA TRIBUTARIA:</strong> {{contrato.clausulaExportacion}}</div>
          <div class="signatures">
            <div class="sig-box"><strong>POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
            <div class="sig-box"><strong>POR: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Firma Autorizada</div>
          </div>
        </body></html>`
    },
    {
      code: 'TPL-QUOTATION',
      name: 'Cotización Oficial de Servicios',
      category: TemplateCategory.QUOTATION,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
              <div class="company-sub">{{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</div>
              <div class="company-sub">Email: {{empresa.email}} | Web: {{empresa.website}}</div>
            </div>
            <div class="header-meta">
              <div class="doc-badge">COTIZACIÓN DE SERVICIOS</div>
              <div class="meta-line"><strong>Folio:</strong> {{documento.codigo}}</div>
              <div class="meta-line"><strong>Expediente:</strong> {{expediente.codigo}}</div>
              <div class="meta-line"><strong>Fecha:</strong> {{documento.fechaEmision}}</div>
            </div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">COTIZACIÓN OFICIAL DE SERVICIOS TI</h1>
            <div class="doc-subtitle">OFFICIAL SERVICE QUOTATION & TECHNICAL ESTIMATE (ES/EN)</div>
          </div>
          <div class="section-title">1. DESTINATARIO Y DATOS DEL CLIENTE / CLIENT DETAILS</div>
          <table class="grid-table">
            <tr>
              <td class="label">Cliente / Razón Social:</td><td><strong>{{cliente.nombreLegal}}</strong></td>
              <td class="label">Tax ID / RUT:</td><td>{{cliente.taxId}}</td>
            </tr>
            <tr>
              <td class="label">País / Dirección:</td><td>{{cliente.pais}}, {{cliente.direccion}}</td>
              <td class="label">Contacto:</td><td>{{cliente.email}}</td>
            </tr>
          </table>
          <div class="section-title">2. ALCANCE TÉCNICO Y PROPUESTA / SCOPE & PROPOSAL</div>
          <div class="scope-box">{{contrato.descripcion}}</div>
          <div class="section-title">3. DETALLE ECONÓMICO Y CONDICIONES / PRICING & PAYMENT TERMS</div>
          <table class="grid-table">
            <tr>
              <td class="label">Moneda:</td><td><strong>{{contrato.moneda}}</strong></td>
              <td class="label">Monto Total Estimado:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td>
            </tr>
            <tr>
              <td class="label">Horas / Capacidad:</td><td>{{contrato.horas}} Horas</td>
              <td class="label">Forma de Pago:</td><td>{{contrato.metodoPago}}</td>
            </tr>
          </table>
          <div class="legal-clause"><strong>TRATAMIENTO TRIBUTARIO:</strong> {{contrato.clausulaExportacion}}</div>
          <div class="signatures">
            <div class="sig-box"><strong>EMITIDO POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
            <div class="sig-box"><strong>ACEPTACIÓN CLIENTE: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Firma y Aceptación de Cotización</div>
          </div>
        </body></html>`
    },
    {
      code: 'TPL-WORK-ORDER',
      name: 'Orden de Trabajo Autorizada (OT)',
      category: TemplateCategory.WORK_ORDER,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
              <div class="company-sub">{{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</div>
            </div>
            <div class="header-meta">
              <div class="doc-badge">ORDEN DE TRABAJO (OT)</div>
              <div class="meta-line"><strong>Folio OT:</strong> {{documento.codigo}}</div>
              <div class="meta-line"><strong>Expediente:</strong> {{expediente.codigo}}</div>
              <div class="meta-line"><strong>Contrato:</strong> {{contrato.codigo}}</div>
              <div class="meta-line"><strong>Fecha Emisión:</strong> {{documento.fechaEmision}}</div>
            </div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">ORDEN DE TRABAJO AUTORIZADA</h1>
            <div class="doc-subtitle">AUTHORIZED WORK ORDER & EXECUTION DIRECTIVE (ES/EN)</div>
          </div>
          <div class="section-title">1. ANTECEDENTES GENERALES</div>
          <table class="grid-table">
            <tr><td class="label">Cliente:</td><td><strong>{{cliente.nombreLegal}}</strong> (Tax ID: {{cliente.taxId}})</td><td class="label">País:</td><td>{{cliente.pais}}</td></tr>
            <tr><td class="label">Contrato Ref.:</td><td>{{contrato.codigo}} — {{contrato.titulo}}</td><td class="label">Expediente:</td><td>{{expediente.codigo}}</td></tr>
          </table>
          <div class="section-title">2. ESPECIFICACIÓN DEL REQUERIMIENTO TÉCNICO</div>
          <div class="scope-box">{{contrato.descripcion}}</div>
          <div class="section-title">3. TIEMPO Y ASIGNACIÓN DE RECURSOS</div>
          <table class="grid-table">
            <tr><td class="label">Horas Asignadas:</td><td><strong>{{contrato.horas}} Horas</strong></td><td class="label">Tarifa Horaria:</td><td>{{contrato.tarifaHora}}</td></tr>
            <tr><td class="label">Valor Total:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td><td class="label">Fecha Programada:</td><td>{{contrato.fechaInicio}} al {{contrato.fechaTermino}}</td></tr>
          </table>
          <div class="signatures">
            <div class="sig-box"><strong>AUTORIZADO POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
            <div class="sig-box"><strong>CONFORMIDAD CLIENTE: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Aprobación Técnica Cliente</div>
          </div>
        </body></html>`
    },
    {
      code: 'TPL-ATTENTION-REPORT',
      name: 'Informe de Atención Técnica',
      category: TemplateCategory.ATTENTION_REPORT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
            </div>
            <div class="header-meta">
              <div class="doc-badge">INFORME TÉCNICO</div>
              <div class="meta-line"><strong>Folio AT:</strong> {{documento.codigo}}</div>
              <div class="meta-line"><strong>Expediente:</strong> {{expediente.codigo}}</div>
              <div class="meta-line"><strong>Fecha:</strong> {{documento.fechaEmision}}</div>
            </div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">INFORME TÉCNICO DE ATENCIÓN</h1>
            <div class="doc-subtitle">TECHNICAL ATTENTION & INCIDENT REPORT (ES/EN)</div>
          </div>
          <div class="section-title">1. INFORMACIÓN DEL SERVICIO Y CLIENTE</div>
          <table class="grid-table">
            <tr><td class="label">Cliente:</td><td><strong>{{cliente.nombreLegal}}</strong></td><td class="label">Tax ID:</td><td>{{cliente.taxId}}</td></tr>
            <tr><td class="label">Contrato / Expediente:</td><td colspan="3">{{contrato.codigo}} / {{expediente.codigo}}</td></tr>
          </table>
          <div class="section-title">2. DETALLE DE LA ATENCIÓN TÉCNICA</div>
          <div class="scope-box">{{contrato.descripcion}}</div>
          <div class="section-title">3. HORAS DEDICADAS Y RESOLUCIÓN</div>
          <table class="grid-table">
            <tr><td class="label">Horas Consumidas:</td><td><strong>{{contrato.horas}} Horas</strong></td><td class="label">Estado de la Atención:</td><td><strong>COMPLETADA CONFORME</strong></td></tr>
          </table>
          <div class="signatures" style="justify-content: flex-start;">
            <div class="sig-box" style="width: 280px;"><strong>POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>Especialista Técnico SATEM</div>
          </div>
        </body></html>`
    },
    {
      code: 'TPL-SERVICE-REPORT',
      name: 'Informe de Servicio Ejecutivo',
      category: TemplateCategory.SERVICE_REPORT,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
            </div>
            <div class="header-meta">
              <div class="doc-badge">INFORME EJECUTIVO</div>
              <div class="meta-line"><strong>Folio:</strong> {{documento.codigo}}</div>
              <div class="meta-line"><strong>Expediente:</strong> {{expediente.codigo}}</div>
              <div class="meta-line"><strong>Fecha:</strong> {{documento.fechaEmision}}</div>
            </div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">INFORME EJECUTIVO DE SERVICIOS PRESTADOS</h1>
            <div class="doc-subtitle">EXECUTIVE SERVICE & PERFORMANCE REPORT (ES/EN)</div>
          </div>
          <div class="section-title">1. CLIENTE Y ANTECEDENTES</div>
          <table class="grid-table">
            <tr><td class="label">Cliente:</td><td><strong>{{cliente.nombreLegal}}</strong> (Tax ID: {{cliente.taxId}})</td><td class="label">País:</td><td>{{cliente.pais}}</td></tr>
            <tr><td class="label">Contrato SOW:</td><td>{{contrato.codigo}} — {{contrato.titulo}}</td><td class="label">Expediente:</td><td>{{expediente.codigo}}</td></tr>
          </table>
          <div class="section-title">2. RESUMEN EJECUTIVO DE ACTIVIDADES REALIZADAS</div>
          <div class="scope-box">{{contrato.descripcion}}</div>
          <div class="section-title">3. MÉTRICAS Y HORAS EJECUTADAS</div>
          <table class="grid-table">
            <tr><td class="label">Horas Totales:</td><td><strong>{{contrato.horas}} Horas</strong></td><td class="label">Monto Asociado:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td></tr>
            <tr><td class="label">Período:</td><td colspan="3">{{contrato.fechaInicio}} al {{contrato.fechaTermino}}</td></tr>
          </table>
          <div class="signatures">
            <div class="sig-box"><strong>EMITIDO POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
            <div class="sig-box"><strong>RECIBIDO POR: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Aprobación Ejecutiva Cliente</div>
          </div>
        </body></html>`
    },
    {
      code: 'TPL-RECEPTION-CONFORMITY',
      name: 'Recepción Conforme de Servicios',
      category: TemplateCategory.RECEPTION_CONFORMITY,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
              <div class="company-sub">{{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</div>
              <div class="company-sub">Email: {{empresa.email}} | Web: {{empresa.website}}</div>
            </div>
            <div class="header-meta">
              <div class="doc-badge">RECEPCIÓN CONFORME / ACCEPTANCE</div>
              <div class="meta-line"><strong>Folio:</strong> {{documento.codigo}}</div>
              <div class="meta-line"><strong>Expediente:</strong> {{expediente.codigo}}</div>
              <div class="meta-line"><strong>Contrato Ref.:</strong> {{contrato.codigo}}</div>
              <div class="meta-line"><strong>Fecha:</strong> {{documento.fechaEmision}}</div>
            </div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">ACTA DE RECEPCIÓN CONFORME DE SERVICIOS</h1>
            <div class="doc-subtitle">CERTIFICATE OF SERVICE ACCEPTANCE & CONFORMITY (ES/EN)</div>
          </div>
          <div class="section-title">1. IDENTIFICACIÓN DE LAS PARTES / PARTIES IDENTIFICATION</div>
          <table class="grid-table">
            <tr>
              <th style="width: 50%;">PRESTADOR DE SERVICIOS / SERVICE PROVIDER</th>
              <th style="width: 50%;">CLIENTE RECEPTOR / CLIENT RECIPIENT</th>
            </tr>
            <tr>
              <td>
                <strong>Razón Social:</strong> {{empresa.nombre}}<br>
                <strong>RUT:</strong> {{empresa.rut}}<br>
                <strong>Representante:</strong> {{empresa.representanteLegal}} ({{empresa.cargoRepresentante}})<br>
                <strong>Domicilio:</strong> {{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}<br>
                <strong>Contacto:</strong> {{empresa.email}} | {{empresa.telefono}}
              </td>
              <td>
                <strong>Razón Social:</strong> {{cliente.nombreLegal}}<br>
                <strong>Tax ID / RUT / EIN:</strong> {{cliente.taxId}}<br>
                <strong>País / Ciudad:</strong> {{cliente.pais}} {{cliente.ciudad}}<br>
                <strong>Domicilio:</strong> {{cliente.direccion}}<br>
                <strong>Contacto:</strong> {{cliente.email}}
              </td>
            </tr>
          </table>
          <div class="section-title">2. REFERENCIA CONTRACTUAL Y EXPEDIENTE / CONTRACTUAL REFERENCE</div>
          <table class="grid-table">
            <tr>
              <td class="label">Contrato Marco / SOW:</td>
              <td><strong>{{contrato.codigo}}</strong> — {{contrato.titulo}}</td>
              <td class="label">Expediente Operativo:</td>
              <td><strong>{{expediente.codigo}}</strong></td>
            </tr>
            <tr>
              <td class="label">Tipo & Modalidad:</td>
              <td>{{contrato.tipoNombre}} ({{contrato.modalidadNombre}})</td>
              <td class="label">Período de Ejecución:</td>
              <td>{{contrato.fechaInicio}} al {{contrato.fechaTermino}}</td>
            </tr>
          </table>
          <div class="section-title">3. SERVICIOS RECIBIDOS Y CONFORMIDAD / DELIVERABLES & CONFORMITY</div>
          <div style="font-weight: bold; margin-bottom: 4px; color: #0a2540; font-size: 11px;">Descripción de las Actividades y Servicios Prestados:</div>
          <div class="scope-box">{{contrato.descripcion}}</div>
          <table class="grid-table" style="margin-top: 10px;">
            <tr>
              <td class="label">Horas / Unidades Ejecutadas:</td>
              <td><strong>{{contrato.horas}} Horas</strong></td>
              <td class="label">Valor Total del Servicio:</td>
              <td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td>
            </tr>
            <tr>
              <td class="label">Condición / Medio de Pago:</td>
              <td colspan="3"><strong>{{contrato.metodoPago}}</strong></td>
            </tr>
          </table>
          <div class="section-title">4. DECLARACIÓN DE RECEPCIÓN A PLENA CONFORMIDAD / ACCEPTANCE STATEMENT</div>
          <div class="legal-clause" style="background: #f0fdf4; border-left: 4px solid #10b981; color: #065f46;">
            <strong>DECLARACIÓN DEL CLIENTE:</strong><br>
            Por medio del presente instrumento, el Cliente declara haber recibido a su entera satisfacción los servicios profesionales y productos especificados precedentemente, acreditando el cabal cumplimiento de los estándares de calidad, plazos y requerimientos técnicos acordados.
          </div>
          <div class="section-title">5. DECLARACIÓN TRIBUTARIA DE EXPORTACIÓN / TAX STATEMENT</div>
          <div class="legal-clause">
            <strong>TRATAMIENTO TRIBUTARIO:</strong><br>
            {{contrato.clausulaExportacion}}
          </div>
          <div class="signatures">
            <div class="sig-box">
              <strong>POR / FOR: {{empresa.nombre}}</strong><br>
              <span style="font-size: 9.5px; color: #64748b;">Prestador del Servicio (Chile)</span>
              <div class="sig-space"></div>
              ____________________________________________<br>
              <strong>{{empresa.representanteLegal}}</strong><br>
              {{empresa.cargoRepresentante}}<br>
              RUT: {{empresa.rut}}
            </div>
            <div class="sig-box">
              <strong>POR / FOR: {{cliente.nombreLegal}}</strong><br>
              <span style="font-size: 9.5px; color: #64748b;">Recepción Conforme Cliente Autorizado</span>
              <div class="sig-space"></div>
              ____________________________________________<br>
              <strong>Firma Autorizada y Aceptación</strong><br>
              Tax ID / RUT: {{cliente.taxId}}<br>
              Fecha: {{documento.fechaEmision}}
            </div>
          </div>
        </body></html>`
    },
    {
      code: 'TPL-COMMERCIAL-PROPOSAL',
      name: 'Propuesta Comercial y Carta Presentación',
      category: TemplateCategory.COMMERCIAL_PROPOSAL,
      language: 'ES/EN',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
          <div class="header">
            <div>
              <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
              <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
              <div class="company-sub">{{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</div>
              <div class="company-sub">Email: {{empresa.email}} | Web: {{empresa.website}}</div>
            </div>
            <div class="header-meta">
              <div class="doc-badge">PROPUESTA COMERCIAL</div>
              <div class="meta-line"><strong>Folio:</strong> {{documento.codigo}}</div>
              <div class="meta-line"><strong>Expediente:</strong> {{expediente.codigo}}</div>
              <div class="meta-line"><strong>Fecha:</strong> {{documento.fechaEmision}}</div>
            </div>
          </div>
          <div class="doc-title-container">
            <h1 class="doc-title">PROPUESTA COMERCIAL DE SERVICIOS TI</h1>
            <div class="doc-subtitle">COMMERCIAL PROPOSAL & SERVICE STATEMENT (ES/EN)</div>
          </div>
          <div class="section-title">1. DESTINATARIO</div>
          <table class="grid-table">
            <tr><td class="label">Empresa Cliente:</td><td><strong>{{cliente.nombreLegal}}</strong> (Tax ID: {{cliente.taxId}})</td></tr>
            <tr><td class="label">Domicilio y País:</td><td>{{cliente.direccion}}, {{cliente.ciudad}}, {{cliente.pais}}</td></tr>
          </table>
          <div class="section-title">2. ALCANCE DEL SERVICIO PROPUESTO</div>
          <div class="scope-box">{{contrato.descripcion}}</div>
          <div class="section-title">3. CONDICIONES ECONÓMICAS Y FORMA DE PAGO</div>
          <table class="grid-table">
            <tr><td class="label">Inversión Total:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td><td class="label">Horas Estimadas:</td><td>{{contrato.horas}} Horas</td></tr>
            <tr><td class="label">Forma de Pago:</td><td colspan="3">{{contrato.metodoPago}}</td></tr>
          </table>
          <div class="legal-clause"><strong>CLÁUSULA TRIBUTARIA:</strong> {{contrato.clausulaExportacion}}</div>
          <div class="signatures">
            <div class="sig-box"><strong>PRESENTADO POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
            <div class="sig-box"><strong>ACEPTADO POR: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Firma y Fecha de Aceptación</div>
          </div>
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

import { TemplateCategory } from '@prisma/client';
import { LOGO_FULL_BASE64 } from '../../assets/logos.js';

export const baseCss = `
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
  .sig-space { height: 75px; display: flex; align-items: flex-end; justify-content: center; }
  .sig-img { max-height: 80px; max-width: 220px; object-fit: contain; margin-bottom: -12px; display: block; margin-left: auto; margin-right: auto; }
`;

export const OFFICIAL_DEFAULT_TEMPLATES = [
  {
    code: 'TPL-CONTRACT-SOW',
    name: 'Contrato Servicios Internacionales (Bilingual SOW)',
    category: TemplateCategory.CONTRACT,
    language: 'ES/EN',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
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
            <strong>Contacto:</strong> {{cliente.email}} | {{cliente.telefono}}
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
          <td class="label">Tarifa por Hora:</td>
          <td>{{contrato.tarifaHoraConEquivalente}}</td>
        </tr>
        <tr>
          <td class="label">T.C. Dólar Observado (Chile):</td>
          <td><strong>{{contrato.tipoCambioInfo}}</strong></td>
          <td class="label">Total Equivalente en CLP:</td>
          <td><strong style="color: #00a896;">{{contrato.montoEquivalenteClp}}</strong></td>
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
    code: 'TPL-WORK-ORDER',
    name: 'Orden de Trabajo Autorizada (OT)',
    category: TemplateCategory.WORK_ORDER,
    language: 'ES/EN',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
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
    code: 'TPL-RECEPTION-CONFORMITY',
    name: 'Acta de Recepción Conforme de Servicios (RC)',
    category: TemplateCategory.RECEPTION_CONFORMITY,
    language: 'ES/EN',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
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
      <div class="section-title">4. DECLARACIÓN DE CONFORMIDAD Y CIERRE / ACCEPTANCE DECLARATION</div>
      <div class="legal-clause">
        El Cliente declara bajo juramento haber recibido a entera satisfacción la totalidad de los servicios técnicos y profesionales descritos precedentemente, prestados de conformidad con los estándares acordados.
      </div>
      <div class="signatures">
        <div class="sig-box">
          <strong>ENTREGADO POR: {{empresa.nombre}}</strong><br>
          <span style="font-size: 9.5px; color: #64748b;">Prestador de Servicios (Chile)</span>
          <div class="sig-space"></div>
          ____________________________________________<br>
          <strong>{{empresa.representanteLegal}}</strong><br>
          {{empresa.cargoRepresentante}}<br>
          RUT: {{empresa.rut}}
        </div>
        <div class="sig-box">
          <strong>RECEPCIÓN CONFORME CLIENTE: {{cliente.nombreLegal}}</strong><br>
          <span style="font-size: 9.5px; color: #64748b;">Cliente Contratante</span>
          <div class="sig-space"></div>
          ____________________________________________<br>
          <strong>Firma de Recepción Conforme</strong><br>
          Tax ID / RUT: {{cliente.taxId}}<br>
          {{cliente.pais}}
        </div>
      </div>
    </body></html>`
  },
  {
    code: 'TPL-ATTENTION-REPORT',
    name: 'Informe Técnico de Atención (AT)',
    category: TemplateCategory.ATTENTION_REPORT,
    language: 'ES/EN',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
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
    code: 'TPL-COMMERCIAL-PROPOSAL',
    name: 'Propuesta Comercial de Servicios TI (PROP)',
    category: TemplateCategory.COMMERCIAL_PROPOSAL,
    language: 'ES/EN',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
      <div class="header">
        <div>
          <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
          <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
          <div class="company-sub">{{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</div>
        </div>
        <div class="header-meta">
          <div class="doc-badge">PROPUESTA COMERCIAL</div>
          <div class="meta-line"><strong>Folio:</strong> {{documento.codigo}}</div>
          <div class="meta-line"><strong>Fecha:</strong> {{documento.fechaEmision}}</div>
        </div>
      </div>
      <div class="doc-title-container">
        <h1 class="doc-title">PROPUESTA COMERCIAL DE SERVICIOS TI</h1>
        <div class="doc-subtitle">COMMERCIAL PROPOSAL & SERVICE STATEMENT (ES/EN)</div>
      </div>
      <div class="section-title">1. CLIENTE Y ANTECEDENTES</div>
      <table class="grid-table">
        <tr><td class="label">Cliente:</td><td><strong>{{cliente.nombreLegal}}</strong></td><td class="label">Tax ID:</td><td>{{cliente.taxId}}</td></tr>
        <tr><td class="label">País / Dirección:</td><td colspan="3">{{cliente.pais}}, {{cliente.direccion}}</td></tr>
      </table>
      <div class="section-title">2. ALCANCE DE LA PROPUESTA</div>
      <div class="scope-box">{{contrato.descripcion}}</div>
      <div class="section-title">3. CONDICIONES ECONÓMICAS Y VALIDEZ</div>
      <table class="grid-table">
        <tr><td class="label">Moneda:</td><td><strong>{{contrato.moneda}}</strong></td><td class="label">Monto Estimado:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td></tr>
        <tr><td class="label">Capacidad / Horas:</td><td>{{contrato.horas}} Horas</td><td class="label">Forma de Pago:</td><td>{{contrato.metodoPago}}</td></tr>
      </table>
      <div class="signatures">
        <div class="sig-box"><strong>PRESENTADO POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
        <div class="sig-box"><strong>ACEPTADO POR: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Firma Aceptación Propuesta</div>
      </div>
    </body></html>`
  },
  {
    code: 'TPL-QUOTATION',
    name: 'Cotización Oficial de Servicios TI (COT)',
    category: TemplateCategory.QUOTATION,
    language: 'ES/EN',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
      <div class="header">
        <div>
          <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
          <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
          <div class="company-sub">{{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</div>
        </div>
        <div class="header-meta">
          <div class="doc-badge">COTIZACIÓN DE SERVICIOS</div>
          <div class="meta-line"><strong>Folio:</strong> {{documento.codigo}}</div>
          <div class="meta-line"><strong>Fecha:</strong> {{documento.fechaEmision}}</div>
        </div>
      </div>
      <div class="doc-title-container">
        <h1 class="doc-title">COTIZACIÓN OFICIAL DE SERVICIOS TI</h1>
        <div class="doc-subtitle">OFFICIAL SERVICE QUOTATION (ES/EN)</div>
      </div>
      <div class="section-title">1. CLIENTE Y ANTECEDENTES</div>
      <table class="grid-table">
        <tr><td class="label">Cliente:</td><td><strong>{{cliente.nombreLegal}}</strong></td><td class="label">Tax ID:</td><td>{{cliente.taxId}}</td></tr>
      </table>
      <div class="section-title">2. ALCANCE Y ESPECIFICACIÓN</div>
      <div class="scope-box">{{contrato.descripcion}}</div>
      <div class="section-title">3. CONDICIONES ECONÓMICAS</div>
      <table class="grid-table">
        <tr><td class="label">Moneda:</td><td><strong>{{contrato.moneda}}</strong></td><td class="label">Total Cotizado:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td></tr>
      </table>
      <div class="signatures">
        <div class="sig-box"><strong>EMITIDO POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
        <div class="sig-box"><strong>ACEPTADO POR: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Firma Aprobación Cotización</div>
      </div>
    </body></html>`
  },
  {
    code: 'TPL-SERVICE-REPORT',
    name: 'Informe Ejecutivo de Servicios Prestados (SRV)',
    category: TemplateCategory.SERVICE_REPORT,
    language: 'ES/EN',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
      <div class="header">
        <div>
          <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
          <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
        </div>
        <div class="header-meta">
          <div class="doc-badge">INFORME EJECUTIVO</div>
          <div class="meta-line"><strong>Folio:</strong> {{documento.codigo}}</div>
          <div class="meta-line"><strong>Fecha:</strong> {{documento.fechaEmision}}</div>
        </div>
      </div>
      <div class="doc-title-container">
        <h1 class="doc-title">INFORME EJECUTIVO DE SERVICIOS PRESTADOS</h1>
        <div class="doc-subtitle">EXECUTIVE SERVICE & PERFORMANCE REPORT (ES/EN)</div>
      </div>
      <div class="section-title">1. CLIENTE Y ANTECEDENTES</div>
      <table class="grid-table">
        <tr><td class="label">Cliente:</td><td><strong>{{cliente.nombreLegal}}</strong></td><td class="label">Tax ID:</td><td>{{cliente.taxId}}</td></tr>
      </table>
      <div class="section-title">2. ACTIVIDADES Y RESULTADOS</div>
      <div class="scope-box">{{contrato.descripcion}}</div>
      <div class="signatures">
        <div class="sig-box"><strong>EMITIDO POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
        <div class="sig-box"><strong>RECIBIDO POR: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Aprobación Cliente</div>
      </div>
    </body></html>`
  },
  {
    code: 'TPL-CONTRACT-NAC',
    name: 'Contrato de Prestación de Servicios (Mercado Nacional - CLP)',
    category: TemplateCategory.CONTRACT,
    language: 'ES',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
      <div class="header">
        <div>
          <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
          <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
          <div class="company-sub">{{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</div>
          <div class="company-sub">Email: {{empresa.email}} | Web: {{empresa.website}}</div>
        </div>
        <div class="header-meta">
          <div class="doc-badge">CONTRATO DE SERVICIOS</div>
          <div class="meta-line"><strong>Folio Contrato:</strong> {{contrato.codigo}}</div>
          <div class="meta-line"><strong>Expediente:</strong> {{expediente.codigo}}</div>
          <div class="meta-line"><strong>Fecha Emisión:</strong> {{contrato.fechaEmision}}</div>
        </div>
      </div>
      <div class="doc-title-container">
        <h1 class="doc-title">{{contrato.titulo}}</h1>
        <div class="doc-subtitle">CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES Y TECNOLÓGICOS</div>
      </div>
      <div class="section-title">1. INDIVIDUALIZACIÓN DE LAS PARTES</div>
      <table class="grid-table">
        <tr>
          <th style="width: 50%;">PRESTADOR DE SERVICIOS</th>
          <th style="width: 50%;">CLIENTE CONTRATANTE</th>
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
            <strong>RUT:</strong> {{cliente.taxId}}<br>
            <strong>Ciudad:</strong> {{cliente.ciudad}}<br>
            <strong>Domicilio:</strong> {{cliente.direccion}}<br>
            <strong>Contacto:</strong> {{cliente.email}} | {{cliente.telefono}}
          </td>
        </tr>
      </table>
      <div class="section-title">2. OBJETO Y ALCANCE DE LOS SERVICIOS</div>
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
      <div class="section-title">3. VIGENCIA Y PLAZOS DE EJECUCIÓN</div>
      <table class="grid-table">
        <tr>
          <td class="label">Fecha de Inicio:</td>
          <td>{{contrato.fechaInicio}}</td>
          <td class="label">Fecha de Término / Vigencia:</td>
          <td>{{contrato.fechaTermino}}</td>
        </tr>
        <tr>
          <td class="label">Régimen de Ejecución:</td>
          <td colspan="3">{{contrato.modalidadNombre}} — Conforme a requerimientos y órdenes de trabajo autorizadas.</td>
        </tr>
      </table>
      <div class="section-title">4. HONORARIOS, VALOR Y FORMA DE PAGO</div>
      <table class="grid-table">
        <tr>
          <td class="label">Moneda:</td>
          <td><strong>{{contrato.moneda}}</strong></td>
          <td class="label">Monto Total Pactado:</td>
          <td><strong style="color: #00a896; font-size: 12px;">{{contrato.moneda}} {{contrato.valor}}</strong></td>
        </tr>
        <tr>
          <td class="label">Horas Contratadas:</td>
          <td>{{contrato.horas}} Horas</td>
          <td class="label">Tarifa por Hora:</td>
          <td>{{contrato.tarifaHora}}</td>
        </tr>
        <tr>
          <td class="label">Forma y Condiciones de Pago:</td>
          <td colspan="3"><strong>{{contrato.metodoPago}}</strong></td>
        </tr>
      </table>
      <div class="section-title">5. TRIBUTACIÓN Y FACTURACIÓN</div>
      <div class="legal-clause">
        <strong>RÉGIMEN TRIBUTARIO NACIONAL:</strong><br>
        {{contrato.clausulaTributaria}}
      </div>
      <div class="signatures">
        <div class="sig-box">
          <strong>POR: {{empresa.nombre}}</strong><br>
          <span style="font-size: 9.5px; color: #64748b;">Prestador de Servicios</span>
          <div class="sig-space"></div>
          ____________________________________________<br>
          <strong>{{empresa.representanteLegal}}</strong><br>
          {{empresa.cargoRepresentante}}<br>
          RUT: {{empresa.rut}}
        </div>
        <div class="sig-box">
          <strong>POR: {{cliente.nombreLegal}}</strong><br>
          <span style="font-size: 9.5px; color: #64748b;">Cliente Contratante</span>
          <div class="sig-space"></div>
          ____________________________________________<br>
          <strong>Firma Autorizada</strong><br>
          RUT: {{cliente.taxId}}
        </div>
      </div>
    </body></html>`
  },
  {
    code: 'TPL-WORK-ORDER-NAC',
    name: 'Orden de Trabajo (Mercado Nacional)',
    category: TemplateCategory.WORK_ORDER,
    language: 'ES',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
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
          <div class="meta-line"><strong>Contrato Ref.:</strong> {{contrato.codigo}}</div>
          <div class="meta-line"><strong>Fecha Emisión:</strong> {{documento.fechaEmision}}</div>
        </div>
      </div>
      <div class="doc-title-container">
        <h1 class="doc-title">ORDEN DE TRABAJO AUTORIZADA</h1>
        <div class="doc-subtitle">DIRECTIVA DE EJECUCIÓN Y ASIGNACIÓN DE RECURSOS TÉCNICOS</div>
      </div>
      <div class="section-title">1. ANTECEDENTES GENERALES</div>
      <table class="grid-table">
        <tr><td class="label">Cliente:</td><td><strong>{{cliente.nombreLegal}}</strong> (RUT: {{cliente.taxId}})</td><td class="label">Ciudad:</td><td>{{cliente.ciudad}}</td></tr>
        <tr><td class="label">Contrato Ref.:</td><td>{{contrato.codigo}} — {{contrato.titulo}}</td><td class="label">Expediente:</td><td>{{expediente.codigo}}</td></tr>
      </table>
      <div class="section-title">2. ESPECIFICACIÓN DEL REQUERIMIENTO TÉCNICO</div>
      <div class="scope-box">{{contrato.descripcion}}</div>
      <div class="section-title">3. TIEMPO Y ASIGNACIÓN DE RECURSOS</div>
      <table class="grid-table">
        <tr><td class="label">Horas Asignadas:</td><td><strong>{{contrato.horas}} Horas</strong></td><td class="label">Tarifa Horaria:</td><td>{{contrato.tarifaHora}}</td></tr>
        <tr><td class="label">Valor Total:</td><td><strong>{{contrato.moneda}} {{contrato.valor}}</strong></td><td class="label">Período Programado:</td><td>{{contrato.fechaInicio}} al {{contrato.fechaTermino}}</td></tr>
      </table>
      <div class="signatures">
        <div class="sig-box"><strong>AUTORIZADO POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
        <div class="sig-box"><strong>CONFORMIDAD CLIENTE: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Aprobación Técnica Cliente</div>
      </div>
    </body></html>`
  },
  {
    code: 'TPL-RECEPTION-NAC',
    name: 'Acta de Recepción Conforme (Mercado Nacional)',
    category: TemplateCategory.RECEPTION_CONFORMITY,
    language: 'ES',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
      <div class="header">
        <div>
          <img src="${LOGO_FULL_BASE64}" class="company-logo" alt="SATEM Soluciones Inteligentes" />
          <div class="company-sub"><strong>{{empresa.nombre}}</strong> | RUT: {{empresa.rut}}</div>
          <div class="company-sub">{{empresa.direccion}}, {{empresa.ciudad}}, {{empresa.pais}}</div>
          <div class="company-sub">Email: {{empresa.email}} | Web: {{empresa.website}}</div>
        </div>
        <div class="header-meta">
          <div class="doc-badge">RECEPCIÓN CONFORME</div>
          <div class="meta-line"><strong>Folio:</strong> {{documento.codigo}}</div>
          <div class="meta-line"><strong>Expediente:</strong> {{expediente.codigo}}</div>
          <div class="meta-line"><strong>Contrato Ref.:</strong> {{contrato.codigo}}</div>
          <div class="meta-line"><strong>Fecha:</strong> {{documento.fechaEmision}}</div>
        </div>
      </div>
      <div class="doc-title-container">
        <h1 class="doc-title">ACTA DE RECEPCIÓN CONFORME DE SERVICIOS</h1>
        <div class="doc-subtitle">CERTIFICADO DE CONFORMIDAD Y CUMPLIMIENTO DE ENTREGABLES</div>
      </div>
      <div class="section-title">1. INDIVIDUALIZACIÓN DE LAS PARTES</div>
      <table class="grid-table">
        <tr>
          <th style="width: 50%;">PRESTADOR DE SERVICIOS</th>
          <th style="width: 50%;">CLIENTE RECEPTOR</th>
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
            <strong>RUT:</strong> {{cliente.taxId}}<br>
            <strong>Ciudad:</strong> {{cliente.ciudad}}<br>
            <strong>Domicilio:</strong> {{cliente.direccion}}<br>
            <strong>Contacto:</strong> {{cliente.email}}
          </td>
        </tr>
      </table>
      <div class="section-title">2. REFERENCIA CONTRACTUAL Y EXPEDIENTE</div>
      <table class="grid-table">
        <tr>
          <td class="label">Contrato Marco:</td>
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
      <div class="section-title">3. SERVICIOS RECIBIDOS Y CONFORMIDAD</div>
      <div style="font-weight: bold; margin-bottom: 4px; color: #0a2540; font-size: 11px;">Descripción de las Actividades y Servicios Prestados:</div>
      <div class="scope-box">{{contrato.descripcion}}</div>
      <div class="section-title">4. DECLARACIÓN DE CONFORMIDAD Y CIERRE</div>
      <div class="legal-clause">
        El Cliente declara haber recibido a entera satisfacción la totalidad de los servicios técnicos y profesionales descritos precedentemente, prestados de conformidad con los estándares y requerimientos acordados.
      </div>
      <div class="signatures">
        <div class="sig-box">
          <strong>ENTREGADO POR: {{empresa.nombre}}</strong><br>
          <div class="sig-space"></div>
          ____________________________________________<br>
          <strong>{{empresa.representanteLegal}}</strong><br>
          {{empresa.cargoRepresentante}}<br>
          RUT: {{empresa.rut}}
        </div>
        <div class="sig-box">
          <strong>RECEPCIONADO CONFORME POR: {{cliente.nombreLegal}}</strong><br>
          <div class="sig-space"></div>
          ____________________________________________<br>
          <strong>Aprobación y Conformidad Cliente</strong><br>
          RUT: {{cliente.taxId}}
        </div>
      </div>
    </body></html>`
  },
  {
    code: 'TPL-PROPOSAL-NAC',
    name: 'Propuesta Comercial (Mercado Nacional - CLP)',
    category: TemplateCategory.COMMERCIAL_PROPOSAL,
    language: 'ES',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body>
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
          <div class="meta-line"><strong>Fecha:</strong> {{documento.fechaEmision}}</div>
        </div>
      </div>
      <div class="doc-title-container">
        <h1 class="doc-title">{{contrato.titulo}}</h1>
        <div class="doc-subtitle">PROPUESTA TÉCNICA Y ECONÓMICA DE SERVICIOS TI</div>
      </div>
      <div class="section-title">1. DESTINATARIO Y CLIENTE</div>
      <table class="grid-table">
        <tr><td class="label">Cliente:</td><td><strong>{{cliente.nombreLegal}}</strong> (RUT: {{cliente.taxId}})</td><td class="label">Contacto:</td><td>{{cliente.contacto}}</td></tr>
        <tr><td class="label">Email:</td><td>{{cliente.email}}</td><td class="label">Teléfono:</td><td>{{cliente.telefono}}</td></tr>
      </table>
      <div class="section-title">2. ALCANCE DE LA PROPUESTA</div>
      <div class="scope-box">{{contrato.descripcion}}</div>
      <div class="section-title">3. CONDICIONES ECONÓMICAS Y FORMA DE PAGO</div>
      <table class="grid-table">
        <tr><td class="label">Moneda:</td><td><strong>{{contrato.moneda}}</strong></td><td class="label">Total Propuesta:</td><td><strong style="color: #00a896; font-size: 12px;">{{contrato.moneda}} {{contrato.valor}}</strong></td></tr>
        <tr><td class="label">Forma de Pago:</td><td colspan="3"><strong>{{contrato.metodoPago}}</strong></td></tr>
      </table>
      <div class="signatures">
        <div class="sig-box"><strong>PRESENTADO POR: {{empresa.nombre}}</strong><div class="sig-space"></div>______________________________<br>{{empresa.representanteLegal}}</div>
        <div class="sig-box"><strong>ACEPTADO POR: {{cliente.nombreLegal}}</strong><div class="sig-space"></div>______________________________<br>Firma Aprobación Cliente</div>
      </div>
    </body></html>`
  }
];

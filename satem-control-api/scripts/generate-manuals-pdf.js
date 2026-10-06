import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, '../../docs');

const commonStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap');

  :root {
    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
    --font-heading: 'Outfit', sans-serif;
    --bg-primary: #0f172a;
    --bg-surface: #1e293b;
    --bg-card: #1e293b;
    --bg-card-hover: #334155;
    --bg-input: #0f172a;
    --border-color: #334155;
    --border-light: #475569;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --accent-primary: #00a896;
    --accent-primary-hover: #008f80;
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.15);
    --warning: #f59e0b;
    --warning-bg: rgba(245, 158, 11, 0.15);
    --danger: #ef4444;
    --danger-bg: rgba(239, 68, 68, 0.15);
    --info: #3b82f6;
    --info-bg: rgba(59, 130, 246, 0.15);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--font-sans);
    background-color: #ffffff;
    color: #1e293b;
    line-height: 1.6;
    font-size: 13px;
    padding: 0;
  }

  .page-container {
    padding: 30px 40px;
  }

  .cover-page {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #ffffff;
    min-height: 980px;
    padding: 80px 50px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
  }

  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 168, 150, 0.15);
    border: 1px solid rgba(0, 168, 150, 0.4);
    color: #00e0c8;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    width: fit-content;
  }

  .cover-title {
    font-family: var(--font-heading);
    font-size: 38px;
    font-weight: 800;
    line-height: 1.2;
    color: #ffffff;
    margin: 24px 0 16px 0;
  }

  .cover-subtitle {
    font-size: 18px;
    color: #94a3b8;
    max-width: 580px;
    line-height: 1.5;
  }

  .cover-footer {
    border-top: 1px solid #334155;
    padding-top: 24px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #64748b;
  }

  h1, h2, h3, h4 {
    font-family: var(--font-heading);
    color: #0f172a;
    font-weight: 700;
  }

  h2 {
    font-size: 20px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
    margin: 28px 0 16px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 15px;
    margin: 18px 0 10px 0;
    color: #1e293b;
    page-break-after: avoid;
  }

  p { margin-bottom: 12px; color: #334155; }

  ul, ol { margin-left: 20px; margin-bottom: 14px; }
  li { margin-bottom: 6px; color: #334155; }

  code {
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
  }

  .alert-box {
    background: #f8fafc;
    border-left: 4px solid var(--accent-primary);
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 16px 0;
    font-size: 12px;
  }

  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge-success { background: #dcfce7; color: #15803d; }
  .badge-warning { background: #fef3c7; color: #b45309; }
  .badge-info { background: #dbeafe; color: #1d4ed8; }
  .badge-danger { background: #fee2e2; color: #b91c1c; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 12px;
  }

  th {
    background: #0f172a;
    color: #ffffff;
    font-family: var(--font-heading);
    padding: 9px 12px;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 9px 12px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }

  tr:nth-child(even) td { background: #f8fafc; }

  /* UI Window Mockup */
  .ui-window {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 10px;
    overflow: hidden;
    margin: 18px 0 24px 0;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
    page-break-inside: avoid;
  }

  .ui-window-header {
    background: #1e293b;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #334155;
  }

  .ui-window-dots {
    display: flex;
    gap: 6px;
  }

  .ui-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .ui-dot.red { background: #ef4444; }
  .ui-dot.yellow { background: #f59e0b; }
  .ui-dot.green { background: #10b981; }

  .ui-window-url {
    background: #0f172a;
    color: #94a3b8;
    padding: 3px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-family: monospace;
    flex-grow: 1;
    border: 1px solid #334155;
  }

  .ui-window-body {
    padding: 20px;
    color: #f8fafc;
    font-size: 12px;
  }

  .ui-btn-primary {
    background: #00a896;
    color: #ffffff;
    font-weight: 600;
    padding: 7px 14px;
    border-radius: 6px;
    display: inline-block;
    border: none;
    font-size: 11px;
  }

  .ui-btn-secondary {
    background: #334155;
    color: #f8fafc;
    padding: 7px 14px;
    border-radius: 6px;
    display: inline-block;
    border: none;
    font-size: 11px;
  }

  .ui-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 14px;
    margin-bottom: 12px;
  }

  .ui-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .ui-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .ui-kpi-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px;
    text-align: left;
  }
  .ui-kpi-val {
    font-size: 22px;
    font-family: var(--font-heading);
    font-weight: 700;
    color: #00e0c8;
    margin-top: 4px;
  }
  .ui-kpi-lbl {
    font-size: 10px;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 600;
  }

  .page-break {
    page-break-after: always;
  }
`;

const clientManualHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual de Usuario - Portal de Clientes SATEM</title>
  <style>${commonStyles}</style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div>
      <div class="brand-badge">SATEM Soluciones Inteligentes SpA</div>
      <h1 class="cover-title">Manual de Usuario<br>Portal Web de Clientes</h1>
      <p class="cover-subtitle">Guía visual e interactiva para la trazabilidad de servicios, órdenes de trabajo, descarga de informes y firma electrónica de actas.</p>
    </div>
    <div class="cover-footer">
      <div>Plataforma SATEM Control • Portal de Clientes</div>
      <div>Versión Oficial 2026 • app.satemsoluciones.com/portal</div>
    </div>
  </div>

  <div class="page-container">
    <h2>1. Introducción al Portal de Clientes</h2>
    <p>El <strong>Portal de Clientes SATEM</strong> permite a su empresa gestionar en tiempo real la trazabilidad de sus contratos, consultar órdenes de trabajo (OT) ejecutadas en sus sucursales, descargar respaldos oficiales e interactuar mediante firma digital.</p>
    
    <div class="alert-box">
      <strong>Beneficios Clave:</strong> Trazabilidad completa 24/7, eliminación del papel, firma electrónica legalmente válida y descarga de respaldos en paquetes comprimidos <code>.ZIP</code>.
    </div>

    <h2>2. Activación de Cuenta y Primer Acceso</h2>
    <p>Para activar su cuenta, recibirá un correo con un enlace de invitación único:</p>

    <!-- UI MOCKUP: INVITATION ACTIVATION -->
    <div class="ui-window">
      <div class="ui-window-header">
        <div class="ui-window-dots"><div class="ui-dot red"></div><div class="ui-dot yellow"></div><div class="ui-dot green"></div></div>
        <div class="ui-window-url">https://app.satemsoluciones.com/portal/invite/tok_894f29a0c</div>
      </div>
      <div class="ui-window-body">
        <div style="max-width: 420px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 14px;">
            <div style="color: #00e0c8; font-weight: 700; font-size: 16px;">SATEM CONTROL</div>
            <div style="color: #94a3b8; font-size: 11px;">Activación de Cuenta Corporativa • Empresa Minera del Norte SpA</div>
          </div>
          <div style="margin-bottom: 10px;">
            <label style="font-size: 10px; color: #94a3b8;">Correo Corporativo (Solo Lectura)</label>
            <div style="background: #0f172a; padding: 6px 10px; border-radius: 4px; border: 1px solid #334155; color: #cbd5e1; font-size: 11px;">contacto@mineradelnorte.cl</div>
          </div>
          <div style="margin-bottom: 10px;">
            <label style="font-size: 10px; color: #94a3b8;">Nombre Completo (*)</label>
            <div style="background: #0f172a; padding: 6px 10px; border-radius: 4px; border: 1px solid #00a896; color: #f8fafc; font-size: 11px;">Rodrigo Valenzuela Silva</div>
          </div>
          <div style="margin-bottom: 10px;">
            <label style="font-size: 10px; color: #94a3b8;">Teléfono de Contacto</label>
            <div style="background: #0f172a; padding: 6px 10px; border-radius: 4px; border: 1px solid #334155; color: #94a3b8; font-size: 11px;">+56 9 8765 4321</div>
          </div>
          <div style="margin-bottom: 14px;">
            <label style="font-size: 10px; color: #94a3b8;">Defina su Contraseña (*)</label>
            <div style="background: #0f172a; padding: 6px 10px; border-radius: 4px; border: 1px solid #334155; color: #cbd5e1; font-size: 11px;">••••••••••••</div>
          </div>
          <div style="text-align: center;">
            <span class="ui-btn-primary" style="width: 100%; text-align: center;">Activar Cuenta e Ingresar</span>
          </div>
        </div>
      </div>
    </div>

    <h3>Pasos de Activación:</h3>
    <ol>
      <li>Verifique que su correo corporativo y empresa asignada sean correctos.</li>
      <li>Complete su nombre y apellido completo junto a su teléfono móvil directo.</li>
      <li>Ingrese una contraseña segura (mínimo 6 caracteres) y confirme.</li>
      <li>Pulse <strong>"Activar Cuenta e Ingresar"</strong> para acceder al portal.</li>
    </ol>
  </div>

  <div class="page-break"></div>

  <div class="page-container">
    <h2>3. Módulo de Expedientes y Servicios (<code>/portal/expedients</code>)</h2>
    <p>En este panel encontrará el catálogo completo de mantenimientos y servicios ejecutados para su empresa:</p>

    <!-- UI MOCKUP: EXPEDIENTS LIST -->
    <div class="ui-window">
      <div class="ui-window-header">
        <div class="ui-window-dots"><div class="ui-dot red"></div><div class="ui-dot yellow"></div><div class="ui-dot green"></div></div>
        <div class="ui-window-url">https://app.satemsoluciones.com/portal/expedients</div>
      </div>
      <div class="ui-window-body">
        <div style="display: flex; justify-content: space-between; margin-bottom: 14px;">
          <div style="background: #0f172a; border: 1px solid #334155; padding: 6px 12px; border-radius: 6px; width: 60%; color: #94a3b8; font-size: 11px;">🔍 Buscar por código, título o sucursal...</div>
          <div style="background: #0f172a; border: 1px solid #334155; padding: 6px 12px; border-radius: 6px; color: #cbd5e1; font-size: 11px;">Estado: Todos los Estados ▾</div>
        </div>

        <div class="ui-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <span style="color: #00e0c8; font-weight: 700; font-size: 13px;">EXP-2026-0042</span>
              <span class="badge badge-warning" style="margin-left: 8px;">En Progreso</span>
              <div style="font-weight: 600; font-size: 13px; color: #f8fafc; margin-top: 2px;">Mantenimiento Preventivo Data Center y UPS Sucursal Norte</div>
            </div>
            <div>
              <span class="ui-btn-secondary" style="font-size: 10px; margin-right: 6px;">📦 ZIP Completo</span>
              <span class="ui-btn-primary" style="font-size: 10px;">Ver Detalle →</span>
            </div>
          </div>
          <div style="display: flex; gap: 16px; font-size: 11px; color: #94a3b8; border-top: 1px solid #334155; padding-top: 8px; margin-top: 6px;">
            <div>🏢 Sucursal: <strong>Planta Antofagasta</strong></div>
            <div>📅 Inicio: <strong>02/10/2026</strong></div>
            <div>📋 <strong>2 OTs</strong> • 🔧 <strong>4 Atenciones</strong> • 📄 <strong>3 Documentos</strong></div>
          </div>
        </div>

        <div class="ui-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <span style="color: #00e0c8; font-weight: 700; font-size: 13px;">EXP-2026-0038</span>
              <span class="badge badge-success" style="margin-left: 8px;">Completado / Firmado</span>
              <div style="font-weight: 600; font-size: 13px; color: #f8fafc; margin-top: 2px;">Certificación de Red de Fibra Óptica y Enlaces de Respaldo</div>
            </div>
            <div>
              <span class="ui-btn-secondary" style="font-size: 10px; margin-right: 6px;">📦 ZIP Completo</span>
              <span class="ui-btn-primary" style="font-size: 10px;">Ver Detalle →</span>
            </div>
          </div>
          <div style="display: flex; gap: 16px; font-size: 11px; color: #94a3b8; border-top: 1px solid #334155; padding-top: 8px; margin-top: 6px;">
            <div>🏢 Sucursal: <strong>Casa Matriz Santiago</strong></div>
            <div>📅 Cierre: <strong>28/09/2026</strong></div>
            <div>📋 <strong>1 OT</strong> • 🔧 <strong>2 Atenciones</strong> • 📄 <strong>Acta de Conformidad Firmada</strong></div>
          </div>
        </div>
      </div>
    </div>

    <h2>4. Firma Digital de Actas (<code>/portal/signatures</code>)</h2>
    <p>El portal integra un lienzo de firma táctil y con ratón para aprobar actas de servicio sin imprimir papel:</p>

    <!-- UI MOCKUP: DIGITAL SIGNATURE -->
    <div class="ui-window">
      <div class="ui-window-header">
        <div class="ui-window-dots"><div class="ui-dot red"></div><div class="ui-dot yellow"></div><div class="ui-dot green"></div></div>
        <div class="ui-window-url">https://app.satemsoluciones.com/portal/signatures</div>
      </div>
      <div class="ui-window-body">
        <div class="ui-grid-2">
          <div class="ui-card">
            <div style="font-weight: 700; font-size: 12px; color: #cbd5e1; margin-bottom: 10px;">Documentos Pendientes (1)</div>
            <div style="background: #0f172a; border: 1px solid #00a896; border-radius: 6px; padding: 10px; margin-bottom: 8px;">
              <div style="color: #00e0c8; font-weight: 700; font-size: 11px;">DOC-2026-0089</div>
              <div style="color: #f8fafc; font-weight: 600; font-size: 11px;">Acta de Recepción Conforme de Servicio</div>
              <div style="color: #94a3b8; font-size: 10px;">Expediente: EXP-2026-0042 • 05/10/2026</div>
              <div style="margin-top: 6px;"><span class="badge badge-warning">Requiere Firma</span></div>
            </div>
          </div>
          <div class="ui-card">
            <div style="font-weight: 700; font-size: 12px; color: #f8fafc; margin-bottom: 8px;">Lienzo de Firma Manuscrita</div>
            <div style="background: #0f172a; border: 2px dashed #475569; border-radius: 6px; height: 110px; display: flex; align-items: center; justify-content: center; position: relative;">
              <svg width="180" height="60" viewBox="0 0 180 60" style="stroke: #00e0c8; fill: none; stroke-width: 2.5; stroke-linecap: round;">
                <path d="M 20 40 Q 40 10, 60 30 T 90 20 T 130 45 T 160 15" />
              </svg>
              <div style="position: absolute; bottom: 4px; right: 8px; font-size: 9px; color: #64748b;">Lienzo Activo (Táctil / Ratón)</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
              <span class="ui-btn-secondary" style="font-size: 10px;">🧹 Limpiar Trazo</span>
              <span class="ui-btn-primary" style="font-size: 10px;">💾 Confirmar y Firmar Documento</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
`;

const adminManualHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual de Usuario - Administrador SATEM Control</title>
  <style>${commonStyles}</style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div>
      <div class="brand-badge">SATEM Soluciones Inteligentes SpA</div>
      <h1 class="cover-title">Manual de Usuario<br>Administrador SATEM Control</h1>
      <p class="cover-subtitle">Manual operativo integral para administración de clientes, sucursales, wizard de contratos, centro de control en tiempo real, facturación SII, SumUp y conciliación bancaria.</p>
    </div>
    <div class="cover-footer">
      <div>SATEM Control Enterprise • Consola Central</div>
      <div>Versión Oficial 2026 • app.satemsoluciones.com</div>
    </div>
  </div>

  <div class="page-container">
    <h2>1. Matriz de Roles y Permisos (RBAC)</h2>
    <p>SATEM Control implementa segregación de funciones estricta con 5 roles operativos:</p>

    <table>
      <thead>
        <tr>
          <th>Rol</th>
          <th>Código</th>
          <th>Módulos Accesibles</th>
          <th>Responsabilidad</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Administrador</strong></td>
          <td><code>ADMIN</code></td>
          <td>Todos los módulos + Configuración Global</td>
          <td>Supervisión general, seguridad y auditoría</td>
        </tr>
        <tr>
          <td><strong>Operaciones</strong></td>
          <td><code>OPERATIONS</code></td>
          <td>Clientes, Contratos, Expedientes, OTs, Centro Control</td>
          <td>Gestión de servicios y asignación de cuadrillas</td>
        </tr>
        <tr>
          <td><strong>Contabilidad</strong></td>
          <td><code>ACCOUNTING</code></td>
          <td>Facturación SII 110, SumUp, Banco Santander</td>
          <td>Cobranzas, emisión de facturas y conciliación</td>
        </tr>
        <tr>
          <td><strong>Técnico</strong></td>
          <td><code>TECHNICIAN</code></td>
          <td>Atenciones en terreno, OTs asignadas, Actas</td>
          <td>Ejecución de trabajos y registro de horas</td>
        </tr>
        <tr>
          <td><strong>Visualizador</strong></td>
          <td><code>VIEWER</code></td>
          <td>Dashboard y Expedientes (Solo Lectura)</td>
          <td>Auditoría y consulta sin permisos de edición</td>
        </tr>
      </tbody>
    </table>

    <h2>2. Dashboard y Centro de Control en Tiempo Real</h2>
    <p>La consola de inicio proporciona indicadores en vivo del estado de la empresa:</p>

    <!-- UI MOCKUP: ADMIN DASHBOARD -->
    <div class="ui-window">
      <div class="ui-window-header">
        <div class="ui-window-dots"><div class="ui-dot red"></div><div class="ui-dot yellow"></div><div class="ui-dot green"></div></div>
        <div class="ui-window-url">https://app.satemsoluciones.com/</div>
      </div>
      <div class="ui-window-body">
        <div class="ui-grid-4" style="margin-bottom: 16px;">
          <div class="ui-kpi-card">
            <div class="ui-kpi-lbl">Expedientes Abiertos</div>
            <div class="ui-kpi-val">14</div>
          </div>
          <div class="ui-kpi-card">
            <div class="ui-kpi-lbl">Contratos Vigentes</div>
            <div class="ui-kpi-val">28</div>
          </div>
          <div class="ui-kpi-card">
            <div class="ui-kpi-lbl">Facturación Neta USD</div>
            <div class="ui-kpi-val">$84.500</div>
          </div>
          <div class="ui-kpi-card">
            <div class="ui-kpi-lbl">Excepciones Activas</div>
            <div class="ui-kpi-val" style="color: #f59e0b;">3</div>
          </div>
        </div>

        <div class="ui-card">
          <div style="font-weight: 700; font-size: 12px; color: #f8fafc; margin-bottom: 8px;">Centro de Control — Excepciones Operativas Pendientes</div>
          <div style="background: #0f172a; border-left: 4px solid #ef4444; padding: 8px 12px; border-radius: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="badge badge-danger">CRÍTICA</span>
              <strong style="margin-left: 8px; color: #f8fafc;">OT-2026-0091 sin técnico asignado</strong>
              <span style="color: #94a3b8; font-size: 10px; margin-left: 8px;">Expediente: EXP-2026-0042 (Planta Norte)</span>
            </div>
            <span class="ui-btn-primary" style="font-size: 10px;">Asignar Cuadrilla ⚡</span>
          </div>
          <div style="background: #0f172a; border-left: 4px solid #f59e0b; padding: 8px 12px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="badge badge-warning">ALERTA</span>
              <strong style="margin-left: 8px; color: #f8fafc;">Contrato CTR-2026-0012 próximo a vencer (15 días)</strong>
              <span style="color: #94a3b8; font-size: 10px; margin-left: 8px;">Cliente: Minera del Norte SpA</span>
            </div>
            <span class="ui-btn-secondary" style="font-size: 10px;">Renovar Wizard 📝</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <div class="page-container">
    <h2>3. Wizard de Contratos y Bolsas de Horas (<code>/contracts/wizard</code>)</h2>
    <p>El asistente permite parametrizar acuerdos comerciales en 4 pasos con cálculo automático de tarifas y SLA:</p>

    <!-- UI MOCKUP: CONTRACT WIZARD -->
    <div class="ui-window">
      <div class="ui-window-header">
        <div class="ui-window-dots"><div class="ui-dot red"></div><div class="ui-dot yellow"></div><div class="ui-dot green"></div></div>
        <div class="ui-window-url">https://app.satemsoluciones.com/contracts/wizard</div>
      </div>
      <div class="ui-window-body">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 10px;">
          <div style="color: #00e0c8; font-weight: 700; font-size: 11px;">✓ 1. Cliente & Sucursal</div>
          <div style="color: #00e0c8; font-weight: 700; font-size: 11px;">✓ 2. Modalidad de Servicio</div>
          <div style="color: #f8fafc; font-weight: 700; font-size: 11px; border-bottom: 2px solid #00a896;">▶ 3. Parámetros Financieros</div>
          <div style="color: #64748b; font-size: 11px;">4. Resumen y Activación</div>
        </div>

        <div class="ui-grid-2">
          <div class="ui-card">
            <label style="font-size: 10px; color: #94a3b8;">Moneda del Contrato</label>
            <div style="background: #0f172a; padding: 6px 10px; border-radius: 4px; border: 1px solid #334155; color: #cbd5e1; font-size: 11px; margin-bottom: 10px;">USD - Dólar Estadounidense</div>
            
            <label style="font-size: 10px; color: #94a3b8;">Bolsa Mensual de Horas</label>
            <div style="background: #0f172a; padding: 6px 10px; border-radius: 4px; border: 1px solid #00a896; color: #f8fafc; font-size: 11px; margin-bottom: 10px;">40 Horas / Mes</div>
          </div>
          <div class="ui-card">
            <label style="font-size: 10px; color: #94a3b8;">Valor Hora Extra Excedente</label>
            <div style="background: #0f172a; padding: 6px 10px; border-radius: 4px; border: 1px solid #334155; color: #cbd5e1; font-size: 11px; margin-bottom: 10px;">$45.00 USD / Hora</div>

            <label style="font-size: 10px; color: #94a3b8;">Recargo Turno de Emergencia</label>
            <div style="background: #0f172a; padding: 6px 10px; border-radius: 4px; border: 1px solid #334155; color: #cbd5e1; font-size: 11px; margin-bottom: 10px;">50% Sobre Tarifa Base</div>
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
          <span class="ui-btn-secondary" style="font-size: 10px;">← Paso Anterior</span>
          <span class="ui-btn-primary" style="font-size: 10px;">Siguiente: Resumen y Activación →</span>
        </div>
      </div>
    </div>

    <h2>4. Conciliación Bancaria Santander (<code>/bank</code>)</h2>
    <p>Cruce automatizado de extractos bancarios contra facturas emitidas:</p>

    <!-- UI MOCKUP: BANK RECONCILIATION -->
    <div class="ui-window">
      <div class="ui-window-header">
        <div class="ui-window-dots"><div class="ui-dot red"></div><div class="ui-dot yellow"></div><div class="ui-dot green"></div></div>
        <div class="ui-window-url">https://app.satemsoluciones.com/bank</div>
      </div>
      <div class="ui-window-body">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div><strong style="color: #f8fafc;">Extracto Bancario Santander (Octubre 2026)</strong></div>
          <span class="ui-btn-primary" style="font-size: 10px;">📤 Cargar Cartola (.xlsx / .csv)</span>
        </div>

        <div class="ui-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="badge badge-success">MATCH EXACTO 100%</span>
              <span style="color: #00e0c8; font-weight: 700; font-size: 12px; margin-left: 8px;">+$1.450.000 CLP</span>
              <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">04/10/2026 • Transf. 893422 - EMPRESA MINERA DEL NORTE SPA (RUT: 76.123.456-K)</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #cbd5e1;">Factura: <strong>FAC-2026-0045</strong></div>
              <span class="ui-btn-primary" style="font-size: 10px; margin-top: 4px;">⚡ Conciliar Factura</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
`;

async function main() {
  console.log('🚀 Iniciando generación de Manuales de Usuario en formato PDF...');
  
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    // 1. GENERATE MANUAL PORTAL CLIENTE
    console.log('📄 Generando docs/MANUAL_PORTAL_CLIENTE.pdf...');
    const pageClient = await browser.newPage();
    await pageClient.setContent(clientManualHtml, { waitUntil: 'networkidle0' });
    const clientPdfPath = path.join(DOCS_DIR, 'MANUAL_PORTAL_CLIENTE.pdf');
    await pageClient.pdf({
      path: clientPdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
      displayHeaderFooter: false
    });
    console.log('✅ Creado:', clientPdfPath);

    // 2. GENERATE MANUAL ADMINISTRADOR
    console.log('📄 Generando docs/MANUAL_ADMINISTRADOR.pdf...');
    const pageAdmin = await browser.newPage();
    await pageAdmin.setContent(adminManualHtml, { waitUntil: 'networkidle0' });
    const adminPdfPath = path.join(DOCS_DIR, 'MANUAL_ADMINISTRADOR.pdf');
    await pageAdmin.pdf({
      path: adminPdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
      displayHeaderFooter: false
    });
    console.log('✅ Creado:', adminPdfPath);

    console.log('🎉 Ambos manuales PDF generados exitosamente con alta resolución y capturas visuales.');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌ Error generando manuales PDF:', err);
  process.exit(1);
});

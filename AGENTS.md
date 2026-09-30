# SATEM Agent Guide & Technical Standard (AGENTS.md)

Este documento es la **guía maestra de arquitectura, estándares de diseño, reglas de integridad y protocolos de desarrollo** para los proyectos del ecosistema **SATEM** (SATEM Soluciones Inteligentes SpA). 

Todo agente de IA, desarrollador o automatización que trabaje en esta base de código o proyectos derivados debe seguir estrictamente estos lineamientos para garantizar que **ningún cambio nuevo rompa la funcionalidad existente** y que **todas las interfaces mantengan la misma calidad estética, responsividad y coherencia visual**.

---

## 1. Stack Tecnológico Oficial

| Capa | Tecnologías | Estándares Clave |
| :--- | :--- | :--- |
| **Frontend** | React 18+, TypeScript, Vite | Vanilla CSS / CSS Variables (Sin Tailwind salvo solicitud explícita), Lucide React (iconos), Axios |
| **Backend** | Node.js (v20+ ESM), Fastify, TypeScript | Prisma ORM, Zod (validaciones), BcryptJS, Archiver, Puppeteer |
| **Base de Datos** | MySQL 8.0 InnoDB | Claves foráneas consistentes, UUIDs en IDs, `utf8mb4_unicode_ci` |
| **Despliegue / DevOps**| Docker, Docker Compose, EasyPanel | Migraciones automáticas idempotentes, volúmenes aislados para persistencia |

---

## 2. Sistema de Diseño SATEM (Design System Tokens)

Todos los proyectos SATEM deben compartir la misma paleta de colores oscuros (*Dark Mode Premium*), tipografía y componentes base definidos en CSS Variables.

### A. Paleta de Colores Oficial

```css
:root {
  /* Tipografías */
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-heading: 'Outfit', sans-serif;

  /* Fondos y Superficies */
  --bg-primary: #0f172a;       /* Slate 900 - Fondo principal de la app */
  --bg-surface: #1e293b;       /* Slate 800 - Fondo de tarjetas y paneles */
  --bg-card: #1e293b;          /* Contenedores de contenido */
  --bg-card-hover: #334155;    /* Hover en tarjetas y elementos interactivos */
  --bg-input: #0f172a;         /* Inputs y selects */
  --bg-overlay: rgba(15, 23, 42, 0.85); /* Fondos de modales con blur */

  /* Bordes */
  --border-color: #334155;     /* Borde estándar */
  --border-light: #475569;     /* Borde sutil / hover */

  /* Textos */
  --text-primary: #f8fafc;     /* Blanco suave - Títulos y textos principales */
  --text-secondary: #94a3b8;   /* Gris claro - Descripciones y etiquetas */
  --text-muted: #64748b;       /* Gris medio - Metadatos y notas secundarias */

  /* Colores de Acento SATEM */
  --accent-primary: #00a896;   /* Verde Azulado SATEM (Brand Principal) */
  --accent-primary-hover: #008f80;
  --accent-glow: rgba(0, 168, 150, 0.25);

  /* Estados y Alertas Semánticas */
  --success: #10b981;          /* Verde Éxito / Firmado / Pagado */
  --success-bg: rgba(16, 185, 129, 0.15);
  --warning: #f59e0b;          /* Ámbar Alerta / Pendiente / Excepción */
  --warning-bg: rgba(245, 158, 11, 0.15);
  --danger: #ef4444;           /* Rojo Error / Crítico / Rechazado */
  --danger-bg: rgba(239, 68, 68, 0.15);
  --info: #3b82f6;             /* Azul Información / En Proceso */
  --info-bg: rgba(59, 130, 246, 0.15);

  /* Radios de Curvatura */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* Sombras y Elevación */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
}
```

### B. Tipografía y Jerarquía
- **Headings (`h1`, `h2`, `h3`):** Utilizan obligatoriamente `--font-heading: 'Outfit'` con `clamp()` para escalado fluido responsivo:
  ```css
  h1 { font-family: var(--font-heading); font-size: clamp(1.35rem, 3.5vw, 1.65rem); font-weight: 700; }
  h2 { font-family: var(--font-heading); font-size: clamp(1.2rem, 2.8vw, 1.45rem); font-weight: 700; }
  h3 { font-family: var(--font-heading); font-size: clamp(1.05rem, 2.2vw, 1.2rem); font-weight: 700; }
  ```
- **Cuerpo y Datos:** Utilizan `--font-sans: 'Inter'` para máxima legibilidad de números, hashes y tablas de auditoría.

---

## 3. Reglas de Componentes y UI Responsiva

### A. Modales Estándar SATEM
Todo modal nuevo debe seguir esta estructura exacta:
```tsx
{showModal && (
  <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)' }}>
    <div className="modal-dialog" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={20} color="var(--accent-primary)" /> Título del Modal
        </h3>
        <button onClick={() => setShowModal(false)} className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        {/* Campos en rejilla responsiva */}
        <div className="grid-form-2">
          {/* form-group */}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
          <button type="submit" className="btn btn-primary">Guardar Cambios</button>
        </div>
      </form>
    </div>
  </div>
)}
```

### B. Botones y Badges Oficiales
- **`.btn-primary`:** Fondo `--accent-primary` (#00a896), texto blanco, hover con oscurecimiento y elevación.
- **`.btn-secondary`:** Fondo `--bg-surface`, borde `--border-color`, texto `--text-primary`.
- **`.btn-danger`:** Fondo `rgba(239, 68, 68, 0.15)`, borde `rgba(239, 68, 68, 0.3)`, texto `#f87171`.
- **Badges:** Siempre con clase semántica `.badge .badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`.

### C. Reglas Obligatorias de Responsividad
1. **Contenedores de Botones y Filtros:** Usar siempre `display: flex; flex-wrap: wrap; gap: 8px;` para evitar desbordes en pantallas pequeñas.
2. **Rejillas Adaptables:** Usar `display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;`.
3. **Tablas de Datos:** Envolver siempre las etiquetas `<table>` en un contenedor con `overflow-x: auto;` y `width: 100%;`.

---

## 4. Reglas Críticas de Integridad y Backend (No-Break Rules)

Para garantizar que ningún despliegue rompa producción:

### A. Borrado Lógico (Soft Delete)
- **Regla:** En las entidades principales (`Expedient`, `Contract`, `Invoice`, `Payment`, `WorkOrder`, `Attention`, `Customer`), el borrado debe ser lógico (`deletedAt = new Date()`).
- **Consultas & Agregaciones:** TODAS las consultas `findMany`, `count`, `aggregate` y dashboards **deben** incluir `{ where: { deletedAt: null } }`.

### B. Carga Modular de Relaciones (Evitar Colapsos 500)
- Al consultar grafos relacionales profundos (por ejemplo, `Expediente -> OTs -> Atenciones -> Técnicos`), no anidar demasiados `include` en una sola consulta SQL rígida.
- Consultar la entidad raíz y cargar las relaciones secundarias en bloques protegidos con `try/catch` individual para que una inconsistencia en una tabla hija nunca rompa la respuesta principal.

### C. Autenticación y Auto-Bootstrap
- Algoritmo de contraseñas: `bcryptjs` con costo de **10 rondas**.
- Los emails de usuario deben procesarse siempre en **minúsculas**: `email.toLowerCase().trim()`.
- **Garantía de Administrador:** En el inicio del servidor (`server.ts`), llamar siempre al helper `ensureDefaultAdmin()` para que si la base de datos se migra o se levanta limpia, el usuario administrador oficial (`admin@satemsoluciones.com` / `admin@123`) se cree o reactive automáticamente sin intervención manual.

### D. Manejo Idempotente de Migraciones MySQL
- En MySQL, las sentencias DDL como `DROP TABLE` o eliminación de claves foráneas deben ejecutarse con `SET FOREIGN_KEY_CHECKS = 0;` en scripts SQL de migración.
- El script de arranque en Docker debe utilizar el runner de auto-reparación ([`scripts/migrate.js`](file:///d:/Dev/satem-control/satem-control-api/scripts/migrate.js)) que limpia bloqueos de migraciones previas antes de invocar `prisma migrate deploy`.

### E. Serialización de BigInt
- `BigInt` (usado en tamaños de archivos de `Document.fileSize`) debe contar con soporte de serialización global en el bootstrap:
  ```ts
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
  ```

---

## 5. Protocolo de Validación Antes de Cada Commit / Despliegue

Antes de dar por completado un cambio o solicitar redespliegue:

1. **Compilación Backend:**
   ```bash
   cd satem-control-api
   npm run build  # (debe ejecutar npx prisma generate && tsc -p tsconfig.build.json con 0 errores)
   ```
2. **Compilación Frontend:**
   ```bash
   cd satem-control-web
   npm run build  # (debe ejecutar tsc && vite build con 0 errores)
   ```
3. **Validación de Rutas:**
   - Asegurar que todo endpoint nuevo en backend esté registrado en `server.ts` con su prefijo `/api/v1/...`.
   - Asegurar que en el frontend el cliente `api` (`src/services/api.ts`) capture errores y los exponga visualmente mediante mensajes descriptivos y banners de reintento.

---

*SATEM Soluciones Inteligentes SpA — Guía de Arquitectura e Integridad Continua.*

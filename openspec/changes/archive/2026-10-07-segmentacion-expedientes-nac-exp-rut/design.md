# Design: Segmentación de Expedientes NAC / EXP y Estandarización de RUT

## Context

SATEM Control gestiona expedientes, contratos, órdenes de trabajo y facturación tanto para el mercado chileno como para exportación.
Actualmente:
- El generador de correlativos numéricos (`sequence.ts`) sólo manejaba `'EXP'` para expedientes.
- La tabla MySQL `sequences` utiliza una clave primaria compuesta `(prefix, year)`, lo que permite añadir `'NAC'` de forma transparente y sin migraciones DDL.
- El menú lateral (`AppLayout.tsx`) contenía una sola entrada genérica "Expedientes" (`/expedients`).
- Las plantillas y pantallas administrativas exhibían etiquetas "Tax ID" o "Tax ID / RUT" aún cuando el cliente era chileno.

Ver `proposal.md` y `specs/` para detalles de requerimientos y casos de uso.

## Goals / Non-Goals

**Goals:**
- Soportar el prefijo `'NAC'` para expedientes nacionales generando correlativos atómicos `NAC-YYYY-NNNNNN`, manteniendo `EXP-YYYY-NNNNNN` para exportación.
- Detección automática del prefijo al crear expedientes manuales o derivados de contratos (evaluando `taxTreatment` y `countryCode` del cliente).
- Filtrado en endpoint `GET /api/v1/expedients?market=NAC|EXP`.
- Separar la navegación interna en dos ítems del menú lateral: "Expedientes NAC" (arriba) y "Expedientes EXP" (abajo).
- Parametrizar `ExpedientsPage.tsx` para responder a la ruta `/expedients/nac` y `/expedients/exp`.
- Reemplazar "Tax ID" por "RUT" en todas las plantillas nacionales (`TPL-*-NAC`), variables inyectadas y componentes UI para clientes chilenos.
- Mantener inalterado el portal de clientes (`/portal`).

**Non-Goals:**
- No modificar el esquema de base de datos relacional (no requiere cambios DDL ni migraciones destructivas).
- No renombrar los códigos de expedientes históricos ya emitidos en producción.
- No alterar la experiencia ni navegación del portal de clientes (`/portal`).

## Decisions

### 1. Prefijo de Secuencia 'NAC' en Base de Datos
- **Decisión:** Extender `SequencePrefix` en `sequence.ts` incorporando `'NAC'`.
- **Razón:** La tabla `sequences` almacena `prefix VARCHAR(10)` y `year INT`. Al llamar `generateSequence(tx, 'NAC')`, MySQL creará e incrementará atómicamente el registro `('NAC', 2026)` sin colisionar con `('EXP', 2026)`.
- **Alternativas consideradas:**
  - *Prefijos dinámicos arbitrarios:* Descartado para mantener tipado estricto en TypeScript.
  - *Tabla separada de secuencias nacionales:* Descartado por ser redundante.

### 2. Criterio de Selección Automática de Prefijo (NAC vs EXP)
- **Decisión:**
  - Si el tratamiento tributario es `EXPORT_SERVICE` o el cliente no pertenece a Chile (`countryCode !== 'CL' && countryCode !== 'CHL'`), se asigna `'EXP'`.
  - Si el tratamiento es `VAT_APPLIED`, `VAT_EXEMPT` o el cliente pertenece a Chile (`CL` / `CHL`), se asigna `'NAC'`.
- **Razón:** Garantiza que tanto la creación manual en `expedients.controller.ts` como la auto-creación en `contracts.controller.ts` asignen coherentemente el prefijo correspondiente.

### 3. Filtrado en API REST (`GET /api/v1/expedients`)
- **Decisión:** Soportar query param `market` (`NAC` o `EXP`). Si `market === 'NAC'`, se filtra con `code: { startsWith: 'NAC-' }`. Si `market === 'EXP'`, se filtra con `code: { startsWith: 'EXP-' }`. En ausencia de parámetro, se retornan todos (para vistas consolidadas o portal).
- **Razón:** Máxima eficiencia indexada en MySQL sin sobrecargar el payload ni duplicar endpoints.

### 4. Estructura de Navegación y Rutas Frontend
- **Decisión:**
  - En `AppLayout.tsx`:
    ```tsx
    <NavLink to="/expedients/nac" ...><FolderKanban /> Expedientes NAC</NavLink>
    <NavLink to="/expedients/exp" ...><FolderKanban /> Expedientes EXP</NavLink>
    ```
    Colocando "Expedientes NAC" inmediatamente arriba de "Expedientes EXP".
  - En `App.tsx`:
    - Ruta `/expedients/nac` renderiza `<ExpedientsPage market="NAC" />`.
    - Ruta `/expedients/exp` renderiza `<ExpedientsPage market="EXP" />`.
    - Ruta `/expedients` redirige con `<Navigate to="/expedients/nac" replace />`.
- **Razón:** Cumple exactamente el orden solicitado por el usuario manteniendo navegación limpia por URL y retrocompatibilidad ante marcadores guardados.

### 5. Inyección de Variables y Plantillas Nacionales con RUT
- **Decisión:**
  - En `document-instances.controller.ts`, enriquecer el objeto `cliente`:
    - `cliente.taxIdLabel`: `"RUT"` si el cliente es chileno, `"Tax ID"` si es extranjero.
    - `cliente.rut`: alias directo a `cliente.taxId`.
  - En `bootstrap-templates.ts`: modificar las plantillas nacionales predeterminadas (`TPL-CONTRACT-NAC`, `TPL-WORK-ORDER-NAC`, `TPL-RECEPTION-NAC`, `TPL-PROPOSAL-NAC`) para utilizar explícitamente "RUT: {{cliente.taxId}}".
  - En `ExpedientsPage.tsx` y `CustomersPage.tsx`: desplegar condicionalmente "RUT" cuando el país sea Chile.

## Risks / Trade-offs

- **[Riesgo]** Expedientes nacionales antiguos que fueron creados con código `EXP-2026-...` antes de esta segmentación.
  → **Mitigación:** En la consulta con `market=NAC`, filtrar por `code: { startsWith: 'NAC-' }`, o alternativamente incluir expedientes con `taxTreatment in ['VAT_APPLIED', 'VAT_EXEMPT']` si no tienen prefijo `NAC-`, garantizando que expedientes existentes no queden huérfanos.
- **[Riesgo]** Acceso directo a la URL anterior `/expedients`.
  → **Mitigación:** Redirigir automáticamente `/expedients` a `/expedients/nac` en `App.tsx`.
- **[Riesgo]** Confusión en clientes del portal externo.
  → **Mitigación:** El portal externo permanece unificado en `/portal/expedients` sin cambios.

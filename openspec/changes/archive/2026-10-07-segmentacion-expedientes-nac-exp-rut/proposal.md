# Proposal: Segmentación de Expedientes NAC / EXP y Estandarización de RUT Nacional

## Why

SATEM opera de forma simultánea en dos mercados con marcos tributarios, cambiarios y operativos distintos:
1. **Mercado Nacional (Chile):** Opera en Pesos Chilenos (CLP), tributación con IVA o exención local según DTE (33/34), transferencias bancarias locales y documentación legal bajo normativa chilena donde la identificación tributaria es inequívocamente el **RUT** (Rol Único Tributario) y no un "Tax ID" anglosajón.
2. **Mercado Internacional (Exportación):** Opera en Dólares (USD), amparado en el Art. 12 E del DL 825 (exportación de servicios), contratos bilingües / Statement of Work (SOW), identificador fiscal genérico (Tax ID / EIN / VAT Number) y pasarelas transfronterizas.

Actualmente:
- Los documentos de clientes nacionales aún exhiben etiquetas genéricas como "Tax ID / RUT" o "Tax ID:", lo cual genera confusión e informalidad ante clientes y contabilidad local en Chile.
- Todos los expedientes se numeraban bajo el prefijo único `EXP-YYYY-NNNNNN` independientemente de si la operación era nacional o internacional.
- En la interfaz interna de administración, los expedientes nacionales e internacionales se encuentran mezclados en una sola vista ("Expedientes"), dificultando el seguimiento de órdenes de trabajo, facturación DTE y contratos locales frente a los contratos de exportación.

Esta propuesta estandariza el identificador tributario chileno como "RUT" en todos los documentos y vistas pertinentes, formaliza la correlación de códigos `NAC-YYYY-NNNNNN` (para nacional) frente a `EXP-YYYY-NNNNNN` (para exportación), y segmenta el panel de administración en dos vistas dedicadas ("Expedientes NAC" y "Expedientes EXP") para todos los roles internos de SATEM, preservando la vista unificada en el portal de clientes.

## What Changes

1. **Estandarización de Identificador Tributario (Tax ID -> RUT para clientes nacionales):**
   - En todos los documentos generados (contratos de prestación de servicios `TPL-CONTRACT-NAC`, órdenes de trabajo `TPL-WORK-ORDER-NAC`, actas de recepción `TPL-RECEPTION-NAC`, cotizaciones `TPL-PROPOSAL-NAC`), reemplazar la etiqueta "Tax ID", "Tax ID / RUT" o "Tax ID / RUT / EIN" por **"RUT"** cuando el cliente sea nacional (código de país `CL` / `CHL` o tratamiento tributario local).
   - Inyectar en el motor de variables de plantillas (`document-instances.controller.ts`) la variable `cliente.taxIdLabel` (que resuelve dinámicamente a `"RUT"` para Chile y `"Tax ID"` para otros países) y `cliente.rut`, garantizando retrocompatibilidad y consistencia.
   - En las vistas administrativas de expedientes y clientes donde se presentan datos de empresas nacionales, desplegar "RUT" en lugar de "Tax ID".

2. **Diferenciación de Código de Expediente (`NAC` vs `EXP`):**
   - Incorporar el prefijo `'NAC'` en el generador atómico transaccional de secuencias (`SequencePrefix` en `sequence.ts`).
   - Mantener la estructura `EXP-YYYY-NNNNNN` (ej. `EXP-2026-000001`) para expedientes de exportación / internacionales.
   - Implementar la estructura `NAC-YYYY-NNNNNN` (ej. `NAC-2026-000001`) para expedientes del mercado nacional, originados manual o automáticamente (desde contratos en CLP o con clientes chilenos).
   - Cada prefijo (`NAC` y `EXP`) mantendrá su propio contador independiente anual en la tabla `sequences`.

3. **Separación de Vistas y Menú Lateral en Administración SATEM:**
   - En el menú lateral izquierdo (`AppLayout.tsx`) para todos los roles de usuario SATEM (`ADMIN`, `OPERATIONS`, `ACCOUNTING`, `TECHNICIAN`, `VIEWER`):
     - Mantener el ítem actual pero renombrarlo a **"Expedientes EXP"** (enlace a `/expedients/exp`), mostrando exclusivamente expedientes internacionales.
     - Crear un nuevo ítem inmediatamente encima llamado **"Expedientes NAC"** (enlace a `/expedients/nac`), mostrando exclusivamente expedientes nacionales.
   - La página de expedientes (`ExpedientsPage.tsx`) aceptará el filtro de mercado (`market: 'NAC' | 'EXP'`), adaptando su título ("Expedientes Nacionales (NAC)" vs "Expedientes de Exportación (EXP)") y realizando la consulta al backend con el filtro correspondiente.
   - En el backend (`expedients.controller.ts`), soportar el parámetro de consulta `market=NAC` o `market=EXP` para filtrar por prefijo de código (`NAC-%` vs `EXP-%`) o tratamiento tributario.
   - **Regla estricta:** El portal de clientes (`/portal`) se mantendrá intacto, con su vista unificada actual de expedientes asociados al cliente autenticado.

## Capabilities

### New Capabilities
- `segmentacion-expedientes-nac-exp`: Diferenciación en el backend y frontend de expedientes nacionales (`NAC-YYYY-NNNNNN`) versus expedientes de exportación (`EXP-YYYY-NNNNNN`), segmentación de ítems del menú lateral administrativo ("Expedientes NAC" encima de "Expedientes EXP"), y soporte de filtrado transaccional por mercado.

### Modified Capabilities
- `plantillas-documentales-nacionales`: Modificación de requisitos para exigir que toda plantilla documental nacional o cliente con residencia fiscal en Chile rotule su identificación tributaria exclusivamente como "RUT" y no "Tax ID".

## Impact

- **Backend (`satem-control-api`):**
  - `src/common/utils/sequence.ts`: adición de `'NAC'` a `SequencePrefix`.
  - `src/modules/expedients/expedients.controller.ts`: asignación automática de prefijo `NAC` o `EXP` en creación de expedientes según cliente / tratamiento tributario, y soporte de query param `market` en listado `getExpedientsHandler`.
  - `src/modules/contracts/contracts.controller.ts`: generación de expediente asociado con prefijo `NAC` para contratos nacionales y `EXP` para contratos de exportación.
  - `src/modules/document-instances/document-instances.controller.ts`: enriquecimiento de variables de cliente (`taxIdLabel`, `rut`).
  - `src/common/utils/bootstrap-templates.ts`: ajuste de plantillas nacionales predeterminadas (`TPL-*-NAC`) para usar "RUT:" en lugar de "Tax ID:".
- **Frontend (`satem-control-web`):**
  - `src/layouts/AppLayout.tsx`: menú lateral con "Expedientes NAC" encima de "Expedientes EXP".
  - `src/App.tsx`: definición de rutas `/expedients/nac` y `/expedients/exp`, con redirección suave desde `/expedients`.
  - `src/pages/ExpedientsPage.tsx`: recepción de prop/parámetro de mercado, consumo de API con filtro `market`, y visualización de etiquetas ("RUT" para clientes chilenos).
  - Portal de clientes (`/portal`, `PortalLayout.tsx`, `PortalExpedientsPage.tsx`): sin alteraciones.
- **Base de Datos:**
  - No requiere migraciones destructivas ni cambios de esquema en Prisma. Las secuencias se auto-registran en la tabla `sequences` en el primer uso mediante `generateSequence`.

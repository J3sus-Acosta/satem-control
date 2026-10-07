# Tasks: Segmentación de Expedientes NAC / EXP y Estandarización de RUT

## 1. Backend Core & Correlativos NAC / EXP

- [x] 1.1 Extender `SequencePrefix` en `src/common/utils/sequence.ts` incorporando `'NAC'` y verificar que el tipado compile sin errores.
- [x] 1.2 Actualizar `createExpedientHandler` en `src/modules/expedients/expedients.controller.ts` para determinar el prefijo (`NAC` o `EXP`) según el cliente (`countryCode === 'CL'`) y tratamiento tributario (`EXPORT_SERVICE` vs `VAT_APPLIED`/`VAT_EXEMPT`).
- [x] 1.3 Actualizar la creación automática de expedientes en `src/modules/contracts/contracts.controller.ts` para invocar `generateSequence(tx, isNational ? 'NAC' : 'EXP')` y verificar que contratos en CLP generen código `NAC-YYYY-NNNNNN`.
- [x] 1.4 Incorporar soporte para el parámetro de consulta `market` (`NAC` | `EXP`) en `getExpedientsHandler` (`src/modules/expedients/expedients.controller.ts`), filtrando registros con `code: { startsWith: 'NAC-' }` o `code: { startsWith: 'EXP-' }`.

## 2. Motor Documental y Estandarización de RUT

- [x] 2.1 Enriquecer el inyector de variables en `src/modules/document-instances/document-instances.controller.ts` añadiendo `cliente.taxIdLabel` ("RUT" para clientes de Chile, "Tax ID" para otros) y `cliente.rut`.
- [x] 2.2 Actualizar las plantillas maestras nacionales (`TPL-CONTRACT-NAC`, `TPL-WORK-ORDER-NAC`, `TPL-RECEPTION-NAC`, `TPL-PROPOSAL-NAC`) en `src/common/utils/bootstrap-templates.ts` para exhibir exclusivamente "RUT: {{cliente.taxId}}" u omitir cualquier referencia anglosajona a "Tax ID".
- [x] 2.3 Actualizar `ExpedientsPage.tsx` y `CustomersPage.tsx` para presentar dinámicamente "RUT" en lugar de "Tax ID" cuando la entidad o cliente pertenezca a Chile.

## 3. Navegación, Menú Lateral y Separación en Frontend

- [x] 3.1 Actualizar el menú lateral en `src/layouts/AppLayout.tsx` añadiendo el ítem "Expedientes NAC" (`/expedients/nac`) directamente arriba de "Expedientes EXP" (`/expedients/exp`) para todos los roles de usuario SATEM.
- [x] 3.2 Modificar `src/App.tsx` para registrar las rutas `/expedients/nac` y `/expedients/exp` dirigidas a `ExpedientsPage`, añadiendo redirección desde `/expedients` hacia `/expedients/nac`.
- [x] 3.3 Adaptar `src/pages/ExpedientsPage.tsx` para recibir la propiedad o ruta `market` ('NAC' | 'EXP'), ajustar el encabezado ("Expedientes Nacionales (NAC)" vs "Expedientes de Exportación (EXP)"), y enviar `market` como filtro a la API.
- [x] 3.4 Verificar que el portal de clientes (`/portal`, `PortalLayout.tsx`, `PortalExpedientsPage.tsx`) se mantenga sin cambios y conserve su vista consolidada.

## 4. Validación de Compilación e Integración

- [x] 4.1 Ejecutar `npm run build` en `satem-control-api` y verificar 0 errores TypeScript y Prisma.
- [x] 4.2 Ejecutar `npm run build` en `satem-control-web` y verificar 0 errores TypeScript y Vite.

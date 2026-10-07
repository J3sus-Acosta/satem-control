# Tasks

## 1. Backend: Métricas de Dashboard Multimoneda

- [x] 1.1 Actualizar `dashboard.controller.ts` para agregar y discriminar `totalNetInvoicedCLP`, `totalNetInvoicedUSD`, `totalVatCLP` y conteos de facturas por régimen tributario (Nacional vs Exportación), y verificar mediante curl o llamada GET a `/api/v1/dashboard`.
- [x] 1.2 Incorporar tests unitarios o script de verificación para validar que las facturas en CLP y USD no se sumen en un mismo total neto ni se distorsionen por tipos de cambio en `satem-control-api/src/modules/dashboard`.

## 2. Backend: Facturación Nacional, DTEs (33/34) e Integración Bancaria

- [x] 2.1 Extender `invoices.controller.ts` y sus esquemas Zod para soportar creación y upload de facturas en CLP con `siiDocType` 33 (afecta a IVA 19%) y 34 (exenta de IVA), calculando y persistiendo `vatAmount` y `totalAmount` coherentes.
- [x] 2.2 Ajustar `contracts.controller.ts` para detectar cuando un cliente pertenece a Chile (`countryCode == 'CL'`) y sugerir/asignar moneda `CLP` y tratamiento tributario nacional predeterminado al crear el expediente.
- [x] 2.3 Permitir en `payments.controller.ts` el registro de pagos con método "Transferencia Bancaria Santander" o "Transferencia Electrónica" en CLP sin exigir SumUp ni recalcular comisiones de pasarela.
- [x] 2.4 Actualizar la regla del checklist del expediente (`ExpedientIntegrityItem`) para que el item financiero se marque completado tanto si se adjunta comprobante de transferencia como si se concilia directamente contra la cartola Santander.

## 3. Backend: Plantillas Oficiales Nacionales en Español y Generador Documental

- [x] 3.1 Agregar las plantillas institucionales oficiales en español (`TPL-CONTRACT-NAC`, `TPL-WORK-ORDER-NAC`, `TPL-RECEPTION-NAC`, `TPL-PROPOSAL-NAC`) en `bootstrap-templates.ts` con redacción 100% en español y sin cláusulas de exportación.
- [x] 3.2 Modificar `bootstrap.ts` para auto-crear y sincronizar las plantillas nacionales en el arranque del servidor de forma idempotente.
- [x] 3.3 Modificar `document-instances.controller.ts` para suprimir el bloque de tipo de cambio / Dólar Observado y cláusulas de exportación cuando la moneda del contrato/expediente sea `CLP`, formateando valores monetarios en pesos chilenos (`$XX.XXX.XXX CLP`).

## 4. Frontend: Dashboard KPI de Facturación Neta en CLP

- [x] 4.1 Actualizar `DashboardPage.tsx` para agregar la tarjeta KPI "Facturación Neta (CLP)" con icono, valor formateado en pesos chilenos y navegación hacia `/billing`.
- [x] 4.2 Reorganizar la cuadrícula de KPIs en `DashboardPage.tsx` con estilos adaptables del SATEM Design System (`grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`) para garantizar óptima visualización en escritorio, tablet y móvil.
- [x] 4.3 Actualizar el bloque de "Resumen Tributario" en `DashboardPage.tsx` para reflejar la distribución de facturas nacionales (DTE 33/34) y de exportación (DTE 110).

## 5. Frontend: Módulos de Facturación y Asistente de Contratos

- [x] 5.1 Modificar `BillingPage.tsx` para incluir selector de moneda (CLP / USD), tipo de DTE (Factura Afecta DTE 33, Factura Exenta DTE 34, Factura Exportación DTE 110), cálculo automático del 19% de IVA, y condicionar la visibilidad de la calculadora SumUp sólo cuando se seleccione USD o pasarela.
- [x] 5.2 Modificar `ContractWizardPage.tsx` para detectar si el cliente seleccionado es de Chile y preseleccionar moneda `CLP`, términos de pago por transferencia bancaria Santander y plantilla nacional en español, manteniendo la opción de edición manual.
- [x] 5.3 Asegurar que en `ExpedientsPage.tsx` los montos se muestren con el símbolo y formato de la moneda respectiva (`CLP` o `USD`) según corresponda a cada factura o contrato.

## 6. Validación de Compilación, Integridad y Despliegue

- [x] 6.1 Compilar el backend con `npm run build` en `satem-control-api` y verificar 0 errores de TypeScript y Prisma.
- [x] 6.2 Compilar el frontend con `npm run build` en `satem-control-web` y verificar 0 errores de TypeScript y Vite.
- [x] 6.3 Ejecutar verificación end-to-end de creación de un contrato nacional en CLP, generación de documento en español, registro de factura SII DTE 33 con IVA, y reflejo de la facturación neta en CLP en el Dashboard.

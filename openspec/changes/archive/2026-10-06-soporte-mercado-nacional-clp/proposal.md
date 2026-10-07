# Proposal

## Why

El sistema SATEM Control fue originalmente concebido y configurado para operaciones de exportación de servicios tecnológicos, con valores expresados en dólares estadounidenses (USD), documentos bilingües (ES/EN) con cláusulas de exención de IVA (Art. 12 E N° 7 DL 825), pagos procesados a través de pasarelas como SumUp con cálculo de comisiones, y liquidaciones asociadas al Dólar Observado del Banco Central de Chile.

Sin embargo, SATEM SpA también atiende activamente el **mercado nacional chileno**, cuyas operaciones tienen características comerciales, tributarias y operativas muy diferentes:
1. **Moneda y tributación local**: Las transacciones se pactan y facturan directamente en Pesos Chilenos (CLP), sin necesidad de conversión de divisas ni tipos de cambio diarios. Las facturas son electrónicas locales ante el SII (DTE 33 afecto con 19% de IVA o DTE 34 no afecto/exento), requiriendo el cálculo y desglose adecuado de Neto, IVA y Total.
2. **Medios de pago directos**: Los clientes nacionales pagan mayoritariamente mediante **transferencia electrónica directa a la cuenta corriente de Banco Santander Chile**, prescindiendo de comisiones y enlaces de SumUp.
3. **Documentación íntegramente en español**: Los contratos de servicios, órdenes de trabajo, actas de recepción conforme y propuestas comerciales no requieren redacción bilingüe ni referencias a exportación de servicios, sino un marco contractual formal adaptado a la legislación y práctica chilena en idioma español.
4. **Visibilidad financiera global**: En la pantalla principal (Dashboard), la administración necesita monitorear claramente tanto la **Facturación Neta en CLP** como la **Facturación Neta en USD**, evitando mezclar monedas o asumir que todas las facturas corresponden a exportación.

Incorporar el soporte oficial para el mercado nacional amplía la cobertura de SATEM Control sin alterar ni romper los flujos existentes de exportación internacional.

## What Changes

1. **Determinación inteligente del Mercado (Nacional vs Internacional)**:
   - Detección automática según el país del cliente (`countryCode == 'CL'` o país "Chile" $\rightarrow$ Mercado Nacional con moneda predeterminada `CLP`; resto de países $\rightarrow$ Mercado Internacional con `USD`).
   - Flexibilidad para cambiar manualmente la moneda o mercado tanto a nivel de Cliente como al emitir Contratos, Cotizaciones y Expedientes.

2. **Régimen Tributario e IVA en Mercado Nacional**:
   - Soporte en backend y frontend para Factura Afecta (DTE 33 con 19% de IVA) y Factura Exenta (DTE 34), además de Factura de Exportación (DTE 110).
   - Cálculo automático en creación/registro de facturas: si es Afecta a IVA, `vatAmount = Math.round(netAmount * 0.19)` y `totalAmount = netAmount + vatAmount`. Si es Exenta o Exportación, `vatAmount = 0` y `totalAmount = netAmount`.
   - Compatibilidad completa en el expediente para tratamientos `VAT_APPLIED`, `VAT_EXEMPT` y `EXPORT_SERVICE`.

3. **Flujo de Pagos y Conciliación Santander para Mercado Nacional**:
   - En expedientes y facturas nacionales en CLP, no se exige ni fuerza el flujo de calculadora o link SumUp.
   - Registro de pagos con método "Transferencia Bancaria Santander" o "Transferencia Electrónica" en CLP, con equivalencia 1:1 directa sin recargo de comisiones ni conversión cambiaria.
   - Conciliación bancaria directa (`BankPage`): coincidencia exacta entre el abono en la cartola Santander y la factura nacional en CLP.
   - En el checklist de integridad del expediente (`ExpedientIntegrityItem`), el requerimiento financiero se satisface de forma flexible al conciliar el abono en la cartola bancaria o al adjuntar el comprobante de transferencia si el cliente lo remite previamente.

4. **Nuevas Plantillas Documentales Oficiales para Mercado Nacional (100% Español)**:
   - Creación de plantillas institucionales oficiales en español en el bootstrap de la base de datos:
     - `TPL-CONTRACT-NAC`: "Contrato de Prestación de Servicios (Mercado Nacional - CLP)"
     - `TPL-WORK-ORDER-NAC`: "Orden de Trabajo (Mercado Nacional)"
     - `TPL-RECEPTION-NAC`: "Acta de Recepción Conforme (Mercado Nacional)"
     - `TPL-PROPOSAL-NAC`: "Propuesta Comercial (Mercado Nacional - CLP)"
   - Supresión de subtítulos en inglés, eliminación de cajas de Dólar Observado / conversión en documentos cuya moneda sea CLP, y reemplazo de cláusulas de exportación por cláusulas tributarias chilenas estándar (afectas o exentas según el expediente).

5. **Evolución del Dashboard (KPIs Multimoneda)**:
   - Desglose y adición del KPI de **"Facturación Neta (CLP)"** en la fila principal de métricas, junto a la **"Facturación Neta (USD)"**.
   - Segmentación de métricas de operaciones y resumen tributario (Facturas DTE 33/34 Nacionales vs DTE 110 Exportación).

## Capabilities

### New Capabilities
- `mercado-nacional-billing`: Soporte de facturación y tributación nacional en CLP (DTE 33 afecto con 19% IVA y DTE 34 exento), flujo de transferencia bancaria directa a Banco Santander sin pasar por SumUp, y reglas de conciliación bancaria directa 1:1.
- `plantillas-documentales-nacionales`: Plantillas documentales oficiales de contratos, órdenes de trabajo, actas de recepción y cotizaciones 100% en español, sin términos bilingües ni conversiones forzadas de moneda.
- `dashboard-kpi-multimoneda`: Módulo de métricas en el Dashboard principal que discrimina y expone la Facturación Neta en CLP y la Facturación Neta en USD de forma precisa y visualmente balanceada.

### Modified Capabilities
<!-- No existing capabilities under openspec/specs/ are being modified; automated-testing-suite and user-manuals remain intact. -->

## Scope and Non-Goals

### En Alcance (Scope)
- Clasificación de mercado nacional vs internacional por cliente/país con anulación manual opcional.
- Soporte completo de Facturas Nacionales (DTE 33 Afecta con 19% IVA y DTE 34 Exenta) en CLP en backend y frontend.
- Carga de archivo de factura del SII (PDF y XML) nacional vinculada al expediente.
- Registro de pagos en CLP por transferencia directa Santander y conciliación contra la cartola bancaria.
- Plantillas oficiales de documentos 100% en español para el mercado nacional en `bootstrap-templates.ts`.
- Lógica en el generador de instancias de documentos (`document-instances.controller.ts`) para omitir la conversión USD/CLP cuando el contrato/documento esté en CLP.
- Integración en Dashboard del KPI de "Facturación Neta (CLP)" con formato de moneda local chilena (`$XX.XXX.XXX CLP`) y preservación del KPI en USD.
- Actualización de `ContractWizardPage`, `BillingPage`, `ExpedientsPage` y `DashboardPage` para seleccionar moneda, tipo de DTE y omitir pasos no aplicables de SumUp en mercado nacional.

### Fuera de Alcance (Non-Goals)
- Emisión directa de DTE por Web Services SOAP/REST hacia el SII (el sistema sigue operando mediante la carga y registro de los documentos ya emitidos externamente en el portal Mipyme / SII).
- Conexión bancaria en tiempo real vía Open Banking API de Banco Santander (la conciliación sigue operando mediante la importación de cartolas o registro de movimientos).
- Reemplazo o eliminación del flujo internacional existente (ambos regímenes deben coexistir de forma armónica e idempotente).

## Impact

### Affected Modules & Files
- **Backend**:
  - `satem-control-api/src/modules/dashboard/dashboard.controller.ts`: Cálculo separado de `totalNetInvoicedCLP`, `totalNetInvoicedUSD`, `totalVatCLP`, `totalInvoicedCLP`.
  - `satem-control-api/src/modules/invoices/invoices.controller.ts`: Soporte de `siiDocType` (33, 34, 110), validación y cálculo de `vatAmount` en CLP y USD.
  - `satem-control-api/src/modules/contracts/contracts.controller.ts`: Detección de país del cliente para sugerir moneda CLP y `taxTreatment: VAT_APPLIED` o `VAT_EXEMPT` cuando corresponda a Chile.
  - `satem-control-api/src/common/utils/bootstrap-templates.ts`: Definición de las plantillas oficiales para mercado nacional (`TPL-CONTRACT-NAC`, `TPL-WORK-ORDER-NAC`, `TPL-RECEPTION-NAC`, `TPL-PROPOSAL-NAC`).
  - `satem-control-api/src/common/utils/bootstrap.ts`: Auto-bootstrap de las nuevas plantillas en el arranque sin duplicación.
  - `satem-control-api/src/modules/document-instances/document-instances.controller.ts`: Adaptación de variables para omitir dólar observado y cláusula de exportación cuando la moneda sea CLP.
- **Frontend**:
  - `satem-control-web/src/pages/DashboardPage.tsx`: Inclusión del KPI "Facturación Neta (CLP)", orden responsivo de métricas y resumen tributario mixto.
  - `satem-control-web/src/pages/BillingPage.tsx`: Selector de moneda (CLP / USD), tipo de DTE (Factura Afecta DTE 33, Factura Exenta DTE 34, Factura Exportación DTE 110), cálculo automático de IVA 19%, y condicionamiento de la calculadora SumUp sólo para cobros en USD / pasarela.
  - `satem-control-web/src/pages/ContractWizardPage.tsx`: Soporte de selección de moneda CLP / USD, selección de plantilla nacional en español o internacional bilingüe, y términos de pago por defecto orientados a transferencia bancaria Santander.
  - `satem-control-web/src/pages/ExpedientsPage.tsx`: Presentación y filtrado coherente de montos según la moneda del expediente/factura.

### Database Models
- Modelos existentes (`Invoice`, `Expedient`, `Contract`, `DocumentTemplate`, `Payment`) ya soportan atributos de moneda (`currency`), montos netos y totales, tipos de DTE (`siiDocType`), y tratamiento tributario (`TaxTreatment`). No se requieren migraciones DDL destructivas ni campos incompatibles.
- Los seeds e inicializadores de plantillas incorporan nuevos registros de `DocumentTemplate` y `DocumentTemplateVersion`.

### Security & Integrity
- Se preservan las políticas de autenticación, control de roles (RBAC) y soft delete (`deletedAt: null`).
- Se mantiene la inmutabilidad de los snapshots de cierre de expediente y el sellado criptográfico SHA-256 de documentos.
- No se introducen dependencias externas innecesarias ni llamadas a servicios no verificados.

# Design

## Context

El sistema actual opera con un modelo unificado en MySQL/Prisma donde las tablas `invoices`, `contracts`, `payments` y `document_instances` poseen columnas para moneda (`currency`), pero los flujos de creación, plantillas predeterminadas y agregaciones asumen valores en dólares (USD) y exención de IVA por exportación (`EXPORT_SERVICE`). Para más detalles sobre la motivación y antecedentes, ver [proposal.md](file:///D:/Dev/satem-control/openspec/changes/soporte-mercado-nacional-clp/proposal.md).

Las entidades de base de datos existentes ya soportan:
- `Invoice`: `currency` (VARCHAR 3), `netAmount` (DECIMAL), `vatAmount` (DECIMAL), `totalAmount` (DECIMAL), `siiDocType` (INT), `taxTreatment` (TaxTreatment enum con `EXPORT_SERVICE`, `VAT_APPLIED`, `VAT_EXEMPT`).
- `Contract`: `currency` (VARCHAR 3), `totalAmount`, `rate`, `contractedHours`.
- `Payment`: `currency` (VARCHAR 3), `amount`, `paymentMethod`, `transactionRef`.
- `BankReceipt`: `amountClp` (DECIMAL en pesos chilenos).
- `DocumentTemplate`: `language` (VARCHAR 10), `category` (TemplateCategory).

Por lo tanto, no se requieren migraciones DDL estructurales destructivas ni agregar campos forzados en el esquema de base de datos. La solución radica en adaptar los controladores de backend, el generador documental, el motor de plantillas y las pantallas frontend de Dashboard, Facturación, Asistente de Contratos y Expedientes.

## Goals / Non-Goals

**Goals:**
- Detección y asignación inteligente de mercado (Nacional = CLP, Internacional = USD) basada en el país del cliente, manteniendo anulación manual.
- Soporte para emisión/registro de Facturas Afectas a IVA (DTE 33, 19% IVA) y Facturas Exentas (DTE 34, 0% IVA) en CLP.
- Flujo de pago directo por transferencia bancaria Santander sin forzar pasarelas como SumUp ni recálculos cambiarios.
- Conciliación bancaria directa 1:1 entre cartola Santander y pagos/facturas en CLP.
- Incorporación de 4 plantillas oficiales 100% en español (`TPL-CONTRACT-NAC`, `TPL-WORK-ORDER-NAC`, `TPL-RECEPTION-NAC`, `TPL-PROPOSAL-NAC`) sin términos bilingües ni referencias a dólar observado.
- Inclusión del KPI de "Facturación Neta (CLP)" en el Dashboard principal en coexistencia armónica con "Facturación Neta (USD)".

**Non-Goals:**
- Conexión por Web Services DTE en tiempo real con el SII (la carga de folios y PDFs/XMLs sigue siendo vía interfaz/archivo).
- Eliminación o deprecación del flujo de exportación en USD (ambos flujos conviven sin fricción).
- Inclusión forzada de datos bancarios confidenciales en los contratos (se mantiene en las notas/facturas o acuerdos específicos conforme a la preferencia del usuario).

## Decisions

### Decisión 1: Clasificación de Mercado Híbrida (Automática con Anulación Manual)
- **Elección**: Al seleccionar o crear un cliente con país Chile (`countryCode == 'CL'` o nombre "Chile"), el sistema sugiere por defecto moneda `CLP`, tipo de factura DTE 33 (afecta a IVA) y plantilla nacional en español. No obstante, el usuario puede seleccionar libremente `USD` o cambiar el tipo de DTE en el formulario si se requiere una cotización o contrato especial en dólares para un cliente local.
- **Razón**: Máxima agilidad para el operador al rellenar formularios estándar, sin limitar casos atípicos o acuerdos multinacionales.
- **Alternativas consideradas**:
  - *Selector rígido obligatorio de mercado en todas las tablas*: Aumentaba la complejidad del modelo y redundaba con los datos geográficos del cliente.
  - *Restricción estricta por país*: Impediría cotizar en USD a filiales chilenas de multinacionales.

### Decisión 2: Desglose y Cálculo Automático de IVA (19%) en Backend y Frontend
- **Elección**: Al registrar una factura con tratamiento `VAT_APPLIED` (DTE 33), el sistema calcula `vatAmount = Math.round(netAmount * 0.19)` y `totalAmount = netAmount + vatAmount`. Si el operador ingresa montos explícitos en el formulario o carga de archivo, se validan los valores respetando el desglose. Si el tratamiento es `VAT_EXEMPT` (DTE 34) o `EXPORT_SERVICE` (DTE 110), `vatAmount` se fija en 0 y `totalAmount = netAmount`.
- **Razón**: Garantiza coherencia matemática y tributaria entre lo que el SII exige en los DTEs y lo que SATEM almacena en auditoría.
- **Alternativas consideradas**:
  - *Calcular IVA solo en frontend*: Riesgo de inconsistencia si un endpoint API recibe llamadas directas.

### Decisión 3: Manejo de Pagos y Conciliación para Transferencias Santander
- **Elección**: En pagos nacionales en CLP:
  - `paymentMethod` se registra como "Transferencia Bancaria Santander" o "Transferencia Electrónica".
  - `currency` es `CLP`. `usdEquivalent` se calcula sólo como referencia informativa sin afectar la liquidación.
  - No se genera ni exige link de SumUp ni se calculan comisiones de adquirencia.
  - La conciliación bancaria en `BankPage` hace match directo (1:1) del `amountClp` de la cartola contra el monto de la factura o pago.
  - En el checklist del expediente (`expedient_integrity_items`), el item `RECONCILIATION_COMPLETED` se completa al conciliar la cartola, y `PAYMENT_PROOF_PRESENT` se completa opcionalmente si se sube comprobante o automáticamente al conciliar en banco.
- **Razón**: Refleja con precisión la realidad de las transferencias electrónicas bancarias chilenas sin cargar costos de pasarelas.

### Decisión 4: Plantillas Nacionales Oficiales en Español (Bootstrap Idempotente)
- **Elección**: Crear 4 plantillas en `bootstrap-templates.ts`:
  1. `TPL-CONTRACT-NAC`: "Contrato de Prestación de Servicios (Mercado Nacional - CLP)"
  2. `TPL-WORK-ORDER-NAC`: "Orden de Trabajo (Mercado Nacional)"
  3. `TPL-RECEPTION-NAC`: "Acta de Recepción Conforme (Mercado Nacional)"
  4. `TPL-PROPOSAL-NAC`: "Propuesta Comercial (Mercado Nacional - CLP)"
  En `document-instances.controller.ts`, cuando la moneda sea `CLP`:
  - `tipoCambioInfo` y `montoEquivalenteClp` se omiten o indican "No aplica (Moneda Nacional)".
  - La cláusula de exportación no se inyecta; en su lugar, se inyecta la cláusula tributaria nacional correspondiente (Afecta o Exenta).
- **Razón**: Los contratos chilenos son legalmente más claros en español puro, y evitan confusiones contractuales sobre tasas de cambio inexistentes.

### Decisión 5: Segregación de Facturación Neta en Dashboard
- **Elección**: En `dashboard.controller.ts`:
  - `totalNetInvoicedUSD`: Suma de `netAmount` donde `status = 'ISSUED'`, `currency = 'USD'`, `deletedAt = null`.
  - `totalNetInvoicedCLP`: Suma de `netAmount` donde `status = 'ISSUED'`, `currency = 'CLP'`, `deletedAt = null`.
  - En `DashboardPage.tsx`: Se añade la tarjeta "Facturación Neta (CLP)" junto a "Facturación Neta (USD)", pasando a un diseño limpio de 5 tarjetas o una cuadrícula armónica adaptativa.
- **Razón**: Evita la distorsión financiera de mezclar pesos y dólares bajo una misma cifra o forzar tipos de cambio históricos variables.

## Risks / Trade-offs

- **[Riesgo] Facturas previas registradas sin moneda explícita**: En versiones anteriores, algunas facturas pudieron crearse asumiendo USD por defecto.
  $\rightarrow$ *Mitigación*: Las consultas en `dashboard.controller.ts` clasifican facturas con `currency = 'CLP'` en CLP y facturas con `currency = 'USD'` (o nulas heredadas) en USD, garantizando retrocompatibilidad total sin romper datos históricos.
- **[Riesgo] Selección errónea de plantilla bilingüe para cliente nacional**: Un operador podría elegir por error la plantilla SOW bilingüe para un cliente chileno.
  $\rightarrow$ *Mitigación*: En `ContractWizardPage.tsx`, al seleccionar un cliente chileno (`CL`), el selector de plantilla filtra o selecciona por defecto automáticamente la plantilla nacional en español.
- **[Riesgo] Sobrecarga visual en la barra de KPIs del Dashboard**: Agregar un quinto KPI podría romper la simetría de la cuadrícula `grid-4`.
  $\rightarrow$ *Mitigación*: Ajustar el grid a `repeat(auto-fit, minmax(220px, 1fr))` para que fluya responsivamente tanto en pantallas de escritorio como en tablets y móviles, respetando el SATEM Design System.

## Migration Plan

1. **Backend**:
   - Actualizar `dashboard.controller.ts` para computar `totalNetInvoicedCLP` y `totalNetInvoicedUSD`.
   - Actualizar `invoices.controller.ts` para aceptar y validar facturas DTE 33/34 en CLP con desglose de IVA.
   - Agregar las nuevas plantillas en `bootstrap-templates.ts` e invocarlas en `bootstrap.ts` con auto-healing.
   - Ajustar `document-instances.controller.ts` para manejar variables de documentos en CLP sin bloques cambiarios.
2. **Frontend**:
   - Actualizar `DashboardPage.tsx` para mostrar la tarjeta KPI de Facturación Neta (CLP) con formato `$XX.XXX.XXX CLP`.
   - Actualizar `BillingPage.tsx` con soporte de moneda CLP/USD, selector de DTE (33/34/110) y cálculo de IVA.
   - Actualizar `ContractWizardPage.tsx` para sugerir moneda CLP y plantillas nacionales cuando el cliente sea de Chile.
3. **Validación**:
   - Ejecutar compilación TypeScript en backend (`npm run build`) y frontend (`npm run build`).
   - Validar arranque limpio de la aplicación y regeneración de plantillas.

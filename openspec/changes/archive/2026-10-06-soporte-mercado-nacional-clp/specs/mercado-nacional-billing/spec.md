# Spec Delta: mercado-nacional-billing

## Purpose

Permite gestionar la facturación, tributación y pagos del mercado nacional en Pesos Chilenos (CLP), soportando facturas afectas a IVA (DTE 33) y exentas (DTE 34), transferencias directas a Banco Santander sin comisiones de pasarela, y conciliación bancaria directa.

## ADDED Requirements

### Requirement: Registro de Facturas SII Nacionales en CLP con IVA Desglosado
El sistema debe permitir registrar y vincular facturas del SII para el mercado nacional chileno expresadas en moneda CLP, soportando tanto Factura Electrónica afecta a IVA (DTE 33, aplicando 19% sobre el neto) como Factura No Afecta o Exenta (DTE 34, sin IVA), guardando los montos netos, IVA y totales correspondientes junto al archivo PDF/XML de respaldo.

#### Scenario: Registro exitoso de Factura Afecta DTE 33 en CLP
- **WHEN** un operador registra una factura para un expediente nacional indicando moneda `CLP`, monto neto $1.000.000, tipo DTE 33 y tratamiento tributario `VAT_APPLIED`
- **THEN** el sistema calcula automáticamente $190.000 de IVA y $1.190.000 de monto total, almacena la factura con status `ISSUED` y actualiza el item de integridad `INVOICE_REGISTERED` del expediente como completado

#### Scenario: Registro de Factura Exenta DTE 34 en CLP
- **WHEN** un operador registra una factura para un expediente nacional con tipo DTE 34 y tratamiento tributario `VAT_EXEMPT`
- **THEN** el sistema asigna $0 de IVA, iguala el monto total al neto y no aplica cálculo de recargos

### Requirement: Flujo de Pagos Nacionales por Transferencia Directa sin SumUp
El sistema debe permitir registrar pagos en CLP mediante transferencia electrónica directa a Banco Santander, sin exigir cálculo de tasas de pasarela, links de pago de SumUp, ni conversión de tipos de cambio de divisas.

#### Scenario: Pago por transferencia bancaria Santander en CLP
- **WHEN** se registra un pago en CLP con método "Transferencia Bancaria Santander" o "Transferencia Electrónica" para una factura o expediente nacional
- **THEN** el sistema registra el pago con `usdEquivalent = null` o calculado sólo para propósitos estadísticos sin alterar el valor nominal en CLP, marca el pago como `CONFIRMED` y genera la asignación de pago (`PaymentAllocation`) lista para conciliación bancaria

### Requirement: Conciliación Bancaria Directa de Facturas Nacionales
El sistema debe permitir conciliar los abonos de la cartola Santander importada contra los pagos o facturas nacionales en CLP con coincidencia exacta (1:1), sin discrepancias originadas por comisiones de pasarelas de pago.

#### Scenario: Auto-match y conciliación manual de transferencia nacional
- **WHEN** un abono en la cartola bancaria Santander coincide en monto exacto en CLP y fecha aproximada con un pago de factura nacional
- **THEN** el sistema permite conciliar la transacción con `discrepancyAmountClp = 0`, actualizando el estado de la cartola a `RECONCILED` y marcando el item de integridad `RECONCILIATION_COMPLETED` del expediente

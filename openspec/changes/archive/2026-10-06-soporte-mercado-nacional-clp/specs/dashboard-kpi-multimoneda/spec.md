# Spec Delta: dashboard-kpi-multimoneda

## Purpose

Permite visualizar métricas financieras en el Dashboard principal distinguiendo con precisión la facturación neta nacional en Pesos Chilenos (CLP) y la facturación de exportación en Dólares Estadounidenses (USD), garantizando una presentación clara y no distorsionada de los ingresos de SATEM.

## ADDED Requirements

### Requirement: KPI de Facturación Neta en CLP en Pantalla Principal
El Dashboard debe calcular y exponer como tarjeta principal destacada el KPI de "Facturación Neta (CLP)" acumulando la suma de los valores netos (`netAmount`) de todas las facturas emitidas (`status = 'ISSUED'`, `deletedAt = null`) cuya moneda sea `CLP`.

#### Scenario: Visualización del KPI de Facturación Neta en CLP
- **WHEN** un usuario con permisos autorizados accede a la pantalla principal del Dashboard
- **THEN** observa una tarjeta KPI con el título "Facturación Neta (CLP)", con valor formateado en moneda local (ej. `$15.450.000 CLP`), subtítulo indicando "Facturas SII nacionales (DTE 33/34)", y enlace de navegación directo hacia la vista de Facturación (`/billing`)

### Requirement: Coexistencia de Métricas Financieras CLP y USD
El endpoint de métricas de Dashboard (`/api/v1/dashboard`) y la interfaz deben proveer simultáneamente el desglose financiero separado para CLP y USD, evitando sumar o mezclar valores de monedas distintas en un solo total neto agregado.

#### Scenario: Cálculo segregado por moneda en backend
- **WHEN** el backend computa las métricas financieras del dashboard
- **THEN** retorna `totalNetInvoicedCLP` sumando facturas con `currency = 'CLP'`, `totalNetInvoicedUSD` sumando facturas con `currency = 'USD'`, y el conteo respectivo de documentos por régimen tributario

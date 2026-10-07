# Spec Delta: plantillas-documentales-nacionales

## Purpose

Provee un conjunto de plantillas documentales oficiales para el mercado nacional chileno redactadas exclusivamente en idioma español, sin términos bilingües ni conversiones forzadas de tipo de cambio, adaptadas a contratos de servicios, órdenes de trabajo, actas de recepción y cotizaciones.

## ADDED Requirements

### Requirement: Plantillas Oficiales Institucionales en Español
El motor de plantillas y bootstrap del sistema debe incluir versiones predeterminadas en idioma español (`language: "ES"`) para la emisión de contratos nacionales (`TPL-CONTRACT-NAC`), órdenes de trabajo (`TPL-WORK-ORDER-NAC`), actas de recepción conforme (`TPL-RECEPTION-NAC`) y propuestas comerciales (`TPL-PROPOSAL-NAC`).

#### Scenario: Generación de Contrato de Servicios para Mercado Nacional
- **WHEN** se genera un documento para un contrato en moneda CLP utilizando la plantilla `TPL-CONTRACT-NAC`
- **THEN** el documento generado se titula "CONTRATO DE PRESTACIÓN DE SERVICIOS", muestra los montos en formato de moneda chilena (`$XX.XXX.XXX CLP`), omite secciones en inglés y referencias a "Statement of Work (SOW)", y excluye la cláusula de exención de exportación (Art. 12 E DL 825)

### Requirement: Supresión de Tipo de Cambio en Documentos en CLP
Al compilar y renderizar cualquier plantilla documental con datos de contrato o expediente cuya moneda sea `CLP`, el motor de generación documental debe omitir automáticamente el bloque de tipo de cambio de dólar observado, tasas de conversión y cláusulas cambiarias que aplican a operaciones de exportación.

#### Scenario: Contrato nacional sin conversión cambiaria
- **WHEN** un contrato tiene configurada la moneda `CLP` y monto total pactado en pesos
- **THEN** el PDF generado muestra el monto directo en pesos chilenos y no incluye leyendas de "T.C. Dólar Observado", "Equivalente en CLP", ni advertencias de tipo de cambio del Banco Central

# plantillas-documentales-nacionales Specification Delta

## MODIFIED Requirements

### Requirement: Plantillas Oficiales Institucionales en Español
El motor de plantillas y bootstrap del sistema SHALL incluir versiones predeterminadas en idioma español (`language: "ES"`) para la emisión de contratos nacionales (`TPL-CONTRACT-NAC`), órdenes de trabajo (`TPL-WORK-ORDER-NAC`), actas de recepción conforme (`TPL-RECEPTION-NAC`) y propuestas comerciales (`TPL-PROPOSAL-NAC`), utilizando obligatoriamente la identificación "RUT" en lugar de "Tax ID" para clientes del mercado chileno.

#### Scenario: Generación de Contrato de Servicios para Mercado Nacional
- **WHEN** se genera un documento para un contrato en moneda CLP utilizando la plantilla `TPL-CONTRACT-NAC`
- **THEN** el documento generado se titula "CONTRATO DE PRESTACIÓN DE SERVICIOS", muestra los montos en formato de moneda chilena (`$XX.XXX.XXX CLP`), omite secciones en inglés y referencias a "Statement of Work (SOW)", excluye la cláusula de exención de exportación (Art. 12 E DL 825), y rotula la identificación fiscal del cliente como "RUT" (ej. "RUT: 76.xxx.xxx-x") en lugar de "Tax ID"

#### Scenario: Plantillas operacionales nacionales con rotulación RUT
- **WHEN** se emite una Orden de Trabajo (`TPL-WORK-ORDER-NAC`), Acta de Recepción Conforme (`TPL-RECEPTION-NAC`) o Propuesta Comercial (`TPL-PROPOSAL-NAC`) para un cliente del mercado chileno
- **THEN** los encabezados y bloques de identificación del cliente MUST exhibir "RUT" y omitir fórmulas en inglés o referencias a "Tax ID"

## ADDED Requirements

### Requirement: Variables de Plantilla con Identificación Tributaria Dinámica
El motor de inyección de variables (`document-instances.controller.ts`) MUST proveer las variables `cliente.taxIdLabel` (que evalúa a "RUT" si el cliente pertenece a Chile o "Tax ID" en caso contrario) y `cliente.rut`, permitiendo que cualquier plantilla institucional o personalizada resuelva automáticamente la etiqueta apropiada según el país del cliente.

#### Scenario: Inyección de RUT en documento nacional
- **WHEN** se compilan las variables de un cliente cuyo `countryCode` es `CL` o `CHL`
- **THEN** `cliente.taxIdLabel` evalúa a `"RUT"` y `cliente.rut` contiene el identificador tributario del cliente

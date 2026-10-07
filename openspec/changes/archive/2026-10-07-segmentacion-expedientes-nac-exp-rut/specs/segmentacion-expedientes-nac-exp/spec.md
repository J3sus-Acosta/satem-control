# segmentacion-expedientes-nac-exp Specification Delta

## Purpose

Permite generar correlativos diferenciados de expedientes para operaciones nacionales (prefijo NAC) y de exportación (prefijo EXP), segmentar la visualización y navegación en el menú administrativo interno de SATEM, y preservar la vista consolidada en el portal de clientes.

## ADDED Requirements

### Requirement: Generación Atómica de Secuencia NAC y EXP
El sistema SHALL soportar los prefijos de secuencia `NAC` y `EXP` de forma independiente a nivel de base de datos (`sequences`), de tal forma que los expedientes del mercado nacional se numeren como `NAC-YYYY-NNNNNN` (ej. `NAC-2026-000001`) y los de exportación como `EXP-YYYY-NNNNNN` (ej. `EXP-2026-000001`), donde `NAC` representa operaciones nacionales y `EXP` exportación.

#### Scenario: Creación de expediente nacional desde contrato o formulario manual
- **WHEN** se crea un expediente para un cliente con país Chile (`CL` / `CHL`) o tratamiento tributario nacional (`VAT_APPLIED` o `VAT_EXEMPT`)
- **THEN** el sistema genera de forma atómica y transaccional un código con prefijo `NAC` correspondiente al año en curso (ej. `NAC-2026-000001`)

#### Scenario: Creación de expediente de exportación
- **WHEN** se crea un expediente para un cliente internacional o con tratamiento tributario `EXPORT_SERVICE`
- **THEN** el sistema genera de forma atómica un código con prefijo `EXP` correspondiente al año en curso (ej. `EXP-2026-000001`)

### Requirement: Filtrado de Expedientes por Mercado en API
El endpoint `GET /api/v1/expedients` MUST aceptar un parámetro de consulta `market` con valores `NAC` o `EXP`. Al recibir dicho parámetro, debe filtrar los registros retornando exclusivamente los expedientes cuyo código inicie con el prefijo indicado (`NAC-%` o `EXP-%`) o cuyo tratamiento tributario/mercado coincida con el solicitado, respetando el borrado lógico (`deletedAt: null`).

#### Scenario: Consulta de expedientes nacionales
- **WHEN** el frontend solicita `GET /api/v1/expedients?market=NAC`
- **THEN** la API retorna únicamente los expedientes nacionales (códigos con prefijo `NAC-`)

#### Scenario: Consulta de expedientes internacionales
- **WHEN** el frontend solicita `GET /api/v1/expedients?market=EXP`
- **THEN** la API retorna únicamente los expedientes internacionales (códigos con prefijo `EXP-`)

### Requirement: Menú Lateral y Vistas Separadas en Panel de Administración
El menú de navegación lateral izquierdo para todos los roles de usuario internos de SATEM (`ADMIN`, `OPERATIONS`, `ACCOUNTING`, `TECHNICIAN`, `VIEWER`) MUST presentar dos accesos diferenciados:
1. "Expedientes NAC" ubicado inmediatamente encima de "Expedientes EXP", apuntando a la ruta `/expedients/nac`.
2. "Expedientes EXP" (renombrando el ítem previo "Expedientes"), apuntando a la ruta `/expedients/exp`.

#### Scenario: Navegación a Expedientes NAC
- **WHEN** un usuario hace clic en "Expedientes NAC" en el menú lateral
- **THEN** la aplicación carga la vista de expedientes con el título "Expedientes Nacionales (NAC)", filtra la tabla exclusivamente para expedientes nacionales y mantiene resaltado el botón "Expedientes NAC" en el sidebar

#### Scenario: Navegación a Expedientes EXP
- **WHEN** un usuario hace clic en "Expedientes EXP" en el menú lateral
- **THEN** la aplicación carga la vista de expedientes con el título "Expedientes de Exportación (EXP)", filtra la tabla exclusivamente para expedientes internacionales y mantiene resaltado el botón "Expedientes EXP" en el sidebar

### Requirement: Preservación de la Vista Unificada en Portal de Clientes
El portal de clientes (`/portal` y `/portal/expedients`) SHALL permanecer sin modificaciones en su estructura, mostrando todos los expedientes asignados al cliente autenticado de forma unificada sin segmentación obligatoria de menús.

#### Scenario: Acceso de cliente a sus expedientes en el portal
- **WHEN** un cliente autenticado ingresa a `/portal/expedients`
- **THEN** visualiza todos sus expedientes autorizados (sean nacionales o internacionales) en la misma vista consolidada original

# Spec Delta

## Purpose

Establecer manuales de usuario oficiales y completos para el Cliente (Portal Web de SATEM) y el Administrador (Consola SATEM Control), documentando procesos de negocio, accesos, firma digital y administración operativa.

## ADDED Requirements

### Requirement: Manual de Usuario del Portal de Clientes
El sistema MUST proveer una guía de usuario integral para clientes externos en `docs/MANUAL_PORTAL_CLIENTE.md`, cubriendo desde la activación de cuenta hasta la firma digital de actas y seguimiento de expedientes.

#### Scenario: Proceso de Activación y Acceso al Portal
- **WHEN** un cliente nuevo recibe un enlace de invitación con token
- **THEN** el manual detalla paso a paso cómo registrar su contraseña, iniciar sesión en `/portal/login` y configurar sus datos personales en `/portal/profile`.

#### Scenario: Seguimiento de Expedientes y Órdenes de Trabajo
- **WHEN** el cliente ingresa a la vista de expedientes (`/portal/expedients`)
- **THEN** el manual explica la interpretación de estados, avance porcentual, atenciones registradas por técnicos y descarga de informes adjuntos.

#### Scenario: Firma Digital de Actas de Servicio
- **WHEN** el cliente debe validar y firmar un acta de servicio (`/portal/signatures`)
- **THEN** el manual explica el uso del panel táctil/mouse, previsualización del documento, validez legal de la firma y trazabilidad con hash de seguridad.

### Requirement: Manual de Usuario del Administrador de SATEM
El sistema MUST proveer un manual operativo y de configuración en `docs/MANUAL_ADMINISTRADOR.md`, documentando todas las capacidades de la consola de administración interna para usuarios con roles ADMIN y OPERATIONS.

#### Scenario: Gestión de Clientes, Sucursales y Contactos
- **WHEN** el administrador requiere dar de alta una nueva empresa cliente
- **THEN** el manual documenta los campos requeridos (Razón Social, RUT, País), la creación de sucursales operativas y la asignación de contactos técnicos y comerciales.

#### Scenario: Ciclo de Vida de Expedientes y Asignación Operativa
- **WHEN** se genera un nuevo expediente o solicitud de servicio
- **THEN** el manual detalla la creación de órdenes de trabajo (OT), asignación de técnicos responsables, registro de horas/atenciones y cierre del expediente.

#### Scenario: Facturación, Pagos y Conciliación Bancaria
- **WHEN** el área de finanzas administra cobros e ingresos
- **THEN** el manual describe el registro de facturas, generación de enlaces de pago SumUp, carga de cartolas bancarias y conciliación contra contratos activos.

#### Scenario: Administración de Usuarios y Plantillas de Documentos
- **WHEN** se requiere gestionar accesos o editar plantillas PDF
- **THEN** el manual documenta la creación de usuarios internos con roles RBAC, envío de invitaciones a clientes y personalización de plantillas en el editor integrado.

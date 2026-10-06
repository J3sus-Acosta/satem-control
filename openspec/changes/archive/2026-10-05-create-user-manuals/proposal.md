# Proposal

## Why

SATEM Control cuenta con dos perfiles de interacción principales con flujos de trabajo muy diferenciados:
1. **El Cliente de SATEM**, que accede a través del **Portal Web de Clientes** (`/portal`) para consultar sus expedientes, revisar el estado de sus órdenes de trabajo, validar informes y firmar digitalmente actas y documentos técnicos.
2. **El Administrador y Equipo Operativo de SATEM**, que utiliza la **Consola de Control Interno** (`/`) para gestionar clientes, sucursales, contratos, expedientes, órdenes de trabajo, facturación, conciliación bancaria SumUp, usuarios de clientes y plantillas de documentos.

Actualmente, el proyecto carece de documentación de usuario estructurada, paso a paso y orientada a procesos para ambas audiencias. Esto genera fricción en la incorporación de nuevos clientes corporativos (*onboarding*), consultas repetitivas a soporte técnico y posibles desalineaciones operativas en la administración del sistema.

Es necesario elaborar dos manuales de usuario exhaustivos, profesionales y estructurados en Markdown:
- `docs/MANUAL_PORTAL_CLIENTE.md`: Manual de Usuario para el Cliente (Portal Web).
- `docs/MANUAL_ADMINISTRADOR.md`: Manual de Usuario para el Administrador de SATEM.

## What Changes

- **Manual de Usuario del Portal de Clientes (`docs/MANUAL_PORTAL_CLIENTE.md`)**:
  - Proceso de activación de cuenta e invitación vía enlace único con token (`/portal/invite/:token`).
  - Inicio de sesión y recuperación de acceso (`/portal/login`).
  - Navegación del Portal y panel de Expedientes (`/portal/expedients`).
  - Visualización del detalle del Expediente: avance, hitos, órdenes de trabajo (OT) asociadas, atenciones y descarga de actas/archivos (`/portal/expedients/:id`).
  - Firma Digital en pantalla mediante panel de firma táctil/ratón (`/portal/signatures`), validación de validez legal y trazabilidad con huella digital.
  - Gestión de perfil de usuario y cambio de contraseña segura (`/portal/profile`).

- **Manual de Usuario del Administrador (`docs/MANUAL_ADMINISTRADOR.md`)**:
  - Control de accesos y matriz de roles SATEM (ADMIN, OPERATIONS, ACCOUNTING, TECHNICIAN, VIEWER).
  - Dashboard Operativo y Centro de Control en tiempo real (`/`, `/control-center`).
  - Gestión de Clientes y Sucursales: alta de empresas, RUT, contactos técnicos y comerciales (`/customers`).
  - Asistente de Contratos (*Contract Wizard*): configuración de modalidades, bolsas de horas, paquetes y vigencias (`/contracts/wizard`).
  - Gestión de Expedientes y Órdenes de Trabajo: ciclo de vida completo de un expediente (creación, asignación de técnicos, registro de atenciones, generación de actas de servicio).
  - Facturación y Conciliación Bancaria: emisión, estados de pago, integración SumUp y carga de cartolas bancarias (`/billing`, `/bank`).
  - Generador y Editor de Plantillas de Documentos (`/admin/templates`, `/admin/templates/:id`).
  - Administración de Usuarios Internos y Usuarios de Clientes: creación de accesos, reseteo de credenciales y envío de invitaciones (`/admin/users`, `/admin/client-users`).

- **Indexación y Enlaces**:
  - Integración de los manuales en la tabla de contenidos de `README.md`.

## Capabilities

### New Capabilities
- `user-manuals`: Documentación funcional exhaustiva y guías de uso paso a paso para el Cliente (Portal Web) y para el Administrador (Consola SATEM Control).

### Modified Capabilities
<!-- No requirement changes to existing functional capabilities -->

## Impact

- **Módulos afectados**:
  - Documentación: `docs/MANUAL_PORTAL_CLIENTE.md`, `docs/MANUAL_ADMINISTRADOR.md`.
  - Navegación / Readme: `README.md`.
- **Código y APIs**: No altera código ejecutable ni esquemas de base de datos.
- **Seguridad**: Asegura que los manuales expliquen las mejores prácticas de seguridad (gestión de contraseñas, validez de firmas electrónicas, principio de menor privilegio en roles).

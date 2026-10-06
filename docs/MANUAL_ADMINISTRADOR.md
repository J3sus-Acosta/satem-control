# Manual de Usuario — Administrador SATEM Control

## SATEM Soluciones Inteligentes SpA
**Plataforma:** SATEM Control — Consola de Gestión Integral y Operaciones  
**Acceso:** `https://app.satemsoluciones.com/` (o URL de despliegue interno)  
**Audiencia:** Administradores Generales, Jefes de Operaciones, Encargados de Finanzas/Contabilidad y Supervisores Técnicos.

---

## 1. Introducción y Arquitectura del Sistema

**SATEM Control** es la plataforma centralizada de gestión operativa, técnica y financiera de **SATEM Soluciones Inteligentes SpA**. El sistema orquesta el ciclo de vida completo de los servicios ofrecidos a clientes corporativos: desde la estructuración de contratos y órdenes de trabajo, pasando por la ejecución en terreno y firma digital de actas, hasta la facturación electrónica y conciliación bancaria automatizada.

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           CICLO OPERATIVO INTEGRAL SATEM CONTROL                        │
├─────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌─────────────────────┤
│ 1. CLIENTE Y    │──>│ 2. EXPEDIENTE    │──>│ 3. ATENCIONES Y  │──>│ 4. FACTURACIÓN Y    │
│    CONTRATO     │   │    Y ASIGNACIÓN  │   │    FIRMA DIGITAL │   │    CONCILIACIÓN     │
│ (Wizard/SOW)    │   │    DE OT         │   │ (Técnicos/Portal)│   │ (SII/SumUp/Santander│
└─────────────────┘   └──────────────────┘   └──────────────────┘   └─────────────────────┘
```

---

## 2. Control de Accesos y Matriz de Roles (RBAC)

El sistema opera bajo el principio de menor privilegio con 5 roles definidos a nivel de backend y frontend:

| Rol | Código | Alcance y Responsabilidades Principales |
| :--- | :--- | :--- |
| **Administrador** | `ADMIN` | Control total del sistema: gestión de usuarios internos/clientes, configuración de plantillas, auditoría global, facturación y conciliación bancaria. |
| **Operaciones** | `OPERATIONS` | Creación y administración de clientes, contratos, expedientes, emisión de Órdenes de Trabajo (OT), asignación de cuadrillas y monitoreo del Centro de Control. |
| **Contabilidad** | `ACCOUNTING` | Módulo de facturación (emisión tipo SII 110, notas de crédito), pasarela SumUp y conciliación de cartolas bancarias Santander. |
| **Técnico** | `TECHNICIAN` | Registro de atenciones en terreno, diagnóstico de fallas, horas invertidas, adjuntos de evidencias y generación preliminar de actas. |
| **Visualizador** | `VIEWER` | Acceso de solo lectura a dashboards, expedientes y reportes sin permisos de edición ni descarga de información financiera crítica. |

### Matriz de Permisos por Módulo

| Módulo / Ruta | ADMIN | OPERATIONS | ACCOUNTING | TECHNICIAN | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dashboard** (`/`) | ✅ Lectura/KPIs | ✅ Lectura/KPIs | ✅ Financiero | ⚠️ Resumen OT | ✅ Lectura |
| **Centro de Control** (`/control-center`) | ✅ Completo | ✅ Operativo | ❌ | ❌ | ⚠️ Lectura |
| **Clientes y Sucursales** (`/customers`) | ✅ Completo | ✅ Crear/Editar | ⚠️ Solo Lectura | ⚠️ Solo Lectura | ⚠️ Solo Lectura |
| **Wizard de Contratos** (`/contracts/wizard`)| ✅ Completo | ✅ Crear/Editar | ⚠️ Solo Lectura | ❌ | ⚠️ Solo Lectura |
| **Expedientes y OTs** (`/expedients`) | ✅ Completo | ✅ Completo | ⚠️ Solo Lectura | ✅ Atenciones | ⚠️ Solo Lectura |
| **Facturación** (`/billing`) | ✅ Completo | ⚠️ Solo Lectura | ✅ Completo | ❌ | ❌ |
| **Conciliación Bancaria** (`/bank`) | ✅ Completo | ❌ | ✅ Completo | ❌ | ❌ |
| **Plantillas de Documentos** (`/admin/templates`)| ✅ Completo | ⚠️ Solo Lectura | ❌ | ❌ | ❌ |
| **Usuarios Internos** (`/admin/users`) | ✅ Completo | ❌ | ❌ | ❌ | ❌ |
| **Usuarios de Clientes** (`/admin/client-users`)| ✅ Completo | ✅ Invitar | ❌ | ❌ | ❌ |

---

## 3. Dashboard y Centro de Control en Tiempo Real

### 3.1 Dashboard General (`/`)
El Dashboard principal entrega una radiografía instantánea del estado de la empresa mediante 4 KPIs fundamentales y un asistente de ciclo de 5 pasos:

1. **Expedientes Abiertos:** Cantidad total de expedientes activos que requieren atención o seguimiento en terreno.
2. **Contratos Vigentes:** Contratos activos con clientes, indicando horas consumidas vs. horas contratadas.
3. **Facturación Neta USD:** Monto facturado acumulado en el período activo.
4. **Excepciones Abiertas:** Alertas que requieren resolución operativa inmediata (ej. contratos próximos a vencer, OTs sin técnico, actas sin firma).

### 3.2 Centro de Control Operativo (`/control-center`)
Diseñado para la supervisión y triaje diario de incidentes:
- **Filtro de Severidad:** Permite clasificar alertas en `CRITICAL` (rojo), `WARNING` (ámbar) e `INFO` (azul).
- **Asignación de Responsables:** Permite asignar una excepción a un miembro del equipo con un solo clic.
- **Acciones Rápidas:** Enlaces directos para resolver la anomalía (ej. asignar técnico a OT huérfana o contactar al cliente para firma pendiente).

---

## 4. Gestión de Clientes, Sucursales y Contratos

### 4.1 Administración de Clientes (`/customers`)
En este módulo se gestiona el directorio de empresas atendidas por SATEM:

1. **Creación de Empresa:**
   - **Razón Social:** Nombre legal de la compañía.
   - **RUT / Tax ID:** Identificador tributario oficial (validación de formato).
   - **Giro Comercial / Industria:** Rubro o actividad económica.
   - **Email de Contacto y Teléfono:** Canales oficiales de comunicación.
2. **Entidades y Sucursales:**
   - Cada cliente puede tener múltiples sucursales asociadas (ej. *Casa Matriz Santiago*, *Planta Antofagasta*, *Data Center Quilicura*).
   - Permite georreferenciar y registrar direcciones exactas para el despacho de técnicos.
3. **Contactos Comerciales y Técnicos:**
   - Registro de contrapartes autorizadas para solicitar servicios o firmar recepciones conformes.

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [🏢 Clientes] ➔ [🏢 Empresa ABC SpA]                                   │
│ RUT: 76.123.456-K | Giro: Minería y Tecnología                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Sucursales Asociadas (3)       │ Contactos Clave (2)                   │
│ • Casa Matriz (Santiago)       │ • Juan Pérez (Jefe Infraestructura)   │
│ • Planta Norte (Calama)        │ • María Gómez (Gerente Operaciones)   │
│ • Laboratorio (Concepción)     │                                       │
└────────────────────────────────┴───────────────────────────────────────┘
```

### 4.2 Asistente de Creación de Contratos (`/contracts/wizard`)
El asistente guía la configuración contractual en 4 pasos estructurados:

1. **Paso 1 — Definición del Contrato:**
   - Selección del Cliente y Sucursal asociada.
   - Código identificador del contrato (ej. `CTR-2026-0012`).
   - Fecha de inicio y fecha de vencimiento.
2. **Paso 2 — Modalidad de Servicio:**
   - **Bolsa de Horas:** Paquete mensual de soporte con tarifas preferenciales.
   - **Mantenimiento Preventivo Periódico (SLA):** Visitas programadas mensuales/trimestrales.
   - **Proyectos Llave en Mano (SOW):** Alcance cerrado con entregables fijos.
3. **Paso 3 — Parámetros Financieros:**
   - Moneda (USD / CLP), valor hora hombre adicional, recargos fuera de horario y términos de pago.
4. **Paso 4 — Resumen y Activación:**
   - Validación global de términos y activación inmediata en el catálogo operativo.

---

## 5. Ciclo de Vida de Expedientes y Órdenes de Trabajo (OT)

El módulo de **Expedientes** (`/expedients`) es el núcleo de las operaciones técnicas de SATEM.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     ESTADOS DE UN EXPEDIENTE OPERATIVO                  │
├──────────────┐      ┌──────────────┐      ┌─────────────┐      ┌────────┤
│ 1. OPEN      │ ───> │ 2. IN_       │ ───> │ 3. PENDING_ │ ───> │ 4.     │
│ (Planificado)│      │    PROGRESS  │      │    SIGNATURE│      │ CLOSED │
└──────────────┘      └──────────────┘      └─────────────┘      └────────┘
```

### 5.1 Creación de un Expediente
1. Ingrese a `/expedients` y presione **"+ Nuevo Expediente"**.
2. Seleccione el **Cliente**, **Sucursal** y **Contrato Asociado**.
3. Ingrese el **Título del Servicio** (ej. *Mantenimiento Preventivo Tableros Eléctricos*) y la descripción del alcance.
4. Defina la prioridad (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### 5.2 Emisión y Gestión de Órdenes de Trabajo (OT)
Dentro del expediente:
1. Haga clic en **"+ Nueva Orden de Trabajo"**.
2. Defina la descripción de las tareas a ejecutar.
3. Asigne el **Técnico Líder** y la cuadrilla de apoyo.
4. Establezca la fecha programada de ejecución.

### 5.3 Registro de Atenciones y Visitas Técnicas
Los técnicos o supervisores registran el avance real de campo:
- **Fecha y Hora:** Registro del momento exacto de la visita.
- **Horas Hombre Invertidas:** Cantidad de horas dedicadas (se descuenta automáticamente de la bolsa de horas del contrato).
- **Problema Diagnosticado:** Falla o requerimiento encontrado.
- **Trabajo Realizado:** Solución técnica implementada y repuestos utilizados.
- **Evidencias y Adjuntos:** Subida de fotografías, diagramas técnicos y mediciones instrumentales.

### 5.4 Generación de Documentos y Actas de Servicio
1. En la pestaña **Documentos** del expediente, seleccione **"Generar Documento"**.
2. Elija la plantilla oficial (ej. *Acta de Recepción Conforme de Servicio* o *Informe de Mantenimiento Preventivo*).
3. El sistema autocompleta los datos del cliente, OT, atenciones y técnicos participantes.
4. El documento queda disponible para:
   - Visualización preliminar en PDF.
   - Enlace para firma del cliente a través del Portal de Clientes.
   - Envío a firma interna del supervisor SATEM.

---

## 6. Facturación, SumUp y Conciliación Bancaria

### 6.1 Módulo de Facturación (`/billing`)
Permite administrar las cuentas por cobrar y documentos tributarios:
- **Emisión de Documentos Tributarios:**
  - Soporte para Facturas de Exportación / Afectas (Tipo SII 110 y estándar chileno).
  - Asociación directa con uno o múltiples expedientes finalizados.
- **Cálculo de Comisiones Pasarela SumUp:**
  - Para pagos procesados vía tarjeta/POS SumUp, el sistema desglosa automáticamente el monto bruto, la comisión de la pasarela y el monto neto recaudado.
- **Estados de Pago:**
  - `PENDING` (Pendiente de Pago).
  - `PAID` (Pagado y Verificado).
  - `OVERDUE` (Vencido con alerta en Centro de Control).
  - `CANCELLED` (Anulado).

### 6.2 Conciliación Bancaria Automatizada (`/bank`)
Permite conciliar los movimientos bancarios de Banco Santander con las facturas emitidas:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ CONCILIACIÓN BANCARIA (SANTANDER ➔ FACTURAS SATEM)                     │
├──────────────────────────────────┬─────────────────────────────────────┤
│ Cartola Bancaria (Santander)     │ Facturas Pendientes                 │
│ • 04/10/2026: +$1.450.000 (Transf)│ • FAC-2026-0045: $1.450.000 (ABC)   │
│   Ref: 893422 - EMPRESA ABC SPA  │   [ ⚡ Conciliación Exacta (100%) ]  │
│                                  │                                     │
│ [ 📤 Cargar Cartola (.xlsx/.csv) ]│ [ 🔗 Conciliar Seleccionados ]      │
└──────────────────────────────────┴─────────────────────────────────────┘
```

**Flujo de Conciliación:**
1. **Carga de Cartola:** Presione **"Cargar Cartola"** y suba el extracto bancario en formato Excel o CSV provisto por Banco Santander.
2. **Motor de Emparejamiento Inteligente:** El sistema compara fecha, monto, RUT y número de referencia contra las facturas abiertas.
3. **Aprobación de Conciliación:**
   - **Match Exacto (Verde):** Coincidencia total de monto y cliente. Se concilia con un clic.
   - **Match Sugerido (Ámbar):** Diferencias menores o abonos parciales. Permite calzar manualmente.
4. **Cierre:** Al conciliar, la factura cambia automáticamente a estado `PAID` y se actualiza el KPI financiero.

---

## 7. Gestión de Usuarios y Plantillas PDF

### 7.1 Gestión de Usuarios Internos (`/admin/users`)
Permite administrar al personal de SATEM:
- **Creación de Usuarios:** Nombre, correo corporativo (`@satemsoluciones.com`), rol asignado y teléfono.
- **Activación / Desactivación:** Permite suspender accesos de colaboradores sin borrar el historial de auditoría ni atenciones pasadas (*Soft Delete*).
- **Reseteo de Contraseñas:** Permite forzar el cambio de credenciales ante incidentes de seguridad.

### 7.2 Gestión de Usuarios de Clientes (`/admin/client-users`)
Permite habilitar el acceso al **Portal de Clientes**:
1. Presione **"+ Invitar Usuario de Cliente"**.
2. Seleccione la **Empresa Cliente** a la que pertenece.
3. Ingrese el **Correo Corporativo** del contacto.
4. El sistema genera un **Token de Invitación Único** y envía el correo con el enlace seguro (`/portal/invite/:token`).
5. **Panel de Gestión de Accesos:**
   - Permite visualizar si el cliente ya activó su cuenta (`ACTIVE`) o si la invitación está pendiente (`INVITED`).
   - Botón **"Reenviar Invitación"** para regenerar el token si este expiró.
   - Botón **"Revocar Acceso"** para bloquear el ingreso al portal en caso de término contractual.

### 7.3 Editor de Plantillas de Documentos (`/admin/templates`)
Permite personalizar los formatos de salida de informes y actas:
- **Variables Dinámicas:** Incorporación de etiquetas como `{{customer_name}}`, `{{expedient_code}}`, `{{service_date}}`, `{{technician_list}}`.
- **Previsualización en Vivo:** Renderizado en tiempo real del PDF con el motor Puppeteer.
- **Bloques de Firma:** Inclusión de cajas de firma digital con hash criptográfico y estampa de tiempo.

---

## 8. Preguntas Frecuentes y Guía de Resolución de Problemas

### ¿Cómo recupero el acceso si un administrador olvida su contraseña?
El sistema cuenta con un mecanismo de auto-bootstrap para el superadministrador oficial (`admin@satemsoluciones.com`). Si se requiere un reseteo de emergencia, un administrador de infraestructura puede ejecutar la utilidad de mantenimiento en el servidor.

### ¿Qué ocurre si un cliente no firma el acta técnica?
El expediente permanecerá en estado `PENDING_SIGNATURE`. El Centro de Control (`/control-center`) emitirá una alerta visual para que el equipo de operaciones pueda contactar al cliente o reenviar el enlace directo desde el panel de expedientes.

### ¿Se pueden exportar todos los respaldos de un cliente para una auditoría?
Sí. Desde el módulo de expedientes, cada registro cuenta con la función de descarga de paquete comprimido `.ZIP`, que consolida el PDF del informe, actas firmadas y evidencias fotográficas.

---

*SATEM Soluciones Inteligentes SpA — Manual de Usuario Oficial para Administradores.*

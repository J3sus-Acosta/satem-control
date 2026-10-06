# Manual de Usuario — Portal de Clientes SATEM

## SATEM Soluciones Inteligentes SpA
**Plataforma:** SATEM Control — Portal Web para Clientes  
**Acceso:** `https://app.satemsoluciones.com/portal` (o URL corporativa provista)

---

## 1. Introducción al Portal de Clientes

El **Portal de Clientes de SATEM** es una plataforma web segura y en tiempo real diseñada para que su empresa pueda:
- Visualizar la **trazabilidad completa** de todos los servicios, mantenimientos y proyectos contratados.
- Consultar el **avance de expedientes**, órdenes de trabajo (OT) y atenciones técnicas ejecutadas en sus instalaciones.
- Descargar **documentación oficial**, informes técnicos y respaldos comprimidos en formato `.ZIP`.
- **Firmar electrónicamente** actas de servicio, recepciones conformes e informes técnicos desde cualquier dispositivo (computador, tablet o teléfono móvil).
- Administrar sus **credenciales de acceso** y datos de contacto de forma autónoma.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE ACCESO DEL CLIENTE                      │
├─────────────────┐      ┌──────────────────┐      ┌──────────────────────┤
│ 1. Invitación   │ ───> │ 2. Activación    │ ───> │ 3. Portal de Control │
│    por Correo   │      │    de Contraseña │      │    Expedientes/Firmas│
└─────────────────┘      └──────────────────┘      └──────────────────────┘
```

---

## 2. Activación de Cuenta y Primer Acceso

### 2.1 Recepción de la Invitación
Cuando el equipo de SATEM crea su usuario corporativo, usted recibirá un correo electrónico con un enlace único de invitación con el siguiente formato:
`https://app.satemsoluciones.com/portal/invite/<TOKEN_DE_SEGURIDAD>`

> [!NOTE]
> Por motivos de seguridad, los enlaces de invitación son de un solo uso y tienen una vigencia temporal establecida por la administración.

### 2.2 Proceso de Activación (`/portal/invite/:token`)
Al ingresar al enlace de invitación, se desplegará el formulario de activación:

| Campo | Descripción | Requisito |
| :--- | :--- | :--- |
| **Correo Electrónico** | Muestra el correo institucional asignado a su empresa | Bloqueado (solo lectura) |
| **Nombre Completo** | Nombre y apellido del contacto responsable | Obligatorio |
| **Teléfono de Contacto** | Número telefónico o móvil corporativo | Opcional (ej: `+56 9 1234 5678`) |
| **Defina su Contraseña** | Clave de acceso personal | Mínimo 6 caracteres |
| **Confirmar Contraseña** | Reescritura idéntica de la contraseña | Obligatorio |

**Pasos para activar:**
1. Verifique que el nombre de su empresa mostrado en la cabecera sea el correcto.
2. Complete su nombre completo y teléfono de contacto.
3. Ingrese una contraseña segura y confírmela en la siguiente casilla.
4. Haga clic en el botón **"Activar Cuenta e Ingresar"**. El sistema validará sus datos, creará su sesión cifrada y lo redirigirá inmediatamente a la vista de expedientes.

---

## 3. Inicio de Sesión Regular (`/portal/login`)

Una vez activada su cuenta, podrá iniciar sesión en cualquier momento desde la página de acceso:

1. Ingrese a `/portal/login`.
2. Escriba su **Correo Electrónico** y **Contraseña**.
3. Haga clic en **"Ingresar al Portal"**.

```text
┌──────────────────────────────────────────────────┐
│              PORTAL DE CLIENTES                  │
│       SATEM Soluciones Inteligentes SpA          │
├──────────────────────────────────────────────────┤
│  Correo Electrónico:                             │
│  [ ejemplo@empresa.com                        ]  │
│                                                  │
│  Contraseña:                                     │
│  [ ••••••••                                   ]  │
│                                                  │
│  [         INGRESAR AL PORTAL         ]          │
└──────────────────────────────────────────────────┘
```

> [!TIP]
> Si olvidó su contraseña o perdió el acceso, contacte a su ejecutivo de cuenta SATEM o escriba a `soporte@satemsoluciones.com` para solicitar la reemisión de su enlace de invitación.

---

## 4. Módulo de Expedientes y Servicios (`/portal/expedients`)

En este módulo encontrará el listado completo de servicios, proyectos y contratos ejecutados para su empresa.

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [🔍 Buscar por código o título...] [ Estado: Todos los Estados ▾ ]     │
├────────────────────────────────────────────────────────────────────────┤
│ EXP-2026-0042        [ En Progreso ]                                   │
│ Mantenimiento Preventivo Data Center Sucursal Norte                    │
│ 🏢 Sucursal: Casa Matriz Santiago | 📅 Fecha: 05/10/2026               │
│ 📋 2 OTs   •   🔧 4 Atenciones   •   📄 3 Documentos                  │
│                                            [ ZIP ]  [ Ver Detalle → ]  │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Filtros y Búsqueda
- **Barra de Búsqueda:** Permite buscar por código de expediente (ej. `EXP-2026-0042`), palabras clave en el título o descripción del servicio.
- **Filtro de Estados:**
  - `OPEN` (Abierto): Expediente recién creado y en etapa de planificación.
  - `IN_PROGRESS` (En Progreso): Trabajos de campo o atenciones técnicas en ejecución.
  - `COMPLETED` / `CLOSED` (Completado / Cerrado): Trabajos concluidos con recepción conforme y cierre formal.

### 4.2 Descarga Rápida en ZIP
Cada tarjeta de expediente incluye el botón **"ZIP"**. Al hacer clic, el sistema empaqueta automáticamente:
- Informes técnicos y actas en formato PDF.
- Fichas de atenciones y órdenes de trabajo asociadas.
- Evidencias fotográficas y archivos adjuntos del servicio.

---

## 5. Detalle del Expediente (`/portal/expedients/:id`)

Al seleccionar un expediente, accederá a la vista pormenorizada dividida en cuatro pestañas:

### 5.1 Pestaña 1: Resumen General
- **Datos de la Empresa y Servicio:** Muestra Razón Social, RUT, sucursal asignada, contrato SOW vinculado, fecha de apertura y fecha de cierre.
- **Integridad del Expediente:** Panel de auditoría que lista los requisitos del servicio (Informe Técnico, Acta Firmada, Facturación) indicando si se encuentran **"Verificado"** (badge verde) o **"Pendiente"** (badge ámbar).

### 5.2 Pestaña 2: Órdenes de Trabajo (OT)
- Lista cada orden de trabajo con su código (`OT-2026-XXXX`), estado y descripción.
- Si cuenta con recepción conforme, se detalla el nombre del aprobador y los comentarios de recepción.

### 5.3 Pestaña 3: Atenciones Técnicas
- Registro cronológico de visitas o atenciones remotas.
- Detalla:
  - **Fecha de atención y horas hombre dedicadas.**
  - **Problema Reportado:** Diagnóstico inicial del requerimiento.
  - **Trabajo Realizado:** Solución técnica implementada por el equipo de ingenieros.
  - **Técnicos a cargo:** Nombres de los especialistas que realizaron la labor.

### 5.4 Pestaña 4: Documentos & Firmas
- Listado de documentos oficiales emitidos (Actas de Recepción, Informes de Mantenimiento, Certificados).
- Botón **"Ver PDF"** para abrir el documento en una pestaña nueva.
- Botón **"Firmar Online"** para documentos que requieran su firma electrónica manuscrita.
- Sección de **Archivos Adjuntos y Evidencias** (fotografías de tableros, capturas de monitoreo, etc.).

---

## 6. Firma Digital de Documentos (`/portal/signatures`)

El portal cuenta con un sistema interactivo de firma digital que permite estampar su aprobación formal sin necesidad de imprimir, escanear ni enviar correos manuales.

```text
┌────────────────────────────────────────────────────────────────────────┐
│ FIRMA DIGITAL DE DOCUMENTOS                                            │
├──────────────────────────────────┬─────────────────────────────────────┤
│ Documentos por Firmar (1)        │ ACTA DE CONFORMIDAD DE SERVICIO     │
│                                  │ Código: DOC-2026-0089               │
│ ┌──────────────────────────────┐ │ Expediente: EXP-2026-0042           │
│ │ DOC-2026-0089   [Pendiente]  │ │                                     │
│ │ Acta de Conformidad          │ │ [ 👁️ Ver PDF Original ]             │
│ │ EXP-2026-0042                │ │                                     │
│ └──────────────────────────────┘ │ ┌─────────────────────────────────┐ │
│                                  │ │                                 │ │
│                                  │ │     [ Panel de Firma ]          │ │
│                                  │ │                                 │ │
│                                  │ └─────────────────────────────────┘ │
│                                  │ [ 🧹 Limpiar ]   [ 💾 Firmar Doc ]   │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### 6.1 Pasos para Firmar un Documento
1. Diríjase a la sección **"Firmar Documentos"** en el menú lateral.
2. Seleccione en la columna izquierda el documento que desea revisar.
3. Haga clic en **"Ver PDF Original"** para leer el contenido del acta en su navegador.
4. En el recuadro de firma:
   - **En Computador:** Mantenga presionado el botón izquierdo del ratón y dibuje su firma.
   - **En Tablet o Celular:** Dibuje su firma directamente con el dedo o lápiz táctil.
5. Si desea corregir el trazo, pulse **"Limpiar"**.
6. Pulse el botón **"Confirmar y Guardar Firma"**.

### 6.2 Validez y Seguridad de la Firma
Al confirmar la firma, el sistema SATEM realiza automáticamente:
- **Incrustación Vectorial:** La firma se estampa en la sección designada del documento PDF oficial.
- **Trazabilidad Forense:** Se registra la fecha y hora exacta (timestamp), la dirección IP del firmante y el identificador único del usuario.
- **Sellado Inmutable:** El documento pasa a estado **`SIGNED`** (Firmado) y queda archivado en la base de datos de auditoría.

---

## 7. Mi Perfil y Seguridad (`/portal/profile`)

En esta sección puede consultar y actualizar su información personal:

1. **Empresa Asignada y Correo:** Datos institucionales de solo lectura vinculados a su cuenta.
2. **Nombre Completo y Teléfono:** Modificables para mantener actualizado su contacto ante emergencias operativas.
3. **Cambio de Contraseña (Opcional):**
   - Ingrese su **Contraseña Actual**.
   - Defina su **Nueva Contraseña** (mínimo 6 caracteres).
   - Reingrese la confirmación y pulse **"Guardar Cambios"**.

---

## 8. Preguntas Frecuentes (FAQ)

### ¿Puedo acceder al portal desde mi teléfono móvil?
Sí. El Portal de Clientes de SATEM cuenta con un diseño 100% responsivo adaptable a smartphones y tablets, incluyendo soporte táctil para la firma de actas.

### ¿Qué hago si el enlace de activación expiró?
Comuníquese con el administrador de SATEM o solicite un reenvío a su ejecutivo comercial. Se le generará un nuevo token de acceso en minutos.

### ¿Dónde puedo descargar los respaldos de mis expedientes anteriores?
En el módulo **Mis Expedientes**, ingrese al expediente correspondiente o pulse directamente el botón **"ZIP"** para descargar todo el histórico documental.

---

*SATEM Soluciones Inteligentes SpA — Manual de Usuario Oficial para Clientes.*

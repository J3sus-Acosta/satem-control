# Design

## Context

Ver `proposal.md` para la motivación.
SATEM Control cuenta con dos interfaces web principales:
1. **Portal Web para Clientes** (`satem-control-web/src/pages/portal/`), diseñado para autoservicio de clientes empresariales, seguimiento de expedientes y firma de actas.
2. **Consola Administrativa Interna** (`satem-control-web/src/pages/admin/` y módulos raíz), diseñada para el personal de SATEM (Administradores, Operaciones, Finanzas, Técnicos).

La documentación debe ser clara, didáctica, estructurada con tablas de navegación, diagramas de flujo ASCII y ejemplos visuales de las pantallas y estados del sistema.

## Goals / Non-Goals

**Goals:**
- Crear `docs/MANUAL_PORTAL_CLIENTE.md`: Manual enfocado exclusivamente en la experiencia del cliente (activación de cuenta, navegación, expedientes, firma digital y perfil).
- Crear `docs/MANUAL_ADMINISTRADOR.md`: Manual integral para administradores y operadores de SATEM (clientes, contratos, expedientes, OTs, facturación, conciliación bancaria, plantillas y gestión de usuarios).
- Mantener un estilo visual coherente con los estándares de diseño SATEM (referencias a Dark Mode, estados de badges, roles).
- Actualizar el `README.md` principal con enlaces directos a ambos manuales.

**Non-Goals:**
- No crear archivos PDF binarios pesados en esta fase (se mantendrá en Markdown estándar con GitHub Flavored Markdown para máxima portabilidad y control de versiones).
- No modificar lógica de negocio ni componentes de frontend.

## Decisions

### 1. Documentación Modular en Formato Markdown con Tablas y Flujos
- **Decisión**: Estructurar los manuales en dos documentos Markdown independientes dentro del directorio `docs/`.
- **Alternativas consideradas**:
  - *Un único manual combinado*: Resulta confuso para un cliente externo leer configuraciones de facturación interna o plantillas de sistema.
  - *Archivos Word o PDF*: Dificultan el control de versiones en Git y la actualización continua en cada release.
- **Justificación**: Separar por audiencia garantiza que cada usuario acceda únicamente a la información pertinente a su rol y permite mantener la documentación sincronizada con el código fuente en Git.

### 2. Estructura Didáctica de los Capítulos
- **Decisión**: Cada capítulo incluirá:
  - **Objetivo**: Qué resuelve el módulo.
  - **Ruta de Acceso**: URL y menú correspondiente.
  - **Campos y Acciones**: Tablas descriptivas con campos obligatorios/opcionales.
  - **Flujo Paso a Paso**: Guía secuencial numerada.
  - **Preguntas Frecuentes y Solución de Problemas**: Respuestas a dudas comunes.

## Risks / Trade-offs

- **[Riesgo] Desactualización futura ante cambios en pantallas** → *Mitigación*: Incluir referencias explícitas a los nombres de rutas y componentes React clave para facilitar la actualización por parte del equipo de documentación.

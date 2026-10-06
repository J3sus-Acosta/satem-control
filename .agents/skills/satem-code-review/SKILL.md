---
name: satem-code-review
description: Protocolo integral de revisión de código, seguridad, arquitectura, base de datos y diseño responsive para proyectos del ecosistema SATEM.
---

# SATEM Code Review

Este skill proporciona un protocolo estructurado de revisión de código para proyectos SATEM (SATEM Soluciones Inteligentes SpA). Realiza un análisis exhaustivo en 8 dimensiones clave para garantizar la integridad, seguridad, rendimiento y coherencia visual sin modificar código durante la revisión.

---

## 1. Arquitectura y Diseño
- **Separación de Responsabilidades**: Rutas/controladores delgados, servicios con lógica de negocio aislada, persistencia desacoplada.
- **Duplicación**: Reutilización de servicios, utilidades compartidas y componentes UI.
- **Acoplamiento & Cohesión**: Módulos con responsabilidades bien delimitadas.
- **Dependencias**: No introducir paquetes npm sin justificación sólida.
- **Código Muerto**: Detección de funciones, archivos y módulos sin uso.

---

## 2. Backend (Node.js / TypeScript / REST)
- **Tipado**: Prohibido el uso indiscriminado de `any`. Tipado explícito en interfaces, esquemas y llamadas a BD.
- **Validación**: Esquemas Zod en todas las entradas (query, params, body).
- **Manejo de Errores**: Códigos HTTP semánticos (400, 401, 403, 404, 500) y mensajes limpios sin stack traces expuestos al cliente.
- **Serialización de BigInt**: Soporte para campos de archivo numéricos grandes.
- **Normalización**: Emails en minúsculas y strings sanitizados.

---

## 3. Base de Datos (Prisma / MySQL / PostgreSQL)
- **Soft Delete Obligatorio**: Consultas sobre entidades principales deben incluir `{ where: { deletedAt: null } }`.
- **Carga Modular de Relaciones**: No encadenar inclusiones profundas (`include: { ... }`) que puedan causar cuellos de botella o errores 500 ante datos faltantes.
- **Migraciones Idempotentes**: Compatibilidad con MySQL 8.0 InnoDB y runner de auto-reparación.
- **Índices & Restricciones**: Índices adecuados en campos de filtro y llaves foráneas bien definidas.
- **Regla Anti-Destructiva**: Prohibido `DROP TABLE`, `TRUNCATE` o `prisma db push` sobre producción.

---

## 4. Frontend (React / Angular / Responsive)
- **Sistema de Diseño SATEM**:
  - Tokens CSS oficiales: `--bg-primary` (#0f172a), `--bg-surface` (#1e293b), `--accent-primary` (#00a896), `--text-primary` (#f8fafc).
  - Tipografía: Outfit en headings (`h1-h3` con `clamp()`), Inter en textos y datos.
  - Modales: Estructura canónica con backdrop blur y botón de cerrar.
  - Botones y Badges: Clases estándar `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.badge-*`.
- **Diseño Responsivo**:
  - Contenedores de botones y filtros con `display: flex; flex-wrap: wrap; gap: 8px;`.
  - Rejillas adaptables con `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));`.
  - Tablas siempre dentro de contenedores con `overflow-x: auto; width: 100%;`.
  - Verificación en mobile (<768px), tablet y desktop.
- **Estados de Interfaz**: Manejo riguroso de estados `loading`, `error` y `empty`.

---

## 5. Seguridad y Confidencialidad
- **Autenticación**: JWT con firma segura, expiración razonable y cookies seguras (`HttpOnly`, `Secure`, `SameSite`).
- **Autorización (RBAC)**: Verificación en servidor de roles de usuario (ADMIN, OPERATIONS, ACCOUNTING, TECHNICIAN, VIEWER).
- **Protección contra IDOR**: Validación de propiedad y ámbito sobre recursos consultados o mutados.
- **Inyección SQL**: Consultas parametrizadas mediante Prisma; prohibida concatenación de SQL crudo.
- **Gestión de Secretos**: Prohibido hardcodear contraseñas, secretos JWT o API keys en código, Git o variables de build.
- **Resiliencia**: Rate limiting y configuración estricta de CORS.

---

## 6. Pruebas y Cobertura (QA)
- **Detección de Frameworks**: Uso del framework instalado (Vitest, Jest, Supertest, etc.).
- **Escenarios Obligatorios**: Happy path, validación de esquemas (400), autenticación/permisos (401/403) y casos de borde.
- **No Regresión**: Pruebas automáticas asociadas a correcciones de bugs previos.

---

## 7. Infraestructura y Despliegue (DevOps)
- **Compilación Limpia**: Backend y Frontend deben compilar con 0 errores de TypeScript y bundling.
- **Docker & EasyPanel**: Verificación de variables de entorno, puertos expuestos y persistencia de volúmenes.
- **Health Checks**: Endpoints de salud accesibles para monitoreo de contenedores.

---

## 8. Detección de Inconsistencias y Código Huérfano
- **Desincronización API-Frontend**: Campos esperados en UI que no son devueltos por el backend, o parámetros requeridos por la API no enviados por la UI.
- **Modelos y Campos Huérfanos**: Columnas en Prisma sin consumo real en la aplicación.
- **Variables / Funciones / Rutas Inactivas**: Código no referenciado en el sistema.

---

## Formato del Dictamen de Revisión

Todo informe emitido bajo este skill debe categorizar sus hallazgos en:

- **CRITICAL**: Vulnerabilidades de seguridad, pérdida de datos o caída del sistema.
- **HIGH**: Violación grave de estándares SATEM, errores potenciales o regresiones funcionales.
- **MEDIUM**: Deuda técnica, tipado deficiente o problemas de mantenibilidad.
- **LOW**: Mejoras menores de legibilidad o estilo.
- **SUGGESTION**: Micro-optimizaciones no bloqueantes.

> **Importante**: No modifiques código durante la revisión salvo petición expresa del usuario.

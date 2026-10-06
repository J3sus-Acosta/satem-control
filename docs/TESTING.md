# Guía de Pruebas Automatizadas — SATEM Control

## SATEM Soluciones Inteligentes SpA

Este documento describe la arquitectura, comandos y estándares para la ejecución y creación de pruebas automatizadas en **SATEM Control**.

---

## 1. Stack de Pruebas

| Capa | Herramienta | Entorno | Alcance |
| :--- | :--- | :--- | :--- |
| **Backend API** | [Vitest](https://vitest.dev/) v2 | Node.js | Rutas Fastify, Inyección HTTP (`app.inject()`), Mocks Prisma, RBAC, Zod |
| **Frontend Web** | [Vitest](https://vitest.dev/) + React Testing Library | jsdom | Componentes React (Modales, Badges), Servicios Axios, Interceptores |

---

## 2. Comandos de Ejecución

### A. Backend (`satem-control-api`)
```bash
cd satem-control-api

# Ejecutar toda la suite de pruebas
npm test

# Modo observador interactivo (Watch mode)
npm run test:watch
```

### B. Frontend (`satem-control-web`)
```bash
cd satem-control-web

# Ejecutar toda la suite de pruebas
npm test

# Modo observador interactivo (Watch mode)
npm run test:watch
```

---

## 3. Arquitectura de Pruebas Backend

Las pruebas de backend se encuentran en `satem-control-api/tests/`:

- `tests/helpers/test-app.ts`: Instancia el servidor Fastify en memoria mediante `buildServer()` y `app.ready()`. Las solicitudes se inyectan a través de `app.inject()` sin necesidad de abrir sockets de red TCP, lo que garantiza una ejecución ultrarrápida (< 100ms por suite).
- `tests/helpers/prisma-mock.ts`: Proveedor de fixtures tipados para usuarios (`buildMockUser`) y generador de tokens JWT válidos (`generateTestJwt`) con diferentes roles del enum `UserRole` (ADMIN, OPERATIONS, TECHNICIAN, VIEWER).
- `tests/modules/health.test.ts`: Pruebas de verificación de disponibilidad de los endpoints `/health` y `/api/v1/health`.
- `tests/modules/auth.test.ts`: Validación de autenticación, hash de contraseñas con bcrypt, normalización de correos a minúsculas y rechazo de usuarios inactivos o con borrado lógico (`deletedAt != null`).
- `tests/modules/rbac.test.ts`: Pruebas de control de acceso basado en roles (`roleGuard`), verificando códigos 401 (sin token) y 403 (rol no autorizado).
- `tests/modules/soft-delete.test.ts`: Validación estricta de la regla de integridad SATEM: todas las consultas de negocio deben filtrar `{ where: { deletedAt: null } }`.
- `tests/modules/validation.test.ts`: Validación de esquemas Zod con respuestas estructuradas `VALIDATION_ERROR` (código HTTP 400).

---

## 4. Arquitectura de Pruebas Frontend

Las pruebas de frontend se encuentran en `satem-control-web/src/test/`:

- `src/test/setup.ts`: Configuración global que extiende `@testing-library/jest-dom` para matchers como `toBeInTheDocument()`.
- `src/test/components/Modal.test.tsx`: Pruebas del componente estándar `Modal` de SATEM, verificando renderizado condicional, accesibilidad, backdrop blur y eventos de cierre.
- `src/test/services/api.test.ts`: Pruebas del cliente HTTP Axios (`api.ts`), verificando inyección de cabecera `Authorization: Bearer <token>`, gestión de tokens en memoria y configuración base.

---

## 5. Reglas para Nuevas Pruebas
1. **Aislamiento Total**: Ninguna prueba unitaria o de integración debe conectarse a bases de datos de producción ni requerir dependencias externas de red.
2. **Sin Falsos Positivos**: Todo endpoint nuevo debe acompañarse de pruebas para el camino feliz (*Happy Path*), caminos de error (*Validation Path*) y verificación de permisos (*Authorization Path*).
3. **No Regresión**: Si se corrige un bug, debe incorporarse un test que reproduzca el caso de borde para evitar que reaparezca.

# Proposal

## Why

SATEM Control es una plataforma crítica para la gestión operativa, contratos, expedientes, facturación y pagos de SATEM Soluciones Inteligentes SpA. Actualmente, el proyecto carece de una suite de pruebas automatizadas y ejecutables tanto en el backend (`satem-control-api`) como en el frontend (`satem-control-web`).

Esta ausencia genera riesgos en los despliegues:
- Riesgo de regresiones al realizar refactorizaciones o aplicar nuevas reglas de negocio.
- Imposibilidad de validar automáticamente las reglas de integridad de SATEM (soft delete `deletedAt`, serialización BigInt, aislamiento RBAC, hash bcrypt y carga modular de relaciones).
- Dependencia exclusiva de pruebas manuales antes de redesplegar a EasyPanel / Docker.

Implementar una suite de pruebas automatizada moderna (con Vitest y Supertest en backend, y Vitest con React Testing Library en frontend) permitirá auditar y verificar de manera continua los endpoints y componentes neurálgicos con máxima velocidad y cero fricción.

## What Changes

- **Backend Testing Framework (`satem-control-api`)**:
  - Instalación y configuración de Vitest en modo TypeScript ESM nativo, compatible con Fastify y Prisma.
  - Creación de utilidades de prueba (`test-helpers`), fixture de mocking de base de datos / cliente Prisma en memoria.
  - Implementación de pruebas automatizadas para autenticación (`/api/v1/auth`), control de roles (`RBAC`), expedientes (`/api/v1/expedients`) e integridad de soft delete.
  - Incorporación del script `"test"` y `"test:coverage"` en `satem-control-api/package.json`.

- **Frontend Testing Framework (`satem-control-web`)**:
  - Configuración de Vitest + `@testing-library/react` + `jsdom` en el entorno Vite.
  - Pruebas unitarias y de integración para componentes reutilizables base (Modales SATEM, Badges, Botones) y contratos de servicios de API (Axios client).
  - Incorporación del script `"test"` en `satem-control-web/package.json`.

- **Pipelines y Verificación**:
  - Validación de que los comandos de compilación y empaquetado (`npm run build`) no se vean afectados.
  - Guía de ejecución de pruebas en `README.md` y documentación operativa.

## Non-Goals (Fuera de Alcance)

- No se realizarán refactors de negocio en la lógica de endpoints existentes más allá de lo necesario para hacerlos testeables.
- No se reemplazarán librerías existentes de backend ni frontend.
- No se conectarán bases de datos de producción para testing; las pruebas se ejecutarán con mocks controlados o base de datos de prueba aislada.

## Capabilities

### New Capabilities
- `automated-testing-suite`: Infraestructura de pruebas unitarias y de integración para backend (Fastify + Prisma) y frontend (React + Vite) en SATEM Control.

### Modified Capabilities
<!-- No requirement changes to existing functional capabilities -->

## Impact

- **Módulos afectados**:
  - Backend: `satem-control-api/package.json`, configuración de Vitest, `satem-control-api/tests/`.
  - Frontend: `satem-control-web/package.json`, `vite.config.ts`, `satem-control-web/src/test/`.
- **APIs afectadas**: Ninguna modificación a contratos existentes; las pruebas validarán contratos actuales.
- **Base de datos**: No afecta esquemas ni migraciones de Prisma.
- **Dependencias**: Vitest, Supertest, @testing-library/react, jsdom como `devDependencies`.
- **Infraestructura**: Compatible con Docker y CI/CD en EasyPanel sin impacto en el runtime de producción.

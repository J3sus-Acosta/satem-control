# Design

## Context

Ver `proposal.md` para la justificación general.
Actualmente `satem-control-api` opera como una API REST construida sobre Node.js v22 (ESM nativo), Fastify v4 y Prisma ORM (MySQL 8.0).
`satem-control-web` está construido con Vite, React 18 y TypeScript.
Ninguno de los dos paquetes contiene suites de pruebas automatizadas configuradas en sus `package.json`.
Las pruebas deben ser rápidas, ejecutables localmente de forma aislada y sin requerir levantar manualmente bases de datos de producción ni servidores externos.

## Goals / Non-Goals

**Goals:**
- Configurar una arquitectura de testing unificada con **Vitest** en ambos subproyectos (`satem-control-api` y `satem-control-web`).
- Proveer un entorno de pruebas de endpoints Fastify mediante `app.inject()` o `supertest` que no requiera abrir sockets TCP en red.
- Implementar un patrón de mocking desacoplado para Prisma (`vitest-mock-extended` o mock manual tipado) que permita simular respuestas de base de datos sin alterar datos reales.
- Crear utilidades de prueba para generar tokens JWT y usuarios con diferentes roles (ADMIN, OPERATIONS, TECHNICIAN).
- Establecer un entorno de pruebas para React utilizando `@testing-library/react` con `jsdom` en `satem-control-web`.

**Non-Goals:**
- No implementar pruebas E2E con navegadores reales (Playwright/Cypress) en esta primera fase.
- No alterar la lógica de negocio ni la estructura de base de datos existente.
- No ejecutar pruebas contra la base de datos de producción de SATEM.

## Decisions

### 1. Vitest como Test Runner Principal
- **Decisión**: Utilizar `vitest` tanto en backend como en frontend.
- **Alternativas consideradas**:
  - *Jest*: Requiere configuración compleja para ESM nativo con TypeScript (`ts-jest`), es más pesado y tiene mayor fricción con Vite.
  - *Node Test Runner nativo*: Menos maduro en cuanto a mocks de módulos y aserciones avanzadas que Vitest.
- **Justificación**: Vitest comparte el pipeline de transformación con Vite, es extremadamente rápido, soporta ESM de forma nativa y tiene sintaxis 100% compatible con Jest (`describe`, `it`, `expect`, `vi.mock`).

### 2. Fastify Testing mediante `app.inject()`
- **Decisión**: Utilizar la función nativa `app.inject()` de Fastify en lugar de levantar un listener HTTP real con `supertest`.
- **Alternativas consideradas**:
  - *Supertest con listener en puerto*: Requiere abrir puertos TCP efímeros y lidiar con colisiones de puertos en CI/CD.
- **Justificación**: `app.inject()` simula peticiones HTTP a nivel de pila de Fastify con máxima velocidad, sin overhead de red ni puertos.

### 3. Mocking Aislado de Prisma ORM
- **Decisión**: Crear un helper `prismaMock` para inyectar modelos simulados en los tests unitarios.
- **Alternativas consideradas**:
  - *Base de datos SQLite en memoria*: Incompatible con tipos específicos y enums de MySQL 8.0 en el `schema.prisma`.
  - *Docker temporal con MySQL*: Más lento y requiere Docker activo en la máquina del desarrollador para correr un simple unit test.
- **Justificación**: Mocks tipados permiten verificar lógica de validación Zod, filtrado de `deletedAt: null` y códigos de error con ejecución instantánea (< 1 segundo).

## Risks / Trade-offs

- **[Riesgo] Divergencia entre mocks y comportamiento real de MySQL** → *Mitigación*: Tipar estrictamente los mocks basándose en los modelos generados por `@prisma/client`.
- **[Riesgo] Configuración de ESM en TypeScript con Fastify** → *Mitigación*: Crear un archivo `vitest.config.ts` optimizado en `satem-control-api` que resuelva extensiones y paths correctamente.

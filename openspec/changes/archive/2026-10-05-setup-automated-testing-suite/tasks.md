# Tasks

## 1. Configuración del Entorno de Pruebas Backend

- [x] 1.1 Instalar dependencias de desarrollo (`vitest`) en `satem-control-api/package.json` y verificar que `npm run build` siga compilando sin conflictos.
- [x] 1.2 Crear el archivo de configuración `satem-control-api/vitest.config.ts` y añadir los scripts `"test"` y `"test:watch"` en `package.json`, verificando la ejecución con `npm test -- --run`.
- [x] 1.3 Crear utilidades de prueba en `satem-control-api/tests/helpers/test-app.ts` para instanciar la aplicación Fastify con inyección HTTP (`app.inject()`) sin abrir puertos en red y verificar su inicialización.
- [x] 1.4 Crear el mock tipado de Prisma ORM en `satem-control-api/tests/helpers/prisma-mock.ts` y utilidades para generar tokens JWT de prueba con roles específicos (ADMIN, TECHNICIAN).

## 2. Suites de Pruebas de Endpoints y Reglas de Negocio Backend

- [x] 2.1 Implementar pruebas unitarias de autenticación en `satem-control-api/tests/modules/auth.test.ts` cubriendo login exitoso, contraseñas erróneas (401) y normalización de emails a minúsculas; verificar que pasen con `npm test`.
- [x] 2.2 Implementar pruebas de autorización y RBAC en `satem-control-api/tests/modules/rbac.test.ts` verificando que usuarios sin rol adecuado reciban 403 Forbidden.
- [x] 2.3 Implementar pruebas de integridad y soft delete en `satem-control-api/tests/modules/soft-delete.test.ts` verificando que consultas de clientes y expedientes excluyan registros con `deletedAt != null`.
- [x] 2.4 Implementar pruebas de validación con Zod en `satem-control-api/tests/modules/validation.test.ts` comprobando respuestas 400 estructuradas ante datos faltantes o inválidos.

## 3. Configuración y Suites de Pruebas Frontend

- [x] 3.1 Instalar dependencias de pruebas (`vitest`, `@testing-library/react`, `jsdom`, `@testing-library/jest-dom`) en `satem-control-web/package.json` y verificar que `npm run build` continúe completando con éxito.
- [x] 3.2 Configurar `satem-control-web/vite.config.ts` para habilitar el entorno de test con `globals: true` y `environment: 'jsdom'`, añadiendo el script `"test"` en `package.json`.
- [x] 3.3 Crear setup de pruebas en `satem-control-web/src/test/setup.ts` e implementar prueba de renderizado del modal SATEM en `satem-control-web/src/test/components/Modal.test.tsx` verificando que pase con `npm test -- --run`.
- [x] 3.4 Implementar pruebas para el cliente de API (`api.ts`) en `satem-control-web/src/test/services/api.test.ts` verificando interceptores de autorización e inyección de token Bearer.

## 4. Verificación de Integración y Documentación

- [x] 4.1 Ejecutar ambas suites de prueba completas (`cd satem-control-api && npm test` y `cd satem-control-web && npm test`) y confirmar que el 100% de los tests pasen limpiamente.
- [x] 4.2 Documentar la guía de ejecución de pruebas y mejores prácticas de testing en `docs/TESTING.md` y referenciarla en `README.md`.

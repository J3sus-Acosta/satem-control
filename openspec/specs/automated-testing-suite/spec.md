# automated-testing-suite Specification

## Purpose

Proporcionar una infraestructura integral y automatizada de pruebas unitarias y de integración para el ecosistema SATEM Control, cubriendo el servidor backend (Fastify + Prisma) y el cliente web (React + Vite).

## Requirements

### Requirement: Ejecución Automatizada de Pruebas en Backend
El backend MUST contar con un framework de pruebas basado en Vitest que permita ejecutar suites de pruebas unitarias y de integración sobre rutas y servicios sin requerir un servidor externo corriendo.

#### Scenario: Ejecución de suite de pruebas de autenticación
- **WHEN** el desarrollador o CI ejecuta `npm run test` en `satem-control-api`
- **THEN** Vitest compila y ejecuta las pruebas de endpoints de autenticación, validando inicio de sesión exitoso, credenciales inválidas (401) y normalización de correo en minúsculas.

#### Scenario: Verificación de regla de Soft Delete en consultas
- **WHEN** se ejecutan pruebas de integración sobre los módulos de clientes y expedientes
- **THEN** la suite verifica que los registros con `deletedAt != null` sean excluidos de los listados (`findMany`, `count`) y de los agregados.

#### Scenario: Cobertura de manejo de errores y validación Zod
- **WHEN** se envía un payload con campos faltantes o tipos inválidos a los endpoints bajo prueba
- **THEN** la respuesta devuelve código HTTP 400 y una estructura de error legible sin exponer detalles internos ni stack traces.

### Requirement: Ejecución Automatizada de Pruebas en Frontend
El frontend en `satem-control-web` MUST contar con un entorno de pruebas con Vitest, React Testing Library y jsdom para evaluar la renderización y lógica de componentes.

#### Scenario: Renderización y accesibilidad del Modal SATEM
- **WHEN** se monta el componente modal estándar de SATEM con propiedades de prueba
- **THEN** el componente renderiza el título, icono, backdrop con efecto blur y dispara la función de cierre al hacer clic en el botón X o Cancelar.

#### Scenario: Integración del Cliente API de Frontend
- **WHEN** se invocan los métodos del cliente `api` (Axios) con respuestas simuladas
- **THEN** se gestionan correctamente los tokens JWT en cabeceras y se capturan los errores 401 para redirección al login.

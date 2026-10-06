# Bootstrap — SATEM Multi-Agente + OpenSpec + Antigravity

## SATEM Soluciones Inteligentes SpA

Este documento configura un ecosistema de desarrollo multi-agente para proyectos SATEM utilizando **Antigravity + OpenSpec**.

El objetivo es que Antigravity pueda tomar un proyecto SATEM existente, analizar su arquitectura, planificar cambios mediante OpenSpec y ejecutar las tareas utilizando agentes especializados para backend, frontend, base de datos, testing, seguridad, revisión y DevOps.

---

# 1. Objetivo

Crear desde cero la estructura necesaria para trabajar en SATEM mediante:

```text
Antigravity
     │
     ▼
OpenSpec
     │
     ├── proposal.md
     ├── specs/
     ├── design.md
     └── tasks.md
     │
     ▼
SATEM Orchestrator
     │
     ├── Requirements Analyst
     ├── Solution Architect
     ├── Node.js / TypeScript Backend
     ├── React Developer
     ├── Angular Developer
     ├── Database / Prisma
     ├── Tester / QA
     ├── Security Reviewer
     ├── Code Reviewer
     ├── Performance Reviewer
     ├── DevOps
     └── Documentation
```

OpenSpec define **qué debe hacerse**.

Los agentes determinan **cómo implementarlo correctamente** dentro de la arquitectura SATEM.

---

# 2. Principios fundamentales SATEM

Todos los agentes deben respetar los siguientes principios.

## 2.1 OpenSpec es la fuente de verdad

Cuando existe un cambio activo de OpenSpec:

```text
proposal
    ↓
spec
    ↓
design
    ↓
tasks
    ↓
implementation
    ↓
tests
    ↓
review
    ↓
archive
```

Los agentes no deben inventar requisitos que contradigan los documentos OpenSpec.

---

## 2.2 No modificar código fuera del alcance

Cada tarea debe indicar:

```text
Files to modify
Files allowed to create
Files explicitly out of scope
```

No realizar refactors no relacionados solamente porque sean posibles.

---

## 2.3 Analizar antes de modificar

Antes de modificar cualquier archivo:

1. Leer el archivo.
2. Revisar sus dependencias.
3. Revisar quién lo utiliza.
4. Revisar modelos y contratos relacionados.
5. Revisar tests existentes.
6. Determinar impacto.
7. Recién entonces modificar.

---

## 2.4 Seguridad desde el diseño

Todo código SATEM debe considerar:

* autenticación;
* autorización;
* validación de entrada;
* sanitización;
* control de acceso;
* protección contra inyección;
* gestión segura de secretos;
* manejo de errores;
* logs sin información sensible;
* cookies seguras;
* CORS;
* CSRF cuando corresponda;
* rate limiting cuando corresponda;
* control de sesiones;
* auditoría de operaciones sensibles.

---

# 3. Stack tecnológico SATEM

El ecosistema debe adaptarse al proyecto concreto, pero la base tecnológica SATEM es:

## Backend

```text
Node.js
TypeScript
Express
REST API
Prisma
MySQL / PostgreSQL
JWT
HTTP-only cookies
Zod u otra librería de validación existente
```

No introducir una librería nueva si el proyecto ya posee una solución equivalente.

---

## Frontend

SATEM utiliza:

```text
React
Angular
TypeScript
HTML
CSS
```

El agente debe detectar cuál framework utiliza realmente el proyecto antes de modificar código.

No convertir React a Angular ni Angular a React salvo que sea explícitamente parte del requerimiento.

---

## Infraestructura

El ecosistema SATEM puede utilizar:

```text
Docker
EasyPanel
VPS
Nginx / reverse proxy
Node.js
MySQL
PostgreSQL
Git
```

Los agentes deben respetar la infraestructura existente.

No cambiar proveedor, servidor, base de datos o arquitectura de despliegue sin requerimiento explícito.

---

# 4. Estructura del ecosistema

La estructura esperada será:

```text
.agents/
└── subagents/
    ├── orchestrator.md
    ├── requirements-analyst.md
    ├── solution-architect.md
    ├── backend-node.md
    ├── frontend-react.md
    ├── frontend-angular.md
    ├── database-prisma.md
    ├── api-architect.md
    ├── tester.md
    ├── debugger.md
    ├── security-reviewer.md
    ├── code-reviewer.md
    ├── performance-reviewer.md
    ├── devops.md
    └── documentation.md

.agents/
└── skills/
    └── satem-code-review/
        └── SKILL.md

openspec/
├── config.yaml
└── changes/

SATEM_AGENT_GUIDE.md
BOOTSTRAP.md
```

Si Antigravity utiliza una estructura diferente en la versión instalada, debe conservarse la estructura funcional equivalente sin introducir archivos específicos de Claude Code.

---

# 5. Instrucciones para Antigravity

Eres un agente de bootstrap.

Debes crear y configurar el ecosistema SATEM desde cero.

No debes asumir que alguno de los archivos existe.

Debes:

1. Detectar la raíz del proyecto.
2. Analizar el stack existente.
3. Detectar Node.js.
4. Detectar TypeScript.
5. Detectar Express.
6. Detectar React y/o Angular.
7. Detectar Prisma.
8. Detectar MySQL y/o PostgreSQL.
9. Detectar Docker.
10. Detectar configuración de EasyPanel cuando exista.
11. Detectar OpenSpec.
12. Crear la estructura de agentes.
13. Crear las instrucciones de cada agente.
14. Crear el orquestador.
15. Crear la guía SATEM.
16. Inicializar OpenSpec cuando corresponda.
17. Crear `openspec/config.yaml`.
18. Ejecutar validaciones.
19. No modificar código de aplicación durante el bootstrap.

### Regla importante

El bootstrap configura el ecosistema de desarrollo.

**No debe implementar funcionalidades de negocio.**

---

# 6. Step 1 — Detectar raíz del proyecto

Antigravity debe determinar la raíz real del proyecto.

Buscar archivos como:

```text
package.json
tsconfig.json
package-lock.json
pnpm-lock.yaml
yarn.lock
npm-shrinkwrap.json
prisma/schema.prisma
docker-compose.yml
Dockerfile
```

Ejemplo:

```bash
find . -maxdepth 3 \
  \( -name "package.json" \
  -o -name "tsconfig.json" \
  -o -name "prisma" \
  -o -name "Dockerfile" \) \
  2>/dev/null
```

Si el usuario ya está en la raíz del proyecto, utilizar ese directorio.

No crear una segunda aplicación ni mover archivos existentes.

---

# 7. Step 2 — Detectar stack

Ejecutar una inspección del proyecto.

Revisar:

```bash
node --version
npm --version
```

Luego analizar:

```text
package.json
tsconfig.json
src/
app/
server/
backend/
frontend/
client/
prisma/
```

Determinar:

```text
Backend:
- Node.js
- TypeScript
- Express

Frontend:
- React
- Angular
- ambos
- ninguno

Database:
- Prisma
- MySQL
- PostgreSQL
- otra

Infrastructure:
- Docker
- EasyPanel
- VPS
```

El resultado debe quedar documentado en el reporte del bootstrap.

---

# 8. Step 3 — Verificar OpenSpec

Comprobar:

```bash
openspec --version
```

Si OpenSpec está disponible:

```text
OpenSpec CLI detectado ✓
```

Si no está disponible, intentar instalarlo mediante npm utilizando el método oficialmente documentado para la versión actual.

Después verificar nuevamente:

```bash
openspec --version
```

Si la instalación no puede realizarse automáticamente, detener únicamente este paso y reportar claramente el problema.

No modificar el código de aplicación para resolver un problema del CLI.

---

# 9. Step 4 — Crear agentes SATEM

Crear:

```text
.agents/subagents/
```

Los siguientes agentes deben existir.

---

# 10. Agent — Orchestrator

Archivo:

```text
.agents/subagents/orchestrator.md
```

Responsabilidad:

```text
Coordinar el ciclo completo de implementación.
```

Debe:

1. Leer OpenSpec.
2. Analizar `tasks.md`.
3. Identificar dependencias.
4. Seleccionar agentes.
5. Ejecutar tareas en orden.
6. Solicitar revisión.
7. Coordinar correcciones.
8. Ejecutar validaciones.
9. Marcar tareas completadas.
10. Generar reporte final.

Pipeline:

```text
OpenSpec
   ↓
Requirements Analyst
   ↓
Solution Architect
   ↓
Implementation Agent
   ↓
Tester
   ↓
Security Review
   ↓
Code Review
   ↓
Performance Review
   ↓
DevOps validation
   ↓
Complete
```

No debe implementar código directamente salvo cambios triviales de configuración cuando sea estrictamente necesario.

---

# 11. Agent — Requirements Analyst

Archivo:

```text
.agents/subagents/requirements-analyst.md
```

Responsabilidad:

Convertir necesidades de negocio SATEM en requisitos técnicos claros.

Debe identificar:

* objetivo;
* actores;
* casos de uso;
* reglas de negocio;
* entradas;
* salidas;
* errores;
* permisos;
* dependencias;
* restricciones;
* criterios de aceptación;
* requisitos no funcionales.

Debe detectar ambigüedades antes de comenzar la implementación.

No debe modificar código.

---

# 12. Agent — Solution Architect

Archivo:

```text
.agents/subagents/solution-architect.md
```

Responsabilidad:

Diseñar la solución técnica antes de implementar.

Debe analizar:

```text
Frontend
Backend
API
Database
Authentication
Authorization
Integrations
Infrastructure
Testing
Security
```

Debe respetar la arquitectura existente.

No crear una nueva arquitectura solamente por preferencia personal.

Debe priorizar:

```text
simplicidad
mantenibilidad
seguridad
separación de responsabilidades
reutilización
escalabilidad razonable
compatibilidad con SATEM
```

---

# 13. Agent — Node.js Backend Developer

Archivo:

```text
.agents/subagents/backend-node.md
```

Responsabilidad:

Implementar backend utilizando:

```text
Node.js
TypeScript
Express
Prisma
REST APIs
```

Debe respetar:

### TypeScript

Preferir:

```text
tipado explícito
interfaces/types coherentes
strict mode
evitar any
```

No utilizar:

```typescript
any
```

sin justificación técnica.

---

### Express

Mantener separación clara entre:

```text
routes
controllers
services
repositories
middleware
schemas
types
utils
```

Cuando esa separación sea compatible con la arquitectura existente.

No introducir capas innecesarias.

---

### Controllers

Los controllers deben:

* recibir requests;
* validar entrada;
* delegar lógica;
* devolver respuestas.

No deben contener lógica de negocio compleja.

---

### Services

Los services contienen lógica de negocio.

Deben evitar:

```text
SQL directo
acceso HTTP directo
manejo de Express
```

cuando esos aspectos pertenecen a otras capas existentes.

---

### Prisma

Utilizar Prisma como capa ORM cuando ya sea parte del proyecto.

No escribir SQL manual si Prisma puede resolver correctamente la operación.

Si SQL manual es estrictamente necesario:

* justificarlo;
* parametrizarlo;
* evitar SQL injection;
* documentar la razón.

---

# 14. Agent — React Developer

Archivo:

```text
.agents/subagents/frontend-react.md
```

Responsabilidad:

Desarrollar interfaces React cuando el proyecto utilice React.

Debe:

* reutilizar componentes;
* evitar duplicación;
* separar UI de lógica compleja;
* manejar estados correctamente;
* validar estados loading/error/empty;
* mantener responsive design;
* respetar el sistema visual existente;
* mantener accesibilidad razonable.

No introducir librerías de UI nuevas sin necesidad.

---

# 15. Agent — Angular Developer

Archivo:

```text
.agents/subagents/frontend-angular.md
```

Responsabilidad:

Desarrollar aplicaciones Angular cuando el proyecto utilice Angular.

Debe respetar:

```text
components
services
guards
interceptors
pipes
models/types
```

según la arquitectura existente.

Debe:

* evitar lógica de negocio pesada dentro de componentes;
* utilizar servicios apropiadamente;
* mantener tipado fuerte;
* reutilizar componentes;
* respetar responsive design;
* manejar estados de error;
* mantener accesibilidad.

No modificar React ni crear una segunda implementación si Angular no corresponde al proyecto.

---

# 16. Agent — Database / Prisma

Archivo:

```text
.agents/subagents/database-prisma.md
```

Responsabilidad:

Gestionar:

```text
Prisma schema
migrations
relations
indexes
constraints
queries
data integrity
```

Antes de modificar `schema.prisma` debe analizar:

```text
modelos existentes
relaciones
foreign keys
indexes
unique constraints
migraciones
datos existentes
```

Regla crítica:

**Nunca ejecutar cambios destructivos sobre producción sin autorización explícita.**

No utilizar:

```bash
prisma db push
```

contra producción cuando exista una estrategia de migraciones.

Preferir migraciones controladas.

---

# 17. Agent — API Architect

Archivo:

```text
.agents/subagents/api-architect.md
```

Responsabilidad:

Revisar contratos REST.

Debe verificar:

```text
HTTP methods
status codes
request schemas
response schemas
pagination
filtering
sorting
errors
authentication
authorization
idempotency
```

Debe evitar cambios incompatibles con clientes existentes.

Cuando una API cambia, debe identificar:

```text
frontend affected
external clients affected
documentation affected
tests affected
```

---

# 18. Agent — Tester / QA

Archivo:

```text
.agents/subagents/tester.md
```

Responsabilidad:

Validar comportamiento real.

Debe detectar automáticamente el framework de testing utilizado por el proyecto.

Puede utilizar:

```text
Vitest
Jest
Supertest
Playwright
Cypress
```

según lo que ya exista en el proyecto.

No debe introducir múltiples frameworks de testing sin justificación.

Debe cubrir:

```text
happy path
validation
error path
edge cases
authorization
authentication
database behavior
API behavior
UI behavior
```

Debe ejecutar los tests existentes antes y después de los cambios cuando sea relevante.

---

# 19. Agent — Debugger

Archivo:

```text
.agents/subagents/debugger.md
```

Responsabilidad:

Investigar errores.

Proceso:

```text
reproducir
↓
observar
↓
aislar
↓
determinar causa raíz
↓
corregir
↓
crear regresión
↓
validar
```

No realizar cambios aleatorios hasta que exista una hipótesis razonable de causa raíz.

---

# 20. Agent — Security Reviewer

Archivo:

```text
.agents/subagents/security-reviewer.md
```

Responsabilidad:

Auditar seguridad.

Debe revisar como mínimo:

### Authentication

```text
JWT
refresh tokens
cookies
session handling
expiration
rotation
```

### Authorization

```text
RBAC
permissions
resource ownership
tenant isolation
branch isolation
```

### API

```text
input validation
rate limiting
CORS
CSRF
injection
mass assignment
IDOR
```

### Database

```text
SQL injection
Prisma query safety
sensitive fields
access control
```

### Secrets

Nunca aceptar:

```text
passwords
JWT secrets
API keys
tokens
credentials
```

hardcodeados en el código.

Debe revisar:

```text
.env
.env.example
Docker
EasyPanel
CI/CD
logs
```

---

# 21. Agent — Code Reviewer

Archivo:

```text
.agents/subagents/code-reviewer.md
```

Debe revisar:

### Arquitectura

* separación de responsabilidades;
* duplicación;
* dependencias innecesarias;
* acoplamiento;
* código muerto.

### TypeScript

* `any`;
* tipos incorrectos;
* casts innecesarios;
* errores de null/undefined;
* funciones excesivamente complejas.

### Backend

* controllers con demasiada lógica;
* services excesivamente grandes;
* queries duplicadas;
* errores mal manejados.

### Frontend

* componentes demasiado grandes;
* lógica duplicada;
* estado innecesario;
* problemas responsive;
* errores de accesibilidad.

### Database

* campos sin uso;
* modelos sin referencias;
* relaciones incorrectas;
* indexes faltantes;
* migraciones peligrosas.

### General

* código no utilizado;
* variables no utilizadas;
* imports no utilizados;
* endpoints sin consumidores;
* funciones sin consumidores;
* componentes sin uso;
* modelos sin uso.

El reviewer debe diferenciar:

```text
CRITICAL
HIGH
MEDIUM
LOW
SUGGESTION
```

---

# 22. Agent — Performance Reviewer

Archivo:

```text
.agents/subagents/performance-reviewer.md
```

Debe analizar:

```text
N+1 queries
queries innecesarias
over-fetching
under-fetching
loops costosos
renders innecesarios
bundle size
memory leaks
caching
pagination
database indexes
API latency
```

No optimizar prematuramente.

Cada recomendación debe explicar:

```text
problema
impacto
solución
```

---

# 23. Agent — DevOps

Archivo:

```text
.agents/subagents/devops.md
```

Responsabilidad:

Revisar despliegue.

Debe considerar:

```text
Docker
EasyPanel
VPS
environment variables
health checks
logs
ports
reverse proxy
database
backups
migrations
rollback
```

No modificar infraestructura de producción sin autorización explícita.

Debe validar que:

```text
build
start
migration
healthcheck
environment
```

sean coherentes.

---

# 24. Agent — Documentation

Archivo:

```text
.agents/subagents/documentation.md
```

Debe mantener actualizados cuando corresponda:

```text
README.md
API documentation
architecture documentation
OpenSpec
environment documentation
deployment documentation
```

No documentar código obvio.

La documentación debe explicar decisiones y procedimientos útiles.

---

# 25. SATEM Code Review Skill

Crear:

```text
.agents/skills/satem-code-review/SKILL.md
```

Contenido conceptual:

```text
# SATEM Code Review

Realiza una revisión integral del proyecto SATEM.

## 1. Arquitectura

Revisar:

- separación de responsabilidades
- duplicación
- acoplamiento
- dependencias
- código muerto

## 2. Backend

Revisar:

- Node.js
- TypeScript
- Express
- controllers
- services
- middleware
- validaciones
- errores
- APIs

## 3. Database

Revisar:

- Prisma
- modelos
- relaciones
- índices
- migraciones
- campos sin uso
- queries innecesarias

## 4. Frontend

Si existe React:

- componentes
- hooks
- estado
- responsive
- accesibilidad

Si existe Angular:

- components
- services
- guards
- interceptors
- state
- responsive
- accesibilidad

## 5. Seguridad

Revisar:

- autenticación
- autorización
- JWT
- cookies
- secretos
- CORS
- CSRF
- injection
- IDOR
- validación

## 6. Testing

Revisar:

- cobertura
- happy path
- errores
- edge cases
- regresiones
- tests de API

## 7. Infraestructura

Revisar:

- Docker
- EasyPanel
- variables de entorno
- health checks
- logs
- migrations
- producción

## 8. Base de datos y código sin uso

Buscar:

- campos sin uso
- variables sin uso
- funciones sin uso
- endpoints sin consumidores
- componentes sin consumidores
- modelos sin referencias
- tablas potencialmente obsoletas
- imports sin uso

## Resultado

Generar:

### CRITICAL

Problemas que pueden provocar:

- vulnerabilidad
- pérdida de datos
- corrupción
- caída
- incumplimiento de reglas fundamentales

### HIGH

Problemas importantes que deberían corregirse.

### MEDIUM

Problemas de arquitectura, mantenibilidad o calidad.

### LOW

Mejoras menores.

### SUGGESTIONS

Mejoras opcionales.

Nunca modificar código durante una revisión salvo que el usuario lo solicite explícitamente.
```

---

# 26. Feature Orchestrator

Crear:

```text
.agents/subagents/orchestrator.md
```

El flujo será:

```text
1. Detect OpenSpec
2. Read proposal
3. Read specification
4. Read design
5. Read tasks
6. Analyze dependencies
7. Assign task
8. Implement
9. Test
10. Security review
11. Code review
12. Performance review
13. Fix blocking findings
14. Validate
15. Mark task completed
16. Continue
17. Final verification
```

---

# 27. Flujo por tarea

Para cada tarea:

```text
                 ┌────────────────────┐
                 │ OpenSpec task      │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │ Requirements      │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │ Architecture      │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │ Implementation    │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │ Tests              │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │ Security Review    │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │ Code Review        │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │ Performance        │
                 └─────────┬──────────┘
                           ↓
                    APPROVED?
                     /      \
                   NO        YES
                   ↓          ↓
                 FIX       [x] task
                   │          ↓
                   └────→ NEXT
```

---

# 28. Regla de corrección

Cuando un reviewer encuentre problemas:

```text
CRITICAL
HIGH
```

el orchestrator debe devolver la tarea al agente correspondiente.

No debe enviar al agente todo el informe si solamente necesita corregir dos problemas.

Debe generar un prompt específico:

```text
Problem:
Expected:
Current:
File:
Line:
Required correction:
Out of scope:
```

Máximo:

```text
2 ciclos de corrección por tarea
```

Si después de dos ciclos continúa fallando:

```text
PAUSE
REPORT
WAIT FOR USER
```

---

# 29. OpenSpec

Verificar:

```bash
openspec list
```

Si no está inicializado:

```bash
openspec init
```

Crear:

```text
openspec/config.yaml
```

---

# 30. OpenSpec config SATEM

El archivo debe contener un contexto equivalente a:

```yaml
schema: spec-driven

context: |

  Project: SATEM Soluciones Inteligentes SpA

  Purpose:
    Plataforma tecnológica empresarial desarrollada y administrada por SATEM
    para soportar procesos internos, clientes, servicios tecnológicos,
    automatización, operaciones y futuras funcionalidades de SATEM ONE.

  Development philosophy:
    - OpenSpec-driven development
    - Multi-agent development
    - Security by design
    - Minimal changes
    - Reusable architecture
    - Strong typing
    - Automated testing
    - Maintainability

  Backend:
    - Node.js
    - TypeScript
    - Express
    - REST API
    - Prisma

  Database:
    - MySQL and/or PostgreSQL depending on project
    - Prisma ORM
    - Controlled migrations

  Frontend:
    - React
    - Angular
    - TypeScript
    - Responsive design

  Infrastructure:
    - Docker
    - EasyPanel
    - VPS
    - Environment variables
    - Reverse proxy

  Authentication:
    - JWT when appropriate
    - Secure HTTP-only cookies when appropriate
    - Refresh token rotation where implemented
    - Role-based authorization

  General coding rules:
    - TypeScript preferred over JavaScript for application code
    - Avoid any unless technically justified
    - Avoid duplicated business logic
    - Keep controllers thin
    - Business logic belongs in services
    - Database access should be isolated
    - Validate external input
    - Never hardcode secrets
    - Never expose sensitive information in logs
    - Prefer small cohesive functions
    - Prefer descriptive names
    - Remove unused code
    - Do not introduce dependencies without justification

  Frontend rules:
    - Responsive design required
    - Reuse components
    - Avoid duplicated UI logic
    - Handle loading, empty and error states
    - Maintain accessibility
    - Respect the existing visual system

  Database rules:
    - Do not perform destructive production changes without authorization
    - Prefer migrations
    - Review relations and indexes before schema changes
    - Check whether new fields are actually consumed
    - Avoid unused database fields

  API rules:
    - Validate request input
    - Use consistent HTTP status codes
    - Return predictable error structures
    - Protect authenticated endpoints
    - Enforce authorization server-side
    - Avoid exposing internal implementation details

  Testing:
    - Detect and use the project's existing test framework
    - Prefer behavior-oriented tests
    - Test happy paths
    - Test validation failures
    - Test authorization failures
    - Test edge cases
    - Add regression tests for discovered bugs

  Security:
    - Authentication
    - Authorization
    - Input validation
    - Injection prevention
    - CORS
    - CSRF when applicable
    - Secure cookies
    - Secret management
    - Rate limiting where appropriate
    - Audit sensitive operations

  SATEM architecture principle:
    Preserve the existing architecture whenever possible.
    Do not introduce a new framework or database merely because another
    technology is preferred by the agent.

rules:

  proposal:

    - Clearly define the business objective.
    - Define scope and non-goals.
    - Identify affected modules.
    - Identify affected APIs.
    - Identify affected database models.
    - Identify security implications.
    - Identify frontend impact.
    - Identify infrastructure impact.
    - Identify external integrations.

  tasks:

    - Break work into small independently verifiable tasks.
    - Every task must identify affected files or modules.
    - Include testing tasks for new business logic.
    - Include security validation when authentication or authorization changes.
    - Include migration validation when database structure changes.
    - Include frontend validation when UI behavior changes.

operations:

  apply:

    guidance:

      - Read existing code before changing it.
      - Do not modify unrelated files.
      - Follow the existing architecture.
      - Reuse existing services and utilities.
      - Do not introduce dependencies without justification.
      - Run appropriate tests after implementation.
      - Update documentation when architecture changes.

  archive:

    guidance:

      - Confirm that implementation matches OpenSpec.
      - Confirm tests pass.
      - Confirm security review completed when applicable.
      - Confirm architecture documentation is updated.
      - Confirm no pending tasks remain.
```

---

# 31. SATEM Agent Guide

Crear:

```text
SATEM_AGENT_GUIDE.md
```

Debe convertirse en el manual permanente del equipo.

Contenido:

# SATEM — Manual Multi-Agente + OpenSpec

## Arquitectura

```text
                 SATEM
                   │
                   ▼
              Antigravity
                   │
                   ▼
               OpenSpec
                   │
          ┌────────┴────────┐
          │                 │
       Planning         Tasks
          │                 │
          └────────┬────────┘
                   ▼
              Orchestrator
                   │
       ┌───────────┼────────────┐
       │           │            │
   Backend      Frontend      Database
       │           │            │
       └───────────┼────────────┘
                   ▼
                 Tests
                   │
                   ▼
               Security
                   │
                   ▼
                Review
                   │
                   ▼
               Approved
                   │
                   ▼
             OpenSpec archive
```

---

# 32. Agentes

| Agente               | Responsabilidad                |
| -------------------- | ------------------------------ |
| orchestrator         | Coordina todo el proceso       |
| requirements-analyst | Analiza requisitos             |
| solution-architect   | Diseña arquitectura            |
| backend-node         | Node.js / Express / TypeScript |
| frontend-react       | React                          |
| frontend-angular     | Angular                        |
| database-prisma      | Prisma / DB                    |
| api-architect        | Contratos REST                 |
| tester               | Testing                        |
| debugger             | Diagnóstico                    |
| security-reviewer    | Seguridad                      |
| code-reviewer        | Calidad                        |
| performance-reviewer | Performance                    |
| devops               | Docker / EasyPanel / VPS       |
| documentation        | Documentación                  |

---

# 33. Flujo recomendado

## Feature pequeña

```text
Usuario
   ↓
Antigravity
   ↓
Orchestrator
   ↓
Implementación
   ↓
Tests
   ↓
Review
```

---

## Feature compleja

```text
1. OpenSpec proposal

2. Requirements analysis

3. Architecture design

4. OpenSpec specification

5. Tasks

6. Orchestrator

7. Backend / Frontend / Database agents

8. Tests

9. Security review

10. Code review

11. Performance review

12. DevOps validation

13. Mark tasks completed

14. OpenSpec archive
```

---

# 34. Reglas para agentes

Todos los agentes deben:

* leer antes de modificar;
* respetar OpenSpec;
* respetar el stack existente;
* evitar cambios fuera de alcance;
* no inventar requisitos;
* no introducir dependencias innecesarias;
* no hardcodear secretos;
* no realizar cambios destructivos en producción;
* ejecutar pruebas;
* reportar cambios;
* reportar problemas;
* dejar evidencia de validación.

---

# 35. Detección de código sin uso

Una revisión SATEM debe intentar detectar:

```text
Variables sin uso
Imports sin uso
Funciones sin referencias
Métodos sin consumidores
Endpoints sin consumidores
Componentes sin referencias
Hooks sin referencias
Servicios sin referencias
Modelos Prisma sin uso
Campos Prisma sin consumidores
Tablas sin uso
Enums sin uso
Tipos TypeScript sin uso
Dependencias npm no utilizadas
Variables de entorno no utilizadas
Rutas sin consumidores
```

La detección debe considerar referencias indirectas antes de declarar algo como "sin uso".

Nunca eliminar automáticamente algo solamente porque no aparezca utilizado en una búsqueda simple.

---

# 36. Detección de inconsistencias

El ecosistema SATEM debe buscar:

```text
Frontend esperando campo que API no entrega
API esperando campo que frontend no envía
Modelo Prisma diferente al código
Variables de entorno declaradas pero no utilizadas
Variables utilizadas pero no documentadas
Endpoints documentados pero inexistentes
Endpoints existentes pero no documentados
Roles declarados pero no validados
Permisos implementados parcialmente
Migraciones faltantes
Tipos desactualizados
Interfaces desactualizadas
```

---

# 37. Responsive Design

Toda aplicación web SATEM debe considerar:

```text
Mobile
Tablet
Desktop
```

No se debe asumir que una interfaz desktop será suficiente.

Al modificar una pantalla:

1. revisar desktop;
2. revisar tablet;
3. revisar mobile;
4. revisar navegación;
5. revisar tablas;
6. revisar formularios;
7. revisar modales;
8. revisar botones;
9. revisar overflow horizontal.

---

# 38. Reglas de base de datos

Antes de modificar una base de datos:

```text
1. Leer schema.prisma
2. Identificar relaciones
3. Identificar consumidores
4. Identificar migraciones
5. Evaluar datos existentes
6. Evaluar impacto
7. Crear migración
8. Ejecutar tests
9. Validar
```

No eliminar:

```text
columnas
tablas
relaciones
índices
```

sin determinar el impacto.

---

# 39. Reglas de producción

Los agentes no deben ejecutar automáticamente:

```text
DROP DATABASE
DROP TABLE
TRUNCATE
DELETE masivo
migraciones destructivas
db push contra producción
```

sin autorización explícita.

La existencia de credenciales en `.env` no constituye autorización para realizar operaciones destructivas.

---

# 40. Variables de entorno

Nunca introducir secretos directamente en:

```text
source code
Git
README
OpenSpec
logs
tests
```

Utilizar:

```text
.env
.env.example
EasyPanel environment variables
```

según corresponda.

`.env.example` debe contener nombres, pero no secretos reales.

---

# 41. Git

Antes de realizar modificaciones importantes:

```bash
git status
```

El agente debe saber:

```text
branch actual
cambios existentes
archivos modificados
```

Nunca sobrescribir cambios preexistentes del usuario.

No ejecutar automáticamente:

```bash
git reset --hard
git clean -fd
git checkout -- .
```

---

# 42. Reporte de cada agente

Todos los agentes deben reportar:

```text
## Agent Report

### Objective
Qué debía realizar.

### Files analyzed
Archivos revisados.

### Files modified
Archivos modificados.

### Changes
Qué cambió.

### Validation
Qué pruebas/comandos ejecutó.

### Problems
Problemas encontrados.

### Remaining work
Trabajo pendiente.
```

---

# 43. Reporte final

El Orchestrator debe entregar:

```text
# SATEM Implementation Report

## Change

<nombre>

## Objective

<objetivo>

## Tasks

<completed>/<total>

## Files modified

<lista>

## Database

<impacto>

## API

<impacto>

## Frontend

<impacto>

## Security

PASS / FINDINGS

## Tests

PASS / FAIL

## Build

PASS / FAIL

## Code Review

APPROVED / NEEDS FIXES

## Performance

PASS / FINDINGS

## Deployment

PASS / NOT REQUIRED

## OpenSpec

COMPLETE / INCOMPLETE

## Remaining risks

<lista>

## Recommendation

<resultado final>
```

---

# 44. Comandos de referencia

Los comandos exactos dependen de la configuración del proyecto.

Como mínimo revisar:

```bash
npm install
npm run build
npm test
npm run lint
```

Cuando existan:

```bash
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
```

Para Prisma:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
```

No ejecutar comandos destructivos automáticamente.

---

# 45. Smoke Test del Bootstrap

Después de crear los archivos verificar:

```bash
node --version
npm --version
openspec --version
```

Verificar:

```text
.agents/subagents/orchestrator.md
.agents/subagents/requirements-analyst.md
.agents/subagents/solution-architect.md
.agents/subagents/backend-node.md
.agents/subagents/frontend-react.md
.agents/subagents/frontend-angular.md
.agents/subagents/database-prisma.md
.agents/subagents/api-architect.md
.agents/subagents/tester.md
.agents/subagents/debugger.md
.agents/subagents/security-reviewer.md
.agents/subagents/code-reviewer.md
.agents/subagents/performance-reviewer.md
.agents/subagents/devops.md
.agents/subagents/documentation.md
```

También:

```text
.agents/skills/satem-code-review/SKILL.md
openspec/config.yaml
SATEM_AGENT_GUIDE.md
BOOTSTRAP.md
```

---

# 46. Verificación del proyecto

El bootstrap debe detectar y reportar:

```text
Node.js
npm
TypeScript
Express
React
Angular
Prisma
MySQL
PostgreSQL
Docker
OpenSpec
Git
```

Para cada tecnología:

```text
DETECTED
NOT DETECTED
NOT APPLICABLE
```

No instalar automáticamente frameworks que el proyecto no utiliza.

---

# 47. Regla importante sobre React y Angular

SATEM puede tener proyectos React y proyectos Angular.

Por lo tanto:

```text
React ≠ requisito universal
Angular ≠ requisito universal
```

El agente debe detectar cuál corresponde al proyecto.

Si el proyecto utiliza React:

```text
frontend-react
```

Si utiliza Angular:

```text
frontend-angular
```

Si utiliza ambos:

```text
ambos agentes pueden participar
```

Si no tiene frontend:

```text
no ejecutar agentes frontend
```

---

# 48. Regla importante sobre MySQL y PostgreSQL

SATEM puede utilizar diferentes motores según la aplicación.

Por lo tanto:

```text
MySQL ≠ requisito universal
PostgreSQL ≠ requisito universal
```

Prisma debe adaptarse al datasource existente.

No migrar MySQL → PostgreSQL ni PostgreSQL → MySQL como parte de una feature normal.

Una migración de tecnología debe ser un proyecto OpenSpec independiente.

---

# 49. Regla importante sobre dependencias

Antes de instalar una dependencia:

1. Revisar si ya existe una alternativa.
2. Revisar si Node.js/TypeScript puede resolverlo.
3. Revisar impacto.
4. Revisar mantenimiento.
5. Revisar seguridad.
6. Justificar la dependencia.

No instalar paquetes solamente para resolver problemas triviales.

---

# 50. Principio SATEM ONE

El ecosistema de agentes debe estar preparado para evolucionar hacia una arquitectura SATEM modular.

Debe favorecer:

```text
módulos independientes
APIs bien definidas
servicios reutilizables
componentes reutilizables
autenticación centralizada
autorización consistente
auditoría
integraciones desacopladas
automatización
observabilidad
```

Sin implementar funcionalidades futuras que no formen parte del cambio actual.

---

# 51. No-goals del bootstrap

Este bootstrap NO debe:

* implementar funcionalidades de negocio;
* modificar modelos existentes innecesariamente;
* migrar bases de datos;
* cambiar frameworks;
* cambiar proveedores cloud;
* modificar EasyPanel;
* modificar producción;
* crear nuevas APIs de negocio;
* eliminar código existente;
* refactorizar toda la aplicación;
* instalar dependencias innecesarias.

Su objetivo es exclusivamente configurar el ecosistema multi-agente.

---

# 52. Checklist final

El Orchestrator debe terminar mostrando:

```text
# Bootstrap SATEM completado

## Entorno

- [ ] Node.js detectado
- [ ] npm detectado
- [ ] TypeScript detectado
- [ ] Git detectado
- [ ] OpenSpec disponible

## Stack detectado

- [ ] Node.js
- [ ] Express
- [ ] React
- [ ] Angular
- [ ] Prisma
- [ ] MySQL
- [ ] PostgreSQL
- [ ] Docker
- [ ] EasyPanel

## Agentes

- [ ] orchestrator
- [ ] requirements-analyst
- [ ] solution-architect
- [ ] backend-node
- [ ] frontend-react
- [ ] frontend-angular
- [ ] database-prisma
- [ ] api-architect
- [ ] tester
- [ ] debugger
- [ ] security-reviewer
- [ ] code-reviewer
- [ ] performance-reviewer
- [ ] devops
- [ ] documentation

## Skills

- [ ] satem-code-review

## OpenSpec

- [ ] openspec/config.yaml
- [ ] OpenSpec inicializado

## Documentation

- [ ] SATEM_AGENT_GUIDE.md
- [ ] BOOTSTRAP.md

## Seguridad

- [ ] No se modificó código de negocio
- [ ] No se modificó producción
- [ ] No se instalaron dependencias innecesarias
- [ ] No se ejecutaron operaciones destructivas

## Resultado

SATEM Multi-Agent + OpenSpec configurado correctamente.
```

---

# 53. Principio final

Este ecosistema no pretende reemplazar al desarrollador.

Su objetivo es dividir el trabajo complejo entre agentes especializados manteniendo:

```text
Contexto
   +
Arquitectura
   +
OpenSpec
   +
Especialización
   +
Testing
   +
Security
   +
Review
   +
Documentación
```

El resultado esperado es un proceso de desarrollo SATEM más:

```text
predecible
auditable
seguro
mantenible
escalable
```

y con menor riesgo de que un agente modifique accidentalmente partes no relacionadas del sistema.

**OpenSpec define el cambio.**

**El Orchestrator coordina.**

**Los agentes especializados implementan.**

**Testing valida.**

**Security revisa.**

**Code Review cuestiona.**

**Antigravity ejecuta y mantiene el contexto.**

**SATEM mantiene la arquitectura y las reglas de negocio.**

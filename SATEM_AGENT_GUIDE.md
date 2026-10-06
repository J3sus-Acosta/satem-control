# SATEM — Manual Multi-Agente + OpenSpec

## SATEM Soluciones Inteligentes SpA

Este documento es el manual permanente de arquitectura, operación multi-agente y desarrollo guiado por especificaciones (**OpenSpec**) para todos los proyectos del ecosistema SATEM.

---

## 1. Arquitectura del Flujo de Trabajo

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

## 2. Catálogo de Agentes Especializados

| Agente | Responsabilidad Principal | Ubicación |
| :--- | :--- | :--- |
| **orchestrator** | Coordina el ciclo de vida completo de cada cambio | `.agents/subagents/orchestrator.md` |
| **requirements-analyst** | Transforma necesidades de negocio en especificaciones y criterios | `.agents/subagents/requirements-analyst.md` |
| **solution-architect** | Diseña arquitectura técnica respetando patrones existentes | `.agents/subagents/solution-architect.md` |
| **backend-node** | Desarrollo en Node.js, Fastify/Express, TypeScript y servicios | `.agents/subagents/backend-node.md` |
| **frontend-react** | Interfaces React, Vite, Dark Mode Premium y responsividad | `.agents/subagents/frontend-react.md` |
| **frontend-angular** | Interfaces Angular cuando el proyecto lo requiera | `.agents/subagents/frontend-angular.md` |
| **database-prisma** | Modelado en Prisma, migraciones controladas e integridad MySQL/Postgres | `.agents/subagents/database-prisma.md` |
| **api-architect** | Contratos de API REST, esquemas de entrada/salida y códigos HTTP | `.agents/subagents/api-architect.md` |
| **tester** | Validación de casos felices, de error y prevención de regresiones | `.agents/subagents/tester.md` |
| **debugger** | Análisis metódico de causa raíz y resolución de incidentes | `.agents/subagents/debugger.md` |
| **security-reviewer** | Auditoría de autenticación, RBAC, IDOR, inyecciones y secretos | `.agents/subagents/security-reviewer.md` |
| **code-reviewer** | Calidad de código, SOLID, TypeScript estricto y código huérfano | `.agents/subagents/code-reviewer.md` |
| **performance-reviewer** | Detección de N+1 queries, fugas de memoria y optimización | `.agents/subagents/performance-reviewer.md` |
| **devops** | Docker, EasyPanel, validación de compilación y despliegue | `.agents/subagents/devops.md` |
| **documentation** | Documentación viva de arquitectura, APIs y OpenSpec | `.agents/subagents/documentation.md` |

---

## 3. Flujos de Trabajo Recomendados

### A. Para Cambios Menores o Correcciones Rápidas
```text
Usuario → Antigravity → Orchestrator → Implementación → Tests → Review → Commit
```

### B. Para Features Complejas o Nuevos Módulos
```text
1. OpenSpec proposal (propuesta de alcance y no-objetivos)
2. Requirements analysis (reglas de negocio y criterios de aceptación)
3. Architecture design (diseño técnico en design.md)
4. OpenSpec specification (specs formales)
5. Tasks (desglose fino de tareas con archivos en alcance)
6. Orchestrator (asignación a agentes según especialidad)
7. Backend / Frontend / Database agents (implementación aislada)
8. Tests (ejecución de suites de prueba)
9. Security review (auditoría de vectores de ataque)
10. Code review (revisión de calidad y tipado)
11. Performance review (validación de carga y consultas)
12. DevOps validation (compilación sin errores de backend y frontend)
13. Mark tasks completed (actualización de checklist en tasks.md)
14. OpenSpec archive (archivo del cambio completado)
```

---

## 4. Reglas Críticas para Todos los Agentes

1. **Analizar antes de modificar**: Leer el archivo, revisar referencias e imports y calcular el impacto antes de aplicar un cambio.
2. **Respetar el alcance delimitado**: No modificar archivos no relacionados ni aplicar refactors masivos que no correspondan a la tarea asignada.
3. **Respetar el Stack Tecnológico**: No introducir librerías redundantes si el proyecto ya cuenta con una solución equivalente.
4. **Soft Delete Mandatorio**: En entidades principales, el borrado debe ser lógico (`deletedAt = new Date()`), y todas las consultas deben filtrar `{ where: { deletedAt: null } }`.
5. **Cero Secretos Hardcodeados**: Ninguna contraseña, llave API o clave JWT debe escribirse en código fuente o Git.
6. **Diseño Responsivo Obligatorio**: Validar siempre el comportamiento en Mobile, Tablet y Desktop.
7. **Regla Anti-Destructiva**: Jamás ejecutar `DROP DATABASE`, `DROP TABLE`, `TRUNCATE` o `prisma db push` destructivo sobre entornos productivos.

---

## 5. Detección de Inconsistencias y Código Sin Uso

Durante las revisiones periódicas, el equipo de agentes debe rastrear:
- Variables, imports, tipos o funciones no referenciadas.
- Endpoints REST o componentes de interfaz sin consumidores.
- Modelos o campos de Prisma sin consumo real.
- Discrepancias entre los campos que devuelve una API y los que espera el frontend.
- Variables de entorno declaradas en `.env` pero no utilizadas en el código fuente.

---

## 6. Comandos de Validación Estándar

```bash
# Backend (satem-control-api)
npm run build              # Validación estricta de TypeScript y cliente Prisma
npx prisma validate        # Validación sintáctica del esquema de datos

# Frontend (satem-control-web)
npm run build              # Compilación estricta TypeScript + Vite
```

---

## 7. Reporte de Implementación del Orchestrator

Al concluir un ciclo de implementación, el Orchestrator entregará un reporte estructurado que documente el estado de cada dimensión técnica (Base de Datos, API, Frontend, Seguridad, Tests, Build y Code Review).

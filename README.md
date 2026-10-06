# SATEM Control

## Plataforma de Control Operativo y Trazabilidad Empresarial
### SATEM Soluciones Inteligentes SpA

SATEM Control es el sistema centralizado de gestión operativa, contratos de mantenimiento, expedientes técnicos, facturación, pasarela de pagos y portal de clientes de SATEM.

---

## 1. Estructura del Proyecto

```text
satem-control/
├── satem-control-api/      # Backend REST API (Node.js, TypeScript, Fastify, Prisma ORM, MySQL)
├── satem-control-web/      # Frontend Web SPA (React 18, Vite, TypeScript, SATEM Design System)
├── docs/                   # Guías operativas, despliegue, desastres y testing
│   ├── TESTING.md          # Guía completa de pruebas automatizadas (Vitest)
│   ├── EASYPANEL-DEPLOYMENT.md
│   └── GUIA_LOGIN_Y_DESPLIEGUE.md
├── openspec/               # Especificaciones y cambios OpenSpec activos
├── .agents/                # Agentes especializados y skills SATEM
├── AGENTS.md               # Estándares técnicos y reglas de integridad de SATEM
└── SATEM_AGENT_GUIDE.md    # Manual permanente de desarrollo multi-agente
```

---

## 2. Puesta en Marcha Rápida

### Backend (`satem-control-api`)
```bash
cd satem-control-api
npm install
npm run dev        # Inicia con recarga en caliente en http://localhost:3000
```

### Frontend (`satem-control-web`)
```bash
cd satem-control-web
npm install
npm run dev        # Inicia con Vite en http://localhost:5173
```

---

## 3. Pruebas Automatizadas (QA Suite)

El proyecto cuenta con una suite completa de pruebas unitarias y de integración impulsada por **Vitest**:

- **Backend Tests:**
  ```bash
  cd satem-control-api
  npm test
  ```
- **Frontend Tests:**
  ```bash
  cd satem-control-web
  npm test
  ```

Para más detalles sobre la arquitectura de pruebas, fixtures y creación de nuevos tests, consulta [docs/TESTING.md](docs/TESTING.md).

---

## 4. Despliegue y Producción

El proyecto está diseñado para desplegarse mediante contenedores Docker administrados en EasyPanel / VPS:
- Backend: `Dockerfile` con Node.js 20+ y runner de migración tolerante a fallos (`scripts/migrate.js`).
- Frontend: `Dockerfile` con compilación estática servida por Nginx.

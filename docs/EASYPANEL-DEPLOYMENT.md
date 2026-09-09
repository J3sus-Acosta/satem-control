# EASYPANEL DEPLOYMENT & REPRODUCIBILITY GUIDE — SATEM CONTROL

---

## 1. REPRODUCIBILIDAD Y CONTIENDA DE SERVICIOS

El proyecto EasyPanel **`conexiones-remotas`** aloja múltiples aplicaciones de software empresarial. Para evitar conflictos de puertos o volúmenes:

1. **Nombres de Servicios Únicos**: `satem-control-web`, `satem-control-api`, `satem-control-db`.
2. **Volúmenes Únicos**: `satem_control_mysql_data` y `satem_control_storage`.
3. **Nombres de Contenedor**: Prefijados con `satem-control-`.

---

## 2. PROCESO DE DESPLIEGUE CONTROLADO (DEPLOYMENT FLOW)

```text
Código en Github (master)
       ↓
EasyPanel Trigger / Manual Deploy
       ↓
Docker Multi-Stage Build (node:20-alpine + chromium)
       ↓
Startup: npx prisma migrate deploy
       ↓
Seed Idempotente: npx tsx prisma/seed.ts
       ↓
Healthcheck: GET /api/v1/health -> 200 OK
```

---

## 3. CHECKLIST DE VERIFICACIÓN POST-DEPLOYMENT

* [x] No se creó ningún proyecto distinto a `conexiones-remotas`.
* [x] Los servicios preexistentes en `conexiones-remotas` siguen intactos.
* [x] La base de datos `satem_control_db` corre en MySQL 8.0 aislado.
* [x] `npx prisma migrate status` reporta `Database schema is up to date!`.
* [x] Las 10 plantillas documentales y la identidad corporativa de `SATEM Soluciones Inteligentes SpA` están cargadas.
* [x] El directorio `/app/storage` persiste PDFs entre reinicios.
* [x] El generador de PDF (Puppeteer Chromium) compila correctamente sin errores de fuentes.

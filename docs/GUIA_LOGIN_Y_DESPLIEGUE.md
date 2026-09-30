# Guía Crítica de Autenticación, Credenciales y Despliegues (SATEM Control)

Este documento establece las reglas fundamentales, componentes protegidos y procedimientos obligatorios para garantizar que el inicio de sesión (`/api/v1/auth/login`) nunca se rompa entre despliegues o cambios de código, tanto en **Local** como en **Producción (EasyPanel)**.

---

## 1. Credenciales Maestras por Defecto

| Parámetro | Valor Oficial SATEM |
| :--- | :--- |
| **Email Administrador** | `admin@satemsoluciones.com` |
| **Contraseña por Defecto** | `admin@123` |
| **Rol en Sistema** | `ADMIN` |
| **Estado requerido** | `isActive: true`, `deletedAt: null` |

---

## 2. ¿Por qué fallaba el Login tras cambios o redespliegues?

1. **`prisma migrate deploy` vs `prisma db seed`:**
   - En producción, Docker corre `npx prisma migrate deploy` que crea/altera tablas, pero **NO** ejecuta el archivo `seed.ts`. Si la base de datos es nueva o no tenía usuarios, la tabla `users` quedaba vacía.
2. **Upsert incompleto en `seed.ts` anterior:**
   - El `upsert` previo solo actualizaba el nombre y rol, ignorando el `passwordHash`. Si la contraseña cambiaba en código, la BD conservaba el hash antiguo.
3. **Discrepancia de dominios históricos en scripts:**
   - Existían scripts de pruebas con `admin@satem.cl` mientras el frontend intentaba autenticar contra `admin@satemsoluciones.com`.

---

## 3. Salvaguardas Implementadas (No Requiere Acción Manual)

Se añadió una rutina de **Auto-Bootstrap** en `satem-control-api/src/common/utils/bootstrap.ts` que se ejecuta cada vez que el servidor arranca:
1. Verifica automáticamente si existe el usuario `admin@satemsoluciones.com` (o el indicado en `ADMIN_EMAIL`).
2. Si no existe, lo crea inmediatamente con rol `ADMIN`, estado activo y contraseña `admin@123` (o `ADMIN_PASSWORD`).
3. Si el usuario existe pero estaba desactivado (`isActive: false` o con `deletedAt`), lo reactiva automáticamente.

---

## 4. Reglas Críticas en Código: ¿Qué NO se debe mover?

### A. Algoritmo de Hashing (`bcryptjs`)
- En [`auth.controller.ts`](file:///d:/Dev/satem-control/satem-control-api/src/modules/auth/auth.controller.ts) y [`seed.ts`](file:///d:/Dev/satem-control/satem-control-api/prisma/seed.ts):
  - El factor de costo de hash debe ser **10 rondas**: `await bcrypt.hash(password, 10)`.
  - La verificación siempre debe ejecutarse con `await bcrypt.compare(body.password, user.passwordHash)`.
  - **NUNCA** almacenar contraseñas en texto plano ni usar funciones síncronas bloqueantes sin salt.

### B. Normalización de Emails (Minúsculas)
- El login en backend siempre ejecuta `body.email.toLowerCase().trim()`.
- Al crear o sembrar usuarios, los emails deben guardarse en **minúsculas**.

### C. Estado y Borrado Lógico
- El handler de login valida: `if (!user || !user.isActive || user.deletedAt)`.
- Si un usuario tiene `isActive = false` o `deletedAt` con fecha, el sistema devolverá error 401.

### D. Cookies y Tokens JWT
- `JWT_SECRET`, `JWT_REFRESH_SECRET` y `COOKIE_SECRET` deben estar configurados en las variables de entorno de EasyPanel.
- La cookie de refresco usa `sameSite: 'lax'` y `path: '/api/v1/auth/refresh'`.

---

## 5. Procedimientos de Respaldo y Reseteo Manual

Si por alguna razón necesitas forzar el restablecimiento del administrador o sembrar datos:

### En Producción (Consola de EasyPanel en `satem-control-api`):
```bash
# 1. Restablecer Admin en 1 segundo (seguro y rápido)
npm run reset-admin

# 2. O con email / contraseña específicos
node scripts/reset-admin.js micorreo@satemsoluciones.com MiPasswordSeguro!

# 3. Sembrar toda la base de datos (Plantillas + Servicios + Admin)
npx tsx prisma/seed.ts
```

### En Local (PowerShell / Bash):
```bash
cd satem-control-api
npm run reset-admin
```

---

## 6. Variables de Entorno Requeridas en Producción

Configuradas en el servicio `satem-control-api` de EasyPanel:
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=mysql://satem_user:satem_pass_2026@satem-control-db:3306/satem_control_db
JWT_SECRET=satem_jwt_prod_secret_2026
JWT_REFRESH_SECRET=satem_jwt_refresh_prod_secret_2026
COOKIE_SECRET=satem_cookie_prod_secret_2026
STORAGE_PATH=/app/storage
FRONTEND_URL=https://app.satemsoluciones.com
ADMIN_EMAIL=admin@satemsoluciones.com
ADMIN_PASSWORD=admin@123
```

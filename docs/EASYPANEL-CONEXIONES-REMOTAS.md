# GUÍA OFICIAL DE DESPLIEGUE EN EASYPANEL — PROYECTO `conexiones-remotas`

---

## 1. REGLA FUNDAMENTAL DE INFRAESTRUCTURA

> **REGLA ABSOLUTA**: Todo el despliegue de **SATEM Control V1** se realiza EXCLUSIVAMENTE dentro del proyecto existente de EasyPanel:
>
> `conexiones-remotas`
>
> **PROHIBIDO**: Crear nuevos proyectos como `satem-control-prod`, `satem-control` o cualquier variante fuera de `conexiones-remotas`.

---

## 2. ARQUITECTURA DE SERVICIOS EN `conexiones-remotas`

```text
EasyPanel (Panel de Control)
└── Proyecto: conexiones-remotas
      │
      ├── [Preservados] Servicios / Apps preexistentes en conexiones-remotas
      │
      ├── Service 1: satem-control-web (React + Vite + Nginx)
      │     └── Domain: https://app.satem.cl
      │
      ├── Service 2: satem-control-api (Node.js 20 Fastify + Prisma + Puppeteer)
      │     ├── Domain: https://api.satem.cl
      │     └── Volume Mount: satem_control_storage -> /app/storage
      │
      └── Service 3: satem-control-db (MySQL 8.0)
            └── Volume Mount: satem_control_mysql_data -> /var/lib/mysql
```

---

## 3. PASOS PARA EL DESPLIEGUE EN EASYPANEL

### Paso 1: Seleccionar el Proyecto Existente
En el panel de administración de EasyPanel, navegar directamente al proyecto:
`conexiones-remotas`

### Paso 2: Crear el Servicio de Base de Datos MySQL
1. Añadir nuevo servicio de tipo **Database -> MySQL** dentro de `conexiones-remotas`.
2. Nombre del servicio: `satem-control-db`.
3. Imagen: `mysql:8.0`.
4. Variables de entorno:
   * `MYSQL_ROOT_PASSWORD`: `<PASSWORD_ROBUSTO_ROOT>`
   * `MYSQL_DATABASE`: `satem_control_db`
   * `MYSQL_USER`: `satem_user`
   * `MYSQL_PASSWORD`: `<PASSWORD_ROBUSTO_USER>`
5. Volumen persistente: `satem_control_mysql_data` montado en `/var/lib/mysql`.

### Paso 3: Crear el Servicio Backend API (`satem-control-api`)
1. Añadir nuevo servicio de tipo **App** desde Git/Dockerfile dentro de `conexiones-remotas`.
2. Nombre del servicio: `satem-control-api`.
3. Repositorio: `git@github.com:.../satem-control.git` (Branch: `master`).
4. Context path: `./satem-control-api`.
5. Dockerfile path: `./satem-control-api/Dockerfile`.
6. Variables de Entorno (Environment):
   * `NODE_ENV`: `production`
   * `PORT`: `3000`
   * `HOST`: `0.0.0.0`
   * `DATABASE_URL`: `mysql://satem_user:<PASSWORD_ROBUSTO_USER>@satem-control-db:3306/satem_control_db`
   * `JWT_SECRET`: `<JWT_SECRET_PROD_MIN_32_CHARS>`
   * `JWT_REFRESH_SECRET`: `<JWT_REFRESH_SECRET_PROD_MIN_32_CHARS>`
   * `COOKIE_SECRET`: `<COOKIE_SECRET_PROD_MIN_32_CHARS>`
   * `STORAGE_PATH`: `/app/storage`
   * `FRONTEND_URL`: `https://app.satem.cl`
7. Volumen Persistente: `satem_control_storage` montado en `/app/storage`.
8. Dominio: `api.satem.cl` (HTTPS SSL automático habilitado).

### Paso 4: Crear el Servicio Frontend Web (`satem-control-web`)
1. Añadir nuevo servicio de tipo **App** desde Git/Dockerfile dentro de `conexiones-remotas`.
2. Nombre del servicio: `satem-control-web`.
3. Repositorio: `git@github.com:.../satem-control.git` (Branch: `master`).
4. Context path: `./satem-control-web`.
5. Dockerfile path: `./satem-control-web/Dockerfile`.
6. Variables de Entorno (Environment):
   * `VITE_API_URL`: `https://api.satem.cl`
7. Dominio: `app.satem.cl` (HTTPS SSL automático habilitado).

---

## 4. INICIALIZACIÓN DE MIGRACIONES Y SEED

Una vez iniciados los contenedores dentro de `conexiones-remotas`:

1. El contenedor backend ejecuta automáticamente en el startup `npx prisma migrate deploy`.
2. Para ejecutar el seed de inicialización de la empresa e identidad corporativa:
   ```bash
   docker exec -it satem-control-api npx tsx prisma/seed.ts
   ```
3. Comprobar salud:
   ```bash
   curl -i https://api.satem.cl/api/v1/health
   ```
   *Respuesta esperada*: `HTTP 200 OK` con estado de base de datos MySQL `connected`.

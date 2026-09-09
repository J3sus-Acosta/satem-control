# PROCEDIMIENTO DE ROLLBACK DE APLICACIÓN — SATEM CONTROL

---

## 1. POLÍTICA DE ROLLBACK

* **Código de Aplicación**: En caso de despliegue fallido del contenedor backend o frontend en EasyPanel, revertir la versión del servicio al SHA de commit previo conocido en `conexiones-remotas`.
* **Base de Datos**: **PROHIBIDO realizar rollback destructivo de esquema (`prisma migrate reset` o `prisma db push`)**. El esquema de base de datos se mantiene retrocompatible usando la estrategia **Expand / Contract**.

---

## 2. PASOS PARA ROLLBACK EN EASYPANEL (`conexiones-remotas`)

1. Abrir EasyPanel -> Proyecto `conexiones-remotas`.
2. Seleccionar el servicio afectado (`satem-control-api` o `satem-control-web`).
3. En la sección **Source / Commit**, especificar el SHA del commit funcional anterior (ej: `195d838dd3b83826f2ad86b74404b7754c192c6f`).
4. Presionar **Deploy**.
5. Verificar la recuperación del servicio mediante el healthcheck:
   ```bash
   curl -i https://api.satem.cl/api/v1/health
   ```

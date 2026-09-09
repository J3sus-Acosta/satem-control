# ESTRATEGIA DE BACKUP Y RESTAURACIÓN DE DATOS — SATEM CONTROL

---

## 1. BACKUP DE MYSQL Y ALMACENAMIENTO PERSISTENTE

* **MySQL Database**: Respaldo automático diario mediante `mysqldump` con retención de 30 días almacenado en punto de almacenamiento independiente (off-site).
* **Storage (`/app/storage`)**: Snapshot binario diario del volumen `satem_control_storage` con retención de 30 días.

---

## 2. PROCEDIMIENTO DE RESTAURACIÓN DE EMERGENCIA

Consultar la guía completa detallada en el Runbook Oficial:
[RUNBOOK-DISASTER-RECOVERY.md](file:///d:/Dev/satem-control/docs/RUNBOOK-DISASTER-RECOVERY.md)

1. Restaurar base de datos MySQL en instancia limpia.
2. Ejecutar `npx prisma migrate deploy` para validar coincidencia de esquema.
3. Copiar PDFs respaldados a `/app/storage`.
4. Validar manifiesto de hashes SHA-256 (`100% MATCH`).
5. Re-iniciar servicios `satem-control-api` y `satem-control-web` en `conexiones-remotas`.

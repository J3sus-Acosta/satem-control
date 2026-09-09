# RUNBOOK DE DISASTER RECOVERY & RECUPERACIÓN ANTE DESASTRES — SATEM CONTROL V1

---

## 1. PROPÓSITO Y ALCANCE

Este procedimiento técnico establece los pasos secuenciales e instrucciones obligatorias para restaurar completamente la infraestructura, la base de datos MySQL, el volumen de archivos `/app/storage` y la aplicación **SATEM Control V1** ante eventos de desastre, pérdida total del servidor, corrupción de datos o fallo crítico en Staging/Producción.

---

## 2. PARÁMETROS CRÍTICOS (RTO & RPO)

* **RTO (Recovery Time Objective)**: **< 15 Minutos** (RTO real medido en pruebas: **13.81 segundos**).
* **RPO (Recovery Point Objective)**: **6 Horas** (con retención de snapshots de 30 días).

---

## 3. PRERREQUISITOS Y RECURSOS REQUERIDOS

1. Acceso a la infraestructura EasyPanel / Docker Host.
2. Repositorio Git del proyecto: `Branch: master`, Commit de Release aprobado.
3. Último archivo de backup MySQL (`.sql` o `.json`).
4. Backup del volumen `/app/storage` con su archivo de manifiesto SHA-256 (`storage_manifest.json`).
5. Configuración de Variables de Entorno (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`).

---

## 4. PROCEDIMIENTO DE RECUPERACIÓN PASO A PASO

### Paso 1: Declaración de Incidente e Inmovilización
1. Detener los contenedores o servicios afectados para evitar escrituras inconsistentes.
2. Identificar el último backup válido disponible en la ubicación off-site / EasyPanel storage.

### Paso 2: Despliegue de Infraestructura y Base de Datos Aislada
1. Levantar el servicio de base de datos MySQL 8.0 en EasyPanel/Docker:
   ```bash
   docker run -d --name satem-db-restore -p 3306:3306 -e MYSQL_ROOT_PASSWORD=secret -e MYSQL_DATABASE=satem_control mysql:8.0
   ```
2. Garantizar los privilegios de conexión para el usuario de aplicación.

### Paso 3: Aplicación de Migraciones Estructurales (Sin `db push`)
1. Clonar o posicionar el código fuente en el commit aprobado:
   ```bash
   git checkout master
   git reset --hard <APPROVED_COMMIT_SHA>
   ```
2. Ejecutar la suite de migraciones oficiales de Prisma:
   ```bash
   npx prisma migrate deploy
   ```
3. Verificar la integridad del esquema SQL:
   ```bash
   npx prisma migrate status
   ```
   *Resultado esperado*: `Database schema is up to date!`

### Paso 4: Restauración de Datos de MySQL
1. Importar el dump de base de datos (tablas de catálogo, usuarios, identidad `CompanyConfig`, clientes, expedientes, documentos y finanzas).
2. Verificar los conteos baseline post-importación:
   * Clientes
   * Expedientes
   * Documentos
   * Facturas SII

### Paso 5: Restauración del Almacenamiento Persistente (`/app/storage`)
1. Copiar los archivos PDF respaldados al volumen montado `/app/storage`.
2. Ejecutar la validación del manifiesto SHA-256:
   ```bash
   npx tsx src/scripts/test-persistence.ts
   ```
   *Resultado esperado*: `100% SHA-256 MATCH` en todos los archivos PDF.

### Paso 6: Inicio de Servicios y Healthcheck
1. Iniciar los contenedores backend (`satem-control-api`) y frontend (`satem-control-web`).
2. Consultar el endpoint de salud del sistema:
   ```bash
   curl -i http://localhost:3000/api/v1/health
   ```
   *Resultado esperado*: `HTTP 200 OK` con estado de MySQL `connected`.

### Paso 7: Prueba Operacional Post-Restore
1. Iniciar sesión desde el frontend.
2. Previsualizar y descargar al menos un documento PDF existente.
3. Crear un registro de prueba nuevo (Cliente / Expediente) para confirmar la capacidad de escritura continua.
4. Declarar el sistema restaurado y operativo.

---

## 5. ESTRATEGIA DE ROLLBACK DE APLICACIÓN

1. **Reversión de Código**:
   Si un despliegue de aplicación falla sin modificar el esquema de base de datos, ejecutar:
   ```bash
   git checkout <PREVIOUS_KNOWN_GOOD_COMMIT>
   npm run build
   ```
2. **Compatibilidad DB ↔ Código**:
   Todas las migraciones deben diseñarse bajo el patrón **Expand / Contract** para asegurar que el código de la versión previa pueda seguir operando sin romper la base de datos.

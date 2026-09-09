# GESTIÓN DE ENTORNOS — STAGING VS PRODUCCIÓN

---

## 1. AISLAMIENTO ABSOLUTO DE ENTORNOS

| Componente | Entorno Staging | Entorno Producción (`conexiones-remotas`) |
| :--- | :--- | :--- |
| **EasyPanel Project** | `satem-control-staging` (o aislado) | **`conexiones-remotas`** |
| **Frontend Domain** | `https://staging.satem.cl` | `https://app.satem.cl` |
| **Backend API Domain** | `https://staging-api.satem.cl` | `https://api.satem.cl` |
| **Database** | `satem_control_db_staging` | `satem_control_db` |
| **Volume Storage** | `storage_staging_data` | `satem_control_storage` |
| **Secrets / Keys** | Claves de prueba Staging | Claves de Producción Únicas |

> **IMPORTANTE**: Staging y Producción nunca comparten base de datos, volumen storage, secretos de autenticación ni dominios.

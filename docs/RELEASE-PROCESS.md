# PROCESO FORMAL DE DEPLOYMENT Y LIBERACIÓN — SATEM CONTROL

---

## 1. FLUJO DE LIBERACIÓN DE VERSIONES

1. **Fase Local**: Desarrollo y paso de tests en entorno local (`npm test`, E2E documental).
2. **Fase Staging**: Despliegue en Staging, validación E2E completa y UAT con datos `UAT-*`.
3. **Audit Pre-Flight (Fase 25.1)**: Evaluación de matriz de 19 áreas y confirmación de `🟢 PRODUCTION READY`.
4. **Despliegue Controlado (Fase 25.2 & 26)**: Despliegue manual aprobado en el proyecto EasyPanel **`conexiones-remotas`**.

## 2. REGLA DE NO AUTO-DEPLOY EN PRODUCCIÓN

* Staging permite auto-deploy vía Webhook de Github.
* **Producción en EasyPanel (`conexiones-remotas`) requiere activación manual aprobada**.

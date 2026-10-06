# Guía de Migración & Adopción en Proyectos Existentes

Este documento describe el protocolo metódico para auditar y actualizar aplicaciones existentes de SATEM al **SATEM Design System**, garantizando la integridad funcional (*No-Break Guarantee*).

---

## 🧭 Los 5 Principios de Preservación

Al adaptar un proyecto existente al Design System, el orden de prioridades es estricto:

1. **Preservar la Funcionalidad**: Ningún formulario debe perder sus validaciones ni disparar peticiones rotas.
2. **Preservar el Comportamiento**: No alterar estados locales (`useState`), efectos (`useEffect`) ni navegaciones (`useNavigate`).
3. **Preservar los Modelos de Datos**: No alterar nombres de propiedades ni tipos de TypeScript.
4. **Preservar la Arquitectura**: No cambiar de framework CSS (ej. no intentar inyectar Tailwind donde hay Vanilla CSS) salvo instrucción explícita.
5. **Estandarizar Progresivamente la Interfaz**: Migrar pantalla por pantalla siguiendo este protocolo.

---

## 🔍 Checklist de Auditoría (Paso a Paso)

```
[ ] 1. Fuentes tipográficas en index.html (Inter + Outfit)
[ ] 2. Presencia de tokens CSS en index.css (:root)
[ ] 3. Assets corporativos en public/assets/ (logo-icon.png, logo-full.png)
[ ] 4. Estandarización de Botones (.btn, .btn-primary, .btn-secondary, .btn-danger)
[ ] 5. Estandarización de Badges (.badge, .badge-success, .badge-warning, etc.)
[ ] 6. Envoltura de Tablas en .table-container
[ ] 7. Unificación de Modales (.modal-overlay + .modal-dialog)
[ ] 8. Adaptabilidad Responsive en Mobile (<768px)
```

---

## 🔄 Tabla de Equivalencias y Refactorización

### 1. Colores Hardcodeados → Tokens Oficiales
| Código Hardcodeado Encontrado | Token de Reemplazo Obligatorio |
| :--- | :--- |
| `color: '#00a896'`, `background: '#00a896'` | `var(--accent-primary)` |
| `background: '#0f172a'` (fondos) | `var(--bg-primary)` |
| `background: '#1e293b'` (superficies/cards) | `var(--bg-surface)` o `var(--bg-card)` |
| `background: '#334155'` (hover o bordes) | `var(--bg-card-hover)` o `var(--border-color)` |
| `color: '#f8fafc'`, `color: '#fff'` (títulos) | `var(--text-primary)` |
| `color: '#94a3b8'` (etiquetas) | `var(--text-secondary)` |
| `color: '#64748b'` (fechas/notas) | `var(--text-muted)` |
| `color: '#10b981'`, `#22c55e` (éxito) | `var(--success)` y `var(--success-bg)` |
| `color: '#f59e0b'`, `#eab308` (aviso) | `var(--warning)` y `var(--warning-bg)` |
| `color: '#ef4444'`, `#dc2626` (peligro) | `var(--danger)` y `var(--danger-bg)` |
| `color: '#3b82f6'`, `#2563eb` (info) | `var(--info)` y `var(--info-bg)` |

---

### 2. Botones Dispersos → Estándar `.btn`
```diff
- <button style={{ backgroundColor: '#00a896', color: '#fff', padding: '10px 14px', borderRadius: '4px' }}>
-   Guardar
- </button>
+ <button className="btn btn-primary">
+   Guardar
+ </button>
```

```diff
- <button style={{ backgroundColor: 'red', color: 'white' }}>
-   Eliminar
- </button>
+ <button className="btn btn-danger">
+   Eliminar
+ </button>
```

---

### 3. Modales en Línea → Patrón Canónico
Si el proyecto cuenta con el componente `<Modal />` (`src/components/Modal.tsx`), refactorizar a:
```diff
- {showModal && (
-   <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)' }}>
-     <div style={{ background: '#fff', padding: 20 }}>
-       ...
-     </div>
-   </div>
- )}
+ <Modal
+   isOpen={showModal}
+   onClose={() => setShowModal(false)}
+   title="Título del Modal"
+   icon={FolderKanban}
+ >
+   ...
+ </Modal>
```

Si el modal contiene lógica muy acoplada que prefiere conservarse inline:
```diff
- <div className="custom-popup" style={{ background: '#111' }}>
+ <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)' }}>
+   <div className="modal-dialog" style={{ maxWidth: '580px' }}>
```

---

### 4. Tablas sin Desplazamiento Protegido
```diff
- <table>
+ <div className="table-container">
+   <table className="custom-table">
        <thead>...</thead>
        <tbody>...</tbody>
- </table>
+   </table>
+ </div>
```

---

## 🧪 Verificación Posterior a la Migración

Antes de dar por finalizada la migración visual, ejecutar en terminal:
1. `npm run build` en el frontend: Verificar 0 errores de tipado o compilación.
2. Inspección en navegador:
   - Probar en modo responsive de DevTools a **375px**, **768px** y **1440px**.
   - Comprobar que no exista barra de desplazamiento horizontal en el `body`.
   - Verificar contraste visual de textos sobre fondo oscuro.

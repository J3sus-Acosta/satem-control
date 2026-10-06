# Catálogo de Componentes UI Canónicos SATEM

Este documento especifica la implementación técnica, estilos y código JSX/React de los componentes base del SATEM Design System.

---

## 🔘 1. Botones (`.btn`)

Todos los botones comparten una altura mínima táctil de 38px, radio de curvatura de 6px (`--radius-sm`) y tipografía semibold de 13.5px.

### A. Clases y Variantes
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 13.5px;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.btn:active {
  transform: scale(0.98);
}

/* Primario: Acción principal / Guardar / Crear */
.btn-primary {
  background-color: var(--accent-primary);
  color: #ffffff;
}
.btn-primary:hover {
  background-color: var(--accent-primary-hover);
  box-shadow: 0 0 12px var(--accent-glow);
}

/* Secundario: Cancelar / Filtros / Cerrar / Neutro */
.btn-secondary {
  background-color: #334155;
  color: var(--text-primary);
  border: 1px solid transparent;
}
.btn-secondary:hover {
  background-color: #475569;
  border-color: #64748b;
}

/* Peligro / Destructivo: Eliminar / Anular / Rechazar */
.btn-danger {
  background-color: #ef4444;
  color: #ffffff;
}
.btn-danger:hover {
  background-color: #dc2626;
}

/* Deshabilitado */
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

/* Icon Button: En tablas o esquinas */
.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: var(--radius-sm);
  transition: color 0.15s, background-color 0.15s;
}
.btn-icon:hover {
  color: var(--text-primary);
  background-color: var(--bg-card-hover);
}
```

### B. Ejemplo React
```tsx
import { Plus, Trash2, Check } from 'lucide-react';

<button className="btn btn-primary">
  <Plus size={16} /> Nuevo Registro
</button>

<button className="btn btn-secondary">
  Cancelar
</button>

<button className="btn btn-danger">
  <Trash2 size={16} /> Eliminar
</button>

<button className="btn btn-primary" disabled>
  <span className="spinner-sm" /> Guardando...
</button>
```

---

## 🏷️ 2. Badges & Píldoras de Estado (`.badge`)

Los badges representan estados semánticos del sistema (expedientes, facturas, contratos, firmas). Utilizan radio tipo píldora (`9999px`) y fondo con opacidad del 15%.

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-success   { background: var(--success-bg); color: var(--success); border: 1px solid var(--success); }
.badge-warning   { background: var(--warning-bg); color: var(--warning); border: 1px solid var(--warning); }
.badge-danger    { background: var(--danger-bg);  color: var(--danger);  border: 1px solid var(--danger); }
.badge-info      { background: var(--info-bg);    color: var(--info);    border: 1px solid var(--info); }
.badge-secondary { background: rgba(100, 116, 139, 0.15); color: #94a3b8; border: 1px solid #475569; }
```

---

## 🪟 3. Modales & Diálogos (`Modal.tsx`)

Estructura canónica reutilizable para todo diálogo emergente.

### A. Componente React Oficial
```tsx
import React, { useEffect } from 'react';
import { X, LucideIcon } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = '580px',
}) => {
  // Cierre con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="modal-overlay"
    >
      <div
        className="modal-dialog"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 id="modal-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            {Icon && <Icon size={20} color="var(--accent-primary)" />}
            <span>{title}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
```

### B. CSS Asociado
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: var(--bg-overlay, rgba(15, 23, 42, 0.85));
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  overflow-y: auto;
}

.modal-dialog {
  background-color: var(--bg-surface, #1e293b);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 580px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  animation: fadeInScale 0.2s ease;
  position: relative;
  margin: auto;
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
```

---

## 🗃️ 4. Tarjetas & Paneles (`.card`, `.kpi-card`)

```css
/* Card genérica de contenido */
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

/* Tarjeta KPI en Dashboards */
.kpi-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  min-width: 0;
}
.kpi-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent-primary);
}
.kpi-card-link {
  cursor: pointer;
}
.kpi-card-link:hover {
  transform: translateY(-3px);
  border-color: var(--accent-primary);
  box-shadow: 0 0 16px var(--accent-glow);
}

.kpi-title {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  font-weight: 600;
}

.kpi-value {
  font-size: clamp(1.5rem, 3.5vw, 1.85rem);
  font-weight: 800;
  font-family: var(--font-heading);
  color: var(--text-primary);
  line-height: 1.1;
  word-break: break-word;
}
```

---

## 📊 5. Tablas Responsivas (`.table-container`, `.custom-table`)

Regla mandatoria: Toda tabla debe estar envuelta en `.table-container` con desplazamiento horizontal táctil.

```css
.table-container {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: var(--shadow-md);
  width: 100%;
}

.custom-table {
  width: 100%;
  min-width: 580px;
  border-collapse: collapse;
  text-align: left;
}

.custom-table th {
  background-color: #0f172a;
  color: var(--text-secondary);
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.custom-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  font-size: 13.5px;
  color: var(--text-primary);
  vertical-align: middle;
}

.custom-table tbody tr:last-child td {
  border-bottom: none;
}

.custom-table tr:hover {
  background-color: var(--bg-card-hover);
}
```

---

## 📝 6. Formularios e Inputs

```css
.form-group {
  margin-bottom: 16px;
  width: 100%;
}

.form-label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  min-height: 40px;
  padding: 8px 14px;
  background-color: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  font-family: var(--font-sans);
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.form-textarea {
  resize: vertical;
  min-height: 90px;
}
```

---

## 🔄 7. Estados de Interfaz (Loading, Empty, Error)

### Empty State Canónico
```tsx
<div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
  <Inbox size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
  <h4 style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Sin registros encontrados</h4>
  <p style={{ fontSize: '13px', margin: 0 }}>No hay elementos para mostrar en esta categoría.</p>
</div>
```

### Error State con Botón de Reintento
```tsx
<div style={{
  padding: '14px 18px',
  backgroundColor: 'var(--danger-bg)',
  border: '1px solid var(--danger)',
  borderRadius: 'var(--radius-sm)',
  color: '#f87171',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '10px'
}}>
  <div><strong>Error:</strong> {errorMessage}</div>
  <button onClick={handleRetry} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>
    Reintentar
  </button>
</div>
```

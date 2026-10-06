# Responsive Design & Breakpoints SATEM

Este documento establece las reglas obligatorias de adaptación fluida a pantallas para garantizar que **ningún componente se desborde, corte o resulte inaccesible en smartphones, tablets o monitores de escritorio**.

---

## 📐 1. Tabla de Breakpoints Oficiales

| Dispositivo / Categoría | Rango de Ancho | Comportamiento Clave en SATEM |
| :--- | :--- | :--- |
| **Desktop Grande** | `≥ 1440px` | Layout completo a 4 columnas en KPIs. Ancho máximo de contenido acotado a `1600px`. |
| **Laptop / Desktop Estándar** | `1024px` – `1439px` | Sidebar fijo (`260px`). Grids de 3 o 4 columnas. Tablas con visualización holgada. |
| **Tablet Landscape** | `< 1024px` (`max-width: 1023px`) | **Sidebar se transforma en Drawer lateral oculto**. Botón hamburguesa visible. Header a `56px`. Grids de split pasan a 1 columna. |
| **Tablet Portrait & Mobile Estándar** | `< 768px` (`max-width: 767px`) | `.grid-2`, `.grid-form-2`, `.grid-form-3` colapsan a **1 columna**. Botones de cabecera se expanden al 100% con `flex-wrap`. |
| **Small Mobile** | `< 480px` (`max-width: 479px`) | Padding del cuerpo se reduce a `10px - 12px`. Diálogos modales ocupan todo el ancho con padding `14px`. Botones en ancho completo. |

---

## 🛡️ 2. Reglas Mandatorias Anti-Desbordamiento

1. **Flex Items con `min-width: 0`**:
   Todo contenedor flex hijo (`.main-content`, `.page-header-info`, bloques de título) debe declarar `min-width: 0` para evitar que textos largos o tablas empujen el ancho de la ventana provocando scroll horizontal involuntario.
2. **Contenedores de Botones y Filtros**:
   ```css
   /* Correcto */
   display: flex;
   flex-wrap: wrap;
   gap: 8px;

   /* PROHIBIDO */
   display: flex;
   white-space: nowrap; /* Rompe pantallas pequeñas */
   ```
3. **Tablas de Datos**:
   Toda etiqueta `<table>` debe estar contenida en un `div.table-container` con:
   ```css
   .table-container {
     width: 100%;
     max-width: 100%;
     overflow-x: auto;
     -webkit-overflow-scrolling: touch;
   }
   ```
4. **Imágenes y Recursos Multimedia**:
   ```css
   img, svg, video {
     max-width: 100%;
     height: auto;
     display: block;
   }
   ```

---

## 📱 3. Media Queries Completas del Sistema

```css
/* ==========================================================================
   Tablet (< 1024px)
   ========================================================================== */
@media (max-width: 1023px) {
  :root {
    --header-height: 56px;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 280px;
    z-index: 1200;
    transform: translateX(-100%);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.65);
    z-index: 1150;
    backdrop-filter: blur(3px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .sidebar-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }

  .mobile-menu-toggle {
    display: inline-flex;
  }

  .content-body {
    padding: 16px;
  }

  .header {
    padding: 0 16px;
  }

  .operating-cycle-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .expedients-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .expedients-sidebar {
    max-height: 380px;
  }

  .grid-split {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

/* ==========================================================================
   Mobile Estándar (< 768px)
   ========================================================================== */
@media (max-width: 767px) {
  .grid-2 {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .grid-form-2, .grid-form-3 {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .operating-cycle-grid {
    grid-template-columns: 1fr 1fr;
  }

  .page-header {
    margin-bottom: 16px;
    gap: 12px;
  }

  .page-header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .page-header-actions .btn {
    flex: 1;
    min-width: 140px;
  }

  .modal-dialog {
    padding: 18px;
    border-radius: var(--radius-md);
  }

  .header-user-email {
    display: none;
  }
}

/* ==========================================================================
   Small Mobile (< 480px)
   ========================================================================== */
@media (max-width: 479px) {
  .content-body {
    padding: 12px 10px;
  }

  .operating-cycle-grid {
    grid-template-columns: 1fr;
  }

  .grid-4 {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .kpi-card {
    padding: 14px;
  }

  .btn {
    padding: 8px 12px;
    font-size: 12.5px;
  }

  .page-header-actions .btn {
    width: 100%;
    flex: unset;
  }

  .modal-dialog {
    padding: 14px;
  }
}
```

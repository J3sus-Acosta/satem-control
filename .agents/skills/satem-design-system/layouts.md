# Arquitectura de Layouts & Navegación SATEM

Este documento detalla la estructura canónica de contenedores de aplicación, navegación lateral (Sidebar Desktop y Drawer Móvil), cabeceras y rejillas adaptables.

---

## 🏛️ 1. Estructura Jerárquica del Layout Base

Toda aplicación web SATEM se organiza bajo esta jerarquía DOM:

```
.app-container
  ├── .sidebar-backdrop (visible solo en mobile al abrir menú)
  ├── .sidebar (Sticky en desktop, Drawer flotante en mobile)
  │     ├── Header de marca (Logo + SATEM Control / Portal)
  │     └── <nav> (Links de navegación con icono Lucide)
  └── .main-content
        ├── .header (Sticky, 64px, breadcrumbs, perfil de usuario)
        └── .content-body (Padding 24px, max-width 1600px)
              ├── .page-header (Título h1, subtítulo, botones de acción)
              └── [Contenido de página: grids, cards, tablas]
```

---

## 💻 2. CSS Oficial del Layout

```css
.app-container {
  display: flex;
  min-height: 100vh;
  position: relative;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

/* Sidebar Navigation */
.sidebar {
  width: var(--sidebar-width);
  background-color: var(--bg-surface);
  border-right: 1px solid var(--border-color);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  z-index: 100;
  overflow-y: auto;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-backdrop {
  display: none;
}

/* Main Content Container */
.main-content {
  flex: 1;
  min-width: 0; /* Previene desbordamiento en elementos flex */
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
}

/* Header Sticky */
.header {
  height: var(--header-height);
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 90;
  backdrop-filter: blur(8px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.mobile-menu-toggle {
  display: none;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.mobile-menu-toggle:hover {
  background-color: var(--bg-card-hover);
  border-color: var(--accent-primary);
}

.content-body {
  padding: 24px;
  flex: 1;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

/* Cabecera de Página */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header-info {
  flex: 1;
  min-width: 260px;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
```

---

## 📱 3. Adaptación Responsive del Menú Lateral (Drawer)

Para pantallas de ancho menor a 1024px:
- La barra lateral se oculta hacia la izquierda (`transform: translateX(-100%)`).
- Se activa el backdrop atenuado con desenfoque (`.sidebar-backdrop.open`).
- El botón `.mobile-menu-toggle` se vuelve visible en la cabecera.

```css
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
}
```

---

## 📐 4. Rejillas Canónicas SATEM

```css
/* Rejilla de 4 KPIs / Métricas */
.grid-4 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

/* Rejilla de 3 Columnas */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

/* Rejilla de 2 Columnas */
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

/* Split Asimétrico (60% / 40%) */
.grid-split {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
  margin-bottom: 24px;
}

/* Formularios en 2 columnas */
.grid-form-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

/* Formularios en 2 columnas asimétricas */
.grid-form-3 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}
```

---

## 🧩 5. Patrón Master-Detail (Ej. Expedientes / Registros)

En resoluciones de escritorio, el listado se mantiene en un panel lateral de `300px` y el detalle 360° en el área amplia:

```css
.expedients-layout {
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  width: 100%;
}

.expedients-sidebar {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 180px);
  min-width: 0;
}

.expedients-detail-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 24px;
  min-width: 0;
  width: 100%;
}

@media (max-width: 1023px) {
  .expedients-layout {
    grid-template-columns: 1fr;
  }
}
```

---
name: satem-design-system
description: Sistema oficial de diseño UI/UX de SATEM (tokens, componentes dark mode, responsive, layouts, branding y accesibilidad) para proyectos nuevos y modernización de existentes.
---

# SATEM UI Design System

Este skill es la **fuente de verdad visual y técnica oficial para todas las aplicaciones web del ecosistema SATEM (SATEM Soluciones Inteligentes SpA)**.

Garantiza que cualquier proyecto nuevo nazca con la identidad visual corporativa de SATEM y que cualquier proyecto existente pueda alinearse de forma coherente sin romper funcionalidades preexistentes.

---

## 🎯 Cuándo utilizar este Skill

1. **Nuevos proyectos SATEM**: Desde el scaffold inicial, antes de crear cualquier componente, página o layout.
2. **Modernización de proyectos existentes**: Para auditar la interfaz actual, reemplazar colores/estilos arbitrarios y estandarizar componentes.
3. **Creación de nuevos componentes o pantallas**: Cuando se soliciten vistas, formularios, dashboards, tablas, diálogos o flujos operativos.
4. **Optimización Responsive**: Cuando una interfaz requiera adaptación a móviles, tablets y pantallas de alta resolución sin desbordamientos.

---

## 📐 Principios de Diseño SATEM

| Principio | Regla Mandatoria |
| :--- | :--- |
| **Dark Mode Premium** | La paleta base es de tonos oscuros de alta gama: fondo Slate 900 (`#0f172a`), superficies Slate 800 (`#1e293b`), acento corporativo `#00a896`. Prohibido crear pantallas en blanco chillón o grises planos sin jerarquía. |
| **Vanilla CSS & Design Tokens** | Se utilizan **variables CSS nativas** (`:root`). Salvo indicación explícita del usuario, **no se introduce Tailwind CSS** ni frameworks pesados (MUI, Bootstrap). |
| **Tipografía Dual Intencionada** | Headings (`h1-h6`) en **Outfit** (con `clamp()` fluido). Cuerpo, tablas y hashes en **Inter**. |
| **Arquitectura No-Break** | La adaptación visual en proyectos existentes **jamás debe romper handlers, hooks, estados ni modelos de datos**. |
| **Touch-Friendly & Responsivo** | Todo elemento interactivo tiene un área táctil mínima de 38px. Contenedores de botones y filtros usan siempre `flex-wrap: wrap; gap: 8px;`. Tablas con scroll horizontal protegido. |

---

## 📚 Estructura de la Documentación Modular

Para una referencia exhaustiva, este skill se compone de los siguientes módulos especializados:

1. **[Design Tokens & CSS Variables](./tokens.md)**: Paleta de colores HEX/RGBA, tipografía, escalas de espaciado, radios de curvatura, sombras, elevaciones y z-index.
2. **[Componentes UI Canónicos](./components.md)**: Botones, Badges, Modales, Cards, Tablas, Formularios, Inputs, Selects, Switches, Tabs, Empty States, Spinners y Alertas.
3. **[Layouts & Navegación](./layouts.md)**: Estructura del AppLayout (Backoffice), PortalLayout (Clientes), Drawer móvil con backdrop, Breadcrumbs y cabeceras.
4. **[Identidad de Marca & Logos](./branding.md)**: Especificación de assets oficiales (`logo-icon.png`, `logo-full.png`, `satem-signature.png`), dimensiones y contextos de uso.
5. **[Responsive Design & Breakpoints](./responsive.md)**: Comportamiento en Desktop Large (≥1440px), Desktop (1024-1439px), Tablet (768-1023px) y Mobile (<768px y <480px).
6. **[Guía de Migración & Adopción](./migration.md)**: Procedimiento paso a paso para diagnosticar proyectos legados y migrarlos al estándar visual SATEM.

---

## ⚡ Protocolos de Ejecución

### Protocolo A: Creación de un Nuevo Proyecto SATEM

Cuando se inicializa un proyecto nuevo:
1. **Configurar Tipografías en `index.html`**:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet" />
   ```
2. **Instalar Tokens Base**: Copiar o inyectar las variables del archivo [tokens.md](./tokens.md) en el archivo principal `src/index.css`.
3. **Copiar Assets Oficiales**: Ubicar `logo-icon.png` y `logo-full.png` en la carpeta `public/assets/` del proyecto.
4. **Montar el Layout Canónico**: Replicar la estructura de navegación responsive descrita en [layouts.md](./layouts.md).
5. **Construir Componentes**: Emplear únicamente las clases y variantes detalladas en [components.md](./components.md).

### Protocolo B: Adaptación de un Proyecto Existente

Cuando se solicite alinear un proyecto existente a SATEM:
1. **Auditoría de Inconsistencias**:
   - Detectar colores hardcodeados (hexadecimales arbitrarios) y mapearlos a las variables de [tokens.md](./tokens.md).
   - Identificar botones o modales dispersos y unificarlos con las clases `.btn`, `.btn-primary`, `.btn-secondary`, `.modal-overlay`, `.modal-dialog`.
   - Verificar si existen tablas sin contenedor de desplazamiento (`.table-container`).
2. **Integración Gradual**:
   - Incorporar las variables CSS en la raíz del proyecto.
   - Ajustar primero el contenedor raíz (`body`, `app-container`, `header`, `sidebar`).
   - Ajustar posteriormente las pantallas módulo a módulo.
3. **Prueba de Integridad**:
   - Comprobar que todos los formularios mantengan sus callbacks de submit.
   - Verificar que no se alteraron llamadas a la API ni validaciones de datos.
   - Probar la vista en resoluciones de 375px (mobile), 768px (tablet) y 1440px (desktop).

---

## 🛡️ Reglas de Prioridad Visual

1. Si existe un componente estándar definido en este Design System, **está estrictamente prohibido crear una alternativa arbitraria**.
2. Los botones de acción principal siempre deben usar `--accent-primary` (#00a896).
3. Los botones de peligro/eliminación siempre deben usar la variante destructiva (`.btn-danger` o texto `#ef4444`).
4. Toda ventana modal debe incluir botón de cierre en la esquina superior derecha (`<X size={18} />`), desenfoque de fondo (`backdropFilter: blur(4px)`) y soporte para cierre al pulsar fuera del diálogo.

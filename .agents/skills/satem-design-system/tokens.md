# Design Tokens & CSS Variables SATEM

Este documento define la totalidad de los **Design Tokens** oficiales de SATEM. Cualquier aplicación SATEM debe declarar estas variables en su archivo raíz CSS (`src/index.css` o equivalente).

---

## 🎨 1. Paleta de Colores

### A. Fondos y Superficies
| Token | Valor HEX / RGBA | Propósito & Caso de Uso |
| :--- | :--- | :--- |
| `--bg-primary` | `#0f172a` (Slate 900) | Fondo principal de la aplicación, fondo de campos de entrada e ítems de auditoría. |
| `--bg-surface` | `#1e293b` (Slate 800) | Superficie de navegación, sidebar lateral, cabeceras fijas (`header`). |
| `--bg-card` | `#1e293b` (Slate 800) | Contenedores principales de contenido, paneles de detalle y diálogos modales. |
| `--bg-card-hover` | `#334155` (Slate 700) | Estado `:hover` en tarjetas interactivas y filas de tablas (`tr:hover`). |
| `--bg-input` | `#0f172a` (Slate 900) | Fondo de `<input>`, `<select>`, `<textarea>`. Garantiza contraste interno contra la card. |
| `--bg-overlay` | `rgba(15, 23, 42, 0.85)` | Fondo con opacidad para backdrop de modales y drawers móviles. |

### B. Color de Marca (Brand SATEM)
| Token | Valor | Propósito & Caso de Uso |
| :--- | :--- | :--- |
| `--accent-primary` | `#00a896` | Color principal de la marca SATEM (verde azulado oscuro enérgico). Acciones primarias, tabs activos y enlaces. |
| `--accent-primary-hover` | `#008f80` | Estado `:hover` en botones primarios. |
| `--accent-glow` | `rgba(0, 168, 150, 0.25)` | Resplandor suave para `:focus` en inputs, bordes iluminados y sombras activas. |

### C. Bordes y Delimitadores
| Token | Valor HEX | Propósito & Caso de Uso |
| :--- | :--- | :--- |
| `--border-color` | `#334155` | Borde estructural estándar (tarjetas, tablas, separadores, inputs). |
| `--border-light` | `#475569` | Borde sutil o estado de hover en elementos interactivos secundarios. |

### D. Jerarquía de Texto y Contraste
| Token | Valor HEX | Propósito & Caso de Uso |
| :--- | :--- | :--- |
| `--text-primary` | `#f8fafc` | Texto de máxima legibilidad (blanco suave 98%). Títulos, datos críticos y valores KPI. |
| `--text-secondary` | `#94a3b8` | Texto complementario (gris claro). Etiquetas de formulario, subtítulos y cabeceras de tablas. |
| `--text-muted` | `#64748b` | Metadatos secundarios (gris medio). Fechas, notas al pie, texto de ayuda y hashes. |

### E. Estados y Alertas Semánticas
| Token | Color Primario | Fondo Suave (`-bg`) | Aplicación |
| :--- | :--- | :--- | :--- |
| **Success** | `--success: #10b981` | `--success-bg: rgba(16, 185, 129, 0.15)` | Firmado, Pagado, Conforme, Trazabilidad 100%, OK. |
| **Warning** | `--warning: #f59e0b` | `--warning-bg: rgba(245, 158, 11, 0.15)` | Pendiente de Firma, Por Vencer, Alerta Moderada, Provisorio. |
| **Danger** | `--danger: #ef4444` | `--danger-bg: rgba(239, 68, 68, 0.15)` | Error Crítico, Excepción Abierta, Rechazado, Acción Destructiva. |
| **Info** | `--info: #3b82f6` | `--info-bg: rgba(59, 130, 246, 0.15)` | En Proceso, Emitido, Detalle Técnico, Modo Lectura. |

---

## 🔤 2. Tipografía & Jerarquía Visual

### Familias Tipográficas
```css
--font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-heading: 'Outfit', sans-serif;
```

### Escala Fluida Responsiva para Encabezados
Todos los encabezados utilizan obligatoriamente `--font-heading: 'Outfit'` con función `clamp()`:
```css
h1 {
  font-family: var(--font-heading);
  color: var(--text-primary);
  font-weight: 700;
  font-size: clamp(1.35rem, 3.5vw, 1.65rem); /* ~21.6px - 26.4px */
  line-height: 1.25;
}

h2 {
  font-family: var(--font-heading);
  color: var(--text-primary);
  font-weight: 700;
  font-size: clamp(1.2rem, 2.8vw, 1.45rem);  /* ~19.2px - 23.2px */
  line-height: 1.3;
}

h3 {
  font-family: var(--font-heading);
  color: var(--text-primary);
  font-weight: 700;
  font-size: clamp(1.05rem, 2.2vw, 1.2rem);  /* ~16.8px - 19.2px */
  line-height: 1.35;
}

h4, h5, h6 {
  font-family: var(--font-heading);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1rem;
}
```

---

## 📏 3. Espaciado, Dimensiones & Radios

### Radios de Curvatura (`border-radius`)
| Token | Valor | Casos de Uso |
| :--- | :--- | :--- |
| `--radius-sm` | `6px` | Botones estándar, inputs, selects, badges compactos, tags. |
| `--radius-md` | `10px` | Tarjetas (Cards), KPIs, paneles de configuración, banners de notificación. |
| `--radius-lg` | `16px` | Ventanas modales (`.modal-dialog`), contenedor de login, cajones flotantes. |
| Píldora / Círculo | `9999px` o `50%` | Badges de estado (`.badge`), avatares, chips interactivos. |

### Sombras y Elevaciones
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
```

### Dimensiones Estructurales
```css
--sidebar-width: 260px; /* Ancho fijo en pantallas Desktop */
--header-height: 64px;  /* Reducido a 56px en pantallas < 1024px */
```

### Capas y Z-Index
| Nivel | Valor | Componente |
| :--- | :--- | :--- |
| Base | `1` - `10` | Contenido estándar, tablas y tarjetas. |
| Header Sticky | `90` | Barra superior de navegación / breadcrumbs. |
| Sidebar Sticky | `100` | Barra lateral fija en desktop. |
| Backdrop Móvil | `1150` | Fondo atenuado al abrir drawer en smartphones/tablets. |
| Drawer Móvil | `1200` | Barra lateral desplegada sobre contenido móvil. |
| Modal Overlay | `1000` o `1300` | Ventanas de diálogo emergentes y modales de confirmación. |

---

## 📋 4. Bloque CSS Listo para Inicializar Proyectos (`tokens.css`)

```css
:root {
  /* Tipografías */
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-heading: 'Outfit', sans-serif;

  /* Fondos y Superficies */
  --bg-primary: #0f172a;
  --bg-surface: #1e293b;
  --bg-card: #1e293b;
  --bg-card-hover: #334155;
  --bg-input: #0f172a;
  --bg-overlay: rgba(15, 23, 42, 0.85);

  /* Bordes */
  --border-color: #334155;
  --border-light: #475569;

  /* Textos */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  /* Identidad Brand SATEM */
  --accent-primary: #00a896;
  --accent-primary-hover: #008f80;
  --accent-glow: rgba(0, 168, 150, 0.25);

  /* Estados Semánticos */
  --success: #10b981;
  --success-bg: rgba(16, 185, 129, 0.15);
  --warning: #f59e0b;
  --warning-bg: rgba(245, 158, 11, 0.15);
  --danger: #ef4444;
  --danger-bg: rgba(239, 68, 68, 0.15);
  --info: #3b82f6;
  --info-bg: rgba(59, 130, 246, 0.15);

  /* Curvaturas */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* Sombras */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15);

  /* Layout */
  --sidebar-width: 260px;
  --header-height: 64px;
}
```

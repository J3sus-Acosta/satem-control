# Identidad de Marca & Logos Oficiales SATEM

Este documento establece las directrices oficiales de uso, ubicación y renderizado de la identidad visual de **SATEM Soluciones Inteligentes SpA**.

---

## 🚫 Regla Crítica de Branding

> **PROHIBIDO inventar, generar por IA o sustituir los logotipos de SATEM por versiones no oficiales o formas SVG genéricas.**
> 
> Todas las aplicaciones deben consumir los assets gráficos existentes ubicados en el directorio `/public/assets/` del proyecto.

---

## 🖼️ 1. Catálogo de Assets Oficiales

| Archivo | Formato | Nombre Visual | Propósito y Contexto |
| :--- | :--- | :--- | :--- |
| `logo-icon.png` | PNG Transparente | **Isotipo SATEM** | Icono compacto para navegación (Sidebar), cabecera móvil, favicons y botones de login. |
| `logo-full.png` | PNG Transparente | **Logotipo Completo** | Logotipo horizontal con texto corporativo ("SATEM Soluciones Inteligentes SpA"). Cabeceras de documentos PDF, informes de conciliación, facturas y reportes imprimibles. |
| `satem-signature.png` | PNG Transparente | **Firma Institucional** | Sello / firma digital institucional para documentos generados y certificados de conformidad. |

---

## 🎯 2. Reglas de Uso y Dimensiones

### A. Isotipo en Barra Lateral de Navegación (`AppLayout` & `PortalLayout`)
- **Altura recomendada**: `28px`
- **Tratamiento en Dark Mode**: Al ubicarse sobre superficies oscuras (`--bg-surface: #1e293b`), se aplica el filtro CSS `brightness(0) invert(1)` para máxima nitidez y contraste blanco puro junto al texto de marca en `--accent-primary`:

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
  <img
    src="/assets/logo-icon.png"
    alt="SATEM Icon"
    style={{ height: '28px', filter: 'brightness(0) invert(1)' }}
  />
  <span style={{ fontSize: '19px', fontWeight: 'bold', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
    SATEM Control
  </span>
</div>
<span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
  Soluciones Inteligentes SpA
</span>
```

### B. Isotipo en Pantallas de Inicio de Sesión (`LoginPage` & `PortalLoginPage`)
- **Contenedor**: Círculo o cuadrado con esquinas redondeadas (`16px` o `50%`) de `56px x 56px`.
- **Fondo del contenedor**: `var(--accent-glow)` con borde `1px solid var(--accent-primary)`.
- **Icono / Isotipo**: Altura centrada de `32px`.

### C. Logotipo Completo en Generación de Documentos y PDFs
- **Ubicación**: Esquina superior izquierda de la primera página del documento o encabezado de reporte.
- **Altura máxima**: `45px` a `55px`.
- **Fondo**: Blanco puro o fondo claro corporativo de impresión.
- **Tratamiento**: Sin filtros de inversión de color (colores originales de marca).

---

## 🎨 3. Colores Institucionales

- **Verde Azulado SATEM (Brand Principal)**: `#00a896` (`--accent-primary`)
- **Verde Oscuro Hover**: `#008f80` (`--accent-primary-hover`)
- **Glow & Resplandor**: `rgba(0, 168, 150, 0.25)`
- **Azul Noche Slate (Fondo Base)**: `#0f172a` (`--bg-primary`)
- **Superficie Slate**: `#1e293b` (`--bg-surface`)

---

## 📦 4. Copia de Assets en Proyectos Nuevos

Al crear o clonar un proyecto nuevo en el ecosistema SATEM, debe asegurarse la presencia de los 3 archivos ejecutando o verificando:

```
[project-root]/public/assets/
  ├── logo-icon.png
  ├── logo-full.png
  └── satem-signature.png
```

Si no estuviesen disponibles en el nuevo repositorio, deben copiarse directamente desde el repositorio central `satem-control/satem-control-web/public/assets/`.

# Reporte Técnico de Refactorización Responsive: Contenedor Principal y Márgenes Flexibles

> **Destinatario:** Desarrollador / Agente IA a cargo del repositorio en producción.  
> **Objetivo:** Documentar el diagnóstico, la solución arquitectónica y los cambios exactos de código aplicados para resolver el estrangulamiento del contenedor principal en pantallas de escritorio y sincronizar los breakpoints responsivos.

---

## 1. Diagnóstico del Problema

### El síntoma
En pantallas de escritorio comunes (por ejemplo, notebooks con pantallas 1080p y escala de Windows al 125%, cuyo viewport CSS efectivo es de **1536px**), el contenedor principal y la barra de navegación no alcanzaban su ancho objetivo de **1440px**, sino que se comprimían a **1216px** (perdiendo más de 220px de contenido útil). En pantallas de 1366px, el contenedor caía a solo **1046px** (ancho típico de tablet).

### La causa raíz (La trampa del margen estático de Figma)
En `styles.css` y `sports.css`, se había definido para `@media (min-width: 1024px)`:
```css
--grid-margin: 160px;
--container-max: 1760px; /* 1440px + 160px + 160px */
```
Y los estilos del contenedor y header calculaban:
```css
.container {
  max-width: var(--container-max);
  padding-left: var(--grid-margin);
  padding-right: var(--grid-margin);
}

header.site-header {
  width: calc(100% - (var(--grid-margin, 160px) * 2));
  max-width: var(--container-content-max, 1440px);
}
```

* **Por qué fallaba:** En Figma, el lienzo desktop medía 1760px fijos ($1440\text{px} + 160\text{px} + 160\text{px}$). Pero al trasladar `160px` como un margen obligatorio y rígido en CSS, en cualquier pantalla menor a 1760px el sistema restaba $160\text{px} \times 2 = 320\text{px}$ de aire muerto:
  $$\text{Viewport } 1536\text{px} - 320\text{px} = \mathbf{1216\text{px}}$$
  El contenedor solo podía llegar a medir 1440px en monitores gigantes de 1760px o más.

---

## 2. Solución Arquitectónica (Estándar de la Industria)

Se desacopló el **ancho máximo del contenido** (`1440px`) del **margen de seguridad lateral** (*safety gutter*):

1. **El contenido manda:** El contenido útil interno se limita a un máximo de **1440px** (`--container-content-max: 1440px`).
2. **Margen de seguridad elástico:** En pantallas de escritorio, el gutter lateral mínimo de seguridad es de **`32px`** (en lugar de 160px forzados).
3. **El contenedor se calcula dinámicamente:**
   ```css
   --container-max: calc(var(--container-content-max, 1440px) + (var(--grid-margin) * 2));
   ```
4. **Comportamiento dinámico según el viewport:**
   * **En monitores ultra-anchos ($\ge 1760\text{px}$ o 1920px):** El contenedor y el header se limitan a 1440px y se autocentran con `margin: 0 auto;`. El espacio sobrante se convierte automáticamente en márgenes elegantes de **160px a cada lado** (tal como el diseño original de Figma) o 240px en 1920px.
   * **En notebooks/pantallas medianas ($1536\text{px}$):** El contenedor y la barra flotante **aprovechan los 1440px completos**, dejando un margen proporcionado y limpio de **48px** por lado ($\frac{1536 - 1440}{2}$).
   * **En laptops estándar ($1366\text{px}$ / $1280\text{px}$):** Ocupan el espacio disponible dejando el resguardo de 32px (ej. 1302px en 1366px en vez de los 1046px anteriores).

---

## 3. Armonización de Breakpoints Responsivos

Se revisaron y alinearon todas las variantes de pantalla para que la grilla de 8 puntos, la barra flotante y los componentes mantengan proporciones consistentes:

| Breakpoint | Ancho Pantalla | `--grid-margin` | Ancho Contenedor / Header |
| :--- | :--- | :--- | :--- |
| **Desktop Grande** | $\ge 1760\text{px}$ | 32px (seguridad) | 1440px centrado (márgenes libres $\ge 160\text{px}$) |
| **Desktop / Laptop** | $1024\text{px} - 1759\text{px}$ | 32px | Hasta 1440px (en 1536px mide 1440px con 48px margen) |
| **Tablet** | $768\text{px} - 1023\text{px}$ | 24px (antes 64px) | Fluido con 24px de margen (720px útiles en 768px) |
| **Mobile General** | $\le 768\text{px}$ | 18px | 100% fluido con 18px de resguardo lateral |
| **Mobile Compacto** | $\le 480\text{px}$ | 12px | 100% fluido con 12px de resguardo lateral |

---

## 4. Archivos Modificados y Cambios Exactos

### A. `styles.css`

#### 1. Variables Base en `:root`
```diff
  /* Grilla y contenedor principal (Base Mobile: <= 767px) */
  --grid-cols: 4;
  --grid-gutter: 16px;
- --grid-margin: 24px;
+ --grid-margin: 18px;
  --container-content-max: 1440px;
- --container-max: 1760px; /* 1440px + 160px + 160px para Desktop */
+ --container-max: calc(var(--container-content-max, 1440px) + (var(--grid-margin) * 2));
```

#### 2. Breakpoint Tablet (`@media (min-width: 768px)`)
```diff
-/* Tablet (768px a 1023px): 12 Columnas | Gutter: 24px | Margen lateral: 64px */
+/* Tablet (768px a 1023px): 12 Columnas | Gutter: 24px | Margen lateral de seguridad: 24px */
 @media (min-width: 768px) {
   :root {
     --grid-cols: 12;
     --grid-gutter: 24px;
-    --grid-margin: 64px;
+    --grid-margin: 24px;
     --gutter: 24px;
-    --page-margin: 64px;
+    --page-margin: 24px;
+    --container-max: calc(var(--container-content-max, 1440px) + (var(--grid-margin) * 2));
     --section-space: 96px;
     --section-padding-y: 96px;
     --section-header-mb: 32px;
```

#### 3. Breakpoint Desktop (`@media (min-width: 1024px)`)
```diff
-/* Desktop (>= 1024px): 12 Columnas | Gutter: 32px | Margen lateral: 160px | Contenedor: 1760px */
+/* Desktop (>= 1024px): 12 Columnas | Gutter: 32px | Margen lateral de seguridad: 32px | Contenedor max: 1440px */
 @media (min-width: 1024px) {
   :root {
     --grid-cols: 12;
     --grid-gutter: 32px;
-    --grid-margin: 160px;
+    --grid-margin: 32px;
     --gutter: 32px;
-    --page-margin: 160px;
+    --page-margin: 32px;
     --container-content-max: 1440px;
-    --container-max: 1760px;
-    --section-space: 160px;
-    --section-padding-y: 160px;
+    --container-max: calc(var(--container-content-max, 1440px) + (var(--grid-margin) * 2));
+    --section-space: 140px;
+    --section-padding-y: 140px;
     --section-header-mb: 48px;
```

#### 4. Fallback del Navbar (`header.site-header`)
```diff
 header.site-header {
   position: fixed;
   top: 18px;
   left: 50%;
   transform: translateX(-50%);
   z-index: 1000;
-  width: calc(100% - (var(--grid-margin, 160px) * 2));
+  width: calc(100% - (var(--grid-margin, 32px) * 2));
   max-width: var(--container-content-max, 1440px);
```

#### 5. Posicionamiento del Widget de Clima (`.hero-weather-card`)
```diff
 .hero-weather-card {
   position: fixed;
   top: 108px;
-  left: calc(50% - (min(100% - (var(--grid-margin, 160px) * 2), var(--container-content-max, 1440px)) / 2));
+  left: calc(50% - (min(100% - (var(--grid-margin, 32px) * 2), var(--container-content-max, 1440px)) / 2));
   z-index: 990;
   width: 304px;
```

#### 6. Mobile General (`@media (max-width: 768px)`)
```diff
 /* --- MOBILE GENERAL (max-width: 768px) --- */
 @media (max-width: 768px) {
+  :root {
+    --grid-margin: 18px;
+    --page-margin: 18px;
+    --container-max: 100%;
+  }
   /* Contenedor & Header */
   .container {
-    padding-left: 18px;
-    padding-right: 18px;
+    padding-left: var(--grid-margin, 18px);
+    padding-right: var(--grid-margin, 18px);
   }
   header.site-header {
-    width: calc(100% - (var(--grid-margin, 24px) * 2));
+    width: calc(100% - (var(--grid-margin, 18px) * 2));
     top: 10px;
```

#### 7. Mobile Pequeño (`@media (max-width: 480px)`)
```diff
 /* --- TELÉFONOS CHICOS (max-width: 480px) --- */
 @media (max-width: 480px) {
+  :root {
+    --grid-margin: 12px;
+    --page-margin: 12px;
+  }
   .container {
-    padding-left: 14px;
-    padding-right: 14px;
+    padding-left: var(--grid-margin, 12px);
+    padding-right: var(--grid-margin, 12px);
   }
   header.site-header {
-    width: calc(100% - 16px);
+    width: calc(100% - (var(--grid-margin, 12px) * 2));
     top: 8px;
     padding: 5px 10px;
   }
   .hero-weather-card {
     top: 76px;
-    left: 8px;
+    left: var(--grid-margin, 12px);
   }
```

---

### B. `sports.css` (Subpáginas de deportes)
Se aplicó la misma sincronización en `sports.css` para evitar desajustes visuales al navegar entre la Home y las páginas de Kitesurf, Windsurf o Wingfoil:
* `--grid-margin: 18px` en Base Mobile.
* `--grid-margin: 24px` en Tablet (`@media (min-width: 768px)`).
* `--grid-margin: 32px` y `--container-max: calc(var(--container-content-max, 1440px) + (var(--grid-margin) * 2))` en Desktop (`@media (min-width: 1024px)`).
* `header.site-header`: fallback actualizado de 160px a 32px.

---

### C. `index.html`
Se actualizó la cadena de versión del recurso CSS para invalidación automática de caché del navegador:
```diff
- <link rel="stylesheet" href="./styles.css?v=6.3">
+ <link rel="stylesheet" href="./styles.css?v=6.4">
```

---

## 5. Resumen de Validación
* **Consistencia visual:** El navbar flotante, el widget meteorológico de cabecera y el contenido de las secciones ahora arrancan en la misma línea vertical en todas las resoluciones.
* **Compatibilidad:** 100% compatible con notebooks Full HD con escala de Windows (125%), MacBooks con pantalla Retina y pantallas ultra panorámicas de escritorio.
* **Cero JavaScript roto:** No afectó las animaciones del scroll-stack ni los cálculos dinámicos de `main.js`.

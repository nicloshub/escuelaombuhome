# ESTADO DEL PROYECTO & GUÍA TÉCNICA (ESCUELA OMBÚ)
> **Documento para transferencia de contexto a otra IA / Desarrollador.**  
> **Fecha de corte:** 23 de Octubre de 2026  
> **Estado general:** En desarrollo activo de subpáginas deportivas. Kitesurf avanzada al 90%.

---

## 1. Entorno de Trabajo y Repositorio

* **Directorio raíz del proyecto activo:**  
  `C:\Users\cloos\Desktop\escuelaombu-cami`  
  *(Nota crítica: NO trabajar en `F:\ParaGuardar\EscuelaOmbu`, que rastrea la landing principal en `main`. El trabajo activo de las subpáginas está en Desktop).*
* **Rama de Git activa:**  
  `nico/subpaginas`
* **Servidor local de desarrollo:**  
  * Ejecutable: `node server.cjs` (servidor HTTP estático nativo).  
  * URL Local: `http://localhost:5175/`  
  * Subpágina Kitesurf: `http://localhost:5175/kitesurf/`
* **Archivos clave modificados:**  
  * `kitesurf/index.html` (Markup principal de la subpágina).  
  * `sports.css` (Hojas de estilo compartidas de subpáginas, cache buster actual `?v=7.4`).  
  * `sports.js` (Lógica interactiva de subpáginas, cache buster actual `?v=4.1`).  
  * `assets/` (Imágenes, fotos webp/jpeg/png y fuentes tipográficas).

---

## 2. Reglas de Oro Técnicas (CUIDADO - EVITAR REGRESIONES)

1. **Saltos de línea (Line Endings): LF estricto (`\n`)**  
   * El repositorio tiene formato Unix LF. En entornos Windows, **NUNCA** guardar con `\r\n` (CRLF).  
   * Si se guardan archivos con CRLF, `git diff` marca miles de líneas modificadas y las herramientas de reemplazo por texto (`Target -> Replacement`) fallan por discrepancia de caracteres invisibles.  
   * En Python, siempre usar: `open(filepath, 'w', encoding='utf-8', newline='\n')`.
2. **Cuidado con `git checkout <file>` / `git restore`**  
   * **NUNCA** ejecutar `git checkout sports.css` o similares sin antes commitear o stashear. El último commit en Git es de un estado anterior; un checkout descarta cientos de líneas de trabajo acumulado.
3. **Paddings de sección unificados**  
   * Las macrosecciones (`section-macro`) tienen un padding vertical unificado en desktop de **96px**:  
     `--kitesurf-pad-y-desktop: 96px;`
4. **Validación visual con Headless Chrome**  
   * Chrome está instalado en: `C:\Program Files\Google\Chrome\Application\chrome.exe`.  
   * Para verificar visualmente sin abrir ventanas: correr scripts Node/Python con CDP (`--headless=new --remote-debugging-port=XXXX`) o capturar screenshots para evitar romper layout.

---

## 3. Estado de Secciones de Kitesurf (`kitesurf/index.html`)

### ✅ 1. Hero (`#inicio`) - *Completado*
* Marco de la foto (`.kite-hero-photo-frame`): **Sin sombra** (`box-shadow: none`).
* Círculo naranja con flecha diagonal en H1 (`.kite-hero-circle-arrow`): **Sin sombra** (`box-shadow: none`), tanto en estado normal como en hover.
* Tarjeta `+15 AÑOS` (`.kite-hero-exp-card`): Padding unificado a **20px** en todos los lados, esquinas redondeadas (`border-radius: 14px`), sin sombra.
* Widget de telemetría en vivo: Conectado a la API de viento oficial (Open-Meteo) mostrando nudos, km/h y orientación en tiempo real.

### ✅ 2. Niveles / El Camino (`#camino`) - *Completado*
* Acordeón interactivo horizontal de 3 niveles (`.level-accordion`).
* Altura estabilizada en **570px** en desktop (`height: 570px`), evitando que se estire verticalmente hacia abajo.
* Badges de nivel: Píldora negra para el nivel (`.level-tag-badge`), píldoras grises claras para horas y descripción (`.level-tag-pill`).
* Checklist de objetivos con letras A, B, C, D... en píldoras redondeadas.
* Animación: `is-in-view` activada por `IntersectionObserver` al hacer scroll.

### ✅ 3. Equipamiento 100% Provisto (`#equipo`) - *Completado*
* **Estructura:** Lista editorial interactiva (`.gear-editorial-stage`) con previsualización flotante (`.gear-floating-preview`).
* **Items (5 exactos del diseño):**
  1. Kite
  2. Tabla
  3. Chaleco
  4. Casco
  5. Traje de neoprene
* **Comportamiento interactivo:**
  * **Inactivo:** `border-radius: 0`, separados únicamente por una línea horizontal oscura continua (`border-bottom: 1px solid var(--ink)`). Texto a la izquierda, flecha `↗` a la derecha.
  * **Activo (Hover / Touch):** Fondo naranja (`#FF5206`), texto blanco, esquinas redondeadas (`border-radius: 20px`), muestra la píldora descriptiva debajo del nombre, botón circular blanco con flecha negra.
  * **Desaparición de líneas adyacentes:** Al estar activo un item, la línea de arriba y la de abajo desaparecen automáticamente (gestionado con CSS `:has()` y clases JS de fallback `.has-active-next` e `.is-first-active`).
  * **Dimensiones:** Items al **100% del ancho del contenedor**.
  * **Tipografía Desktop:** Nombres a **25px** (Anton), píldora explicativa a **13px** (Inter).
* **Botón Inferior:** `¿Traés tu equipo? Consultanos` (`.gear-consult-btn`):
  * **Ancho completo (100%)** del contenedor.
  * `border-radius: 12px` en desktop. Fondo `#1F1C1D`.

### ✅ 4. Clase Paso a Paso (`#dia-de-clase`) - *Completado*
* Scrollytelling interactivo: mientras se scrollea la lista de pasos (1 a 5), la foto lateral izquierda hace crossfade con la escena correspondiente (desde la escuela, armado en la arena, hasta el agua).

### ✅ 5. Seguridad y Bote de Rescate (`#rescate`) - *Completado*
* Tarjeta oscura `.rescue-card-dark` (`#231F20`, `border-radius: 28px`).
* Tipografía blanca con titular: `GOMÓN DE RESCATE EN GUARDIA PERMANENTE`.
* Check badge `EMBARCACIÓN NÁUTICA HOMOLOGADA`.
* Contenedor de foto `.rescue-media-box` (actualmente con placeholder "FOTO BOTE" a la espera de la foto final del semirrígido).

---

## 4. Sección Reseñas de Alumnos (`#resenas`) - *Completado*

Se reemplazó exitosamente la antigua sección bento por la **grilla editorial de 3 columnas de Reseñas de Alumnos**:
* **Cabecera unificada:** `// RESEÑAS DE ALUMNOS` con título Anton `EMPEZARON DE CERO. MIRÁ DÓNDE ESTÁN.`
* **Columna Izquierda:** Foto superior de rider en salto (`deporte-kitesurf.webp`) + Card naranja con logo de **HARD WIND** (`logo_hw.svg`) y bajada institucional.
* **Columna Central (Reseña Activa):** Card con comillas dobles naranjas, cita testimonial, autor, puntaje `5.0 ★` y foto interior del alumno.
* **Controles Circulares:** Botones `←` y `→` centrados al pie de la tarjeta central con microinteracciones y soporte táctil swipe en móviles.
* **Carrusel en JavaScript (`sports.js`):** Función `initResenasCarousel()` con precarga inmediata de imágenes y transición suave por crossfade.
* **Columna Derecha:** Foto superior de alumnos celebrando en el agua (`mosaico-tablas.webp`) + Card oscura `#231F20` con cifra `200+` y texto social proof.

---

## 5. Glosario de Variables CSS y Tokens de Identidad

```css
--orange: #FF5206;
--ink: #1F1C1D;         /* Negro / gris muy oscuro institucional */
--dark-card: #231F20;    /* Fondo de tarjetas oscuras */
--white: #FEFEFE;
--light-1: #F6F6F6;
--font-display: 'Anton', Impact, sans-serif;
--font-body: 'Inter', Arial, sans-serif;
--radius-card: 24px;
--radius-pill: 999px;
```

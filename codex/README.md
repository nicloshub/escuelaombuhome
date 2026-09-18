# Escuela Ombú

Implementación en HTML, CSS y JavaScript sin frameworks ni dependencias de compilación.

## Estado

Trabajo en curso. No publicar todavía: falta incorporar los recursos originales y verificar visualmente contra el Figma actual.

El conector de Figma alcanzó el límite del plan Starter. Se obtuvo la estructura del frame 131:6 y una referencia visual; no se pudieron obtener los contextos de las subsecciones. La sesión de navegador sí permite abrir el diseño, pero sus exportaciones y su portapapeles no entregaron datos al entorno de trabajo.

## Continuar

Se necesita el frame completo exportado desde Figma como SVG, con `Outline text` desactivado y `Include id attribute` activado. Esto permitirá extraer imágenes originales, texturas, íconos y textos, sin reconstruirlos de memoria.

Pendientes:

- Incorporar los archivos referenciados en `assets/`.
- Sustituir textos provisionales de deportes y completar todas las reseñas con la exportación exacta.
- Verificar tipografías, fotografías, recortes, texturas negras y posiciones contra el archivo.
- Confirmar los enlaces de WhatsApp y la cámara. No se inventaron números ni transmisiones.
- Los datos de viento son una muestra del diseño, no una lectura en tiempo real.
- Verificar en navegador a 1440, 1024, 768 y 390px, incluyendo carga de imágenes, desbordamientos y navegación por teclado.

## Desarrollo local

Con Node.js instalado:

```sh
node server.mjs
```

Abrir http://127.0.0.1:4173. El servidor está limitado a localhost y es sólo para desarrollo. La ruta `/__import` guarda la exportación SVG local para continuar la extracción.

`index.html` también se puede abrir directamente. Anton e Inter se cargan desde Google Fonts y necesitan conexión a Internet.

## Archivos

- `index.html`: estructura semántica de las secciones.
- `styles.css`: estilos y adaptaciones responsive.
- `script.js`: pestañas de deportes y menú móvil, con manejo de teclado.
- `server.mjs`: servidor local sin paquetes externos.

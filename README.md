# Escuela Ombú

Sitio estático con home y páginas de kitesurf, windsurf, wingfoil, SUP y kayaks.

## Desarrollo

Requiere Node.js 20 o superior. No requiere instalar paquetes.

```sh
npm run build
npm run dev
npm test
```

Abrir http://localhost:5175. Editar `templates/`, `content/faq.json`, `site.config.json`, `styles.css`, `seo.css`, `main.js` y `seo.js`; luego regenerar HTML con `npm run build`.

Los datos de contacto, dominio y redes están centralizados en `site.config.json`. La ficha que Google muestra como Buenos Aires Kitesurf fue confirmada por el propietario como su ficha. Las reseñas mantienen el contenido estático original, sin API ni widget externo. No se genera AggregateRating.

La clase de prueba está comentada en `templates/home.html`. Para activarla: completar duración/precio en la configuración y quitar el comentario que envuelve ese bloque. Los instructores muestran nombre y disciplina.

## Publicación

El desarrollo genera `noindex,follow`. Para publicar, cambiar `published` a `true` en la configuración y ejecutar `npm run build:production`. Esto genera páginas indexables y `sitemap.xml`, usando https://escuelaombu.com.ar en canonical, Open Graph y JSON-LD. El comando no despliega ni hace push.

Subir `index.html`, los cinco directorios de deportes, `assets/`, los archivos CSS/JS públicos, `robots.txt` y `sitemap.xml` a un hosting con soporte de `index.html` por directorio. No subir los scripts, plantillas ni configuración del proyecto. Configurar HTTPS y redirección del dominio alternativo al dominio canónico en el hosting.

Imágenes WebP y social 1200×630 generadas con `scripts/optimize-images.py` (Python + Pillow); originales conservados. El JSON-LD referencia también `assets/clases-kitesurf-san-isidro.jpg` según el bloque solicitado.

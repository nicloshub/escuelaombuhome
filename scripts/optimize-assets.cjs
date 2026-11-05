const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');

async function processImage(srcName, variants) {
  const srcPath = path.join(ASSETS_DIR, srcName);
  if (!fs.existsSync(srcPath)) {
    console.error(`Source file not found: ${srcName}`);
    return;
  }

  const origStat = fs.statSync(srcPath);
  console.log(`\nProcessing ${srcName} (${Math.round(origStat.size / 1024)} KB):`);

  for (const v of variants) {
    const destPath = path.join(ASSETS_DIR, v.destName);
    let pipeline = sharp(srcPath).rotate(); // auto-rotate based on EXIF if present

    if (v.width || v.height) {
      pipeline = pipeline.resize({
        width: v.width,
        height: v.height,
        fit: v.fit || 'inside',
        withoutEnlargement: true
      });
    }

    pipeline = pipeline.webp({
      quality: v.quality || 82,
      effort: 6
    });

    await pipeline.toFile(destPath);
    const destStat = fs.statSync(destPath);
    const savings = Math.round((1 - destStat.size / origStat.size) * 100);
    console.log(`  -> ${v.destName} [${v.label}]: ${Math.round(destStat.size / 1024)} KB (${savings}% smaller)`);
  }
}

async function run() {
  console.log('--- Starting Image Optimization with Sharp ---');

  // 1. Equipamiento (8 items)
  const equipment = [
    'equipo_arnes.JPEG',
    'equipo_barra.JPEG',
    'equipo_botitas.JPEG',
    'equipo_casco.JPEG',
    'equipo_chaleco.JPEG',
    'equipo_kite.JPEG',
    'equipo_tablas.JPEG',
    'equipo_traje.JPEG'
  ];

  for (const item of equipment) {
    const baseName = path.basename(item, path.extname(item));
    await processImage(item, [
      { destName: `${baseName}.webp`, width: 800, quality: 84, label: 'Desktop' },
      { destName: `${baseName}-mobile.webp`, width: 480, quality: 80, label: 'Mobile' }
    ]);
  }

  // 2. Bote de Rescate
  await processImage('boterio.png', [
    { destName: 'boterio.webp', width: 900, quality: 84, label: 'Desktop' },
    { destName: 'boterio-mobile.webp', width: 550, quality: 80, label: 'Mobile' }
  ]);

  // 3. Niveles
  await processImage('nivel-1.jpg', [
    { destName: 'nivel-1.webp', width: 900, quality: 82, label: 'Desktop' },
    { destName: 'nivel-1-mobile.webp', width: 550, quality: 80, label: 'Mobile' }
  ]);
  await processImage('nivel-2.jpg', [
    { destName: 'nivel-2.webp', width: 900, quality: 82, label: 'Desktop' },
    { destName: 'nivel-2-mobile.webp', width: 550, quality: 80, label: 'Mobile' }
  ]);
  await processImage('nivel-3.jpg', [
    { destName: 'nivel-3.webp', width: 900, quality: 82, label: 'Desktop' },
    { destName: 'nivel-3-mobile.webp', width: 550, quality: 80, label: 'Mobile' }
  ]);

  // 4. Hero Kitesurf
  await processImage('hero-kitesurf.jpg', [
    { destName: 'hero-kitesurf.webp', width: 1600, quality: 82, label: 'Desktop' },
    { destName: 'hero-kitesurf-mobile.webp', width: 800, quality: 80, label: 'Mobile' }
  ]);

  // 5. Journey (Paso a Paso 01-07)
  const steps = [
    'paso-01-recibimiento.jpg',
    'paso-02-condiciones.jpg',
    'paso-03-armamos.jpg',
    'paso-04-te-cambias.jpg',
    'paso-05-entramos-al-agua.jpg',
    'paso-06-comienza-la-accion.jpg',
    'paso-07-cierre.jpg'
  ];

  for (const step of steps) {
    const baseName = path.basename(step, path.extname(step));
    await processImage(step, [
      { destName: `${baseName}.webp`, width: 800, quality: 82, label: 'Desktop' },
      { destName: `${baseName}-mobile.webp`, width: 550, quality: 80, label: 'Mobile' }
    ]);
  }

  // 6. Instructor Adelino
  await processImage('instructor-adelino.jpg', [
    { destName: 'instructor-adelino.webp', width: 600, quality: 82, label: 'Standard' }
  ]);

  // 7. Reseñas
  await processImage('IMG_6171.JPG', [
    { destName: 'IMG_6171.webp', width: 700, quality: 82, label: 'Standard' }
  ]);
  await processImage('saltomirandote.jpg', [
    { destName: 'saltomirandote.webp', width: 750, quality: 82, label: 'Standard' }
  ]);

  console.log('\n--- Image optimization complete! ---');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

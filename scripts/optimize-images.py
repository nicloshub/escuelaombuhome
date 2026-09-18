"""Genera recursos WebP locales; conserva originales para futuras ediciones."""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
OUT = ASSETS / 'optimized'
OUT.mkdir(exist_ok=True)
names = {
    'IMG_0319.JPG': 'escuela-deportes-nauticos-acassuso',
    'IMG_9513.JPG': 'navegacion-kitesurf-rio-de-la-plata',
    'IMG_20200310_171427.jpg': 'practica-kitesurf-san-isidro',
    'sport-kitesurf-figma.jpg': 'clases-kitesurf-san-isidro',
    'windsurf.jpg': 'clases-windsurf-acassuso',
    'wingfoil.jpg': 'clases-wingfoil-san-isidro',
    'sup.jpg': 'clases-sup-paddle-acassuso',
    'kayaks.jpg': 'alquiler-kayaks-acassuso',
    'fondorio.png': 'camara-rio-acassuso',
    'fotocu1.jpg': 'alumnos-escuela-ombu',
    'fotocu2.jpg': 'tablas-windsurf-sup-ombu',
    'fotocu3.jpg': 'clase-navegacion-rio',
    'Horizontal BsN.png': 'logo-horizontal-escuela-ombu',
    'logoBsN.png': 'logo-ombu-oscuro',
    'logoNsB.png': 'logo-ombu-claro',
    'mascara1.png': 'textura-borde-ombu',
    **{f'instructor-{n}.jpg': f'instructor-{n}-escuela-ombu' for n in ['lara','marc','ana','nicolas']}
}
manifest = {}
for source, slug in names.items():
    original = ImageOps.exif_transpose(Image.open(ASSETS / source))
    original = original.convert('RGBA' if 'A' in original.getbands() else 'RGB')
    max_width = min(original.width, 1920)
    if source.startswith('logo'):
        widths = [min(96, original.width)]
    else:
        widths = sorted(set([w for w in [480,960,1440] if w < max_width] + [max_width]))
    variants = []
    for width in widths:
        height = round(original.height * width / original.width)
        filename = f'{slug}-{width}.webp'
        original.resize((width,height), Image.Resampling.LANCZOS).save(OUT / filename, 'WEBP', quality=82, method=6)
        variants.append({'src':f'/assets/optimized/{filename}','width':width,'height':height})
    manifest[source] = variants
hero = ImageOps.exif_transpose(Image.open(ASSETS / 'IMG_0319.JPG')).convert('RGB')
ImageOps.fit(hero, (1200,630), method=Image.Resampling.LANCZOS).save(OUT / 'escuela-ombu-social.jpg', quality=88, optimize=True)
(ASSETS / 'image-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{len(manifest)} recursos optimizados; imagen social 1200x630 generada.')

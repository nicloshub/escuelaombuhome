import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(import.meta.dirname);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/__import' && req.method === 'GET') {
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      return res.end('<!doctype html><html lang="es"><title>Importar referencia de Figma</title><form method="post"><label for="svg">SVG exportado de Figma</label><textarea id="svg" name="svg" style="display:block;width:90%;height:300px"></textarea><button>Guardar referencia</button></form></html>');
    }
    if (url.pathname === '/__import' && req.method === 'POST') {
      let data = '';
      for await (const chunk of req) { data += chunk; if (data.length > 64000000) { res.writeHead(413); return res.end(); } }
      const svg = new URLSearchParams(data).get('svg');
      if (!svg?.trim().startsWith('<svg')) { res.writeHead(400); return res.end('No se recibió un SVG.'); }
      await mkdir(resolve(root, 'reference'), {recursive:true});
      await writeFile(resolve(root, 'reference/figma.svg'), svg);
      res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8'});
      return res.end(`Referencia guardada: ${svg.length} caracteres.`);
    }
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep) || path.includes(sep + '.git' + sep)) { res.writeHead(403); return res.end(); }
    const content = await readFile(path);
    res.writeHead(200, {'Content-Type':types[extname(path)] || 'application/octet-stream'});
    res.end(content);
  } catch { res.writeHead(404); res.end('No encontrado'); }
});
server.listen(4173, '127.0.0.1', () => console.log('Escuela Ombú: http://127.0.0.1:4173'));

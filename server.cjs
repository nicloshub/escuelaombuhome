const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
function createServer() {
  return http.createServer((req,res) => {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405,{'Allow':'GET, HEAD'});return res.end(); }
    let pathname;
    try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400);return res.end();}
    const allowed=/^\/(?:$|index\.html$|(?:kitesurf|windsurf|wingfoil|sup|kayaks)(?:\/|\/index\.html)?$|(?:styles\.css|seo\.css|main\.js|seo\.js|robots\.txt|sitemap\.xml|favicon\.(?:ico|png))$|assets\/[\w .%/-]+$)/;
    if(!allowed.test(pathname) || pathname.split('/').some(s=>s.startsWith('.'))) {res.writeHead(404);return res.end('No encontrado');}
    let file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end();}
    try {
      if(fs.statSync(file).isDirectory()) {
        if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'});return res.end();}
        file=path.join(file,'index.html');
      }
      const info=fs.statSync(file);if(!info.isFile())throw new Error();
      res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':info.size,'X-Content-Type-Options':'nosniff'});
      if(req.method==='HEAD')return res.end();
      fs.createReadStream(file).pipe(res);
    }catch{res.writeHead(404);res.end('No encontrado');}
  });
}
if(require.main===module)createServer().listen(process.env.PORT||5175,'127.0.0.1',()=>console.log('Escuela Ombú: http://localhost:'+(process.env.PORT||5175)));
module.exports={createServer};

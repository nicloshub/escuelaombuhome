const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createServer}=require('../server.cjs');
const root=path.resolve(__dirname,'..');
const slugs=['','kitesurf','windsurf','wingfoil','sup','kayaks'];
for(const slug of slugs)test(`Página ${slug||'home'}: SEO, imágenes y enlaces locales`,()=>{
  const source=fs.readFileSync(path.join(root,slug,'index.html'),'utf8');
  const html=source.replace(/<!--[\s\S]*?-->/g,'');
  assert.match(html,/<html lang="es-AR">/);
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  assert.match(html,new RegExp(`rel="canonical" href="https://escuelaombu.com.ar/${slug?slug+'/':''}"`));
  const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const business=schemas.flatMap(s=>s['@graph']||[s]).find(s=>s['@type']==='SportsActivityLocation');
  assert.equal(business.email,'info@escuelaombu.com.ar');
  assert.equal(business.url,'https://escuelaombu.com.ar/');
  assert.ok(business.sameAs.includes('https://www.instagram.com/escuelaombu/'));
  assert.doesNotMatch(html,/URL_FINAL|URL_INSTAGRAM|\{\{|AggregateRating|\/api\/reviews/);
  for(const image of html.matchAll(/<img\b[^>]*>/g)){
    assert.match(image[0],/width="\d+"/);assert.match(image[0],/height="\d+"/);assert.match(image[0],/alt="[^"]*"/);
  }
  for(const [,url] of html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)){
    assert.ok(fs.existsSync(path.join(root,url)),`Recurso faltante ${url}`);
  }
});
test('Reseñas estáticas originales y clase de prueba oculta',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/Martín Sosa/);assert.match(html,/Santiago Muñoz/);
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g,''),/Reservar clase de prueba/);
  assert.match(html,/<!--<div>[\s\S]*?Reservar clase de prueba[\s\S]*?-->/);
});
test('Servidor: rutas de servicio, redirección y archivos privados',async()=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const base=`http://127.0.0.1:${server.address().port}`;
    for(const slug of slugs)assert.equal((await fetch(base+'/'+(slug?slug+'/':''))).status,200);
    assert.equal((await fetch(base+'/kitesurf',{redirect:'manual'})).status,301);
    for(const url of ['/.git/config','/site.config.json','/templates/home.html','/assets/../server.cjs','/%ZZ'])assert.ok((await fetch(base+url)).status>=400);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

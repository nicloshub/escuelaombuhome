import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFile(resolve(root, path), 'utf8');
const config = JSON.parse(await read('site.config.json'));
const faq = JSON.parse(await read('content/faq.json'));
const production = process.argv.includes('--production');
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const json = value => JSON.stringify(value, null, 2).replaceAll('<','\\u003c');
const origin = config.siteUrl ? new URL(config.siteUrl).origin : '';
if (origin && (!origin.startsWith('https://') || /URL_FINAL|localhost|example\./i.test(origin))) throw new Error('siteUrl debe ser el dominio HTTPS definitivo.');
if (production && (!origin || !config.published)) throw new Error('Definí siteUrl y published=true antes de generar producción.');
const indexable = production && config.published && Boolean(origin);
const mapLink = config.googleBusinessUrl || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${config.streetAddress}, ${config.addressLocality}, ${config.addressRegion}`);
const socialLinks = [config.instagramUrl, config.youtubeUrl, config.googleBusinessUrl].filter(Boolean);
for (const value of [...socialLinks,config.googleMapsEmbedUrl].filter(Boolean)) {
  if (new URL(value).protocol !== 'https:') throw new Error('Los enlaces públicos deben usar HTTPS.');
}
if (config.googleMapsEmbedUrl && !/^https:\/\/www\.google\.com\/maps\/embed[/?]/.test(config.googleMapsEmbedUrl)) throw new Error('Usá el iframe oficial de Google Maps.');
const business = {
  '@type':'SportsActivityLocation', '@id':origin ? `${origin}/#escuela` : '#escuela',
  name:config.name,
  description:'Escuela de kitesurf, windsurf, wingfoil y SUP en Acassuso, San Isidro. Equipo incluido y lancha de apoyo.',
  ...(origin ? {url:`${origin}/`,image:`${origin}/assets/clases-kitesurf-san-isidro.jpg`} : {}),
  telephone:config.telephone, email:config.email,
  address:{'@type':'PostalAddress',streetAddress:config.streetAddress,addressLocality:config.addressLocality,addressRegion:config.addressRegion,addressCountry:'AR'},
  geo:{'@type':'GeoCoordinates',latitude:config.latitude,longitude:config.longitude},
  openingHoursSpecification:{'@type':'OpeningHoursSpecification',dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],opens:'09:00',closes:'19:00'},
  ...(socialLinks.length ? {sameAs:socialLinks} : {})
};
const faqSchema={'@type':'FAQPage',mainEntity:faq.map(q=>({'@type':'Question',name:q.question,acceptedAnswer:{'@type':'Answer',text:q.answer}}))};
function head(title, description, path='/', extra=[]) {
  const url=origin+path;
  return `<title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${indexable?'index,follow':'noindex,follow'}">
  ${origin?`<link rel="canonical" href="${esc(url)}">`:''}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_AR">
  <meta property="og:site_name" content="Escuela Ombú">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  ${origin?`<meta property="og:url" content="${esc(url)}">`:''}
  <meta property="og:image" content="${esc(origin)}/assets/optimized/escuela-ombu-social.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Deportes náuticos en Escuela Ombú, Acassuso">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(origin)}/assets/optimized/escuela-ombu-social.jpg">
  <script type="application/ld+json">${json({'@context':'https://schema.org',...business})}</script>
  ${extra.length ? `<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':extra})}</script>` : ''}`;
}
const faqHTML=`<section class="section-faq" id="preguntas" aria-labelledby="faq-title"><div class="container"><span class="section-label">// Antes de empezar</span><h2 class="display-title" id="faq-title">Preguntas frecuentes</h2><div class="motion-accordion" data-accordion>${faq.map((q,i)=>`<div class="motion-accordion-item"><button type="button" class="motion-accordion-trigger" aria-expanded="false" aria-controls="faq-panel-${i}" id="faq-trigger-${i}"><span class="motion-accordion-question">${esc(q.question)}</span><span class="motion-accordion-icon" aria-hidden="true"><svg class="icon-plus" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><svg class="icon-minus" width="14" height="14" viewBox="0 0 14 2" fill="none"><path d="M1 1h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span></button><div class="motion-accordion-panel" id="faq-panel-${i}" role="region" aria-labelledby="faq-trigger-${i}"><div class="motion-accordion-content"><div class="motion-accordion-content-inner"><p>${esc(q.answer)}</p></div></div></div></div>`).join('')}</div></div></section>`;
const mapHTML=config.googleMapsEmbedUrl
  ? `<iframe src="${esc(config.googleMapsEmbedUrl)}" title="Ubicación oficial de Escuela Ombú en Google Maps" width="560" height="400" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`
  : `<div class="map-address"><span class="section-label">Acassuso · San Isidro</span><p>${esc(config.streetAddress)}</p><p>${esc(config.addressLocality)}</p><a class="btn-pill-dark" href="${esc(mapLink)}" target="_blank" rel="noopener noreferrer">Abrir ubicación en Google Maps</a></div>`;
const trialHours=Number(config.trialHours)>0 ? `${config.trialHours} horas` : '';
const trialCopy=trialHours
  ? `Si venís con dudas, es normal, a casi todos les pasa. Hacé una clase de prueba de ${trialHours}: la mitad en tierra, la otra mitad en el agua. Si te gusta, seguís. Si no, no perdiste nada.`
  : 'Si venís con dudas, es normal, a casi todos les pasa. Consultanos por la clase de prueba y coordinamos la duración y el recorrido con vos. Si te gusta, seguís. Si no, no perdiste nada.';
const replacements={
  '{{MAP}}':mapHTML,'{{MAP_LINK}}':esc(mapLink),'{{EMAIL}}':esc(config.email),
  '{{SOCIAL_PROOF}}':`+1.200 ALUMNOS${Number(config.schoolYears)>0?` · ${config.schoolYears} AÑOS EN EL RÍO`:''} · EQUIPO INCLUIDO · LANCHA DE APOYO`,
  '{{TRIAL_COPY}}':esc(trialCopy),
  '{{TRIAL_PRICE}}':Number(config.trialPriceARS)>0?`Precio: ${new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(config.trialPriceARS)}`:'Consultá duración y precio por WhatsApp.',
  '{{SOCIAL_LINKS}}':[[config.instagramUrl,'Instagram'],[config.youtubeUrl,'YouTube']].filter(([url])=>url).map(([url,label])=>`<a class="footer-social-link" href="${esc(url)}" target="_blank" rel="me noopener noreferrer">${label}</a>`).join(''),
  '{{REVIEWS_LINK}}':config.googleBusinessUrl?`<a class="service-detail-link" href="${esc(config.googleBusinessUrl)}" rel="me noopener noreferrer" target="_blank">Ver opiniones en Google Maps →</a>`:`<a class="service-detail-link" href="https://wa.me/${config.whatsapp}">Hablemos de tu primera clase →</a>`
};
let home=await read('templates/home.html');
for(const [key,value] of Object.entries(replacements))home=home.replaceAll(key,value);
home=home.replace('<!--SEO_HEAD-->',head('Escuela de Kitesurf y Windsurf en San Isidro | Ombú','Aprendé kitesurf, windsurf, wingfoil y SUP en Acassuso, a 20 min de Capital. Empezás de cero, con equipo incluido y lancha de apoyo. Reservá tu clase.','/',[faqSchema]));
home=home.replace('<!--FAQ_SECTION-->',faqHTML);
for(const [index,key] of ['lara','marc','ana','nicolas'].entries()) {
  const profile=config.instructors[key];
  const parts=profile ? [Number(profile.years)>0?`${profile.years} años de experiencia`:'',profile.certifications].filter(Boolean) : [];
  home=home.replace(`<!--INSTRUCTOR_${index}-->`,parts.length?`<p class="instructor-credentials">${parts.map(esc).join(' · ')}</p>`:'');
}
if (/\{\{[^}]+\}\}/.test(home))throw new Error('Quedaron variables sin resolver.');
await writeFile(resolve(root,'index.html'),home);
const header=home.match(/<header class="site-header">[\s\S]*?<\/header>/)[0];
const footer=home.match(/<footer class="site-footer-wrapper">[\s\S]*?<\/footer>/)[0];
const floating=home.match(/<a class="whatsapp-float"[\s\S]*?<\/a>/)[0];
const services={kitesurf:'Clases de kitesurf en San Isidro',windsurf:'Clases de windsurf en Acassuso',wingfoil:'Clases de wingfoil en San Isidro',sup:'Clases de SUP en Acassuso',kayaks:'Alquiler de kayaks en Acassuso'};
for(const [slug,title] of Object.entries(services)) {
  let card=await read(`templates/${slug}.html`);
  card=card.replaceAll('<h3','<h2').replaceAll('</h3>','</h2>');
  card=card.replace(/<a class="service-detail-link"[^>]*>[\s\S]*?<\/a>/g,'');
  const description=slug==='kayaks'?'Kayaks simples y dobles con chaleco y remo incluidos. Consultá recorridos y disponibilidad en Escuela Ombú, Acassuso.':`Aprendé ${slug==='sup'?'SUP Paddle':slug} en Escuela Ombú, Acassuso, San Isidro. Equipo incluido y acompañamiento del instructor. Consultá disponibilidad.`;
  const schema={'@type':'Service',name:title,serviceType:slug,areaServed:{'@type':'City',name:'San Isidro'},provider:{'@id':business['@id']},...(origin?{url:`${origin}/${slug}/`}:{})};
  const html=`<!DOCTYPE html><html lang="es-AR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head(`${title} | Escuela Ombú`,description,`/${slug}/`,[schema])}<link rel="icon" href="/assets/logoNsB.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/seo.css"></head><body class="service-page"><a class="skip-link" href="#contenido">Saltar al contenido</a>${header.replaceAll('href="#','href="/#')}<main id="contenido"><section class="service-intro container"><nav aria-label="Ruta de navegación"><a href="/">Inicio</a> / ${esc(slug)}</nav><span class="section-label">// Escuela Ombú · Acassuso</span><h1>${title}</h1><p>${description}</p></section><section class="service-content container" aria-label="Información de ${slug}">${card}</section><section class="service-next container"><h2>Tu próximo paso en el río</h2><p>Escribinos para coordinar tu clase y confirmar las condiciones del día. Estamos en ${esc(config.streetAddress)}, Acassuso, de 9 a 19 hs.</p><a class="btn-pill-orange" href="https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Hola Ombú, quiero consultar por ${slug}.`)}">Consultar por WhatsApp</a><a class="service-detail-link" href="/#contacto">Cómo llegar →</a></section>${faqHTML}<nav class="service-related container" aria-label="Otros deportes">${Object.entries(services).filter(([key])=>key!==slug).map(([key,label])=>`<a href="/${key}/">${label}</a>`).join('')}</nav></main>${footer.replaceAll('href="#','href="/#')}${floating}<script src="/seo.js" defer></script></body></html>`;
  await mkdir(resolve(root,slug),{recursive:true});await writeFile(resolve(root,slug,'index.html'),html);
}
await writeFile(resolve(root,'robots.txt'),indexable?`User-agent: *\nAllow: /\nDisallow: /codex/\nDisallow: /templates/\nDisallow: /scripts/\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nAllow: /\n# Entorno de pruebas: cada página envía noindex.\n');
if(indexable)await writeFile(resolve(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['',...Object.keys(services)].map(slug=>`<url><loc>${esc(origin)}/${slug?slug+'/':''}</loc></url>`).join('')}</urlset>`);
else await rm(resolve(root,'sitemap.xml'),{force:true});
console.log(`Home + 5 páginas generadas. Modo: ${indexable?'producción':'desarrollo (noindex)'}.`);

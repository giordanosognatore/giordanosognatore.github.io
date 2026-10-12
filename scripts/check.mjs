import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
import {estrattoAssets,verifyEstratto} from './estratto-assets.mjs';
import {loadArticles,escapeHtml,renderMarkdown} from './taccuino.mjs';
const articles=loadArticles();
const releases=articles.filter(a=>a.category==='comunicati-stampa');
const config=JSON.parse(readFileSync(new URL('../site.config.json',import.meta.url)));
const origin=(process.env.SITE_URL||config.url).replace(/\/$/,'');
const indexable=process.env.SITE_INDEXABLE==='true'||(process.env.SITE_INDEXABLE!=='false'&&config.indexable);
const root=resolve('dist');
const htmlFiles=readdirSync(root,{recursive:true}).filter(p=>p.endsWith('.html'));
const verificationFiles=htmlFiles.filter(p=>/^google[0-9a-f]+\.html$/.test(p));
const pages=htmlFiles.filter(p=>!verificationFiles.includes(p));
assert.equal(pages.length,10+articles.length+(releases.length?1:0));
for(const file of verificationFiles){
 const value=readFileSync(resolve(root,file),'utf8').trim();
 assert.equal(value,`google-site-verification: ${file}`,`${file}: invalid Google site verification payload`);
}
let refs=0;
for(const page of pages){
 const html=readFileSync(resolve(root,page),'utf8');
 assert.match(html,/<html lang="it">/);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 for(const required of ['<title>','name="description"','name="viewport"','name="robots"','property="og:title"','name="twitter:card"','rel="icon"','<main id="contenuto"','class="skip"'])assert.ok(html.includes(required),`${page}: ${required}`);
 assert.match(html,/<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Apri menu">/);
 assert.match(html,/<nav id="primary-navigation" aria-label="Navigazione principale">.*>Home<.*>Romanzi<.*>Taccuino<.*>Press<.*>L’autore</s);
 assert.match(html,/<script src="(?:https:\/\/[^" ]+\/|\.\.\/)?assets\/navigation\.js" defer><\/script>/);
 assert.match(html,/<div class="contact-links"><a href="mailto:giordano\.sognatore@gmail\.com" aria-label="Email: giordano\.sognatore@gmail\.com">Email<\/a><a href="https:\/\/t\.me\/giordanosognatoreofficial" aria-label="Canale Telegram ufficiale di Giordano Sognatore">Telegram<\/a><\/div>/);
 if(page!=='404.html'){
  assert.match(html,/rel="canonical" href="https:\/\//);
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(data['@graph'].filter(n=>n['@type']==='Book').length,2);
  assert.equal(data['@graph'].filter(n=>n['@type']==='Person').length,1);
  assert.deepEqual(data['@graph'].find(n=>n['@type']==='Person').sameAs,['https://t.me/giordanosognatoreofficial']);
  assert.ok(!JSON.stringify(data['@graph'].filter(n=>n['@type']!=='BlogPosting')).match(/isbn|offers|price|datePublished/));
  assert.ok(html.includes(`name="robots" content="${indexable?'index,follow':'noindex,follow'}"`));
  assert.ok(html.includes(`rel="canonical" href="${escapeHtml(origin+'/'+(page==='index.html'?'':page))}"`));
 }
 for(const m of html.matchAll(/(?:href|src)="([^"#]*)(#[^"]*)?"/g)){
  const [_,path,hash]=m;
  if(/^(https?:|data:|mailto:|tel:)/.test(path))continue;
  assert.ok(!path.startsWith('/'),`Fragile root path: ${path}`);
  const target=path?resolve(dirname(resolve(root,page)),path):resolve(root,page);
  assert.ok(target.startsWith(root)&&existsSync(target),`${page} -> ${path}`);
  if(hash)assert.ok(readFileSync(target,'utf8').includes(`id="${hash.slice(1)}"`),`${page} missing anchor ${hash}`);
  const url=new URL(path||'',`https://example.test/giordanosognatore/${page}`);
  assert.ok(url.pathname.startsWith('/giordanosognatore/'));
  refs++;
 }
 for(const image of html.matchAll(/<img\b[^>]*>/g))for(const attr of ['alt=','width=','height='])assert.ok(image[0].includes(attr));
 for(const script of html.matchAll(/<script\b[^>]*>/g))assert.ok(/type="application\/ld\+json"|src="(?:https:\/\/[^" ]+\/|\.\.\/)?assets\/navigation\.js" defer/.test(script[0]),`${page}: unexpected script ${script[0]}`);
 assert.ok(!/<iframe|<form/.test(html),'No iframes or forms expected');
}
assert.match(readFileSync(resolve(root,'le-ombre-si-rivelano.html'),'utf8'),/href="https:\/\/amzn.eu\/d\/6sXfK4j"/);
const bestiaAmazon=/<a class="button" href="https:\/\/amzn.eu\/d\/023g6Qe1">Acquista su Amazon<\/a>/;
assert.match(readFileSync(resolve(root,'index.html'),'utf8'),bestiaAmazon);
assert.match(readFileSync(resolve(root,'l-immagine-della-bestia.html'),'utf8'),bestiaAmazon);
assert.match(readFileSync(resolve(root,'index.html'),'utf8'),/href="press\.html"[^>]*>Press<\/a>/);
const map=readFileSync(resolve(root,'sitemap.xml'),'utf8');
assert.equal((map.match(/<loc>/g)||[]).length,pages.length-1);
assert.ok(!map.includes('404.html'));
for(const required of ['il-giorno-in-cui-nacque-la-bestia.html','press.html','ai.html','temi.html'])assert.ok(map.includes(required));
assert.match(readFileSync(resolve(root,'robots.txt'),'utf8'),/Sitemap: https:\/\//);
const css=readFileSync(resolve(root,'assets/site.css'),'utf8');assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);assert.match(css,/@media\(max-width:700px\).*\.nav-toggle/s);assert.match(css,/\.nav-toggle\[aria-expanded="false"\]\+nav\{display:none\}/);
const navigationJs=readFileSync(resolve(root,'assets/navigation.js'),'utf8');
for(const required of ["event.key==='Escape'","closeMenu(true)","mobile.addEventListener('change'","aria-expanded","aria-label"])assert.ok(navigationJs.includes(required),`navigation.js: ${required}`);
assert.match(readFileSync(resolve(root,'il-giorno-in-cui-nacque-la-bestia.html'),'utf8'),/COMPANION GRATUITO/);
assert.match(readFileSync(resolve(root,'press.html'),'utf8'),/PRESS &amp; MEDIA|PRESS & MEDIA/);
assert.match(readFileSync(resolve(root,'press.html'),'utf8'),/Review copy EPUB\/PDF disponibile su richiesta/);
assert.match(readFileSync(resolve(root,'ai.html'),'utf8'),/Non contro l’IA/);
assert.match(readFileSync(resolve(root,'ai.html'),'utf8'),/Ada Vesper/);
assert.match(readFileSync(resolve(root,'temi.html'),'utf8'),/Sei domande/);
const home=readFileSync(resolve(root,'index.html'),'utf8');
const press=readFileSync(resolve(root,'press.html'),'utf8');
const archive=readFileSync(resolve(root,'taccuino.html'),'utf8');
const feed=readFileSync(resolve(root,'feed.xml'),'utf8');
assert.equal(existsSync(resolve(root,'comunicati-stampa.html')),releases.length>0);
assert.equal(press.includes('<h2>Ultimi comunicati stampa</h2>'),releases.length>0);
assert.equal((feed.match(/<item>/g)||[]).length,articles.length);
assert.match(feed,/<rss version="2.0"/);
for(const article of articles){
 const html=readFileSync(resolve(root,article.route),'utf8');
 const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
 const posting=data['@graph'].find(n=>n['@type']==='BlogPosting');
 assert.equal(posting.headline,article.title);
 assert.equal(posting.datePublished,article.date);
 assert.equal(posting.description,article.description);
 assert.equal(posting.url,origin+'/'+article.route);
 assert.equal(posting.author.name,'Giordano Sognatore');
 assert.deepEqual(posting.keywords,article.tags);
 assert.match(html,/property="og:type" content="article"/);
 assert.ok(html.includes(`<div class="entry-body">${renderMarkdown(article.body)}</div>`));
 assert.ok(html.includes('href="../taccuino.html" aria-current="page"'));
 assert.ok(archive.includes(`href="${article.route}"`));
 assert.ok(map.includes(escapeHtml(origin+'/'+article.route)));
 assert.ok(feed.includes(`<link>${escapeHtml(origin+'/'+article.route)}</link>`));
}
for(const article of articles.filter(a=>a.showOnHome).slice(0,3))assert.ok(home.includes(`href="${article.route}"`));
for(const category of ['taccuino','comunicati-stampa'])for(const article of articles.filter(a=>a.category===category).slice(0,3))assert.ok(press.includes(`href="${article.route}"`));
for(const page of pages){
 const html=readFileSync(resolve(root,page),'utf8');
 assert.ok(html.includes(`type="application/rss+xml" title="Dal taccuino di Giordano" href="${escapeHtml(origin+'/feed.xml')}"`));
 if(page==='404.html')assert.ok(html.includes(`href="${origin}/taccuino.html"`));
}
const companionPdf=resolve(root,'downloads/il-giorno-in-cui-nacque-la-bestia-ada-vesper.pdf');
const companionEpub=resolve(root,'downloads/il-giorno-in-cui-nacque-la-bestia-ada-vesper.epub');
const companionCover=resolve(root,'assets/companion-cover.png');
const companionStates=[companionPdf,companionEpub,companionCover].map(existsSync);
assert.ok(companionStates.every(Boolean)||companionStates.every(v=>!v),'Companion assets must be imported as a complete set');
if(companionStates[0]){
 assert.equal(readFileSync(companionPdf).subarray(0,5).toString(),'%PDF-','Companion PDF signature');
 assert.equal(readFileSync(companionEpub).subarray(0,2).toString(),'PK','Companion EPUB signature');
 assert.ok(statSync(companionPdf).size>100000&&statSync(companionPdf).size<2000000,'Companion PDF size');
 assert.ok(statSync(companionEpub).size>100000&&statSync(companionEpub).size<2000000,'Companion EPUB size');
}
const bestia=readFileSync(resolve(root,'l-immagine-della-bestia.html'),'utf8');
const sample=bestia.match(/<section class="sample-strip shell"[^>]*>(.*?)<\/section>/s)?.[1];
assert.ok(sample,'Missing free reading sample');
for(const copy of ['ESTRATTO GRATUITO','Leggi gratuitamente<br>il primo Atto.','Prologo + Atto I — La Pace, capitoli 1–6. Un estratto completo dell’inizio del romanzo, gratuito e senza registrazione.'])assert.ok(sample.includes(copy),`Missing approved sample copy: ${copy}`);
assert.ok(bestia.indexOf('id="estratto-gratuito"')<bestia.indexOf('class="companion-strip shell"'),'Reading sample must precede the companion');
for(const asset of estrattoAssets){
 verifyEstratto(readFileSync(resolve(root,asset.publicPath)),asset);
 assert.ok(sample.includes(`<a class="button" href="${asset.publicPath}" download>Scarica ${asset.format}</a>`),`Missing direct ${asset.format} download`);
}
assert.ok(sample.indexOf('Scarica EPUB')<sample.indexOf('Scarica PDF'),'EPUB must come first');
const allowedBinary=new Set([companionPdf,companionEpub,...estrattoAssets.map(asset=>resolve(root,asset.publicPath))]);
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(p,e.name)):resolve(p,e.name));
let bytes=0;for(const f of walk(root)){
 assert.ok(!/\.(docx|zip|env)$/.test(f),`Unexpected publication/source file: ${f}`);
 if(/\.(epub|pdf)$/.test(f))assert.ok(allowedBinary.has(f),`Unexpected downloadable binary: ${f}`);
 if(/\.(html|xml|txt|js|css)$/.test(f)){
  const text=readFileSync(f,'utf8');
  assert.doesNotMatch(text,/google\s*play|play\.google\.com|books\.google\./i,`${f}: premature Google Play reference`);
  for(const match of text.matchAll(/https?:\/\/(?:t\.me|telegram\.me)\/[^\s"'<>]+/g))assert.equal(match[0],'https://t.me/giordanosognatoreofficial',`${f}: unexpected public Telegram URL`);
 }
 bytes+=statSync(f).size;
}
console.log(`PASS: ${pages.length} pages; ${verificationFiles.length} verification file(s); ${refs} local references; root/subpath links; metadata, JSON-LD, sitemap, 404 and publication perimeter. Sample EPUB/PDF: verified Git blobs and SHA-256. Companion assets: ${companionStates[0]?'ready':'not yet imported'}. ${Math.round(bytes/1024)} KiB total.`);

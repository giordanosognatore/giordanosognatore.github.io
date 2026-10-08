import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist');
const htmlFiles=readdirSync(root).filter(p=>p.endsWith('.html'));
const verificationFiles=htmlFiles.filter(p=>/^google[0-9a-f]+\.html$/.test(p));
const pages=htmlFiles.filter(p=>!verificationFiles.includes(p));
assert.equal(pages.length,9);
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
 assert.match(html,/<nav id="primary-navigation" aria-label="Navigazione principale">.*>Home<.*>Romanzi<.*>Press<.*>L’autore</s);
 assert.match(html,/<script src="(?:https:\/\/[^" ]+\/)?assets\/navigation\.js" defer><\/script>/);
 assert.match(html,/<div class="contact-links"><a href="mailto:giordano\.sognatore@gmail\.com" aria-label="Email: giordano\.sognatore@gmail\.com">Email<\/a><a href="https:\/\/t\.me\/giordanosognatore">Telegram<\/a><\/div>/);
 if(page!=='404.html'){
  assert.match(html,/rel="canonical" href="https:\/\//);
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(data['@graph'].filter(n=>n['@type']==='Book').length,2);
  assert.equal(data['@graph'].filter(n=>n['@type']==='Person').length,1);
  assert.ok(!JSON.stringify(data).match(/isbn|offers|price|datePublished/));
 }
 for(const m of html.matchAll(/(?:href|src)="([^"#]*)(#[^"]*)?"/g)){
  const [_,path,hash]=m;
  if(/^(https?:|data:|mailto:|tel:)/.test(path))continue;
  assert.ok(!path.startsWith('/'),`Fragile root path: ${path}`);
  const target=path?resolve(dirname(resolve(root,page)),path):resolve(root,page);
  assert.ok(target.startsWith(root)&&existsSync(target),`${page} -> ${path}`);
  if(hash)assert.ok(readFileSync(target,'utf8').includes(`id="${hash.slice(1)}"`),`${page} missing anchor ${hash}`);
  const url=new URL(path||page,`https://example.test/giordanosognatore/${page}`);
  assert.ok(url.pathname.startsWith('/giordanosognatore/'));
  refs++;
 }
 for(const image of html.matchAll(/<img\b[^>]*>/g))for(const attr of ['alt=','width=','height='])assert.ok(image[0].includes(attr));
 for(const script of html.matchAll(/<script\b[^>]*>/g))assert.ok(/type="application\/ld\+json"|src="(?:https:\/\/[^" ]+\/)?assets\/navigation\.js" defer/.test(script[0]),`${page}: unexpected script ${script[0]}`);
 assert.ok(!/<iframe|<form/.test(html),'No iframes or forms expected');
}
assert.match(readFileSync(resolve(root,'le-ombre-si-rivelano.html'),'utf8'),/href="https:\/\/amzn.eu\/d\/6sXfK4j"/);
const bestiaAmazon=/<a class="button" href="https:\/\/amzn.eu\/d\/023g6Qe1">Acquista su Amazon<\/a>/;
assert.match(readFileSync(resolve(root,'index.html'),'utf8'),bestiaAmazon);
assert.match(readFileSync(resolve(root,'l-immagine-della-bestia.html'),'utf8'),bestiaAmazon);
assert.match(readFileSync(resolve(root,'index.html'),'utf8'),/href="press\.html"[^>]*>Press<\/a>/);
const map=readFileSync(resolve(root,'sitemap.xml'),'utf8');
assert.equal((map.match(/<loc>/g)||[]).length,8);
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
const allowedBinary=new Set([companionPdf,companionEpub]);
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(p,e.name)):resolve(p,e.name));
let bytes=0;for(const f of walk(root)){
 assert.ok(!/\.(docx|zip|env)$/.test(f),`Unexpected publication/source file: ${f}`);
 if(/\.(epub|pdf)$/.test(f))assert.ok(allowedBinary.has(f),`Unexpected downloadable binary: ${f}`);
 bytes+=statSync(f).size;
}
console.log(`PASS: ${pages.length} pages; ${verificationFiles.length} verification file(s); ${refs} local references; root/subpath links; metadata, JSON-LD, sitemap, 404 and publication perimeter. Companion assets: ${companionStates[0]?'ready':'not yet imported'}. ${Math.round(bytes/1024)} KiB total.`);

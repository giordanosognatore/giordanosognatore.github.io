import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist');
const pages=readdirSync(root).filter(p=>p.endsWith('.html'));
assert.equal(pages.length,6);
let refs=0;
for(const page of pages){
 const html=readFileSync(resolve(root,page),'utf8');
 assert.match(html,/<html lang="it">/);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 for(const required of ['<title>','name="description"','name="viewport"','name="robots"','property="og:title"','name="twitter:card"','rel="icon"','<main id="contenuto"','class="skip"'])assert.ok(html.includes(required),`${page}: ${required}`);
 if(page!=='404.html'){
  assert.match(html,/rel="canonical" href="https:\/\//);
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(data['@graph'].filter(n=>n['@type']==='Book').length,2);
  assert.equal(data['@graph'].filter(n=>n['@type']==='Person').length,1);
  assert.ok(!JSON.stringify(data).match(/isbn|offers|price|datePublished/));
 }
 for(const m of html.matchAll(/(?:href|src)="([^"#]*)(#[^"]*)?"/g)){
  const [_,path,hash]=m;
  if(/^(https?:|data:)/.test(path))continue;
  assert.ok(!path.startsWith('/'),`Fragile root path: ${path}`);
  const target=path?resolve(dirname(resolve(root,page)),path):resolve(root,page);
  assert.ok(target.startsWith(root)&&existsSync(target),`${page} -> ${path}`);
  if(hash)assert.ok(readFileSync(target,'utf8').includes(`id="${hash.slice(1)}"`),`${page} missing anchor ${hash}`);
  // Exact same relative path resolves within a project-site prefix.
  const url=new URL(path||page,`https://example.test/giordanosognatore/${page}`);
  assert.ok(url.pathname.startsWith('/giordanosognatore/'));
  refs++;
 }
 for(const image of html.matchAll(/<img\b[^>]*>/g))for(const attr of ['alt=','width=','height='])assert.ok(image[0].includes(attr));
 assert.ok(!/<script(?! type="application\/ld\+json")|<iframe|<form/.test(html),'No client runtime or forms expected');
}
assert.match(readFileSync(resolve(root,'le-ombre-si-rivelano.html'),'utf8'),/href="https:\/\/amzn.eu\/d\/6sXfK4j"/);
assert.ok(!readFileSync(resolve(root,'l-immagine-della-bestia.html'),'utf8').includes('Acquista'));
const map=readFileSync(resolve(root,'sitemap.xml'),'utf8');assert.equal((map.match(/<loc>/g)||[]).length,5);assert.ok(!map.includes('404.html'));assert.ok(map.includes('il-giorno-in-cui-nacque-la-bestia.html'));
assert.match(readFileSync(resolve(root,'robots.txt'),'utf8'),/Sitemap: https:\/\//);
const css=readFileSync(resolve(root,'assets/site.css'),'utf8');assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);
assert.match(readFileSync(resolve(root,'il-giorno-in-cui-nacque-la-bestia.html'),'utf8'),/COMPANION GRATUITO/);
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
console.log(`PASS: ${pages.length} pages; ${refs} local references; root/subpath links; metadata, JSON-LD, sitemap, 404 and publication perimeter. Companion assets: ${companionStates[0]?'ready':'not yet imported'}. ${Math.round(bytes/1024)} KiB total.`);

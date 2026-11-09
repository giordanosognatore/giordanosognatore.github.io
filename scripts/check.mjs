import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
import {estrattoAssets,verifyEstratto} from './estratto-assets.mjs';
import {sampleRoute} from './epub-sample.mjs';
import {ombreRoute,ombrePaperback,ombreAssets} from './ombre.mjs';
import {checkOmbre} from './check-ombre.mjs';
import {checkOnlineSample} from './check-epub-sample.mjs';
import {companionReadingRoute} from './companion.mjs';
import {checkCompanion} from './check-companion.mjs';
import {bestiaFormats} from './formats.mjs';
import {books} from './books.mjs';
import {bookJournal,articleBooks} from './related-books.mjs';
import {socialCards,socialMetadata} from './social.mjs';
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
assert.equal(pages.length,14+articles.length+(releases.length?1:0),'Generated pages do not match content: run npm run build before npm run check');
for(const card of Object.values(socialCards)){
 const bytes=readFileSync(resolve(root,card.path));
 assert.equal(bytes.subarray(0,3).toString('hex'),'ffd8ff',`${card.path}: expected JPEG`);
 assert.ok(bytes.length<300000,`${card.path}: social image must stay below 300 KB`);
 let dimensions=null;
 for(let offset=2;offset+8<bytes.length;){
  assert.equal(bytes[offset],0xff,`${card.path}: malformed JPEG segment`);
  const marker=bytes[offset+1];
  if([0xc0,0xc1,0xc2].includes(marker)){
   dimensions=[bytes.readUInt16BE(offset+7),bytes.readUInt16BE(offset+5)];break;
  }
  if(marker===0xda||marker===0xd9)break;
  const length=bytes.readUInt16BE(offset+2);
  assert.ok(length>=2,`${card.path}: invalid JPEG segment length`);
  offset+=2+length;
 }
 assert.deepEqual(dimensions,[1200,630],`${card.path}: social image dimensions`);
}
for(const file of verificationFiles){
 const value=readFileSync(resolve(root,file),'utf8').trim();
 assert.equal(value,`google-site-verification: ${file}`,`${file}: invalid Google site verification payload`);
}
let refs=0;
for(const page of pages){
 const html=readFileSync(resolve(root,page),'utf8');
 assert.match(html,/<html lang="it">/);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 assert.equal((html.match(/<main\b/g)||[]).length,1);
 assert.match(html,/<main id="contenuto" tabindex="-1">/,`${page}: keyboard skip target must accept focus`);
 assert.ok(!/tabindex="[1-9]/.test(html),`${page}: do not override natural tab order`);
 let headingLevel=0;
 for(const heading of html.matchAll(/<h([1-6])(?:\s[^>]*)?>/g)){
  const level=Number(heading[1]);assert.ok(level<=headingLevel+1,`${page}: skipped heading level h${headingLevel} → h${level}`);headingLevel=level;
 }
 for(const group of html.matchAll(/<div class="format-actions"[^>]*>/g))assert.ok(group[0].includes('role="group"'),`${page}: formats need a named accessible group`);
 for(const required of ['<title>','name="description"','name="viewport"','name="robots"','property="og:title"','name="twitter:card"','rel="icon"','<main id="contenuto"','class="skip"'])assert.ok(html.includes(required),`${page}: ${required}`);
 assert.match(html,/<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Apri menu">/);
 assert.match(html,/<nav id="primary-navigation" aria-label="Navigazione principale">.*>Home<.*>Romanzi<.*>Taccuino<.*>Press<.*>L’autore</s);
 assert.match(html,/<script src="(?:https:\/\/[^" ]+\/|\.\.\/)?assets\/navigation\.js" defer><\/script>/);
 assert.match(html,/<div class="contact-links"><a href="mailto:giordano\.sognatore@gmail\.com" aria-label="Email: giordano\.sognatore@gmail\.com">Email<\/a><a href="https:\/\/t\.me\/giordanosognatoreofficial" aria-label="Canale Telegram ufficiale di Giordano Sognatore">Telegram<\/a><\/div>/);
 if(page!=='404.html'){
  assert.match(html,/rel="canonical" href="https:\/\//);
  assert.ok(html.includes(socialMetadata(origin,page)),`${page}: missing shared social metadata`);
  const card=['l-immagine-della-bestia.html',sampleRoute].includes(page)?'bestia':['le-ombre-si-rivelano.html',ombreRoute].includes(page)?'ombre':page==='il-dottor-sottutto.html'?'sottutto':'sito';
  assert.ok(html.includes(`property="og:image" content="${escapeHtml(origin+'/assets/social-'+card+'.jpg')}"`),`${page}: wrong social card or prefix`);
  assert.equal((html.match(/name="twitter:card"/g)||[]).length,1,`${page}: duplicate Twitter card`);
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(data['@graph'].filter(n=>n['@type']==='Book').length,3);
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
 for(const frame of html.matchAll(/<iframe\b[^>]*>/g)){
  assert.match(frame[0],/src="https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}"/,`${page}: iframe host or video id not allowed`);
  for(const required of ['title="','loading="lazy"','referrerpolicy="strict-origin-when-cross-origin"','allow="','allowfullscreen'])assert.ok(frame[0].includes(required),`${page}: incomplete YouTube iframe`);
 }
 assert.ok(!/<form/.test(html),'No forms expected');
}
assert.ok(readFileSync(resolve(root,'le-ombre-si-rivelano.html'),'utf8').includes(`href="${ombrePaperback}"`));
checkOmbre(root);
const bestiaAmazon=/<a class="button" href="https:\/\/amzn.eu\/d\/023g6Qe1">Acquista su Amazon<\/a>/;
assert.match(readFileSync(resolve(root,'l-immagine-della-bestia.html'),'utf8'),bestiaAmazon);
const homeCatalog=readFileSync(resolve(root,'index.html'),'utf8');
const bestiaCatalog=[...homeCatalog.matchAll(/<article class="book-row">[\s\S]*?<\/article>/g)].map(m=>m[0]).find(html=>html.includes('<h3><a href="l-immagine-della-bestia.html">'));
assert.ok(bestiaCatalog,'Missing Bestia catalog entry');
assert.ok(!bestiaCatalog.includes('<p class="credit">'),'No isolated author credit in catalog');
const bestiaPage=readFileSync(resolve(root,'l-immagine-della-bestia.html'),'utf8');
assert.ok(bestiaPage.includes('<p class="credit">Giordano Sognatore <span>con Ada Vesper</span></p>'),'Keep credit on book page');
assert.ok(bestiaPage.includes('<a class="button" href="il-giorno-in-cui-nacque-la-bestia.html">Scopri il companion</a>'),'Companion discovery must be a secondary button');
assert.ok(bestiaPage.includes('<a class="button" href="#estratto-gratuito">Estratto gratuito</a>'),'Book hero must link to the excerpt section');
assert.ok(bestiaPage.includes('<a class="button" href="#companion-gratuito">Companion gratuito</a>'),'Book hero must link to the companion section');
assert.ok(bestiaPage.includes('<section class="companion-strip shell" id="companion-gratuito">'),'Companion section needs the stable in-page anchor');
assert.ok(!readFileSync(resolve(root,'index.html'),'utf8').includes('↓')&&!bestiaPage.includes('↓'),'Down arrows must not return to Home or the Bestia page');
assert.ok(bestiaCatalog.includes('<div class="format-actions" role="group" aria-label="Scopri e ascolta L’Immagine della Bestia">'));
assert.deepEqual([...bestiaCatalog.matchAll(/<a class="button" href="([^"]+)">([^<]+)<\/a>/g)].map(m=>[m[1],m[2]]),[
 ['l-immagine-della-bestia.html','Scopri il libro'],[bestiaFormats.audiobook,'Audiolibro gratuito']
]);
assert.equal((bestiaCatalog.match(/<a\b/g)||[]).length,4,'Only cover, title and two actions in Bestia catalog');
assert.ok(!/<details|<summary|class="text-link"/.test(bestiaCatalog),'Catalog must not duplicate the book format chooser');
const catalogEntries=[...homeCatalog.matchAll(/<article class="book-row">[\s\S]*?<\/article>/g)].map(m=>m[0]);
assert.equal(catalogEntries.length,3,'Home catalog must contain the two published novels and the forthcoming novel');
const sottuttoCatalog=catalogEntries.find(html=>html.includes('<h3><a href="il-dottor-sottutto.html">Il Dottor Sottutto</a></h3>'));
assert.ok(sottuttoCatalog,'Missing Il Dottor Sottutto catalog entry');
for(const copy of ['ROMANZO · IN ARRIVO','Mystery thriller','assets/dottor-sottutto-360.webp 360w, assets/dottor-sottutto-720.webp 720w','width="720" height="1080"'])assert.ok(sottuttoCatalog.includes(copy),`Sottutto catalog: missing ${copy}`);
assert.deepEqual([...sottuttoCatalog.matchAll(/<a class="button" href="([^"]+)">([^<]+)<\/a>/g)].map(m=>[m[1],m[2]]),[['il-dottor-sottutto.html','Scopri il libro']]);
assert.ok(sottuttoCatalog.includes('class="format-actions single-action" role="group" aria-label="Scopri Il Dottor Sottutto"'));
assert.ok(!sottuttoCatalog.includes('Amazon')&&!sottuttoCatalog.includes('Acquista')&&!sottuttoCatalog.includes('Leggi gratis'),'Forthcoming catalog card must not imply availability');
const googlePlayUrl=bestiaFormats.ebook;
const googlePlayButton=`<a class="button" href="${googlePlayUrl}">Google Play Books</a>`;
for(const page of ['index.html','l-immagine-della-bestia.html','press.html']){
 const html=readFileSync(resolve(root,page),'utf8');
 if(page==='index.html'){
  assert.ok(!html.includes('<details'),'Full format chooser belongs on the book page, not Home');
  assert.ok(html.includes(`<a class="button" href="${bestiaFormats.audiobook}">${bestiaFormats.audiobookLabel}</a>`),'Keep direct access to the free audiobook');
  assert.ok(!html.includes('hero-audio'),'No separate long audiobook link in the hero');
 }else{
  assert.ok(html.includes(googlePlayButton),`${page}: missing Google Play Books button`);
  assert.ok(html.includes(`<a class="button" href="${bestiaFormats.audiobook}">${bestiaFormats.audiobookLabel}</a>`),`${page}: missing free full audiobook`);
 }
 assert.ok(!/Ascolta 30 minuti gratis|Acquista su Google Play|books\/listen\?/.test(html),`${page}: obsolete audiobook CTA`);
}
const ombrePage=readFileSync(resolve(root,'le-ombre-si-rivelano.html'),'utf8');
assert.ok(!ombrePage.includes('play.google.com'),'Do not invent a Google Play edition for Le Ombre Si Rivelano');
assert.ok(ombrePage.includes('class="detail-cover uniform-mockup"'),'Ombre book page must use the approved photographic mockup');
assert.ok(ombrePage.includes('assets/ombre-mockup.webp'),'Ombre page must use the approved mockup asset');
const sottuttoPage=readFileSync(resolve(root,'il-dottor-sottutto.html'),'utf8');
const sottuttoTeaser='Milano, 2011. Una serie di morti, un soprannome costruito dalla stampa e un giornalista deciso a verificare i fatti dietro quel nome.';
for(const copy of ['ROMANZO · IN ARRIVO','<h1>Il Dottor<br><em>Sottutto</em></h1>','Giordano Sognatore <span>con Ada Vesper</span>','Mystery thriller',sottuttoTeaser,'Marco Rinaldi','Dottor Sottutto','Competenza e autorità','Dubbio e verità','Il Dottor Sottutto · In arrivo'])assert.ok(sottuttoPage.includes(copy),`Sottutto page: missing ${copy}`);
assert.equal(books.find(book=>book.id==='sottutto').desc,sottuttoTeaser);
assert.ok(!sottuttoPage.includes('ciò che tutti sembrano già sapere'),'Remove the vague consensus claim from the public teaser');
const sottuttoNicknameCopy='La stampa costruisce presto una figura capace di concentrare paure e sospetti: il Dottor Sottutto. Ma un soprannome può essere un indizio, una caricatura o soltanto un titolo efficace. Marco cerca un legame fra le vittime, mentre ogni risposta apre una domanda nuova.';
assert.ok(sottuttoPage.includes(`<p>${sottuttoNicknameCopy}</p>`),'Keep the public nickname deliberately ambiguous');
for(const spoiler of ['È un medico realmente competente','non ammettere repliche','Fra redazioni, ospedali'])assert.ok(!sottuttoPage.includes(spoiler),`Sottutto page must not reveal identity or motivation through: ${spoiler}`);
assert.ok(sottuttoPage.includes('<p>Fra redazioni, piste incerte e notti trascorse a cercare un legame ancora invisibile, Marco entra in un caso che mette alla prova il suo mestiere e il suo modo di cercare la verità.</p>'),'Keep the closing investigative without implying a medical setting');
assert.ok(sottuttoPage.includes('<figure class="detail-cover uniform-mockup provisional-cover"><img src="assets/dottor-sottutto-mockup.webp" width="420" height="525"'));
assert.ok(sottuttoPage.includes('<figcaption>Copertina provvisoria</figcaption>'));
assert.ok(!/(?:Amazon|Acquista|Scarica|Leggi online|Audiolibro|Cartaceo|Ebook|EPUB|PDF)/i.test(sottuttoPage.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1]),'Forthcoming page must not expose commercial or download actions');
assert.ok(!sottuttoPage.includes('↓'),'Sottutto preview must not introduce down arrows');
assert.equal((sottuttoPage.match(/class="button(?: [^"]*)?"/g)||[]).length,0,'Sottutto page must not have premature CTA buttons');
assert.match(readFileSync(resolve(root,'index.html'),'utf8'),/href="press\.html"[^>]*>Press<\/a>/);
const map=readFileSync(resolve(root,'sitemap.xml'),'utf8');
assert.equal((map.match(/<loc>/g)||[]).length,pages.length-1);
assert.ok(!map.includes('404.html'));
for(const required of ['il-dottor-sottutto.html','il-giorno-in-cui-nacque-la-bestia.html','press.html','ai.html','temi.html'])assert.ok(map.includes(required));
assert.match(readFileSync(resolve(root,'robots.txt'),'utf8'),/Sitemap: https:\/\//);
const css=readFileSync(resolve(root,'assets/site.css'),'utf8');assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);assert.match(css,/@media\(max-width:700px\).*\.nav-toggle/s);assert.match(css,/\.nav-toggle\[data-ready\]\[aria-expanded="false"\]\+nav\{display:none\}/);
assert.match(css,/:root\{[^}]*font-size:100%/, 'Respect the browser’s default text size');
assert.ok(css.includes('.hero-actions,.format-actions,.download-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,9.5rem),1fr))'),'Action groups must share responsive equal-width columns');
assert.ok(css.includes('@media(max-width:700px){.hero-actions,.format-actions,.download-actions{grid-template-columns:1fr}'),'Action groups must stack consistently on mobile');
assert.ok(css.includes('.detail-cover.uniform-mockup'),'Approved detail mockups must share one responsive crop rule');
assert.match(css,/:where\(a,button,summary\):focus-visible\{outline:2px solid var\(--gold\)/);
const luminance=hex=>{const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const color=name=>css.match(new RegExp(`--${name}:(#[a-f0-9]{6})`))[1].slice(1);
for(const background of ['bg','surface'])for(const foreground of ['ink','muted','gold']){
 const a=luminance(color(background)),b=luminance(color(foreground));
 assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${foreground} on ${background}: text contrast below 4.5:1`);
}
const navigationJs=readFileSync(resolve(root,'assets/navigation.js'),'utf8');
for(const required of ["event.key==='Escape'","closeMenu(true)","mobile.addEventListener('change'","aria-expanded","aria-label"])assert.ok(navigationJs.includes(required),`navigation.js: ${required}`);
const companionPage=readFileSync(resolve(root,'il-giorno-in-cui-nacque-la-bestia.html'),'utf8');
assert.match(companionPage,/COMPANION GRATUITO/);
assert.ok(companionPage.includes('class="detail-cover uniform-mockup"'),'Companion page must use the approved illustrative book mockup');
assert.ok(companionPage.includes('assets/companion-mockup.webp'),'Companion page must use the approved mockup asset');
assert.ok(companionPage.includes(`<a class="button button-primary" href="${companionReadingRoute}">Leggi online</a>`),'Companion page must lead with online reading');
checkCompanion(root);
assert.match(readFileSync(resolve(root,'press.html'),'utf8'),/PRESS &amp; MEDIA|PRESS & MEDIA/);
assert.match(readFileSync(resolve(root,'press.html'),'utf8'),/Review copy EPUB\/PDF disponibile su richiesta/);
const ai=readFileSync(resolve(root,'ai.html'),'utf8');
assert.match(ai,/Non contro l’IA/);
assert.match(ai,/Ada Vesper/);
assert.ok(ai.includes('<a class="button" href="il-giorno-in-cui-nacque-la-bestia.html">Scopri il companion</a>'),'ai.html: companion CTA must use the shared button style');
assert.ok(!ai.includes('Leggi il companion gratuito'),'ai.html: obsolete companion label remains');
const temi=readFileSync(resolve(root,'temi.html'),'utf8');
assert.match(temi,/Sei domande/);
assert.ok(temi.includes('<a class="button" href="l-immagine-della-bestia.html">Scopri il libro</a>'),'temi.html: book CTA must use the shared button style');
assert.ok(!temi.includes('Scopri il romanzo'),'temi.html: obsolete book label remains');
assert.ok(temi.includes('<a class="text-link" href="press.html">Torna a Press & media</a>'),'temi.html: missing aligned Press text link');
assert.ok(!temi.includes('<a class="button" href="press.html">Press & media</a>'),'temi.html: obsolete Press button remains');
const author=readFileSync(resolve(root,'autore.html'),'utf8');
const authorStatement=renderMarkdown(readFileSync(resolve('contenuti/autore/perche-scrivo.md'),'utf8').trim(),'');
assert.ok(author.includes(`<h2 id="perche-scrivo-title">Perché scrivo queste storie</h2></div><div class="prose">${authorStatement}</div></section>`),'Author page: approved statement must be rendered unchanged');
assert.match(author,/id="perche-scrivo" aria-labelledby="perche-scrivo-title"/);
assert.ok(author.includes('<figure class="author-illustration"><img src="assets/autore-viandante-800.webp"'));
assert.ok(author.includes('srcset="assets/autore-viandante-400.webp 400w, assets/autore-viandante-800.webp 800w"'));
assert.ok(author.includes('width="800" height="800" alt="Viandante con un cane fra libri, simboli celesti e paesaggi antichi e futuristici"'));
assert.ok(author.includes('<figcaption><span>Il viandante cosmico.</span><span>Rappresentazione simbolica dell’autore.</span></figcaption>'));
const authorOriginal=readFileSync(resolve('materiali/autore/viandante-cosmico-tra-mondi-celesti-originale.png'));
assert.equal(createHash('sha256').update(authorOriginal).digest('hex'),'6efc4795cb8ee693a1753da30d5c17826decaae14336e28e505145ad941c32a6','Archived author image must match the unmodified original');
for(const size of [400,800]){
 const bytes=readFileSync(resolve(root,`assets/autore-viandante-${size}.webp`));
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');
 assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
 assert.equal(bytes.subarray(8,16).toString(),'WEBPVP8 ');
 assert.equal(bytes.subarray(23,26).toString('hex'),'9d012a');
 assert.deepEqual([bytes.readUInt16LE(26)&0x3fff,bytes.readUInt16LE(28)&0x3fff],[size,size]);
 assert.ok(bytes.length<(size===400?80000:260000),'Author image exceeds its web budget');
}
assert.ok(!existsSync(resolve(root,'materiali')),'Archive materials must not be deployed');
for(const page of pages){
 const html=readFileSync(resolve(root,page),'utf8');
 assert.ok(!html.includes('viandante-cosmico-tra-mondi-celesti-originale.png'),`${page}: original archive image must not be linked`);
 if(page!=='autore.html')assert.ok(!html.includes('assets/autore-viandante-'),`${page}: illustration belongs only on the author page`);
}
assert.equal((author.match(/id="perche-scrivo"/g)||[]).length,1);
assert.ok(author.includes('<h2>Continuiamo la conversazione</h2><p>Sul mio canale Telegram condivido gli articoli del Taccuino e riflessioni sui temi che attraversano le mie storie: libertà, conoscenza, fede, tecnologia e responsabilità.</p>'));
assert.ok(author.includes('<a class="button" href="https://t.me/giordanosognatoreofficial">Segui Giordano Sognatore su Telegram</a>'));
assert.ok(author.includes('<a class="button" href="mailto:giordano.sognatore@gmail.com">Scrivi una email</a>'));
assert.ok(author.indexOf('id="perche-scrivo"')<author.indexOf('UN IMMAGINARIO NARRATIVO'));
const home=readFileSync(resolve(root,'index.html'),'utf8');
const hero=home.match(/<section class="hero shell">(.*?)<\/section>/s)[1];
assert.ok(hero.includes('<p class="credit">Giordano Sognatore <span>con Ada Vesper</span></p>'),'Keep credit in Home hero');
assert.ok(hero.includes('<div class="hero-actions" role="group" aria-label="Scopri, leggi e ascolta L’Immagine della Bestia">'));
assert.deepEqual([...hero.matchAll(/<a class="(button(?: button-primary)?)" href="([^"]+)">([^<]+)<\/a>/g)].map(m=>m.slice(1)),[
 ['button button-primary','l-immagine-della-bestia.html','Scopri il libro'],
 ['button',sampleRoute,'Estratto gratuito'],
 ['button',bestiaFormats.audiobook,'Audiolibro gratuito']
]);
assert.ok(!hero.includes('Scopri il romanzo')&&!hero.includes('Ascolta gratuitamente su Google Play'));
const press=readFileSync(resolve(root,'press.html'),'utf8');
const archive=readFileSync(resolve(root,'taccuino.html'),'utf8');
const feed=readFileSync(resolve(root,'feed.xml'),'utf8');
assert.equal(existsSync(resolve(root,'comunicati-stampa.html')),releases.length>0);
assert.equal(press.includes('<h2>Ultimi comunicati stampa</h2>'),releases.length>0);
assert.equal((feed.match(/<item>/g)||[]).length,articles.length);
assert.ok(!feed.includes('il-dottor-sottutto.html'),'Book preview must not enter the Taccuino feed');
const sottuttoSocial=readFileSync(resolve(root,socialCards.sottutto.path));
assert.equal(createHash('sha256').update(sottuttoSocial).digest('hex'),'3308721bdc6c69a603866bd36f95a8126e98c70555a688e495264daf96c2b079','Sottutto social card must match the approved provisional composition');
const sottuttoSocialSource=readFileSync(resolve('materiali/social/sottutto.svg'),'utf8');
for(const copy of ['ROMANZO · IN ARRIVO','Copertina provvisoria','../../dist/assets/dottor-sottutto-720.webp'])assert.ok(sottuttoSocialSource.includes(copy),`Sottutto social source: missing ${copy}`);
assert.ok(articles.every(article=>!article.relatedBooks.includes('sottutto')),'No Taccuino article is editorially associated with Sottutto in this task');
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
 const related=articleBooks(article);
 assert.equal(html.includes('class="entry-books"'),Boolean(related),`${article.route}: unexpected/missing book links`);
 if(related)assert.ok(html.includes(`</div>${related}</article>`),`${article.route}: book links must follow the unchanged body`);
 assert.ok(html.includes('href="../taccuino.html" aria-current="page"'));
 assert.ok(archive.includes(`href="${article.route}"`));
 assert.ok(map.includes(escapeHtml(origin+'/'+article.route)));
 assert.ok(feed.includes(`<link>${escapeHtml(origin+'/'+article.route)}</link>`));
}
for(const book of books){
 const html=readFileSync(resolve(root,book.route),'utf8');
 const related=bookJournal(articles,book.id);
 assert.equal(html.includes('Dal taccuino: dentro e intorno al romanzo'),Boolean(related),`${book.route}: unexpected/missing journal section`);
 if(related)assert.ok(html.includes(related),`${book.route}: incorrect related articles`);
}
for(const article of articles.filter(a=>a.showOnHome).slice(0,3))assert.ok(home.includes(`href="${article.route}"`));
for(const category of ['taccuino','comunicati-stampa'])for(const article of articles.filter(a=>a.category===category).slice(0,3))assert.ok(press.includes(`href="${article.route}"`));
for(const page of pages){
 const html=readFileSync(resolve(root,page),'utf8');
 assert.ok(html.includes(`type="application/rss+xml" title="Dal taccuino di Giordano" href="${escapeHtml(origin+'/feed.xml')}"`));
 if(page==='404.html')assert.ok(html.includes(`href="${origin}/taccuino.html"`));
}
const ombreMockupAsset=resolve(root,'assets/ombre-mockup.webp');
const companionMockupAsset=resolve(root,'assets/companion-mockup.webp');
assert.ok(existsSync(ombreMockupAsset)&&statSync(ombreMockupAsset).size===20818,'Approved Ombre mockup asset');
assert.ok(existsSync(companionMockupAsset)&&statSync(companionMockupAsset).size===13734,'Approved companion mockup asset');
const sottuttoAssets=[
 ['dottor-sottutto-360.webp',54392,'9fb9742d319e8c423e60dead27798dc6e3cde4565025fd8a85d42dafe9ef960e',[360,540]],
 ['dottor-sottutto-720.webp',136786,'fbc945fa096513ab1fcdbe0bc3ecf8f84e6b9f7ad61634b4b6702ffba96a020a',[720,1080]],
 ['dottor-sottutto-mockup.webp',56058,'f59d51674667651fd08b799587efd8da380f6cd48aa662e5661f7938bdc3b382',[420,525]]
];
for(const [name,size,hash,dimensions] of sottuttoAssets){
 const bytes=readFileSync(resolve(root,'assets',name));
 assert.equal(bytes.length,size,`${name}: approved size`);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,`${name}: approved hash`);
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,16).toString(),'WEBPVP8 ');
 assert.deepEqual([bytes.readUInt16LE(26)&0x3fff,bytes.readUInt16LE(28)&0x3fff],dimensions,`${name}: dimensions`);
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
assert.ok(sample.indexOf('Leggi online')<sample.indexOf('Scarica EPUB'),'Online reading comes before downloads');
assert.ok(sample.includes(`<a class="button button-primary" href="${sampleRoute}">Leggi online</a>`));
assert.ok(sample.indexOf('Scarica EPUB')<sample.indexOf('Scarica PDF'),'EPUB must come first');
checkOnlineSample(root);
const pressKit=resolve(root,'downloads/press-kit-l-immagine-della-bestia.pdf');
const pressKitBytes=readFileSync(pressKit);
assert.equal(pressKitBytes.subarray(0,5).toString(),'%PDF-','Press kit PDF signature');
assert.equal(createHash('sha256').update(pressKitBytes).digest('hex'),'d2ce554baba4f64f0103b2bda1a55e87d84e457306b86e5893f16ff6c6a456a6','Press kit PDF must match approved 2-page master');
assert.ok(pressKitBytes.length>5000&&pressKitBytes.length<500000,'Press kit file size');
assert.ok(press.includes('<a class="button" href="downloads/press-kit-l-immagine-della-bestia.pdf" download>Scarica press kit PDF</a>'),'Press kit download link is missing');
const allowedBinary=new Set([companionPdf,companionEpub,pressKit,...estrattoAssets.map(asset=>resolve(root,asset.publicPath)),...ombreAssets.map(asset=>resolve(root,asset.path))]);
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(p,e.name)):resolve(p,e.name));
let bytes=0;for(const f of walk(root)){
 assert.ok(!/\.(docx|zip|env|kpf|pages|kcb|kdf)$/.test(f),`Unexpected publication/source file: ${f}`);
 if(/\.(epub|pdf)$/.test(f))assert.ok(allowedBinary.has(f),`Unexpected downloadable binary: ${f}`);
 if(/\.(html|xml|txt|js|css)$/.test(f)){
  const text=readFileSync(f,'utf8');
  for(const match of text.matchAll(/https?:\/\/play\.google\.com\/store\/books\/details\?[^\s"'<>]+/g))assert.equal(match[0],googlePlayUrl,`${f}: unexpected Google Play Books URL`);
  for(const match of text.matchAll(/https?:\/\/(?:t\.me|telegram\.me)\/[^\s"'<>]+/g))assert.equal(match[0],'https://t.me/giordanosognatoreofficial',`${f}: unexpected public Telegram URL`);
 }
 bytes+=statSync(f).size;
}
console.log(`PASS: ${pages.length} pages; ${verificationFiles.length} verification file(s); ${refs} local references; root/subpath links; metadata, JSON-LD, sitemap, 404 and publication perimeter. Sample EPUB/PDF: verified Git blobs and SHA-256. Companion assets: ${companionStates[0]?'ready':'not yet imported'}. ${Math.round(bytes/1024)} KiB total.`);

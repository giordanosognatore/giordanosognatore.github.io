import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(new URL('../dist/',import.meta.url).pathname);
const amazon='https://amzn.eu/d/023g6Qe1';
const googlePlayEbook='https://play.google.com/store/books/details?id=jpgZEgAAQBAJ';
const googlePlayAudiobook='https://play.google.com/store/audiobooks/details?id=AQAAAEBG5iumfM';
const googlePlayAudiobookPreview='https://play.google.com/books/listen?id=AQAAAEBG5iumfM';

const amazonButton=`<a class="button" href="${amazon}">Acquista su Amazon</a>`;
const pressAmazonButton=`<a class="button" href="${amazon}">Amazon</a>`;
const googlePlayButton=`<a class="button" href="${googlePlayEbook}">Google Play Books</a>`;

const formatActions=sampleHref=>`<div class="format-actions" aria-label="Formati e acquisto di L’Immagine della Bestia"><details class="format-menu"><summary class="button">Ebook <span aria-hidden="true">⌄</span></summary><div class="format-menu-panel" role="group" aria-label="Dove acquistare l’ebook">${amazonButton}${googlePlayButton}</div></details><a class="button" href="${amazon}" aria-label="Acquista il cartaceo di L’Immagine della Bestia su Amazon">Cartaceo</a><details class="format-menu"><summary class="button">Audiolibro <span aria-hidden="true">⌄</span></summary><div class="format-menu-panel" role="group" aria-label="Audiolibro di L’Immagine della Bestia"><a class="button" href="${googlePlayAudiobookPreview}">Ascolta 30 minuti gratis</a><a class="button" href="${googlePlayAudiobook}">Acquista su Google Play</a></div></details><a class="button" href="${sampleHref}">Estratto gratuito</a></div>`;

const pages=[
 ['index.html','l-immagine-della-bestia.html#estratto-gratuito',amazonButton],
 ['l-immagine-della-bestia.html','#estratto-gratuito',amazonButton],
 ['press.html','l-immagine-della-bestia.html#estratto-gratuito',pressAmazonButton]
];
for(const [file,sampleHref,needle] of pages){
 const path=resolve(root,file);
 let html=readFileSync(path,'utf8');
 if(!html.includes(needle))throw new Error(`${file}: expected Bestia Amazon CTA not found`);
 html=html.replace(needle,formatActions(sampleHref));
 writeFileSync(path,html);
}

// Keep the public metadata aligned with the formats that are actually available.
for(const file of ['index.html','l-immagine-della-bestia.html']){
 const path=resolve(root,file);
 let html=readFileSync(path,'utf8');
 html=html
  .replaceAll('I romanzi di Giordano Sognatore. Scopri L’Immagine della Bestia e Le Ombre Si Rivelano, disponibili su Amazon.','I romanzi di Giordano Sognatore. Scopri L’Immagine della Bestia e Le Ombre Si Rivelano, tra ebook, cartaceo e audiolibro.')
  .replaceAll('Un thriller geopolitico fantascientifico su intelligenza artificiale, fiducia e libertà. Giordano Sognatore con Ada Vesper. Disponibile su Amazon.','Un thriller geopolitico fantascientifico su intelligenza artificiale, fiducia e libertà. Giordano Sognatore con Ada Vesper. Disponibile in ebook, cartaceo e audiolibro.');
 writeFileSync(path,html);
}

const pressPath=resolve(root,'press.html');
let press=readFileSync(pressPath,'utf8');
press=press.replace('<strong>Genere:</strong> thriller geopolitico fantascientifico<br><strong>Ambientazione:</strong>','<strong>Genere:</strong> thriller geopolitico fantascientifico<br><strong>Formati:</strong> ebook, cartaceo e audiolibro<br><strong>Ambientazione:</strong>');
writeFileSync(pressPath,press);

const themesPath=resolve(root,'temi.html');
let themes=readFileSync(themesPath,'utf8');
themes=themes.replace('<a class="button" href="press.html">Press & media</a>','<a class="text-link" href="press.html">Torna a Press & media</a>');
writeFileSync(themesPath,themes);

const cssPath=resolve(root,'assets/site.css');
const cssStart='/* format-actions:start */';
const cssEnd='/* format-actions:end */';
const cssBlock=`${cssStart}\n.format-actions{display:flex;flex-wrap:wrap;align-items:flex-start;gap:12px;margin-top:16px}.format-actions>.button,.format-menu>summary.button{margin-top:0}.format-menu{position:relative}.format-menu summary{list-style:none;cursor:pointer}.format-menu summary::-webkit-details-marker{display:none}.format-menu summary.button span{font-size:1rem;transition:transform .16s ease}.format-menu[open] summary.button span{transform:rotate(180deg)}.format-menu-panel{position:absolute;z-index:20;top:calc(100% + 8px);left:0;min-width:235px;padding:7px;background:var(--surface);border:1px solid var(--line);box-shadow:0 18px 34px #0008}.format-menu-panel .button{display:flex;width:100%;min-height:44px;margin:0;padding:10px 12px;border:0;justify-content:flex-start;text-align:left;font-size:.82rem;font-weight:500;color:var(--ink)}.format-menu-panel .button:hover{background:var(--gold);color:var(--bg)}.format-menu-panel .button+.button{border-top:1px solid var(--line)}.book-row .format-actions{gap:8px}.book-row .format-actions>.button,.book-row .format-menu>summary.button{padding:9px 12px;min-height:42px;font-size:.78rem}.book-row .format-menu-panel .button{font-size:.8rem}.download-actions>.format-actions{margin-top:0}@media(max-width:700px){.format-actions{display:grid;grid-template-columns:1fr;margin-top:18px}.format-actions>.button,.format-actions>.format-menu,.format-menu>summary.button{width:100%;max-width:none}.format-menu>summary.button,.format-actions>.button{justify-content:center;text-align:center}.format-menu-panel{position:static;width:100%;min-width:0;margin-top:7px;box-shadow:none}.book-row .format-actions>.button,.book-row .format-menu>summary.button{width:100%;justify-content:center}}\n${cssEnd}`;
let css=readFileSync(cssPath,'utf8');
const start=css.indexOf(cssStart);
const end=css.indexOf(cssEnd);
if(start!==-1&&end!==-1&&end>=start)css=css.slice(0,start).trimEnd()+css.slice(end+cssEnd.length);
css=css.trimEnd()+`\n${cssBlock}\n`;
writeFileSync(cssPath,css);

console.log('Added format-based Bestia CTAs, Google Play ebook/audiobook links, 30-minute audio preview and aligned Press link.');

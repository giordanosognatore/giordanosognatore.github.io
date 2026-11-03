import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateRawSync} from 'node:zlib';
import {estrattoAssets,verifyEstratto} from './estratto-assets.mjs';
import {escapeHtml} from './taccuino.mjs';

export const sampleRoute='estratto-l-immagine-della-bestia.html';
export const sampleSections=[
 {id:'nota-autori',file:'nota-autore',title:'Nota degli autori'},
 {id:'epigrafe',file:'epigrafe',title:'Epigrafe'},
 {id:'prologo',file:'prologo',title:'Prologo — La guerra che non comincia',narrative:true},
 {id:'atto-1',file:'atto-1',title:'Atto I — La Pace'},
 {id:'capitolo-01',file:'capitolo-01',title:'Capitolo 1 — Padre Rinaldi',narrative:true},
 {id:'capitolo-02',file:'capitolo-02',title:'Capitolo 2 — L’ala spezzata',narrative:true},
 {id:'capitolo-03',file:'capitolo-03',title:'Capitolo 3 — Gerusalemme',narrative:true},
 {id:'capitolo-04',file:'capitolo-04',title:'Capitolo 4 — Non lo so',narrative:true},
 {id:'capitolo-05',file:'capitolo-05',title:'Capitolo 5 — Gli architetti',narrative:true},
 {id:'capitolo-06',file:'capitolo-06',title:'Capitolo 6 — Il Patto',narrative:true}
];
export const sampleImages=[
 {source:'act-01.jpg',path:'assets/estratto-bestia-atto-i.webp',width:768,height:1152},
 {source:'internal-02.png',path:'assets/estratto-bestia-ala-spezzata.webp',width:768,height:925}
];

// A deliberately limited ZIP reader for this immutable, hash-verified EPUB only.
// Central-directory sizes also handle entries with data descriptors. No extraction
// to disk, external executables, private repository or general-purpose ZIP API.
export function approvedEpubEntries(bytes=readFileSync(new URL('../dist/'+estrattoAssets[0].publicPath,import.meta.url))){
 verifyEstratto(bytes,estrattoAssets[0]);
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
  if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){end=i;break;}
 }
 assert.ok(end>=0,'EPUB: missing ZIP directory');
 assert.equal(bytes.readUInt16LE(end+4),0);assert.equal(bytes.readUInt16LE(end+6),0);
 const count=bytes.readUInt16LE(end+10),directorySize=bytes.readUInt32LE(end+12);
 let offset=bytes.readUInt32LE(end+16);
 const directoryEnd=offset+directorySize;
 assert.ok(directoryEnd<=end,'EPUB: invalid directory bounds');
 const wanted=new Set([...sampleSections.map(s=>`EPUB/text/${s.file}.xhtml`),...sampleImages.map(i=>'EPUB/images/'+i.source)]);
 const entries=new Map();
 for(let i=0;i<count;i++){
  assert.ok(offset+46<=directoryEnd);assert.equal(bytes.readUInt32LE(offset),0x02014b50);
  const flags=bytes.readUInt16LE(offset+8),method=bytes.readUInt16LE(offset+10);
  const compressed=bytes.readUInt32LE(offset+20),size=bytes.readUInt32LE(offset+24);
  const nameLength=bytes.readUInt16LE(offset+28),extra=bytes.readUInt16LE(offset+30),comment=bytes.readUInt16LE(offset+32);
  const name=bytes.subarray(offset+46,offset+46+nameLength).toString('utf8');
  if(wanted.has(name)){
   assert.ok(!entries.has(name),'EPUB: duplicate selected entry');assert.equal(flags&1,0);
   assert.ok([0,8].includes(method));assert.ok(size>0&&size<2000000);
   const local=bytes.readUInt32LE(offset+42);
   assert.ok(local+30<=bytes.length);assert.equal(bytes.readUInt32LE(local),0x04034b50);
   const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
   assert.ok(start+compressed<=bytes.readUInt32LE(end+16),'EPUB: invalid payload bounds');
   const payload=bytes.subarray(start,start+compressed);
   const result=method===0?payload:inflateRawSync(payload,{maxOutputLength:size});
   assert.equal(result.length,size);entries.set(name,result);
  }
  offset+=46+nameLength+extra+comment;
 }
 assert.equal(offset,directoryEnd);assert.equal(entries.size,wanted.size,'EPUB: missing approved section/image');
 return entries;
}

export function sourceSection(entries,section){
 const xml=entries.get(`EPUB/text/${section.file}.xhtml`).toString('utf8');
 assert.equal(xml.match(/<title>(.*?)<\/title>/s)?.[1],section.title);
 const body=xml.match(/<section\b[^>]*>([\s\S]*?)<\/section>/)?.[1].trim();
 assert.ok(body,`Missing section ${section.file}`);
 // This is known XHTML, not arbitrary HTML: fail closed on new structures.
 for(const tag of body.matchAll(/<(\/?)([\w-]+)\b([^>]*)>/g)){
  assert.ok(['h1','p','span','em','strong','div','blockquote','br','figure','img','cite'].includes(tag[2]),`Unexpected EPUB tag: ${tag[2]}`);
  const attributes=tag[3].replace(/\/?\s*$/,'');
  let consumed='';
  for(const a of attributes.matchAll(/\s+([\w:-]+)="([^"]*)"/g)){
   assert.ok(['class','aria-hidden','src','alt','lang','xml:lang'].includes(a[1]),`Unexpected EPUB attribute: ${a[1]}`);consumed+=a[0];
  }
  assert.equal(consumed,attributes);
 }
 return body;
}

export function sampleContent(entries,section){
 let html=sourceSection(entries,section).replace(/<(\/?)h1\b/g,'<$1h2').replaceAll(' class="visually-hidden"','').replace(/ xml:lang="[^"]*"/g,'');
 html=html.replace(/<img\b([^>]*?)\/>/g,(_,attributes)=>{
  const source=attributes.match(/ src="\.\.\/images\/([^"]+)"/)?.[1];
  const image=sampleImages.find(i=>i.source===source);assert.ok(image,`Unexpected EPUB image ${source}`);
  return `<img${attributes.replace(/ src="[^"]+"/,` src="${image.path}"`)} width="${image.width}" height="${image.height}" loading="lazy" decoding="async">`;
 });
 return html;
}

export function onlineSample(){
 const entries=approvedEpubEntries();
 const downloads=estrattoAssets.map(a=>`<a class="button" href="${a.publicPath}" download>Scarica ${a.format}</a>`).join('');
 const toc=sampleSections.map(s=>`<li><a href="#${s.id}">${escapeHtml(s.title)}</a></li>`).join('');
 const sections=sampleSections.map((s,index)=>{
  const previous=sampleSections.slice(0,index).findLast(v=>v.narrative);
  const next=sampleSections[index+1];
  const navigation=s.narrative?`<nav class="excerpt-chapter-nav" aria-label="Dopo ${escapeHtml(s.title)}">${previous?`<a href="#${previous.id}">← ${escapeHtml(previous.title)}</a>`:''}<a href="#indice-estratto">Torna all’indice</a>${next?`<a href="#${next.id}">Continua: ${escapeHtml(next.title)} →</a>`:'<a href="#fine-estratto">Fine dell’estratto →</a>'}</nav>`:'';
  return `<section class="excerpt-section" id="${s.id}" aria-label="${escapeHtml(s.title)}"><div class="excerpt-text">${sampleContent(entries,s)}</div>${navigation}</section>`;
 }).join('\n');
 return `<article class="excerpt shell">
<header class="excerpt-header"><a class="breadcrumb" href="l-immagine-della-bestia.html">L’Immagine della Bestia /</a><p class="eyebrow">ESTRATTO GRATUITO · LETTURA ONLINE</p><h1>L’Immagine<br>della <em>Bestia</em></h1><p class="credit">Giordano Sognatore <span>con Ada Vesper</span></p><p class="excerpt-intro">Prologo + Atto I — La Pace, capitoli 1–6.<br>Leggi qui, senza registrazione, oppure scarica l’estratto nel formato che preferisci.</p><div class="download-actions"><a class="button button-primary" href="#prologo">Inizia dal Prologo</a>${downloads}</div></header>
<nav class="excerpt-toc" id="indice-estratto" aria-labelledby="indice-estratto-title"><h2 id="indice-estratto-title">Indice dell’estratto</h2><ol>${toc}</ol></nav>
<nav class="excerpt-tools" aria-label="Strumenti di lettura"><a href="#indice-estratto">Indice</a><a href="${estrattoAssets[0].publicPath}" download>EPUB</a><a href="${estrattoAssets[1].publicPath}" download>PDF</a><a href="l-immagine-della-bestia.html">Il romanzo</a></nav>
${sections}
<footer class="excerpt-end" id="fine-estratto"><p class="eyebrow">FINE DELL’ESTRATTO GRATUITO</p><h2>Vuoi continuare?</h2><p>Hai letto il Prologo e l’Atto I — La Pace di <em>L’Immagine della Bestia</em>. La pagina del romanzo raccoglie i formati disponibili, compreso l’audiolibro integrale gratuito.</p><div class="download-actions"><a class="button button-primary" href="l-immagine-della-bestia.html">Scopri il romanzo completo</a>${downloads}</div><a class="text-link" href="#indice-estratto">Torna all’indice dell’estratto</a></footer>
</article>`;
}

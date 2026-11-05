import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {escapeHtml as esc} from './taccuino.mjs';

export const ombreRoute='leggi-le-ombre-si-rivelano.html';
export const ombrePaperback='https://www.amazon.it/dp/B0F4Y71R6L';
export const ombreAssets=[
 {format:'EPUB',path:'downloads/le-ombre-si-rivelano.epub',size:1742103,sha256:'521bf0e2093d9804f041582b6d7ae6d2c013494f64a8fb61cb741081d314f636'},
 {format:'PDF',path:'downloads/le-ombre-si-rivelano.pdf',size:747045,sha256:'02c8a9a30eb7ff8dc121bfc3ad3ad3f66d96b33d688e4b18ab88cc877940cab8'}
];
export function verifyOmbre(bytes,asset){
 assert.equal(bytes.length,asset.size,`Ombre ${asset.format}: unexpected size`);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,`Ombre ${asset.format}: unexpected SHA-256`);
}

// Separate from Bestia's deliberately restricted parser. This is only for the
// immutable adapted EPUB above, verified before any ZIP/XML interpretation.
export function ombreEntries(bytes=readFileSync(new URL('../dist/'+ombreAssets[0].path,import.meta.url))){
 verifyOmbre(bytes,ombreAssets[0]);
 const end=bytes.length-22;
 assert.equal(bytes.readUInt32LE(end),0x06054b50);
 assert.equal(bytes.readUInt16LE(end+20),0);
 assert.equal(bytes.readUInt32LE(end+4),0);
 assert.equal(bytes.readUInt16LE(end+8),bytes.readUInt16LE(end+10));
 const directory=bytes.readUInt32LE(end+16),count=bytes.readUInt16LE(end+10);
 assert.equal(directory+bytes.readUInt32LE(end+12),end);
 const result=new Map();let offset=directory;
 for(let i=0;i<count;i++){
  assert.ok(offset+46<=end);assert.equal(bytes.readUInt32LE(offset),0x02014b50);
  const flags=bytes.readUInt16LE(offset+8),method=bytes.readUInt16LE(offset+10);
  const compressed=bytes.readUInt32LE(offset+20),size=bytes.readUInt32LE(offset+24);
  const length=bytes.readUInt16LE(offset+28),extra=bytes.readUInt16LE(offset+30),comment=bytes.readUInt16LE(offset+32);
  assert.ok(offset+46+length+extra+comment<=end);
  const name=bytes.subarray(offset+46,offset+46+length).toString('utf8');
  assert.match(name,/^[\w/-]+\.(?:xhtml|xml|opf|css|png)$|^mimetype$/);
  assert.ok(!result.has(name));assert.equal(flags&1,0);assert.ok([0,8].includes(method));assert.ok(size<3000000);
  const local=bytes.readUInt32LE(offset+42);assert.ok(local+30<=directory);
  assert.equal(bytes.readUInt32LE(local),0x04034b50);
  const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
  assert.ok(start+compressed<=directory);
  const payload=bytes.subarray(start,start+compressed),value=method===0?payload:inflateRawSync(payload,{maxOutputLength:size});
  assert.equal(value.length,size);result.set(name,value);offset+=46+length+extra+comment;
 }
 assert.equal(offset,end);assert.equal(count,33);
 return result;
}
const ids=['frontespizio','dedica','introduzione','indice-libro','prologo',...Array.from({length:18},(_,i)=>`capitolo-${i+1}`),'epilogo','riflessioni-finali','autore'];
export function ombreSections(entries=ombreEntries()){
 return ids.map((id,i)=>{
  const file=i===0?'titlePageContent.xhtml':`chapter-${i}.xhtml`;
  const xml=entries.get('OPS/'+file).toString('utf8');
  const title=xml.match(/<title>(.*?)<\/title>/s)[1];
  const body=xml.match(/<body>(.*?)<\/body>/s)[1];
  // The importer emits only these semantic tags. Refuse new markup/attributes.
  for(const tag of body.matchAll(/<(\/?)(\w+)([^>]*)>/g)){
   assert.ok(['p','h1','em','strong','br','a'].includes(tag[2]));
   assert.ok(tag[2]==='a'&&!tag[1]?/^ href="(?:titlePageContent|chapter-\d+)\.xhtml"$/.test(tag[3]):/^\/?$/.test(tag[3]));
  }
  return {id,file,title,body};
 });
}
export const ombreDownloads=()=>ombreAssets.map(a=>`<a class="button" href="${a.path}" download>Scarica ${a.format}</a>`).join('');
export function ombreContent(section,sections){
 return section.body.replace(/<(\/?)h1>/g,'<$1h2>').replace(/href="([\w-]+\.xhtml)"/g,(_,file)=>{
  const destination=sections.find(s=>s.file===file);assert.ok(destination);
  return `href="#${destination.id}"`;
 }).replaceAll('<br/>','<br>');
}
export function onlineOmbre(){
 const sections=ombreSections(),downloads=ombreDownloads();
 const toc=sections.map(s=>`<li><a href="#${s.id}">${s.title}</a></li>`).join('');
 const chapters=sections.map((s,i)=>`<section class="excerpt-section" id="${s.id}" aria-label="${esc(s.title)}"><div class="excerpt-text">${ombreContent(s,sections)}</div><nav class="excerpt-chapter-nav" aria-label="Dopo ${esc(s.title)}">${i?`<a href="#${sections[i-1].id}">← ${sections[i-1].title}</a>`:''}<a href="#indice-ombre">Torna all’indice</a>${sections[i+1]?`<a href="#${sections[i+1].id}">Continua: ${sections[i+1].title} →</a>`:'<a href="#fine-romanzo">Fine del romanzo →</a>'}</nav></section>`).join('\n');
 return `<article class="excerpt shell"><header class="excerpt-header"><a class="breadcrumb" href="le-ombre-si-rivelano.html">Le Ombre Si Rivelano /</a><p class="eyebrow">ROMANZO INTEGRALE GRATUITO · LETTURA ONLINE</p><h1>Le Ombre<br>Si <em>Rivelano</em></h1><p class="credit">Giordano Sognatore</p><p class="excerpt-intro">Il romanzo completo, gratuito e senza registrazione.<br>Leggi qui oppure scarica EPUB e PDF.</p><div class="download-actions"><a class="button button-primary" href="#prologo">Inizia dal Prologo</a>${downloads}</div><figure class="ombre-reading-cover"><img src="assets/ombre-lettura-copertina.webp" width="640" height="990" alt="Copertina di Le Ombre Si Rivelano, Giordano Sognatore" decoding="async"></figure></header><nav class="excerpt-toc" id="indice-ombre" aria-labelledby="indice-ombre-title"><h2 id="indice-ombre-title">Indice del romanzo</h2><ol>${toc}</ol></nav><nav class="excerpt-tools" aria-label="Strumenti di lettura"><a href="#indice-ombre">Indice</a><a href="${ombreAssets[0].path}" download>EPUB</a><a href="${ombreAssets[1].path}" download>PDF</a><a href="le-ombre-si-rivelano.html">Il romanzo</a></nav>${chapters}<footer class="excerpt-end" id="fine-romanzo"><p class="eyebrow">FINE DEL ROMANZO</p><h2>Grazie per aver letto.</h2><div class="download-actions">${downloads}<a class="button" href="le-ombre-si-rivelano.html">Torna alla scheda del romanzo</a></div><a class="text-link" href="#indice-ombre">Torna all’indice del romanzo</a></footer></article>`;
}

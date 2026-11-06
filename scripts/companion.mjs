import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {inflateRawSync} from 'node:zlib';
import {escapeHtml as esc} from './taccuino.mjs';

export const companionReadingRoute='leggi-il-giorno-in-cui-nacque-la-bestia.html';
export const companionAssets=[
 {format:'EPUB',path:'downloads/il-giorno-in-cui-nacque-la-bestia-ada-vesper.epub',size:539772,gitBlob:'ea70a59b55b268a487545f70206c8fac5ae210d9',sha256:'c94957af99fabc43cc5cf325a53e7853d59aab39e644df26c318ed632982ac94'},
 {format:'PDF',path:'downloads/il-giorno-in-cui-nacque-la-bestia-ada-vesper.pdf',size:674518,gitBlob:'12d1b996cea3aa12225b5df0ebbeec3cad55149d',sha256:'d83efaabf1104d035f96e4b66860460ffb4a3fcd3a4829e84a8c2b2dd91133eb'}
];
export function verifyCompanion(bytes,asset){
 assert.equal(bytes.length,asset.size,`Companion ${asset.format}: unexpected size`);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,`Companion ${asset.format}: unexpected SHA-256`);
 assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),asset.gitBlob,`Companion ${asset.format}: unexpected Git blob`);
}

const sectionFiles=['title.xhtml','legal.xhtml','voice.xhtml','dedica.xhtml',...Array.from({length:24},(_,i)=>`ch${String(i+1).padStart(2,'0')}.xhtml`),'finale.xhtml'];
const sectionIds=['frontespizio','nota-al-lettore','nota-sulla-voce','dedica','prologo',...Array.from({length:22},(_,i)=>`capitolo-${i+1}`),'epilogo','nota-finale'];

// Restricted ZIP reader for the immutable public companion EPUB. It reads only
// the approved textual spine entries, without extracting files or using a
// general-purpose archive dependency.
export function companionEntries(bytes=readFileSync(new URL('../dist/'+companionAssets[0].path,import.meta.url))){
 verifyCompanion(bytes,companionAssets[0]);
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
  if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){end=i;break;}
 }
 assert.ok(end>=0,'Companion EPUB: missing ZIP directory');
 assert.equal(bytes.readUInt16LE(end+4),0);assert.equal(bytes.readUInt16LE(end+6),0);
 const count=bytes.readUInt16LE(end+10),directorySize=bytes.readUInt32LE(end+12);
 let offset=bytes.readUInt32LE(end+16);const directoryEnd=offset+directorySize;
 assert.ok(directoryEnd<=end,'Companion EPUB: invalid directory bounds');
 const wanted=new Set(sectionFiles.map(file=>'EPUB/'+file)),entries=new Map();
 for(let i=0;i<count;i++){
  assert.ok(offset+46<=directoryEnd);assert.equal(bytes.readUInt32LE(offset),0x02014b50);
  const flags=bytes.readUInt16LE(offset+8),method=bytes.readUInt16LE(offset+10);
  const compressed=bytes.readUInt32LE(offset+20),size=bytes.readUInt32LE(offset+24);
  const nameLength=bytes.readUInt16LE(offset+28),extra=bytes.readUInt16LE(offset+30),comment=bytes.readUInt16LE(offset+32);
  const name=bytes.subarray(offset+46,offset+46+nameLength).toString('utf8');
  if(wanted.has(name)){
   assert.ok(!entries.has(name),'Companion EPUB: duplicate selected entry');assert.equal(flags&1,0);
   assert.ok([0,8].includes(method));assert.ok(size>0&&size<1000000);
   const local=bytes.readUInt32LE(offset+42);assert.ok(local+30<=bytes.length);assert.equal(bytes.readUInt32LE(local),0x04034b50);
   const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
   assert.ok(start+compressed<=bytes.readUInt32LE(end+16),'Companion EPUB: invalid payload bounds');
   const payload=bytes.subarray(start,start+compressed),value=method===0?payload:inflateRawSync(payload,{maxOutputLength:size});
   assert.equal(value.length,size);entries.set(name,value);
  }
  offset+=46+nameLength+extra+comment;
 }
 assert.equal(offset,directoryEnd);assert.equal(entries.size,wanted.size,'Companion EPUB: missing approved section');
 return entries;
}

export function companionSections(entries=companionEntries()){
 return sectionFiles.map((file,index)=>{
  const xml=entries.get('EPUB/'+file).toString('utf8');
  const title=xml.match(/<title>(.*?)<\/title>/s)?.[1];
  const body=xml.match(/<body>([\s\S]*?)<\/body>/)?.[1].trim();
  assert.ok(title&&body,`Companion: invalid ${file}`);
  for(const tag of body.matchAll(/<(\/?)([\w-]+)\b([^>]*)>/g)){
   assert.ok(['div','h1','h2','p','em','strong','br','blockquote'].includes(tag[2]),`Companion: unexpected tag ${tag[2]}`);
   const attributes=tag[3].replace(/\/?\s*$/,'');let consumed='';
   for(const attribute of attributes.matchAll(/\s+([\w:-]+)="([^"]*)"/g)){
    assert.equal(attribute[1],'class',`Companion: unexpected attribute ${attribute[1]}`);consumed+=attribute[0];
   }
   assert.equal(consumed,attributes);
  }
  return {id:sectionIds[index],file,title,body};
 });
}
export const companionDownloads=()=>companionAssets.map(asset=>`<a class="button" href="${asset.path}" download>Scarica ${asset.format}</a>`).join('');
export const companionContent=section=>section.body.replace(/<(\/?)(?:h1)>/g,'<$1h2>').replaceAll('<br/>','<br>');

export function onlineCompanion(){
 const sections=companionSections(),downloads=companionDownloads();
 const toc=sections.map(section=>`<li><a href="#${section.id}">${esc(section.title)}</a></li>`).join('');
 const content=sections.map((section,index)=>`<section class="excerpt-section" id="${section.id}" aria-label="${esc(section.title)}"><div class="excerpt-text">${companionContent(section)}</div><nav class="excerpt-chapter-nav" aria-label="Dopo ${esc(section.title)}">${index?`<a href="#${sections[index-1].id}">← ${esc(sections[index-1].title)}</a>`:''}<a href="#indice-companion">Torna all’indice</a>${sections[index+1]?`<a href="#${sections[index+1].id}">Continua: ${esc(sections[index+1].title)} →</a>`:'<a href="#fine-companion">Fine del companion →</a>'}</nav></section>`).join('\n');
 return `<article class="excerpt shell"><header class="excerpt-header"><a class="breadcrumb" href="il-giorno-in-cui-nacque-la-bestia.html">Il giorno in cui nacque la Bestia /</a><p class="eyebrow">COMPANION GRATUITO · LETTURA ONLINE</p><h1>Il giorno in cui<br>nacque la <em>Bestia</em></h1><p class="credit">Ada Vesper <span>con Giordano Sognatore</span></p><p class="excerpt-intro">Il diario completo, gratuito e senza registrazione.<br>Leggi qui oppure scarica EPUB e PDF.</p><div class="download-actions"><a class="button button-primary" href="#prologo">Inizia dal Prologo</a>${downloads}</div><figure class="reading-cover"><img src="assets/companion-cover.png" width="640" height="920" alt="Copertina di Il giorno in cui nacque la Bestia, Ada Vesper con Giordano Sognatore" decoding="async"></figure></header><nav class="excerpt-toc" id="indice-companion" aria-labelledby="indice-companion-title"><h2 id="indice-companion-title">Indice del companion</h2><ol>${toc}</ol></nav><nav class="excerpt-tools" aria-label="Strumenti di lettura"><a href="#indice-companion">Indice</a><a href="${companionAssets[0].path}" download>EPUB</a><a href="${companionAssets[1].path}" download>PDF</a><a href="il-giorno-in-cui-nacque-la-bestia.html">Il companion</a></nav>${content}<footer class="excerpt-end" id="fine-companion"><p class="eyebrow">FINE DEL COMPANION</p><h2>Grazie per aver letto.</h2><div class="download-actions">${downloads}<a class="button" href="il-giorno-in-cui-nacque-la-bestia.html">Scopri il companion</a></div><a class="text-link" href="#indice-companion">Torna all’indice del companion</a></footer></article>`;
}

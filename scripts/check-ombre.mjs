import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {ombreRoute,ombreAssets,ombreEntries,ombreSections,verifyOmbre,ombrePaperback} from './ombre.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const decode=value=>value.replace(/&(amp|lt|gt|quot|#x27);/g,(_,entity)=>({amp:'&',lt:'<',gt:'>',quot:'"','#x27':"'"})[entity]);
const text=value=>decode(value.replace(/<[^>]*>/g,'')).replace(/\s+/gu,' ').trim();
function emphasis(html){
 const stack=[];let italic=false,bold=false,value='';
 for(const part of html.split(/(<[^>]+>)/g)){
  if(part.startsWith('<')){
   const [,closing,tag]=part.match(/^<(\/?)(\w+)/);
   if(tag==='br')continue;
   if(closing){const previous=stack.pop();assert.equal(previous.tag,tag);({italic,bold}=previous);}
   else{stack.push({tag,italic,bold});if(tag==='em')italic=true;if(tag==='strong')bold=true;}
  }else for(const char of decode(part))if(!/\s/u.test(char))value+=char+Number(italic)+Number(bold);
 }
 assert.equal(stack.length,0);return sha(value);
}
export function checkOmbre(root){
 for(const asset of ombreAssets)verifyOmbre(readFileSync(resolve(root,asset.path)),asset);
 const bytes=readFileSync(resolve(root,ombreAssets[0].path)),tampered=Buffer.from(bytes);tampered[100]^=1;
 assert.throws(()=>ombreEntries(tampered),/SHA-256/);
 const entries=ombreEntries(bytes),sections=ombreSections(entries);
 const source=JSON.parse(readFileSync(new URL('./ombre-source-checks.json',import.meta.url)));
 assert.equal(source.sourceSha256,'b8eaf7a646c3638bd0f3b9bdcab14c12da36bea3919e68a0f0054e06c6fcb87a');
 assert.equal(sections.length,26);assert.equal(source.sections.length,26);
 const page=readFileSync(resolve(root,ombreRoute),'utf8');let blocks=0,position=0;
 assert.equal((page.match(/class="excerpt-section"/g)||[]).length,26);
 for(let i=0;i<sections.length;i++){
  const section=sections[i],expected=source.sections[i];assert.equal(section.file,expected.file);assert.equal(section.title,expected.title);
  const at=page.indexOf(`<section class="excerpt-section" id="${section.id}"`,position);assert.ok(at>=position);position=at+1;
  const rendered=page.slice(at,page.indexOf('</section>',at));
  const html=rendered.match(/<div class="excerpt-text">(.*?)<\/div>/s)[1];
  for(const [name,markup] of [['EPUB',section.body],['online',html]]){
   const hashes=[...markup.matchAll(/<(p|h[12])>(.*?)<\/\1>/gs)].map(m=>sha(text(m[2])));
   assert.deepEqual(hashes,expected.blocks,`${section.id}: ${name} paragraphs/text differ from Pages`);
   assert.equal(emphasis(markup),expected.emphasisSha256,`${section.id}: ${name} emphasis differs from Pages`);
   assert.equal((markup.match(/<br\/?\s*>/g)||[]).length,expected.lineBreaks,`${section.id}: ${name} line breaks differ`);
  }
  blocks+=expected.blocks.length;
 }
 assert.equal(blocks,279);
 for(const [name,bytes] of entries){
  assert.ok(!/fonts|encryption|\.js$|drop-cap/.test(name));
  if(/\.(?:opf|xhtml|css|xml)$/.test(name))assert.ok(!/@font-face|onload=|<script|opacity:0|EPB-UUID|dc:contributor|\/Users\//.test(bytes.toString()));
 }
 const opf=entries.get('OPS/book.opf').toString();assert.ok(opf.includes('<dc:creator>Giordano Sognatore</dc:creator>'));
 const cover=entries.get('OPS/cover.png');
 for(let offset=8;offset<cover.length;){
  const size=cover.readUInt32BE(offset),type=cover.subarray(offset+4,offset+8).toString();
  assert.ok(['IHDR','IDAT','IEND','PLTE','tRNS'].includes(type));offset+=size+12;
 }
 const web=readFileSync(resolve(root,'assets/ombre-lettura-copertina.webp'));
 assert.equal(web.subarray(0,4).toString(),'RIFF');assert.equal(web.subarray(8,12).toString(),'WEBP');
 for(let offset=12;offset+8<web.length;){
  const type=web.subarray(offset,offset+4).toString(),size=web.readUInt32LE(offset+4);
  assert.ok(!['EXIF','XMP ','ICCP'].includes(type));offset+=8+size+(size%2);
 }
 assert.ok(web.length<160000);
 assert.ok(page.includes('width="640" height="990"'));
 const header=page.match(/<header class="excerpt-header">([\s\S]*?)<\/header>/)[1];
 assert.equal((header.match(/<figure class="reading-cover">/g)||[]).length,1);
 assert.ok(header.indexOf('class="reading-cover"')>header.indexOf('Scarica PDF'));
 assert.ok(page.indexOf('</header>')<page.indexOf('class="excerpt-toc"'));
 assert.ok(page.includes('class="reading-page"'));
 assert.equal((page.match(/class="excerpt-chapter-nav"/g)||[]).length,26);
 assert.ok(page.includes('href="#prologo">Inizia dal Prologo'));
 const home=readFileSync(resolve(root,'index.html'),'utf8');
 const catalog=[...home.matchAll(/<article class="book-row">[\s\S]*?<\/article>/g)].map(m=>m[0]).find(html=>html.includes('<h3><a href="le-ombre-si-rivelano.html">'));
 assert.ok(catalog,'Missing Ombre catalog entry');
 assert.ok(catalog.includes('<div class="format-actions" role="group" aria-label="Scopri e leggi Le Ombre Si Rivelano">'));
 assert.ok(catalog.includes('<a class="button" href="le-ombre-si-rivelano.html">Scopri il libro</a>'));
 assert.ok(catalog.includes(`<a class="button" href="${ombreRoute}">Leggi gratis il romanzo</a>`));
 assert.equal((catalog.match(/class="button"/g)||[]).length,2,'Both Ombre catalog actions must remain spaced buttons');
 const book=readFileSync(resolve(root,'le-ombre-si-rivelano.html'),'utf8');
 assert.ok(book.includes(`href="${ombreRoute}">Leggi online`));
 assert.equal(book.split(`<a class="button" href="${ombrePaperback}">Cartaceo</a>`).length-1,2,'Both paperback actions must be labeled Cartaceo buttons');
 assert.ok(!book.includes('Acquista il cartaceo su Amazon'),'No inconsistent paperback label');
 for(const a of ombreAssets)for(const html of [book,page])assert.ok(html.includes(`href="${a.path}" download>Scarica ${a.format}`));
 assert.ok(!readFileSync(resolve(root,'feed.xml'),'utf8').includes(ombreRoute));
 assert.equal(readFileSync(resolve(root,'sitemap.xml'),'utf8').split('/'+ombreRoute+'</loc>').length-1,1);
 console.log(`PASS: Ombre, ${blocks} Pages text blocks and character-level emphasis match EPUB/online; 26 sections; immutable assets; no embedded fonts/scripts or cover metadata.`);
}

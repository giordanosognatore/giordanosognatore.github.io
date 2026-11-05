import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {sampleRoute,sampleSections,sampleImages,approvedEpubEntries,sourceSection} from './epub-sample.mjs';
import {estrattoAssets} from './estratto-assets.mjs';

export function checkOnlineSample(root){
 const bytes=readFileSync(resolve(root,estrattoAssets[0].publicPath));
 const entries=approvedEpubEntries(bytes);
 const tampered=Buffer.from(bytes);tampered[100]^=1;
 assert.throws(()=>approvedEpubEntries(tampered),/SHA-256 inatteso/,'Never parse a changed/unapproved EPUB');
 const page=readFileSync(resolve(root,sampleRoute),'utf8');
 assert.equal((page.match(/class="excerpt-section"/g)||[]).length,10);
 assert.equal((page.match(/class="excerpt-chapter-nav"/g)||[]).length,7);
 assert.ok(page.includes('href="#prologo">Inizia dal Prologo</a>'));
 assert.ok(page.includes('<nav class="excerpt-toc" id="indice-estratto"'));
 assert.ok(page.includes('<nav class="excerpt-tools" aria-label="Strumenti di lettura">'));
 assert.ok(page.includes('id="fine-estratto"'));
 let position=0,paragraphs=0;
 for(const section of sampleSections){
  assert.ok(page.includes(`<a href="#${section.id}">${section.title}</a>`));
  const start=page.indexOf(`<section class="excerpt-section" id="${section.id}"`,position);
  assert.ok(start>=position,'EPUB reading order must be unchanged');position=start+1;
  const rendered=page.slice(start,page.indexOf('</section>',start));
  const marker='<div class="excerpt-text">';
  const content=rendered.slice(rendered.indexOf(marker)+marker.length,rendered.lastIndexOf('</div>'));
  const original=sourceSection(entries,section);
  // Independent from the rendering transform: all text, paragraph boundaries,
  // emphasis and narrative breaks must match the approved XHTML, in order.
  const text=html=>html.replace(/<[^>]*>/g,'').trim();
  assert.equal(text(content),text(original),`${section.id}: approved text changed`);
  let paragraphPosition=0;
  for(const p of original.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)){
   const expected=p[0].replace(/ xml:lang="[^"]*"/g,'');
   const at=content.indexOf(expected,paragraphPosition);
   assert.ok(at>=paragraphPosition,`${section.id}: missing/reordered/changed paragraph`);
   paragraphPosition=at+expected.length;paragraphs++;
  }
  for(const pattern of [/<p\b/g,/<em\b/g,/<strong\b/g,/<blockquote\b/g,/<br\b/g,/class="narrative-break"/g,/class="message"/g,/class="screen-text"/g,/class="smallcaps"/g]){
   assert.equal((content.match(pattern)||[]).length,(original.match(pattern)||[]).length,`${section.id}: lost structure ${pattern}`);
  }
  assert.equal((content.match(/<h2\b/g)||[]).length,1);
  assert.ok(!/<h1\b|xml:lang|epub:type|\.\.\/images\//.test(content));
 }
 assert.ok(paragraphs>3700,'Missing narrative paragraphs');
 assert.equal((page.match(/class="narrative-break"/g)||[]).length,83);
 for(const image of sampleImages){
  const bytes=readFileSync(resolve(root,image.path));
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
  assert.equal(bytes.readUInt32LE(4)+8,bytes.length);assert.ok(bytes.length<160000,'Sample illustration budget');
  let dimensions=null;
  for(let offset=12;offset+8<=bytes.length;){
   const kind=bytes.subarray(offset,offset+4).toString(),size=bytes.readUInt32LE(offset+4);
   assert.ok(offset+8+size<=bytes.length);
   assert.ok(!['EXIF','XMP ','ICCP'].includes(kind),'Web derivative should not carry source metadata');
   if(kind==='VP8X')dimensions=[bytes.readUIntLE(offset+12,3)+1,bytes.readUIntLE(offset+15,3)+1];
   if(kind==='VP8 ')dimensions=[bytes.readUInt16LE(offset+14)&0x3fff,bytes.readUInt16LE(offset+16)&0x3fff];
   offset+=8+size+(size%2);
  }
  assert.deepEqual(dimensions,[image.width,image.height]);
  const tag=page.match(new RegExp(`<img[^>]*src="${image.path.replaceAll('.','\\.')}"[^>]*>`))?.[0];
  assert.ok(tag?.includes('loading="lazy"')&&tag.includes('decoding="async"'));
  assert.ok(tag.includes(`width="${image.width}" height="${image.height}"`));
 }
 assert.equal((page.match(/<img\b/g)||[]).length,3,'Two approved illustrations plus the existing book cover');
 const header=page.match(/<header class="excerpt-header">([\s\S]*?)<\/header>/)[1];
 assert.equal((header.match(/<figure class="reading-cover">/g)||[]).length,1);
 assert.ok(header.includes('src="assets/bestia-720.webp"'));
 assert.ok(header.includes('srcset="assets/bestia-360.webp 360w, assets/bestia-720.webp 671w"'));
 assert.ok(header.includes('width="671" height="1003"'));
 assert.ok(header.includes('alt="Copertina di L’Immagine della Bestia, Giordano Sognatore con Ada Vesper"'));
 assert.ok(header.indexOf('class="reading-cover"')>header.indexOf('Scarica PDF'));
 assert.ok(page.indexOf('</header>')<page.indexOf('class="excerpt-toc"'));
 assert.ok(!page.includes('bestia-mockup.webp'),'Use the flat cover, not the book mockup');
 assert.ok(page.includes('<span lang="en"><span class="smallcaps">SOPHIA — predict consequences. Preserve choice.</span></span>'));
 for(const asset of estrattoAssets)assert.ok(page.includes(`href="${asset.publicPath}" download>Scarica ${asset.format}</a>`));
 const feed=readFileSync(resolve(root,'feed.xml'),'utf8');assert.ok(!feed.includes(sampleRoute),'The excerpt is not a journal post');
 const map=readFileSync(resolve(root,'sitemap.xml'),'utf8');assert.equal(map.split('/'+sampleRoute+'</loc>').length-1,1);
 console.log(`PASS: online excerpt matches ${paragraphs} approved EPUB paragraphs, emphasis and 83 narrative breaks; 2 optimized illustrations; immutable EPUB guard.`);
}

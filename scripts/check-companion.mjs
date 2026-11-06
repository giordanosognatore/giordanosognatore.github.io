import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {companionReadingRoute,companionAssets,verifyCompanion,companionEntries,companionSections,companionContent} from './companion.mjs';

export function checkCompanion(root){
 for(const asset of companionAssets){
  const bytes=readFileSync(resolve(root,asset.path));
  verifyCompanion(bytes,asset);
 }
 const bytes=readFileSync(resolve(root,companionAssets[0].path)),entries=companionEntries(bytes),sections=companionSections(entries);
 const tampered=Buffer.from(bytes);tampered[100]^=1;
 assert.throws(()=>companionEntries(tampered),/SHA-256|Git blob/,'Never parse a changed companion EPUB');
 assert.equal(sections.length,29);
 assert.deepEqual(sections.slice(0,5).map(section=>section.id),['frontespizio','nota-al-lettore','nota-sulla-voce','dedica','prologo']);
 assert.deepEqual(sections.slice(-2).map(section=>section.id),['epilogo','nota-finale']);
 const page=readFileSync(resolve(root,companionReadingRoute),'utf8');
 assert.equal((page.match(/class="excerpt-section"/g)||[]).length,29);
 assert.equal((page.match(/class="excerpt-chapter-nav"/g)||[]).length,29);
 assert.ok(page.includes('href="#prologo">Inizia dal Prologo</a>'));
 assert.ok(page.includes('<nav class="excerpt-toc" id="indice-companion"'));
 assert.ok(page.includes('<nav class="excerpt-tools" aria-label="Strumenti di lettura">'));
 assert.ok(page.includes('id="fine-companion"'));
 let position=0,paragraphs=0;
 for(const section of sections){
  assert.ok(page.includes(`<a href="#${section.id}">${section.title}</a>`));
  const start=page.indexOf(`<section class="excerpt-section" id="${section.id}"`,position);
  assert.ok(start>=position,'Companion reading order must match the EPUB');position=start+1;
  const marker='<div class="excerpt-text">',contentStart=page.indexOf(marker,start)+marker.length;
  const contentEnd=page.indexOf('</div><nav class="excerpt-chapter-nav"',contentStart);
  const rendered=page.slice(contentStart,contentEnd),expected=companionContent(section);
  assert.equal(rendered,expected,`${section.id}: EPUB markup/text changed online`);
  paragraphs+=(section.body.match(/<p\b/g)||[]).length;
 }
 assert.equal(paragraphs,136);
 assert.equal((page.match(/<div class="excerpt-text">[\s\S]*?<p\b/g)||[]).length>0,true);
 assert.equal((page.match(/<blockquote\b/g)||[]).length,2);
 assert.equal((page.match(/<strong\b/g)||[]).length,1);
 assert.equal((page.match(/<em\b/g)||[]).length,3); // two in the EPUB frontispiece plus the page title
 const header=page.match(/<header class="excerpt-header">([\s\S]*?)<\/header>/)[1];
 assert.equal((header.match(/<figure class="reading-cover">/g)||[]).length,1);
 assert.ok(header.includes('src="assets/companion-cover.png"'));
 assert.ok(header.includes('width="640" height="920"'));
 assert.ok(header.includes('alt="Copertina di Il giorno in cui nacque la Bestia, Ada Vesper con Giordano Sognatore"'));
 assert.ok(header.indexOf('class="reading-cover"')>header.indexOf('Scarica PDF'));
 assert.ok(page.indexOf('</header>')<page.indexOf('class="excerpt-toc"'));
 const cover=readFileSync(resolve(root,'assets/companion-cover.png'));
 assert.equal(cover.subarray(1,4).toString(),'PNG');assert.equal(cover.readUInt32BE(16),640);assert.equal(cover.readUInt32BE(20),920);
 for(const asset of companionAssets)assert.ok(page.includes(`href="${asset.path}" download>Scarica ${asset.format}</a>`));
 const book=readFileSync(resolve(root,'il-giorno-in-cui-nacque-la-bestia.html'),'utf8');
 assert.equal((book.match(new RegExp(`href="${companionReadingRoute}">Leggi online<\\/a>`,'g'))||[]).length,2);
 const actionGroups=[...book.matchAll(/<div class="download-actions">([\s\S]*?)<\/div>/g)].map(match=>match[1]).filter(html=>html.includes('Scarica EPUB'));
 assert.equal(actionGroups.length,2,'Hero and closing must both offer online/EPUB/PDF');
 for(const group of actionGroups){
  assert.ok(group.includes(`<a class="button button-primary" href="${companionReadingRoute}">Leggi online</a>`));
  assert.ok(group.indexOf('Leggi online')<group.indexOf('Scarica EPUB'));
  assert.ok(group.indexOf('Scarica EPUB')<group.indexOf('Scarica PDF'));
 }
 assert.ok(!readFileSync(resolve(root,'feed.xml'),'utf8').includes(companionReadingRoute));
 assert.equal(readFileSync(resolve(root,'sitemap.xml'),'utf8').split('/'+companionReadingRoute+'</loc>').length-1,1);
 console.log(`PASS: companion online matches ${paragraphs} approved EPUB paragraphs in 29 sections; immutable EPUB/PDF and cover verified.`);
}

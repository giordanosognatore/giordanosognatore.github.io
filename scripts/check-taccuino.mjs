import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {runInNewContext} from 'node:vm';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {parseArticle,renderMarkdown,loadArticles} from './taccuino.mjs';
const fixture=(extra='',body='Un testo con **enfasi e *corsivo***.')=>`---\ntitle: "Prova"\ndate: 2026-10-10\ndescription: "Una descrizione & un dettaglio"\ncategory: taccuino\ntags:\n  - Scrittura\n${extra}---\n\n${body}\n`;
assert.equal(parseArticle(fixture(),'Caffè e libri.md').slug,'caffe-e-libri');
assert.equal(parseArticle(fixture(),'prova.md').showOnHome,true);
assert.equal(parseArticle(fixture().replace('category: taccuino','category: comunicati-stampa'),'prova.md').showOnHome,false);
assert.equal(parseArticle(fixture('showOnHome: false\n'),'prova.md').showOnHome,false);
for(const source of [fixture('unknown: yes\n'),fixture('date: 2026-10-11\n'),fixture('showOnHome: yes\n'),fixture('slug: ../escape\n'),fixture().replace('2026-10-10','2026-02-30'),fixture().replace('category: taccuino','category: altro'),fixture('', '# Altro titolo')])assert.throws(()=>parseArticle(source,'prova.md'));
assert.equal(renderMarkdown('**enfasi e *corsivo***'),'<p><strong>enfasi e <em>corsivo</em></strong></p>');
assert.equal(renderMarkdown('**Lo *Spaccio* è una coincidenza.**'),'<p><strong>Lo <em>Spaccio</em> è una coincidenza.</strong></p>');
assert.equal(renderMarkdown('## Titolo\n\n### Dettaglio\n\n- uno\n- due\n\n> Una *citazione*.\n\n---'),'<h2>Titolo</h2>\n<h3>Dettaglio</h3>\n<ul><li>uno</li><li>due</li></ul>\n<blockquote><p>Una <em>citazione</em>.</p></blockquote>\n<hr>');
assert.equal(renderMarkdown('[Romanzo](l-immagine-della-bestia.html)'),'<p><a href="../l-immagine-della-bestia.html">Romanzo</a></p>');
assert.ok(renderMarkdown('<script>alert("x")</script>').includes('&lt;script&gt;'));
assert.throws(()=>renderMarkdown('[click](javascript:alert)'));
assert.throws(()=>renderMarkdown('[click](//example.test)'));
// Execute the unchanged client menu against controlled DOM events.
const attributes={'aria-controls':'primary-navigation','aria-expanded':'false'};
const listeners={};let focused=false;
const toggle={getAttribute:k=>attributes[k],setAttribute:(k,v)=>attributes[k]=v,focus:()=>{focused=true;},addEventListener:(k,fn)=>listeners['toggle:'+k]=fn};
const navigation={contains:()=>true,addEventListener:(k,fn)=>listeners['nav:'+k]=fn};
const mobile={matches:true,addEventListener:(k,fn)=>listeners['media:'+k]=fn};
runInNewContext(readFileSync(new URL('../dist/assets/navigation.js',import.meta.url),'utf8'),{
 document:{querySelector:()=>toggle,getElementById:()=>navigation,addEventListener:(k,fn)=>listeners['doc:'+k]=fn},
 window:{matchMedia:query=>{assert.equal(query,'(max-width: 700px)');return mobile;}}
});
listeners['toggle:click']();assert.equal(attributes['aria-expanded'],'true');assert.equal(attributes['aria-label'],'Chiudi menu');
listeners['doc:keydown']({key:'Escape'});assert.equal(attributes['aria-expanded'],'false');assert.ok(focused);
listeners['toggle:click']();listeners['nav:click']({target:{closest:()=>true}});assert.equal(attributes['aria-expanded'],'false');
listeners['toggle:click']();mobile.matches=false;listeners['media:change']({matches:false});assert.equal(attributes['aria-expanded'],'false');
// Isolated build exercises future publishing with no edits to real content or dist.
const temp=mkdtempSync(join(tmpdir(),'taccuino-check-'));
try{
 const repo=new URL('../',import.meta.url);
 for(const path of ['scripts','dist','site.config.json'])cpSync(new URL(path,repo),join(temp,path),{recursive:true});
 const dir=join(temp,'contenuti/taccuino');mkdirSync(dir,{recursive:true});
 const env={...process.env,SITE_URL:'https://example.test/anteprima',SITE_INDEXABLE:'false'};
 const run=()=>{for(const file of ['build.mjs','press.mjs','check.mjs'])execFileSync(process.execPath,[`scripts/${file}`],{cwd:temp,env,stdio:'pipe'});};
 run();
 assert.ok(!existsSync(join(temp,'dist/taccuino/giordano-bruno-un-altra-bestia.html')));
 for(let n=1;n<=4;n++)writeFileSync(join(dir,`appunto-${n}.md`),fixture().replace('2026-10-10',`2026-10-0${n}`));
 writeFileSync(join(dir,'escluso.md'),fixture('showOnHome: false\n'));
 writeFileSync(join(dir,'comunicato.md'),fixture().replace('category: taccuino','category: comunicati-stampa'));
 run();
 let home=readFileSync(join(temp,'dist/index.html'),'utf8');
 assert.ok(!home.includes('href="taccuino/appunto-1.html"'));
 assert.ok(!home.includes('href="taccuino/escluso.html"'));
 assert.ok(!home.includes('href="taccuino/comunicato.html"'));
 const press=readFileSync(join(temp,'dist/press.html'),'utf8');
 const releaseSection=press.match(/<section class="journal-strip shell"><h2>Ultimi comunicati stampa<\/h2>(.*?)<\/section>/s)[1];
 assert.ok(releaseSection.includes('taccuino/comunicato.html'));
 assert.ok(!releaseSection.includes('taccuino/appunto-'));
 assert.ok(!readFileSync(join(temp,'dist/comunicati-stampa.html'),'utf8').includes('taccuino/appunto-'));
 const snapshots=['index.html','feed.xml','sitemap.xml','taccuino/appunto-4.html'].map(f=>[f,readFileSync(join(temp,'dist',f),'utf8')]);
 run();for(const [f,content] of snapshots)assert.equal(readFileSync(join(temp,'dist',f),'utf8'),content);
 rmSync(join(dir,'comunicato.md'));run();
 assert.ok(!existsSync(join(temp,'dist/comunicati-stampa.html')));
 assert.ok(!existsSync(join(temp,'dist/taccuino/comunicato.html')));
 writeFileSync(join(dir,'duplicato.md'),fixture('slug: appunto-1\n'));
 assert.throws(()=>loadArticles(new URL('file://'+dir+'/')),/Slug duplicato/);
}finally{rmSync(temp,{recursive:true,force:true});}
console.log('PASS: Markdown/front matter, escaping, categories, Home selection, empty archives, stale cleanup, preview/subpath, menu events and deterministic build.');

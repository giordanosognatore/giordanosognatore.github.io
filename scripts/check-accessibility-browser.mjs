// Optional development check. No runtime/browser dependencies are shipped.
// Run npm run dev and Chrome with --remote-debugging-port=9223 first.
import assert from 'node:assert/strict';
import {readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.PREVIEW_URL||'http://localhost:4173').replace(/\/$/,'')+'/';
const debug=(process.env.CHROME_DEBUG_URL||'http://localhost:9223').replace(/\/$/,'');
const pages=readdirSync(new URL('../dist/',import.meta.url),{recursive:true}).filter(p=>p.endsWith('.html')&&!/^google[0-9a-f]+\.html$/.test(p));
const target=await (await fetch(`${debug}/json/new?about:blank`,{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((ok,fail)=>{ws.onopen=ok;ws.onerror=fail;});
let serial=0;
const pending=new Map();
ws.onmessage=({data})=>{
 const message=JSON.parse(data),p=pending.get(message.id);
 if(!p)return;pending.delete(message.id);clearTimeout(p.timer);
 if(message.error)p.fail(new Error(JSON.stringify(message.error)));else p.ok(message.result);
};
const call=(method,params={})=>new Promise((ok,fail)=>{
 const id=++serial,timer=setTimeout(()=>{pending.delete(id);fail(new Error(`CDP timeout: ${method}`));},20000);
 pending.set(id,{ok,fail,timer});ws.send(JSON.stringify({id,method,params}));
});
const evaluate=async expression=>{
 const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 assert.ok(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;
};
const navigate=async path=>{
 const url=new URL(path,base).href;
 await call('Page.navigate',{url});
 for(let i=0;i<100;i++){
  await delay(50);
  if(await evaluate(`location.href===${JSON.stringify(url)}&&document.readyState==='complete'`))return;
 }
 throw new Error(`Page did not load: ${url}`);
};
const size=(width,height=1000)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
const key=async(key,shift=false)=>{
 const codes={Tab:9,Enter:13,Escape:27};
 const p={key,code:key,windowsVirtualKeyCode:codes[key],modifiers:shift?8:0};
 await call('Input.dispatchKeyEvent',{type:'keyDown',...p,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await call('Input.dispatchKeyEvent',{type:'keyUp',...p});await delay(30);
};
const screenshot=async name=>{
 if(!process.env.A11Y_SCREENSHOT_DIR)return;
 const dir=resolve(process.env.A11Y_SCREENSHOT_DIR);mkdirSync(dir,{recursive:true});
 const r=await call('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(dir,name+'.png'),Buffer.from(r.data,'base64'));
};

// Checks direct text against solid ancestor backgrounds, not text inside images,
// gradients, OS forced-colors, or the actual experience of assistive technology.
const probe=()=>{
 const rgba=s=>(s.match(/[\d.]+/g)||[]).map(Number);
 const blend=(f,b)=>{const a=f[3]??1;return [0,1,2].map(i=>f[i]*a+b[i]*(1-a)).concat(1);};
 const background=e=>e?blend(rgba(getComputedStyle(e).backgroundColor),background(e.parentElement)):[17,20,18,1];
 const luminance=c=>{const a=c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
 const describe=e=>`${e.tagName}.${e.className}: ${e.textContent.trim().slice(0,65)}`;
 const visible=e=>{const s=getComputedStyle(e);return e.getClientRects().length&&s.visibility!=='hidden'&&s.display!=='none';};
 const elements=[...document.querySelectorAll('body *')].filter(visible),contrast=[];
 for(const e of elements.filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))){
  const s=getComputedStyle(e),bg=background(e),fg=blend(rgba(s.color),bg),a=luminance(bg),b=luminance(fg);
  const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700);
  if(ratio+.01<(large?3:4.5))contrast.push({element:describe(e),ratio});
 }
 const overflow=elements.filter(e=>{const r=e.getBoundingClientRect();return !e.closest('.skip')&&r.width&&(r.right>innerWidth+1||r.left< -1);}).map(describe);
 const unnamed=elements.filter(e=>['A','BUTTON','SUMMARY'].includes(e.tagName)&&!e.textContent.trim()&&!e.getAttribute('aria-label')&&!e.querySelector('img[alt]')).map(describe);
 // Element rectangles alone miss unwrapped anonymous text nodes in flex/grid.
 const clippedText=[];
 for(const e of elements){
  if(e.closest('.skip'))continue;
  for(const n of e.childNodes)if(n.nodeType===3&&n.textContent.trim()){
   const range=document.createRange();range.selectNodeContents(n);
   if([...range.getClientRects()].some(r=>r.right>innerWidth+1||r.left< -1))clippedText.push(describe(e));
  }
 }
 // Both frame separators span the page; their contents retain their inset.
 const frameLines=[];
 for(const [selector,border] of [['.header','borderBottomWidth'],['.footer','borderTopWidth']]){
  const e=document.querySelector(selector),r=e.getBoundingClientRect();
  if(Math.abs(r.x)>.5||Math.abs(r.width-document.documentElement.clientWidth)>.5||parseFloat(getComputedStyle(e)[border])!==1)frameLines.push(`${selector}: separator must span the full page width`);
 }
 return {contrast,overflow,clippedText,unnamed,frameLines};
};
const modes=[
 {width:1440},{width:768},{width:390},{width:320},
 {width:768,font:32},{width:320,font:32},
 {width:768,spacing:true},{width:320,spacing:true}
];
let combinations=0;
try{
 await call('Page.enable');await call('Page.bringToFront');await call('Emulation.setFocusEmulationEnabled',{enabled:true});
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const mode of modes){
  await size(mode.width);
  // All generated pages at root; representative templates under project prefix.
  const paths=[...pages,...['index.html','press.html','estratto-l-immagine-della-bestia.html','le-ombre-si-rivelano.html','leggi-le-ombre-si-rivelano.html'].map(p=>'giordanosognatore/'+p)];
  for(const path of paths){
   await navigate(path);
   if(mode.font)await evaluate(`document.documentElement.style.fontSize='${mode.font}px'`);
   if(mode.spacing)await evaluate(`(()=>{const s=document.createElement('style');s.textContent='*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';document.head.append(s);})()`);
   const report=await evaluate(`(${probe.toString()})()`);
   for(const [check,issues] of Object.entries(report))assert.deepEqual(issues,[],`${path} ${JSON.stringify(mode)} ${check}: ${JSON.stringify(issues.slice(0,5))}`);
   if(path.endsWith('index.html')){
    const separated=await evaluate(`(()=>{const group=document.querySelector('[aria-label="Scopri e leggi Le Ombre Si Rivelano"]'),links=[...group.querySelectorAll('a')];if(links.length!==2||links.some(a=>!a.classList.contains('button')))return false;const [a,b]=links.map(e=>e.getBoundingClientRect());return b.left-a.right>=7||b.top-a.bottom>=7;})()`);
    assert.ok(separated,`Ombre catalog buttons must have a visible gap: ${path} ${JSON.stringify(mode)}`);
   }
   if(path==='index.html'&&[390,1440].includes(mode.width)&&!mode.spacing)await screenshot(`home-${mode.width}-${mode.font||16}`);
   combinations++;
  }
  console.log(`PASS layout/solid-background contrast: ${JSON.stringify(mode)}`);
 }
 for(const width of [1440,390])for(const page of ['estratto-l-immagine-della-bestia.html','leggi-le-ombre-si-rivelano.html']){
  await size(width);await navigate(page);
  const cover=await evaluate(`(()=>{const figure=document.querySelector('.reading-cover'),img=figure.querySelector('img'),r=figure.getBoundingClientRect(),h=figure.closest('header').getBoundingClientRect(),buttons=document.querySelector('.excerpt-header .download-actions').getBoundingClientRect(),toc=document.querySelector('.excerpt-toc').getBoundingClientRect();return {loaded:img.complete&&img.naturalWidth>0,width:r.width,expectedWidth:Math.min(320,h.width),centerError:Math.abs(r.left+r.width/2-h.left-h.width/2),gap:r.top-buttons.bottom,beforeIndex:r.bottom<=toc.top,aspectError:Math.abs(img.getBoundingClientRect().height-r.width*Number(img.getAttribute('height'))/Number(img.getAttribute('width')))};})()`);
  assert.ok(cover.loaded&&Math.abs(cover.width-cover.expectedWidth)<1&&cover.centerError<1&&cover.gap>=39&&cover.beforeIndex&&cover.aspectError<1,`${page} ${width}: inconsistent reading cover ${JSON.stringify(cover)}`);
 }
 console.log('PASS shared flat reading covers: loaded, centered, responsive, uncropped, after actions and before index');
 for(const width of [390,1440])for(const page of ['index.html','press.html','estratto-l-immagine-della-bestia.html','leggi-le-ombre-si-rivelano.html']){
  await size(width);await navigate(page);await key('Tab');
  assert.equal(await evaluate('document.activeElement.className'),'skip');
  assert.ok(await evaluate('document.activeElement.matches(":focus-visible")&&document.activeElement.getBoundingClientRect().top>=0'));
  await key('Enter');assert.equal(await evaluate('document.activeElement.id'),'contenuto');
  await key('Tab');assert.ok(await evaluate('document.querySelector("main").contains(document.activeElement)'));
  const tree=(await call('Accessibility.getFullAXTree')).nodes.filter(n=>!n.ignored);
  assert.equal(tree.filter(n=>n.role?.value==='main').length,1);
  assert.equal(tree.filter(n=>n.role?.value==='heading'&&n.properties?.some(p=>p.name==='level'&&p.value.value===1)).length,1);
  for(const node of tree.filter(n=>['button','link','DisclosureTriangle','heading'].includes(n.role?.value)))assert.ok(node.name?.value,`${page}: unnamed ${node.role.value}`);
  if(page==='index.html')assert.ok(tree.some(n=>n.role?.value==='group'&&n.name?.value==='Formati e accesso a L’Immagine della Bestia'));
 }
 await size(390);await navigate('index.html');await key('Tab');await key('Tab');await key('Tab');
 assert.equal(await evaluate('document.activeElement.className'),'nav-toggle');
 await key('Enter');assert.equal(await evaluate('document.activeElement.getAttribute("aria-expanded")'),'true');
 for(const label of ['Home','Romanzi','Taccuino','Press','L’autore']){
  await key('Tab');assert.equal(await evaluate('document.activeElement.textContent'),label);
 }
 await key('Escape');assert.equal(await evaluate('document.activeElement.className'),'nav-toggle');
 assert.equal(await evaluate('document.activeElement.getAttribute("aria-expanded")'),'false');
 await key('Tab');assert.ok(await evaluate('!document.activeElement.closest("#primary-navigation")'));
 await evaluate('document.querySelector("summary").focus()');
 assert.ok(await evaluate('document.activeElement.matches(":focus-visible")&&getComputedStyle(document.activeElement).outlineStyle==="solid"'));
 await key('Enter');assert.ok(await evaluate('document.querySelector("details").open'));
 await key('Tab');assert.equal(await evaluate('document.activeElement.textContent'),'Acquista su Amazon');
 await key('Tab');assert.equal(await evaluate('document.activeElement.textContent'),'Google Play Books');
 await key('Tab',true);await key('Tab',true);assert.equal(await evaluate('document.activeElement.tagName'),'SUMMARY');
 await key('Enter');assert.ok(await evaluate('!document.querySelector("details").open'));
 await screenshot('ebook-keyboard-focus-390');
 // Leaving the non-modal menu must not hide a breadcrumb behind its overlay.
 await navigate('l-immagine-della-bestia.html');await key('Tab');await key('Tab');await key('Tab');await key('Enter');
 for(let i=0;i<6;i++)await key('Tab');
 assert.equal(await evaluate('document.activeElement.className'),'breadcrumb');
 assert.equal(await evaluate('document.querySelector(".nav-toggle").getAttribute("aria-expanded")'),'false');
 assert.ok(await evaluate('(()=>{const e=document.activeElement,r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+10,r.y+r.height/2))})()'),'Menu covers the link focused after leaving navigation');
 console.log('PASS keyboard skip, main focus, menu/escape/focus exit, native ebook details, accessible names and landmarks');
 for(const mode of [{width:390},{width:320,font:32},{width:768,font:32}]){
  await size(mode.width);await navigate('estratto-l-immagine-della-bestia.html');
  if(mode.font)await evaluate(`document.documentElement.style.fontSize='${mode.font}px'`);
  for(const id of ['prologo','capitolo-01','capitolo-06','fine-estratto']){
   await evaluate(`document.querySelector('a[href="#${id}"]').click()`);await delay(50);
   const r=await evaluate(`(()=>{const h=document.getElementById('${id}').querySelector('h2'),bar=document.querySelector('.excerpt-tools');return {heading:h.getBoundingClientRect().top,barBottom:bar.getBoundingClientRect().bottom}})()`);
   assert.ok(r.barBottom>0&&r.heading>=r.barBottom&&r.heading<1000,JSON.stringify(r));
   if(id==='prologo'&&!mode.font)await screenshot('excerpt-keyboard-390');
  }
  await evaluate('document.querySelector("#capitolo-01 .excerpt-chapter-nav a").focus();document.activeElement.scrollIntoView({block:"start"})');
  const focus=await evaluate('({top:document.activeElement.getBoundingClientRect().top,bar:document.querySelector(".excerpt-tools").getBoundingClientRect().bottom})');
  assert.ok(focus.top>=focus.bar,'Focused chapter link is hidden by reading toolbar');
 }
 console.log('PASS long excerpt anchors/focus clear of sticky tools, including 200% text');
 for(const mode of [{width:390},{width:320,font:32},{width:768,font:32}]){
  await size(mode.width);await navigate('leggi-le-ombre-si-rivelano.html');
  if(mode.font)await evaluate(`document.documentElement.style.fontSize='${mode.font}px'`);
  for(const id of ['prologo','capitolo-1','capitolo-18','riflessioni-finali','fine-romanzo']){
   await evaluate(`document.querySelector('a[href="#${id}"]').click()`);await delay(50);
   const r=await evaluate(`(()=>{const h=document.getElementById('${id}').querySelector('h2'),bar=document.querySelector('.excerpt-tools');return {heading:h.getBoundingClientRect().top,barBottom:bar.getBoundingClientRect().bottom}})()`);
   assert.ok(r.barBottom>0&&r.heading>=r.barBottom&&r.heading<1000,JSON.stringify(r));
  }
 }
 console.log('PASS complete Ombre reader anchors clear of sticky tools, including 200% text');
 await size(390);await call('Emulation.setEmulatedMedia',{features:[{name:'forced-colors',value:'active'},{name:'prefers-reduced-motion',value:'reduce'}]});await navigate('autore.html');
 assert.deepEqual((await evaluate(`(${probe.toString()})()`)).frameLines,[],'Forced colors must retain full-width separators');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 console.log('PASS full-width header/footer separators, including forced-colors emulation');
 await size(390);await call('Emulation.setScriptExecutionDisabled',{value:true});await navigate('estratto-l-immagine-della-bestia.html');
 assert.equal(await evaluate('document.querySelectorAll(".excerpt-text p").length'),3753);
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".header nav")).display'),'flex');
 await key('Tab');await key('Enter');assert.equal(await evaluate('document.activeElement.id'),'contenuto');
 await navigate('leggi-le-ombre-si-rivelano.html');
 assert.equal(await evaluate('document.querySelectorAll(".excerpt-section").length'),26);
 assert.equal(await evaluate('document.querySelectorAll(".excerpt-text p").length'),253);
 await evaluate('document.querySelector(\'a[href="#capitolo-18"]\').click()');
 assert.equal(await evaluate('location.hash'),'#capitolo-18');
 console.log(`PASS: ${combinations} page/layout combinations; no-JavaScript reading and skip navigation. Not a WCAG certification.`);
}finally{
 try{await call('Page.close');}finally{ws.close();for(const p of pending.values()){clearTimeout(p.timer);p.fail(new Error('Browser check closed'));}pending.clear();}
}

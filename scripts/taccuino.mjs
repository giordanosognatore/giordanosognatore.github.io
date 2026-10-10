import {readFileSync,readdirSync,existsSync} from 'node:fs';
export const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export const categoryLabels={'taccuino':'Dal taccuino','comunicati-stampa':'Comunicati stampa'};
const compare=(a,b)=>a<b?-1:a>b?1:0;
const scalar=value=>{
 const text=value.trim();
 if(text.startsWith('"'))return JSON.parse(text);
 if(text.startsWith("'")){if(!text.endsWith("'"))throw new Error('Stringa non chiusa');return text.slice(1,-1).replaceAll("''", "'");}
 return text;
};
export function parseArticle(source,filename){
 const match=source.replaceAll('\r\n','\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
 if(!match)throw new Error(`${filename}: front matter mancante`);
 const meta={};let inTags=false;
 for(const line of match[1].split('\n')){
  if(!line.trim())continue;
  if(inTags&&/^  - .+/.test(line)){meta.tags.push(scalar(line.slice(4)));continue;}
  const field=line.match(/^(title|date|description|category|tags|slug|showOnHome):(?: (.*))?$/);
  if(!field)throw new Error(`${filename}: campo o sintassi non supportati: ${line}`);
  const [,key,value='']=field;
  if(Object.hasOwn(meta,key))throw new Error(`${filename}: campo duplicato ${key}`);
  inTags=key==='tags';
  if(inTags){if(value&&value!=='[]')throw new Error(`${filename}: tags richiede un elenco su righe separate`);meta.tags=[];}
  else if(key==='showOnHome'){if(!/^(true|false)$/.test(value))throw new Error(`${filename}: showOnHome deve essere true/false`);meta[key]=value==='true';}
  else meta[key]=scalar(value);
 }
 for(const key of ['title','date','description','category'])if(typeof meta[key]!=='string'||!meta[key].trim())throw new Error(`${filename}: ${key} obbligatorio`);
 if(!Object.hasOwn(categoryLabels,meta.category))throw new Error(`${filename}: categoria non valida`);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)||!Number.isFinite(Date.parse(meta.date))||new Date(meta.date).toISOString().slice(0,10)!==meta.date)throw new Error(`${filename}: data non valida`);
 if(!Array.isArray(meta.tags)||meta.tags.some(t=>typeof t!=='string'||!t.trim()))throw new Error(`${filename}: tags obbligatori (anche [])`);
 meta.slug??=filename.replace(/\.md$/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug))throw new Error(`${filename}: slug non valido`);
 meta.showOnHome??=meta.category==='taccuino';
 let body=match[2].trim();
 // A matching source H1 is represented by the page's single H1.
 if(body.startsWith('# ')){
  const end=body.indexOf('\n');const heading=end<0?body.slice(2):body.slice(2,end);
  if(heading!==meta.title)throw new Error(`${filename}: H1 diverso dal titolo`);
  body=end<0?'':body.slice(end).trim();
 }
 if(!body)throw new Error(`${filename}: articolo vuoto`);
 return {...meta,body,route:`taccuino/${meta.slug}.html`};
}
export function loadArticles(directory=new URL('../contenuti/taccuino/',import.meta.url)){
 if(!existsSync(directory))return [];
 const articles=readdirSync(directory).filter(f=>f.endsWith('.md')).sort().map(f=>parseArticle(readFileSync(new URL(f,directory),'utf8'),f));
 if(new Set(articles.map(a=>a.slug)).size!==articles.length)throw new Error('Slug duplicato nel Taccuino');
 return articles.sort((a,b)=>compare(b.date,a.date)||compare(a.slug,b.slug));
}
function safeLink(url,prefix){
 if(/^(https?:\/\/|mailto:)/i.test(url))return escapeHtml(url);
 if(/^[a-z0-9][a-z0-9._/-]*(?:#[a-z0-9_-]+)?$/i.test(url)&&!url.split('/').includes('..'))return escapeHtml(prefix+url);
 if(/^#[a-z0-9_-]+$/i.test(url))return escapeHtml(url);
 throw new Error(`Link Markdown non supportato: ${url}`);
}
export function inlineMarkdown(text,prefix='../',allowLinks=true){
 function parse(start,closing=''){
  let html='';let i=start;
  while(i<text.length){
   if(closing&&text.startsWith(closing,i))return {html,end:i+closing.length,closed:true};
   const rest=text.slice(i);
   const link=allowLinks&&rest.match(/^\[([^\]\n]+)\]\(([^\s)]+)\)/);
   if(link){html+=`<a href="${safeLink(link[2],prefix)}">${inlineMarkdown(link[1],prefix,false)}</a>`;i+=link[0].length;continue;}
   const marker=rest.startsWith('**')?'**':rest.startsWith('*')?'*':null;
   if(marker){
    const inner=parse(i+marker.length,marker);
    if(inner.closed&&inner.html){const tag=marker==='**'?'strong':'em';html+=`<${tag}>${inner.html}</${tag}>`;i=inner.end;continue;}
    html+=marker;i+=marker.length;continue;
   }
   html+=escapeHtml(text[i++]);
  }
  return {html,end:i,closed:false};
 }
 return parse(0).html;
}
export function renderMarkdown(body,prefix='../'){
 const lines=body.split('\n');let html=[];
 const special=line=>/^(#{1,6} |[-*] |>|---\s*$)/.test(line);
 for(let i=0;i<lines.length;){
  const line=lines[i];if(!line.trim()){i++;continue;}
  const heading=line.match(/^(##|###) (.+)$/);
  if(heading){html.push(`<h${heading[1].length}>${inlineMarkdown(heading[2],prefix)}</h${heading[1].length}>`);i++;continue;}
  if(/^#{1,6} /.test(line))throw new Error('Sono supportati solo titoli ## e ### nel corpo');
  if(/^---\s*$/.test(line)){html.push('<hr>');i++;continue;}
  if(/^[-*] /.test(line)){let items=[];while(i<lines.length&&/^[-*] /.test(lines[i]))items.push(`<li>${inlineMarkdown(lines[i++].slice(2),prefix)}</li>`);html.push(`<ul>${items.join('')}</ul>`);continue;}
  if(/^>/.test(line)){let quote=[];while(i<lines.length&&/^>/.test(lines[i]))quote.push(lines[i++].replace(/^> ?/,''));html.push(`<blockquote>${renderMarkdown(quote.join('\n'),prefix)}</blockquote>`);continue;}
  let paragraph=[line];i++;while(i<lines.length&&lines[i].trim()&&!special(lines[i]))paragraph.push(lines[i++]);
  html.push(`<p>${inlineMarkdown(paragraph.join(' '),prefix)}</p>`);
 }
 return html.join('\n');
}
export const dateLabel=date=>{const [y,m,d]=date.split('-');return `${Number(d)} ${['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'][Number(m)-1]} ${y}`;};
export const articleMeta=a=>`<p class="entry-meta"><time datetime="${a.date}">${dateLabel(a.date)}</time><span>${categoryLabels[a.category]}</span></p>`;
export const articleTags=a=>a.tags.length?`<ul class="entry-tags" aria-label="Tag">${a.tags.map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ul>`:'';
export const articleList=(articles,level=2)=>`<div class="entry-list">${articles.map(a=>`<article class="entry-card">${articleMeta(a)}<h${level}><a href="${a.route}">${escapeHtml(a.title)}</a></h${level}><p>${escapeHtml(a.description)}</p>${articleTags(a)}</article>`).join('')}</div>`;
export const articleSection=(articles,{title='Dal taccuino di Giordano',archive='taccuino.html',label='Tutti gli appunti'}={})=>articles.length?`<section class="journal-strip shell"><h2>${title}</h2>${articleList(articles.slice(0,3),3)}<a class="text-link" href="${archive}">${label}</a></section>`:'';
export function rss(articles,origin){
 const esc=escapeHtml;
 return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Dal taccuino di Giordano</title><link>${esc(origin+'/taccuino.html')}</link><description>Appunti, incontri e retroscena dai libri di Giordano Sognatore.</description><language>it</language><atom:link href="${esc(origin+'/feed.xml')}" rel="self" type="application/rss+xml"/>${articles.map(a=>`<item><title>${esc(a.title)}</title><link>${esc(origin+'/'+a.route)}</link><guid isPermaLink="true">${esc(origin+'/'+a.route)}</guid><pubDate>${new Date(a.date+'T00:00:00Z').toUTCString()}</pubDate><description>${esc(a.description)}</description><category>${esc(categoryLabels[a.category])}</category>${a.tags.map(t=>`<category>${esc(t)}</category>`).join('')}</item>`).join('')}</channel></rss>\n`;
}

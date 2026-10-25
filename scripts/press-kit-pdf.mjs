import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const out=resolve(dirname(fileURLToPath(import.meta.url)),'../dist/downloads/press-kit-l-immagine-della-bestia.pdf');
const W=595.28,H=841.89;
const C={navy:[.046,.09,.145],mid:[.07,.17,.25],gold:[.69,.52,.31],ink:[.12,.17,.22],muted:[.36,.42,.48],paper:[.985,.979,.964],white:[1,1,1]};
const urls={book:'https://giordanosognatore.github.io/l-immagine-della-bestia.html',sample:'https://giordanosognatore.github.io/l-immagine-della-bestia.html#estratto-gratuito',diary:'https://giordanosognatore.github.io/il-giorno-in-cui-nacque-la-bestia.html',article:'https://giordanosognatore.github.io/taccuino/la-firma-resta-umana-e-ada-vesper.html',audio:'https://play.google.com/books/listen?id=AQAAAEBG5iumfM',press:'https://giordanosognatore.github.io/press.html',email:'mailto:giordano.sognatore@gmail.com'};
const pages=[];let ops=[],links=[];
const col=k=>`${C[k].map(v=>Number(v).toFixed(3)).join(' ')} rg`;
const scol=k=>`${C[k].map(v=>Number(v).toFixed(3)).join(' ')} RG`;
const rect=(x,y,w,h,color)=>ops.push(`${col(color)} ${x} ${y} ${w} ${h} re f`);
const line=(x,y,w,color='gold')=>ops.push(`${scol(color)} 0.6 w ${x} ${y} m ${x+w} ${y} l S`);
const map={'’':146,'‘':145,'“':147,'”':148,'—':151,'–':150,'…':133,'€':128};
function win(s){let out='';for(const c of String(s)){let n=c.charCodeAt(0);if(map[c])n=map[c];if(n>255)n=63;out+=String.fromCharCode(n);}return out;}
function pdfEscape(s){return win(s).replaceAll('\\','\\\\').replaceAll('(','\\(').replaceAll(')','\\)');}
function text(s,x,y,size=10,font='F1',color='ink'){
 ops.push(`BT ${col(color)} /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfEscape(s)}) Tj ET`);
}
function words(s,x,y,width,size=10,lead=15,font='F1',color='ink'){
 const chunks=String(s).split(/\s+/);let ln='',curr=y;
 const max=Math.floor(width/(size*(font==='F3'?.46:.51)));
 for(const word of chunks){let proposal=ln?ln+' '+word:word;if(proposal.length>max&&ln){text(ln,x,curr,size,font,color);curr-=lead;ln=word;}else ln=proposal;}
 if(ln){text(ln,x,curr,size,font,color);curr-=lead;}return curr;
}
function label(s,x,y){text(s.toUpperCase(),x,y,8.4,'F2','gold');}
function hyperlink(s,url,x,y,size=9.4,color='mid'){
 text(s,x,y,size,'F2',color);let width=Math.min(s.length*size*.55,440);
 ops.push(`${scol('gold')} .6 w ${x} ${y-3} m ${x+width} ${y-3} l S`);
 links.push({uri:url,rect:[x,y-5,x+width,y+12]});
}
function footer(p){line(44,46,W-88,'muted');text('GIORDANO SOGNATORE  /  PRESS KIT  -  OTTOBRE 2026',44,29,7.3,'F1','muted');text(`${p} / 2`,526,29,7.5,'F1','muted')}
function end(){pages.push({ops:ops.join('\n')+'\n',links});ops=[];links=[];}
// Pagina 1: scheda del romanzo e letture di ingresso.
rect(0,0,W,H,'paper');rect(0,0,218,H,'navy');rect(218,0,3,H,'gold');
label('SCHEDA EDITORIALE',34,763);
rect(34,439,150,287,'mid');rect(38,443,142,279,'navy');
text('L’IMMAGINE',43,665,17.2,'F3','white');text('DELLA',43,635,17.2,'F3','white');text('BESTIA',43,603,29,'F3','gold');
line(42,584,130,'gold');words('IL FUTURO HA UN VOLTO.',43,566,123,11,15,'F2','white');
label('AUTORE',34,414);text('Giordano Sognatore',34,394,10.5,'F2','white');text('con Ada Vesper',34,378,10,'F1','white');
line(34,355,148,'muted');label('GENERE',34,337);text('Thriller geopolitico',34,316,10,'F1','white');text('fantascientifico',34,301,10,'F1','white');
line(34,282,148,'muted');label('FORMATI',34,265);text('Cartaceo · ebook',34,245,10,'F1','white');text('Audiolibro',34,229,10,'F1','white');text('822 pagine (cartaceo)',34,207,9,'F1','white');
line(34,189,148,'muted');label('CONTENUTI GRATUITI',34,171);
hyperlink('Pagina del libro',urls.book,34,149,9.2,'white');hyperlink('Estratto iniziale',urls.sample,34,126,9.2,'white');
const x=250,rw=298;text('L’IMMAGINE',x,759,31,'F3');text('DELLA BESTIA',x,720,31,'F3');line(x,700,rw);
text('IL FUTURO HA UN VOLTO.',x,676,11.4,'F2','gold');
let y=644;y=words('Gerusalemme, 2030. Dopo anni di guerra, divisioni e paura, SOPHIA, una intelligenza artificiale capace di mettere in relazione ciò che gli uomini vedono soltanto in parte, sembra riuscire dove governi e religioni hanno fallito: trovare una strada verso la pace.',x,y,rw,10.1,15.8,'F1');y-=16;
y=words('In un mondo pronto ad affidarsi a chi sa prevenire il disastro, padre Marco Rinaldi affronta una domanda che nessun sistema può risolvere al suo posto: dove finisce la fiducia e dove comincia la rinuncia al proprio giudizio?',x,y,rw,10.1,15.8);y-=28;
label('TEMI',x,y);y-=12;line(x,y,rw,'muted');y-=25;
for(const [n,s] of [['01','Intelligenza artificiale e autorità'],['02','Pace, potere e libertà'],['03','Fede, discernimento e responsabilità']]){text(n,x,y,9.7,'F2','gold');text(s,x+27,y,9.7);y-=27;}
y-=9;line(x,y,rw,'muted');y-=26;label('MATERIALI PER LA LETTURA',x,y);y-=25;hyperlink('Estratto gratuito: prologo e Atto I',urls.sample,x,y);y-=25;hyperlink('Formati e disponibilità del romanzo',urls.book,x,y);y-=26;
words('La versione audio è fruibile. Il perfezionamento editoriale è ancora in corso.',x,y,rw,8.9,12.5,'F1','muted');footer(1);end();
// Pagina 2: autore, metodo e contatti.
rect(0,0,W,H,'paper');rect(0,H-174,W,174,'navy');label('L’AUTORE  /  IL METODO',44,786);text('Giordano Sognatore',44,735,27,'F3','white');words('Narrativa distopica e speculativa. Tecnologia, potere, libertà, fede e responsabilità personale: grandi trasformazioni raccontate attraverso scelte umane.',44,699,492,10.5,15.2,'F1','white');line(44,668,W-88);
let yl=625;const lx=44,leftW=236;label('BIO BREVE',lx,yl);yl-=15;line(lx,yl,leftW,'muted');yl-=25;
yl=words('Giordano Sognatore è autore di narrativa distopica e speculativa. Dopo l’esordio con Le Ombre Si Rivelano, ha pubblicato L’Immagine della Bestia, thriller geopolitico fantascientifico sul rapporto tra intelligenza artificiale, potere e responsabilità. Pubblica sotto pseudonimo.',lx,yl,leftW,9.8,14.7);yl-=24;label('ADA VESPER',lx,yl);yl-=14;line(lx,yl,leftW,'muted');yl-=25;
yl=words('Ada Vesper è la voce letteraria della componente di IA nella collaborazione creativa. Confronto su progettazione, dialoghi, revisioni, critica e verifica delle scelte. La responsabilità autoriale finale resta umana.',lx,yl,leftW,9.8,14.7);yl-=19;hyperlink('Diario gratuito di Ada Vesper',urls.diary,lx,yl,8.7);yl-=24;hyperlink('La firma resta umana. E Ada Vesper?',urls.article,lx,yl,8.3);
let yr=625;const rx=318,rightW=232;label('PER STAMPA E PODCAST',rx,yr);yr-=15;line(rx,yr,rightW,'muted');yr-=27;
for(const [h,d] of [['IA e autorialità','Scrivere con l’IA senza delegarle il giudizio.'],['Potere e fiducia','Quando uno strumento diventa una autorità?'],['Fede e tecnologia','Quale spazio resta al discernimento?']]){text(h,rx,yr,9.8,'F2');yr-=19;yr=words(d,rx,yr,rightW,9.1,13.1,'F1','muted')-11;}
yr-=14;label('RISORSE',rx,yr);yr-=15;line(rx,yr,rightW,'muted');yr-=26;
hyperlink('Copertina e pagina del romanzo',urls.book,rx,yr,8.9);yr-=24;hyperlink('Estratto gratuito EPUB / PDF',urls.sample,rx,yr,8.9);yr-=24;hyperlink('Anteprima audio (30 minuti)',urls.audio,rx,yr,8.9);yr-=24;hyperlink('Pagina Press e media',urls.press,rx,yr,8.9);yr-=28;words('Review copy EPUB/PDF integrale su richiesta. Nessun obbligo di lettura o recensione.',rx,yr,rightW,9.1,13.8,'F1','muted');
line(44,131,W-88);label('CONTATTI MEDIA',44,110);hyperlink('giordano.sognatore@gmail.com',urls.email,44,89,10.4);text('Interviste scritte o audio · identità pubblica: pseudonimo',44,67,8.8,'F1','muted');footer(2);end();
const toLatinBytes=s=>Buffer.from(s,'binary');
let objects=[''];const add=s=>{objects.push(s);return objects.length-1};
const f1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
const f2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
const f3=add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>');
const pageNodes=[];
for(const p of pages){const bytes=toLatinBytes(p.ops);const cont=add(`<< /Length ${bytes.length} >>\nstream\n${p.ops}endstream`);const anns=p.links.map(({uri,rect})=>add(`<< /Type /Annot /Subtype /Link /Rect [${rect.join(' ')}] /Border [0 0 0] /A << /S /URI /URI (${pdfEscape(uri)}) >> >>`));const pg=add(`PLACEHOLDER_PAGE_${cont}_${anns.join('_')}`);pageNodes.push({pg,cont,anns});}
const parents=add(`<< /Type /Pages /Kids [${pageNodes.map(o=>o.pg+' 0 R').join(' ')}] /Count ${pageNodes.length} >>`);
for(const p of pageNodes){objects[p.pg]=`<< /Type /Page /Parent ${parents} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R >> >> /Contents ${p.cont} 0 R /Annots [${p.anns.map(n=>n+' 0 R').join(' ')}] >>`;}
const catalog=add(`<< /Type /Catalog /Pages ${parents} 0 R >>`);
let buffers=[Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n','binary')],offsets=[0],length=buffers[0].length;
for(let i=1;i<objects.length;i++){offsets.push(length);const b=Buffer.concat([Buffer.from(`${i} 0 obj\n`,'ascii'),toLatinBytes(objects[i]),Buffer.from('\nendobj\n','ascii')]);buffers.push(b);length+=b.length;}
const pos=length;let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)xref+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';xref+=`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${pos}\n%%EOF\n`;
buffers.push(Buffer.from(xref,'ascii'));const pdf=Buffer.concat(buffers);mkdirSync(dirname(out),{recursive:true});writeFileSync(out,pdf);console.log(`Created ${out} (${pdf.length} bytes; ${pages.length} pages)`);

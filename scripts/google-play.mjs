import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(new URL('../dist/',import.meta.url).pathname);
const amazon='https://amzn.eu/d/023g6Qe1';
const googlePlay='https://play.google.com/store/books/details?id=jpgZEgAAQBAJ';
const amazonButton=`<a class="button" href="${amazon}">Acquista su Amazon</a>`;
const googlePlayButton=`<a class="button" href="${googlePlay}">Google Play Books</a>`;

for(const file of readdirSync(root).filter(name=>name.endsWith('.html'))){
 const path=resolve(root,file);
 let html=readFileSync(path,'utf8');
 html=html.replaceAll(amazonButton,amazonButton+googlePlayButton);
 writeFileSync(path,html);
}

const pressPath=resolve(root,'press.html');
let press=readFileSync(pressPath,'utf8');
press=press.replace(`<a class="button" href="${amazon}">Amazon</a>`,`<a class="button" href="${amazon}">Amazon</a>${googlePlayButton}`);
writeFileSync(pressPath,press);

const themesPath=resolve(root,'temi.html');
let themes=readFileSync(themesPath,'utf8');
themes=themes.replace('<a class="button" href="press.html">Press & media</a>','<a class="text-link" href="press.html">Torna a Press & media</a>');
writeFileSync(themesPath,themes);

console.log('Added Google Play Books CTAs and aligned temi.html Press link.');

import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {estrattoAssets,sourceCommit,verifyEstratto} from './estratto-assets.mjs';

// Reads only the two approved assets; never changes the source checkout.
const source=resolve(process.argv[2]||'../bestia');
const root=new URL('../dist/',import.meta.url);
// Validate the complete pair before writing either destination.
const assets=estrattoAssets.map(asset=>{
 const bytes=readFileSync(resolve(source,asset.source));
 verifyEstratto(bytes,asset);
 return {asset,bytes};
});
mkdirSync(new URL('downloads/',root),{recursive:true});
for(const {asset,bytes} of assets){
 const destination=new URL(asset.publicPath,root);
 writeFileSync(destination,bytes);
 const published=readFileSync(destination);
 verifyEstratto(published,asset);
 assert.ok(published.equals(bytes),`${asset.format}: copia non identica`);
 console.log(`${asset.format}: ${asset.size} byte, SHA-256 ${asset.sha256}`);
}
console.log(`Estratto importato senza trasformazioni. Fonte approvata: bestia@${sourceCommit}`);

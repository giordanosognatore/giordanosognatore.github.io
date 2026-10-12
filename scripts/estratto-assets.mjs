import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Approved, immutable source: giordanosognatore/bestia at this commit.
export const sourceCommit='68f7bbb3142f5f0e4dabd0b8d7afb4e6b6b9646a';
export const estrattoAssets=[
 {format:'EPUB',source:'produzione/prove/Bestia_Atto_I_Estratto_gratuito_1.6.7.epub',publicPath:'downloads/l-immagine-della-bestia-atto-i-estratto-gratuito.epub',size:2607867,gitBlob:'7e0467b854f25be744e05e53436dfac8655af053',sha256:'83156d741bf781f704a1787037c731c052cd8625c960a70eacd539461d73c5b9'},
 {format:'PDF',source:'produzione/prove/Bestia_Atto_I_Estratto_gratuito_1.6.7.pdf',publicPath:'downloads/l-immagine-della-bestia-atto-i-estratto-gratuito.pdf',size:11614035,gitBlob:'b11629e46c9f9562cb53628d386042e90b3ac3d4',sha256:'c88825f6cdf4cffef83dc9ab82cc432aaf9f28f66ec1aa56fa28a440eb6be6c4'}
];

export function verifyEstratto(bytes,asset){
 assert.equal(bytes.length,asset.size,`${asset.format}: dimensione inattesa`);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,`${asset.format}: SHA-256 inatteso`);
 assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),asset.gitBlob,`${asset.format}: SHA Git inatteso`);
}

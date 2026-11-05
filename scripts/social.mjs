import {escapeHtml} from './taccuino.mjs';

export const socialCards = Object.freeze({
 site: {path:'assets/social-sito.jpg', alt:'Giordano Sognatore — romanzi, tecnologia, potere e libertà'},
 bestia: {path:'assets/social-bestia.jpg', alt:'L’Immagine della Bestia — Giordano Sognatore con Ada Vesper, con la copertina del romanzo'},
 ombre: {path:'assets/social-ombre.jpg', alt:'Le Ombre Si Rivelano — Giordano Sognatore, con la copertina del romanzo'}
});

export function socialMetadata(origin, file) {
 const key=['l-immagine-della-bestia.html','estratto-l-immagine-della-bestia.html'].includes(file)?'bestia':['le-ombre-si-rivelano.html','leggi-le-ombre-si-rivelano.html'].includes(file)?'ombre':'site';
 const card=socialCards[key];
 const url=escapeHtml(`${origin}/${card.path}`);
 const alt=escapeHtml(card.alt);
 return `<meta property="og:image" content="${url}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${alt}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${url}"><meta name="twitter:image:alt" content="${alt}">`;
}

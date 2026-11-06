// Canonical public destinations and labels, shared by Home, book and Press.
export const bestiaFormats = Object.freeze({
 amazon: 'https://amzn.eu/d/023g6Qe1',
 ebook: 'https://play.google.com/store/books/details?id=jpgZEgAAQBAJ',
 audiobook: 'https://play.google.com/store/audiobooks/details?id=AQAAAEBG5iumfM',
 audiobookLabel: 'Audiolibro gratuito'
});

export const formatActions = (sampleHref,{companionHref}={}) => `<div class="format-actions" role="group" aria-label="Formati e accesso a L’Immagine della Bestia"><details class="format-menu"><summary class="button">Ebook <span aria-hidden="true">⌄</span></summary><div class="format-menu-panel" role="group" aria-label="Dove acquistare l’ebook"><a class="button" href="${bestiaFormats.amazon}">Acquista su Amazon</a><a class="button" href="${bestiaFormats.ebook}">Google Play Books</a></div></details><a class="button" href="${bestiaFormats.amazon}" aria-label="Acquista il cartaceo di L’Immagine della Bestia su Amazon">Cartaceo</a><a class="button" href="${bestiaFormats.audiobook}">${bestiaFormats.audiobookLabel}</a><a class="button" href="${sampleHref}">Estratto gratuito</a>${companionHref?`<a class="button" href="${companionHref}">Companion gratuito</a>`:''}</div>`;

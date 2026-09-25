# Giordano Sognatore — sito ufficiale

Sito italiano dell’autore, con Home, L’Immagine della Bestia, Le Ombre Si Rivelano, il companion gratuito Il giorno in cui nacque la Bestia, Autore e 404. **Questa proposta è da revisionare prima del merge.** L’anteprima Sites è privata; il repository rimane privato. Nessun dominio acquistato o collegato.

## Architettura

HTML e CSS statici generati con Node.js 22 o successivo, senza dipendenze. Nessun JavaScript client, backend, database, tracciamento, font remoto o cookie applicativo. Il server Node è solo uno strumento locale: non viene distribuito.

- `scripts/build.mjs`: template condivisi, catalogo libri, companion, testi e metadati;
- `scripts/import-companion-assets.sh`: importa e verifica dal repository canonico `bestia` PDF, EPUB e cover del companion;
- `dist/`: output pubblico versionato e pronto all’hosting;
- `dist/assets/`: CSS, copertine ottimizzate, mockup promozionale di *L’Immagine della Bestia* e cover web del companion;
- `dist/downloads/`: PDF ed EPUB gratuiti del companion, presenti dopo l’import degli asset canonici;
- `site.config.json`: URL canonico completo e indicizzazione;
- `scripts/check.mjs`: controllo del sito e dei riferimenti;
- `scripts/serve.mjs`: anteprima locale, anche sotto `/giordanosognatore/`;
- `.openai/hosting.json`: identità dell’anteprima Sites, non necessaria su altri hosting;
- `.github/workflows/verify.yml`: verifica delle Pull Request;
- `.github/workflows/pages.yml`: pubblicazione GitHub Pages manuale, solo da `main`.

Per aggiungere opere, estendere il catalogo e la pagina dedicata in `build.mjs`. Il companion resta separato dalla griglia dei due romanzi: è presentato come contenuto gratuito collegato a *L’Immagine della Bestia*. Layout, navigazione e footer sono condivisi. I link sono relativi e terminano in `.html`, evitando dipendenze da rewrite o fallback SPA.

## Sviluppo e build

```sh
npm run build
npm run check
npm run dev
```

Aprire `http://localhost:4173/`. Il server serve anche `/giordanosognatore/` per verificare i link sotto un prefisso. Non occorre `npm install`. La build non scarica risorse.

### Companion gratuito

La pagina `il-giorno-in-cui-nacque-la-bestia.html` presenta *Il giorno in cui nacque la Bestia — Diario di una collaborazione creativa*, di Ada Vesper con Giordano Sognatore, come companion gratuito e senza spoiler importanti.

Gli asset canonici restano nel repository privato `gsognatore/bestia`, percorso `documentazione/diario/`. Per materializzarli nel sito da un checkout locale che contenga entrambi i repository:

```sh
bash scripts/import-companion-assets.sh ../bestia
npm run build
npm run check
```

Lo script verifica gli SHA Git dei tre sorgenti prima di copiarli, rinomina PDF/EPUB con URL stabili e crea una cover web ridimensionata senza modificare gli originali. Se gli asset non sono ancora importati, la pagina resta costruibile in modalità di revisione con una copertina tipografica di riserva e senza link di download attivi.

Le copertine sono ottimizzate a due dimensioni. Il CSS è sorgente diretto in `dist/assets/site.css`; la build rigenera HTML e SEO, conservando gli asset. Il mockup promozionale `dist/assets/bestia-mockup.webp` è usato soltanto nella pagina dedicata a *L’Immagine della Bestia*; home e catalogo mantengono la copertina piatta canonica. Non cancellare `dist/assets` come se fosse una cache.

## URL canonici e indicizzazione

`site.config.json` contiene l’URL dell’anteprima e `indexable: false`. In alternativa, usare `SITE_URL` e `SITE_INDEXABLE` durante la build. L’URL include l’eventuale prefisso, senza slash finale.

```sh
SITE_URL=https://giordanosognatore.github.io SITE_INDEXABLE=true npm run build
```

Configurare l’URL pubblico effettivo **solo dopo la scelta dell’hosting**. Vengono aggiornati canonical, Open Graph, JSON-LD, sitemap, robots e link di recupero della 404. Nessun dominio definitivo è presupposto. Le risorse relative funzionano con la stessa struttura sia alla radice sia sotto un prefisso; i metadati assoluti richiedono una build con l’URL della destinazione. Non pubblicare l’anteprima `noindex` come versione definitiva senza riconfigurazione.

## Deployment

Distribuire **soltanto `dist/`**, mai l’intero repository.

### GitHub Pages

Dopo review e merge, abilitare Pages con sorgente GitHub Actions. Avviare manualmente `Publish GitHub Pages` da `main`: nessun deployment automatico e nessun merge sono inclusi in questa proposta. La disponibilità di Pages per repository privati dipende dal piano GitHub: in alternativa usare l’hosting statico scelto o rendere pubblico esclusivamente questo repository dopo averne revisionato storia e contenuto. Il workflow configura l’URL del project site; dopo l’adozione di un dominio personalizzato aggiornare `SITE_URL` nel workflow.

### Cloudflare Pages (candidato permanente)

Collegare questo repository, branch `main`, comando `npm run build`, directory di output `dist`, Node 22. Impostare `SITE_URL` all’URL Pages effettivo e `SITE_INDEXABLE=true` per la produzione. Per preview di branch usare il relativo URL e `SITE_INDEXABLE=false`. Nessuna integrazione Cloudflare è necessaria nel codice. Il file `404.html` è riconosciuto dal provider.

### Netlify o hosting equivalente

Build `npm run build`, pubblicazione `dist`. Configurare le stesse variabili e il fallback 404 nativo dell’hosting. Non usare una riscrittura SPA verso `index.html`. Su hosting generici impostare la pagina di errore a `404.html` mantenendo HTTP 404.

### Sites

L’anteprima privata serve la stessa directory `dist` e mantiene l’indicizzazione disabilitata. L’autenticazione dell’anteprima è gestita dall’hosting e non fa parte del sito statico esportabile.

## Fonti, contenuti e asset

Mandato dell’autore, consultazione read-only di `gsognatore/bestia`, ramo `main`, master comune 1.6.7: nota degli autori, prologo e presentazione iniziale di padre Marco Rinaldi. Testi promozionali scritti ex novo, senza trasferire il manoscritto né anticiparne il finale. Il master, le estrazioni e i documenti interni non sono inclusi in questo repository.

Copertina Bestia: derivati WebP del pannello canonico `immagini/sorgenti/copertina/00-Copertina/front-cover-epub.png`, blob `c44a18366d08f155f1eb9124d727c9aadef034df`. Il pannello è documentato nel progetto editoriale come estratto dal wrap canonico `immagini/copertina/00-Copertina.png`, conservando il credito **con ADA VESPER**. Nessun originale modificato. La pagina dedicata usa inoltre `dist/assets/bestia-mockup.webp`, mockup promozionale fotorealistico approvato dall’autore; è un’immagine illustrativa del volume e non sostituisce gli asset canonici di copertina. Home e catalogo continuano a usare la copertina piatta.

Copertina Ombre: asset pubblicato sul sito dell’autore `https://soloist.ai/giordanosognatore`, recuperato dal suo CDN. La copertina documenta titolo, autore e ambientazione nella Milano avvolta nella nebbia. Non è una ricostruzione generativa. Fonte dell’asset: `https://cdn.soloist.ai/bf68bfbf-fee7-4d1b-aaf1-9ff8cb553d4c/5ea9d8b9-f280-495a-94d5-3a71d795061e_1040x1040.webp`.

Companion: fonte canonica `documentazione/diario/Il giorno in cui nacque la Bestia - Ada Vesper - v2.pdf` / `.epub` e `Il giorno in cui nacque la Bestia - copertina.png` nel repository `bestia`. La pagina del sito lo descrive come diario della collaborazione creativa, gratuito e leggibile prima o dopo il romanzo senza spoiler importanti; Ada Vesper è presentata come voce/pseudonimo letterario della componente di IA, senza attribuirle identità personale o giuridica. PDF ed EPUB distribuiti dal sito sono copie byte-per-byte dei file canonici verificati dallo script di importazione; la sola cover web è un derivato ridimensionato.

**Revisione editoriale successiva:** l’autore ha confermato che *Le Ombre Si Rivelano* è il suo romanzo d’esordio e ha autorizzato la presentazione del rapporto narrativo con *L’Immagine della Bestia*: il primo segue Marco Rinaldi in una fase precedente della sua vita, mentre il secondo riprende lo stesso personaggio; i due romanzi restano leggibili indipendentemente. La pagina è stata quindi ampliata con una sinossi promozionale coerente con il riferimento canonico `manoscritto/riferimenti/Le Ombre Si Rivelano.docx` nel repository privato `bestia`. Nessun prezzo, ISBN, recensione o formato commerciale è inserito.

## Diritti

© 2026 Giordano Sognatore. Tutti i diritti riservati. La visibilità del repository non concede una licenza d’uso di testi, copertine, immagini o identità grafica. Non viene attribuita automaticamente una licenza open source al codice. I font sono stack di sistema e non sono redistribuiti. Vedere `COPYRIGHT.md`.

## Decisioni dell’autore ancora aperte

- Revisione e merge della proposta.
- Verifica finale del collegamento Amazon nel browser dell’autore.
- Hosting e dominio definitivi.
- Eventuali contatti e social pubblici; futuro link d’acquisto per Bestia.

# Giordano Sognatore — sito ufficiale

Sito italiano ufficiale di Giordano Sognatore, pubblicato su **https://giordanosognatore.github.io/**, con Home, romanzi pubblicati, anteprima del prossimo romanzo, companion gratuito, Taccuino, Autore e materiali Press. Le modifiche seguono il flusso branch dedicato e Pull Request verso `main`; il merge resta all’autore/proprietario. Non è configurato un dominio personalizzato.

## Architettura

HTML e CSS statici generati con Node.js 22 o successivo, senza dipendenze. Il solo JavaScript client gestisce il menu mobile; non sono presenti backend, database, tracciamento, font remoto o cookie applicativi. Il server Node è solo uno strumento locale: non viene distribuito.

- `scripts/build.mjs`: template condivisi, catalogo libri, companion, testi e metadati;
- `scripts/books.mjs`: identità condivise dei romanzi e destinazioni per i collegamenti dal Taccuino;
- `scripts/related-books.mjs`: richiami reciproci fra romanzi e articoli associati esplicitamente;
- `scripts/formats.mjs`: destinazioni e pulsanti condivisi per ebook, cartaceo e audiolibro gratuito della Bestia;
- `scripts/social.mjs`: immagini e metadati Open Graph/Twitter condivisi;
- `scripts/epub-sample.mjs`: lettura online generata direttamente dall’EPUB pubblico approvato, senza duplicare il testo;
- `scripts/check-epub-sample.mjs`: confronto di testo, paragrafi e formattazione con l’EPUB e controlli delle illustrazioni web;
- `scripts/companion.mjs`: lettura online integrale del companion, generata dal suo EPUB pubblico immutabile;
- `scripts/check-companion.mjs`: confronto completo delle 29 sezioni e dei 136 paragrafi del companion, oltre a hash, cover e collegamenti;
- `scripts/press.mjs`: pagine Press, trasparenza sull’IA e temi;
- `scripts/navigation.mjs`: fonte canonica condivisa dell’header e della navigazione;
- `scripts/import-companion-assets.sh`: importa e verifica dal repository canonico `bestia` PDF, EPUB e cover del companion;
- `scripts/import-estratto-assets.mjs`: importa senza trasformazioni EPUB/PDF dell’estratto; `scripts/estratto-assets.mjs` ne fissa provenienza e hash;
- `dist/`: output pubblico versionato e pronto all’hosting;
- `dist/assets/`: CSS, JavaScript vanilla del menu mobile, copertine ottimizzate, mockup promozionale di *L’Immagine della Bestia* e cover web del companion;
- `dist/downloads/`: PDF ed EPUB gratuiti del companion e dell’estratto, copie degli asset canonici;
- `site.config.json`: URL canonico completo e indicizzazione;
- `scripts/check.mjs`: controllo del sito, dei riferimenti e delle invarianti di accessibilità;
- `scripts/check-accessibility-browser.mjs`: verifica browser facoltativa e senza dipendenze di reflow, contrasto, tastiera, focus e semantica;
- `scripts/serve.mjs`: anteprima locale, anche sotto `/giordanosognatore/`;
- `.openai/hosting.json`: identità dell’anteprima Sites, non necessaria su altri hosting;
- `.github/workflows/verify.yml`: verifica delle Pull Request;
- `.github/workflows/pages.yml`: pubblicazione GitHub Pages su push a `main` o avvio manuale, solo da `main`.

Per aggiungere opere, estendere il catalogo in `scripts/books.mjs` e la pagina dedicata in `scripts/build.mjs`. Il companion resta separato dalla griglia dei romanzi: è presentato come contenuto gratuito collegato a *L’Immagine della Bestia*. Layout, navigazione e footer sono condivisi. I link sono relativi e terminano in `.html`, evitando dipendenze da rewrite o fallback SPA.

## Sviluppo e build

```sh
npm run build
npm run check
npm run dev
```

Aprire `http://localhost:4173/`. Il server serve anche `/giordanosognatore/` per verificare i link sotto un prefisso. Non occorre `npm install`. La build non scarica risorse. Eseguire sempre `npm run build` prima di `npm run check`: il controllo confronta l’output con tutte le sorgenti pubblicabili e segnala anche articoli non ancora rigenerati.

### Accessibilità e comfort di lettura

Il testo di base rispetta la dimensione predefinita del browser. Header, griglie e controlli consentono l’ingrandimento e la spezzatura delle etichette lunghe senza nascondere contenuti. Il collegamento «Vai al contenuto» trasferisce il focus al `main` senza aggiungerlo all’ordine di Tab; link, pulsanti e riepiloghi nativi hanno un indicatore di focus visibile. Le sezioni tematiche espongono titoli gerarchici e i formati sono gruppi accessibili nominati. Non sono stati cambiati testi approvati, palette o immagini. L’unico JavaScript client resta il menu mobile: ora si chiude anche quando il focus esce dalla navigazione, senza riportarlo al pulsante o coprire il controllo successivo.

`npm run check` protegge le invarianti HTML/CSS e il contrasto della palette. `npm run check:browser` aggiunge controlli reali in Chrome tramite CDP, con anteprima e browser già avviati: non richiede dipendenze npm e non è necessario in build/CI. Matrice di prova, comandi, risultati e limiti sono documentati in [`docs/accessibilita.md`](docs/accessibilita.md). I test automatici **non sono una certificazione WCAG** e non sostituiscono verifiche con lettori di schermo, Safari, zoom nativo e dispositivi reali.

### Formati e accessi gratuiti

La prima schermata della Home mette in primo piano l’ultima uscita con tre pulsanti, nell’ordine: «Scopri il libro» (azione principale piena), «Estratto gratuito» e «Audiolibro gratuito» (con bordo). L’estratto apre direttamente la lettura online, l’audiolibro la scheda Google Play. Home, pagina del romanzo e Press usano le destinazioni e l’etichetta «Audiolibro gratuito» di `scripts/formats.mjs`, senza sostituzioni successive nell’HTML generato. L’audiolibro integrale è gratuito su Google Play: nella verifica del 3 novembre 2026 la scheda italiana esponeva un’offerta a `0 EUR`. Non è un acquisto né un’anteprima limitata a 30 minuti. Aggiornare la fonte condivisa se cambia la disponibilità.

Il catalogo della Home resta sintetico. Per la Bestia presenta «Scopri il libro» e «Audiolibro gratuito» (la stessa destinazione Google Play della fonte condivisa); per Ombre «Scopri il libro» e «Leggi gratis il romanzo»; per il futuro *Il Dottor Sottutto* soltanto «Scopri il libro», perché non è ancora disponibile commercialmente. Il selettore completo dei formati della Bestia è mantenuto nella scheda del romanzo e in Press, non nel catalogo Home. Nella scheda della Bestia «Estratto gratuito» e «Companion gratuito» attivano lo scorrimento alle rispettive sezioni più sotto senza icone direzionali aggiuntive; in Home o Press l’estratto ha invece una destinazione diversa. Nelle schede di entrambi i romanzi il pulsante per l’edizione cartacea è etichettato «Cartaceo»; nella scheda di Ombre la dicitura è uniforme anche nel secondo richiamo.

### Coerenza dei pulsanti

Home, schede dei romanzi, companion, Press, IA, Temi, contatti e letture online condividono la stessa regola per `.hero-actions`, `.format-actions` e `.download-actions`: griglia di colonne della stessa larghezza all’interno del gruppo, spaziatura 12 px, altezza minima 48 px, padding e carattere uniformi, etichette centrate e spezzabili. La larghezza dipende dal contenitore, non da una misura rigida comune a tutto il sito. Le colonne hanno un minimo preferito di 9,5 rem, limitato allo spazio disponibile; fino a 700 px diventano una colonna unica. Nel catalogo le tre schede condividono struttura e allineamento: sopra 700 px una subgrid allinea le righe di testo e i gruppi di azioni; i due romanzi disponibili mantengono due pulsanti, mentre l’opera in arrivo ne presenta uno solo senza simularne la disponibilità; le colonne dei pulsanti hanno un minimo preferito di 12 rem per evitare etichette su più righe quando basta impilare le azioni. Su mobile molto stretto rispetto al carattere, una container query riserva lo spazio per due righe, senza altezze rigide che possano tagliare il testo. Il credito isolato «con Ada Vesper» è omesso soltanto dal catalogo, non dalla prima sezione Home, dalla scheda o dalla lettura online. «Scopri il companion» nella scheda Bestia è un pulsante secondario autonomo, non esteso all’intera sezione. I menu Ebook restano nativi e accessibili da tastiera; le loro opzioni condividono la larghezza del pannello. Link editoriali, breadcrumb e comandi compatti di navigazione dei lettori restano distinti.

### Anteprime social

`scripts/social.mjs` seleziona immagini JPEG 1200 × 630: `social-bestia.jpg` (anche per l’estratto online) e `social-ombre.jpg` per i romanzi già pubblicati, `social-sito.jpg` come anteprima generale e di riserva per il Taccuino e le altre pagine. La preview di *Il Dottor Sottutto* usa temporaneamente questo fallback generale: non viene introdotta una composizione social specifica prima dell’approvazione della copertina definitiva. Open Graph e Twitter usano URL assoluti che rispettano `SITE_URL` e il suo eventuale prefisso, con testo alternativo e `summary_large_image`.

Le composizioni sorgenti sono in `materiali/social/`: SVG che riusano le copertine canoniche WebP senza alterarle e i font di sistema Georgia/Arial. Per aggiornarle, aprire l’SVG in un browser con le risorse locali abilitate e rasterizzarlo a 1200 × 630 in JPEG (qualità 90), sostituendo il corrispondente file in `dist/assets/`. Non servono strumenti grafici durante la build: le immagini raster sono asset versionati. Il controllo verifica presenza, firma JPEG, dimensioni, peso e corretta selezione dei metadati anche sotto prefisso. Il rendering effettivo nelle app di condivisione resta da verificare dopo la pubblicazione, tenendo conto delle loro cache.

### Anteprima di Il Dottor Sottutto

`il-dottor-sottutto.html` presenta il prossimo romanzo come **ROMANZO · IN ARRIVO**, senza data, prezzo, ISBN, formati o collegamenti commerciali. L’identità condivisa è registrata in `scripts/books.mjs` con ID stabile `sottutto`, titolo *Il Dottor Sottutto*, genere pubblico «Mystery thriller» e credito «con Ada Vesper». L’ID è tecnicamente valido per `relatedBooks`, ma nessun articolo del Taccuino viene associato automaticamente: ogni futura associazione richiederà una decisione editoriale esplicita.

La Home usa le cover piatte responsive `dist/assets/dottor-sottutto-360.webp` e `dist/assets/dottor-sottutto-720.webp`; la scheda usa il mockup coordinato 420 × 525 `dist/assets/dottor-sottutto-mockup.webp`. Tutti e tre gli asset sono temporanei, già approvati per questa anteprima e documentati in [`materiali/dottor-sottutto/README.md`](materiali/dottor-sottutto/README.md). La pagina indica «Copertina provvisoria» e non presenta acquisto, download, estratto o disponibilità. La fonte editoriale resta il repository `giordanosognatore/dottor-sottutto`; il sito contiene soltanto testi promozionali nuovi e spoiler-free.

### Companion gratuito

La pagina `il-giorno-in-cui-nacque-la-bestia.html` presenta *Il giorno in cui nacque la Bestia — Diario di una collaborazione creativa*, di Ada Vesper con Giordano Sognatore, come companion gratuito e senza spoiler importanti. Nella prima e nell’ultima sezione, «Leggi online» precede «Scarica EPUB» e «Scarica PDF».

Gli asset canonici restano nel repository privato `gsognatore/bestia`, percorso `documentazione/diario/`. Per materializzarli nel sito da un checkout locale che contenga entrambi i repository:

```sh
bash scripts/import-companion-assets.sh ../bestia
npm run build
npm run check
```

Lo script verifica gli SHA Git dei tre sorgenti prima di copiarli, rinomina PDF/EPUB con URL stabili e crea una cover web 640 × 920 ridimensionata senza modificare gli originali; il derivato elimina inoltre la sottile cucitura chiara sul bordo destro. Se gli asset non sono ancora importati, la pagina resta costruibile in modalità di revisione con una copertina tipografica di riserva e senza link di download attivi.

`leggi-il-giorno-in-cui-nacque-la-bestia.html` pubblica il companion completo come pagina statica: copertina piatta, indice di 29 sezioni, barra degli strumenti, navigazione precedente/successiva e download. `scripts/companion.mjs` legge soltanto l’EPUB pubblico versionato, dopo aver verificato dimensione, SHA Git e SHA-256 di EPUB e PDF; il parser ZIP limitato seleziona le 29 sorgenti XHTML senza estrarle su disco. L’HTML conserva in ordine tutti i 136 paragrafi, titoli, sottotitoli, dedica, enfasi e interruzioni di riga. Gli adattamenti sono soltanto `h1` → `h2` sotto il titolo della pagina e `<br/>` → `<br>`. `scripts/check-companion.mjs` confronta integralmente markup e testo di ogni sezione, rifiuta un EPUB alterato e verifica link, copertina, sitemap e assenza dal feed. Build e CI non accedono al repository privato.

Le copertine sono ottimizzate a due dimensioni. Il CSS è sorgente diretto in `dist/assets/site.css`; la build rigenera HTML e SEO, conservando gli asset. Home e catalogo mantengono le copertine piatte canoniche. Nelle schede dedicate, invece, la presentazione usa mockup illustrativi coordinati: `dist/assets/bestia-mockup.webp`, `dist/assets/ombre-mockup.webp`, `dist/assets/companion-mockup.webp` e il provvisorio `dist/assets/dottor-sottutto-mockup.webp`. I mockup di Ombre, companion e Sottutto sono derivati web 420 × 525 degli asset approvati dall’autore e condividono lo stesso ingombro responsive; non sostituiscono le copertine canoniche. Il mockup del companion è una scelta illustrativa di coerenza visiva e non implica l’esistenza di un’edizione cartacea: i formati distribuiti restano PDF ed EPUB. Non cancellare `dist/assets` come se fosse una cache.

### Estratto gratuito di L’Immagine della Bestia

La pagina del romanzo presenta **Prologo + Atto I — La Pace, capitoli 1–6**, prima del companion, con «Leggi online» come prima azione e download EPUB/PDF subito disponibili (EPUB per primo fra i download), senza registrazione. La sezione è tipografica e riusa il linguaggio editoriale del sito, senza nuove immagini. Il pulsante della Home «Estratto gratuito» apre direttamente la lettura online.

Fonte canonica: `giordanosognatore/bestia`, commit approvato `68f7bbb3142f5f0e4dabd0b8d7afb4e6b6b9646a`:

- `produzione/prove/Bestia_Atto_I_Estratto_gratuito_1.6.7.epub`
- `produzione/prove/Bestia_Atto_I_Estratto_gratuito_1.6.7.pdf`

Da un checkout locale di `bestia` contenente questi file:

```sh
node scripts/import-estratto-assets.mjs ../bestia
npm run build
npm run check
```

Il percorso di `bestia` è relativo alla directory corrente (o assoluto); la destinazione è sempre il `dist/downloads/` di questo sito. Lo script legge soltanto i due sorgenti, verifica **entrambi prima di scrivere** tramite dimensione, SHA Git blob e SHA-256 fissati in `scripts/estratto-assets.mjs`, poi copia i byte e ricontrolla hash e identità esatta della copia. Non richiede strumenti esterni, non modifica il checkout sorgente e non trasforma né ricomprime i file. Companion ed estratto hanno importazioni indipendenti.

URL pubblici stabili, relativi alla radice del sito e funzionanti anche sotto prefisso:

- `downloads/l-immagine-della-bestia-atto-i-estratto-gratuito.epub`
- `downloads/l-immagine-della-bestia-atto-i-estratto-gratuito.pdf`

Gli asset sono versionati nel sito: build e CI non accedono al repository privato. `npm run check` richiede entrambi i file e verifica gli hash approvati, i link diretti e l’ordine EPUB/PDF. Un aggiornamento editoriale richiede una nuova approvazione e l’aggiornamento esplicito del manifest; non basta sostituire i file.

#### Lettura online

`estratto-l-immagine-della-bestia.html` è una pagina HTML statica completa: indice con ancore condivisibili, nota degli autori ed epigrafe già presenti nell’EPUB, Prologo, apertura dell’Atto I e capitoli 1–6. Include strumenti di lettura discreti (indice, EPUB, PDF, scheda del romanzo), navigazione fra capitoli e un richiamo al romanzo completo soltanto alla fine. Non richiede JavaScript per leggere o usare l’indice; non registra posizione, cookie o dati del lettore.

Le tre letture online presentano la copertina dopo i pulsanti e prima dell’indice, centrata e senza ritaglio, con la classe condivisa `.reading-cover` (larghezza massima 320 px). L’estratto della Bestia riusa la copertina piatta responsive già presente sul sito, non il mockup: nessun nuovo asset o modifica al contenuto dell’EPUB. Restano esplicite le diciture «estratto gratuito» per la Bestia, «romanzo integrale gratuito» per Ombre e «companion gratuito» per il diario.

`scripts/epub-sample.mjs` legge **soltanto l’EPUB pubblico versionato in `dist/downloads/`**, verificandone dimensione, SHA Git e SHA-256 **prima** di interpretarlo. Un lettore ZIP limitato a questo file immutabile usa esclusivamente `node:zlib`, seleziona dieci sezioni XHTML e le due illustrazioni già approvate, non estrae altri contenuti e non scrive file sorgenti. Non si accede a `bestia` durante la build, non si include il master, non si mantengono trascrizioni o copie editoriali da sincronizzare. Un asset assente o diverso da quello approvato interrompe la build.

Il testo XHTML viene mantenuto: paragrafi, corsivi, grassetti, messaggi, testo a schermo, maiuscoletto, citazioni e tutti gli 83 stacchi narrativi. Gli unici adattamenti HTML sono tecnici: titoli `h1` → `h2` sotto il titolo della pagina, titoli di apertura resi visibili, rimozione del duplicato XML di `lang` (conservando `lang="en"` dove presente), percorsi/dimensioni e caricamento differito delle immagini. Identificativi, indice e navigazione web sono contenitori esterni al testo. `scripts/check-epub-sample.mjs` confronta ordine e contenuto di tutti i **3753 paragrafi** con la fonte approvata e rifiuta un EPUB alterato.

Le illustrazioni web sono derivati senza metadati delle immagini **già incluse nell’EPUB**, non nuove creazioni: `dist/assets/estratto-bestia-atto-i.webp` (768 × 1152, circa 116 KiB) e `dist/assets/estratto-bestia-ala-spezzata.webp` (768 × 925, circa 46 KiB). La composizione intera, il rapporto d’aspetto e i testi alternativi originali sono conservati; le immagini restano fuori dalle altre pagine. Sono asset versionati, senza encoder necessario in build o CI. Per rigenerarli con `cwebp` (libwebp) installato localmente:

```sh
workdir="$(mktemp -d)"
node --input-type=module - "$workdir" <<'JS'
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {approvedEpubEntries,sampleImages} from './scripts/epub-sample.mjs';
const entries=approvedEpubEntries();
for (const image of sampleImages) writeFileSync(resolve(process.argv[2],image.source),entries.get('EPUB/images/'+image.source));
JS
cwebp -q 82 -m 6 -metadata none -resize 768 0 "$workdir/act-01.jpg" -o dist/assets/estratto-bestia-atto-i.webp
cwebp -q 82 -m 6 -metadata none -resize 768 0 "$workdir/internal-02.png" -o dist/assets/estratto-bestia-ala-spezzata.webp
rm -r "$workdir"
npm run build
npm run check
```

La pagina ha canonical, anteprima social del romanzo e voce in sitemap, ma **non** è un articolo del Taccuino e non entra nel feed RSS. I download approvati rimangono byte per byte invariati. Per ampliare o sostituire il perimetro dell’estratto serve una nuova approvazione editoriale, non una semplice modifica alla selezione delle sezioni.

### Le Ombre Si Rivelano — romanzo integrale gratuito

La scheda del romanzo offre lettura online, EPUB adattato e PDF, senza registrazione, mantenendo il collegamento al cartaceo Amazon. La Home continua a privilegiare *L’Immagine della Bestia*.

`leggi-le-ombre-si-rivelano.html` riusa il layout dell’estratto: copertina, indice, 26 sezioni, navigazione fra capitoli e download. Il testo deriva soltanto dall’EPUB pubblico adattato e verificato per hash; build e CI non accedono ai sorgenti privati. La pagina entra nella sitemap e usa l’anteprima social Ombre, ma non genera un articolo o una voce RSS.

L’EPUB conserva testo, paragrafi e corsivi/grassetti, senza font incorporati o script; i 23 capilettera grafici diventano iniziali testuali. Il PDF è una copia invariata dell’esportazione Pages. `scripts/check-ombre.mjs` confronta i 279 blocchi e gli stati di enfasi con le impronte dell’esportazione originale. Provenienza, privacy, importazione riproducibile e verifiche sono documentate in [`docs/ombre.md`](docs/ombre.md). L’autore ha verificato l’EPUB, approvato la versione locale e autorizzato push e pubblicazione.

### Voce dell’autore

`contenuti/autore/perche-scrivo.md` contiene il testo in prima persona «Perché scrivo queste storie», approvato dall’autore. È Markdown senza front matter, separato dagli articoli del Taccuino: viene inserito solo nella pagina `autore.html`, prima della presentazione dell’immaginario narrativo. Non genera una pagina, un articolo RSS o una voce di archivio. Il titolo e l’invito Telegram «Continuiamo la conversazione» sono nel template `scripts/build.mjs`.

Questa sezione presenta motivazioni, discernimento, fede e rispetto verso il prossimo senza dati anagrafici privati né anticipazioni dei romanzi in lavorazione. Il testo approvato non va riscritto senza nuova autorizzazione. `npm run check` verifica che il Markdown sia riportato senza modifiche e che l’invito punti al canale ufficiale, conservando anche il contatto email.

### Immagine simbolica dell’autore

La pagina Autore presenta «Il viandante cosmico», l’immagine indicata dall’autore come già utilizzata su Telegram e Amazon. È un’identità visiva simbolica, non una fotografia. L’intera composizione quadrata viene mostrata accanto al nome su desktop e sotto il nome su schermi piccoli, senza ritaglio circolare; testo alternativo e didascalia su due righe — «Il viandante cosmico. / Rappresentazione simbolica dell’autore.» — ne chiariscono il significato.

L’originale PNG 1254 × 1254 è archiviato senza modifiche in `materiali/autore/viandante-cosmico-tra-mondi-celesti-originale.png`, **fuori dalla directory pubblicata `dist/`**. Il sito usa due derivati WebP senza metadati, a 400 e 800 pixel, selezionati con `srcset`, con spazio riservato per evitare salti di layout. Provenienza, SHA-256 e comandi di rigenerazione sono in [`materiali/autore/README.md`](materiali/autore/README.md). Build e CI usano gli asset versionati senza richiedere un encoder d’immagini. L’immagine non viene aggiunta alla Home né alle anteprime social.

### Canale Telegram ufficiale

Footer, contatti autore e `sameAs` usano `https://t.me/giordanosognatoreofficial`, con etichetta “Telegram” e descrizione accessibile del canale. I controlli rifiutano altri URL Telegram nelle superfici web pubbliche e verificano il collegamento approvato a Google Play Books. I formati della Bestia sono mantenuti in `scripts/formats.mjs`; download, lettura e collegamento al cartaceo di *Le Ombre Si Rivelano* sono in `scripts/ombre.mjs`.

### Cartella stampa PDF (Press & media)

La pagina `press.html` mette a disposizione un press kit ufficiale di **due pagine A4** per *L’Immagine della Bestia*, completo di copertina a risoluzione adeguata, testi approvati e link cliccabili.

Il PDF canonico e versionato è `dist/downloads/press-kit-l-immagine-della-bestia.pdf`, una copia **ottimizzata senza modifiche visive** del press kit illustrato verificato dall'autore. Pesa circa 37 KiB, contiene due pagine A4 e conserva i collegamenti; il confronto dei render con l'originale ha rilevato zero differenze. SHA-256: `d2ce554baba4f64f0103b2bda1a55e87d84e457306b86e5893f16ff6c6a456a6`.

Il PDF **non viene rigenerato** da `npm run build`: è l'asset ufficiale che va mantenuto nel repository insieme agli altri download statici. Lo script di verifica controlla la firma PDF, le dimensioni e lo SHA-256 atteso. Sostituirlo solo in seguito a una modifica editoriale approvata; aggiornare anche lo SHA-256 nel controllo. Non occorre alcun caricamento manuale nel repository locale.

## URL canonici e indicizzazione

`site.config.json` contiene l’URL pubblico `https://giordanosognatore.github.io` e `indexable: true`. In alternativa, usare `SITE_URL` e `SITE_INDEXABLE` durante la build. L’URL include l’eventuale prefisso, senza slash finale.

```sh
SITE_URL=https://giordanosognatore.github.io SITE_INDEXABLE=true npm run build
```

In caso di cambio hosting o dominio, aggiornare l’URL pubblico effettivo nella configurazione e nel workflow di deployment. Vengono aggiornati canonical, Open Graph, JSON-LD, sitemap, robots e link di recupero della 404. Nessun dominio definitivo è presupposto. Le risorse relative funzionano con la stessa struttura sia alla radice sia sotto un prefisso; i metadati assoluti richiedono una build con l’URL della destinazione. Non pubblicare l’anteprima `noindex` come versione definitiva senza riconfigurazione.

## Deployment

Distribuire **soltanto `dist/`**, mai l’intero repository.

### GitHub Pages

L’hosting attuale è GitHub Pages, con sorgente GitHub Actions. `Publish GitHub Pages` esegue build e controlli, quindi distribuisce `dist/` a ogni push su `main`; può essere avviato anche manualmente da `main`. I branch di lavoro non pubblicano il sito. Il workflow configura l’URL `https://giordanosognatore.github.io`; dopo l’adozione di un dominio personalizzato aggiornare anche `SITE_URL` nel workflow. Nessun agente effettua merge senza autorizzazione esplicita.

### Cloudflare Pages (candidato permanente)

Collegare questo repository, branch `main`, comando `npm run build`, directory di output `dist`, Node 22. Impostare `SITE_URL` all’URL Pages effettivo e `SITE_INDEXABLE=true` per la produzione. Per preview di branch usare il relativo URL e `SITE_INDEXABLE=false`. Nessuna integrazione Cloudflare è necessaria nel codice. Il file `404.html` è riconosciuto dal provider.

### Netlify o hosting equivalente

Build `npm run build`, pubblicazione `dist`. Configurare le stesse variabili e il fallback 404 nativo dell’hosting. Non usare una riscrittura SPA verso `index.html`. Su hosting generici impostare la pagina di errore a `404.html` mantenendo HTTP 404.

### Sites

L’anteprima privata serve la stessa directory `dist` e mantiene l’indicizzazione disabilitata. L’autenticazione dell’anteprima è gestita dall’hosting e non fa parte del sito statico esportabile.

## Fonti, contenuti e asset

Mandato dell’autore, consultazione read-only di `gsognatore/bestia`, ramo `main`, master comune 1.6.7: nota degli autori, prologo e presentazione iniziale di padre Marco Rinaldi. Testi promozionali scritti ex novo, senza trasferire il manoscritto né anticiparne il finale. Il master, le estrazioni e i documenti interni non sono inclusi in questo repository.

Copertina Bestia: derivati WebP del pannello canonico `immagini/sorgenti/copertina/00-Copertina/front-cover-epub.png`, blob `c44a18366d08f155f1eb9124d727c9aadef034df`. Il pannello è documentato nel progetto editoriale come estratto dal wrap canonico `immagini/copertina/00-Copertina.png`, conservando il credito **con ADA VESPER**. Nessun originale modificato. La pagina dedicata usa inoltre `dist/assets/bestia-mockup.webp`, mockup promozionale fotorealistico approvato dall’autore; è un’immagine illustrativa del volume e non sostituisce gli asset canonici di copertina. Home e catalogo continuano a usare la copertina piatta.

Copertina Ombre: asset pubblicato sul sito dell’autore `https://soloist.ai/giordanosognatore`, recuperato dal suo CDN. La copertina documenta titolo, autore e ambientazione nella Milano avvolta nella nebbia. Non è una ricostruzione generativa. I derivati web rimuovono esclusivamente la sottile cornice chiara esterna e vengono riportati alle dimensioni già previste dal layout. Fonte dell’asset: `https://cdn.soloist.ai/bf68bfbf-fee7-4d1b-aaf1-9ff8cb553d4c/5ea9d8b9-f280-495a-94d5-3a71d795061e_1040x1040.webp`.

Companion: fonte canonica `documentazione/diario/Il giorno in cui nacque la Bestia - Ada Vesper - v2.pdf` / `.epub` e `Il giorno in cui nacque la Bestia - copertina.png` nel repository `bestia`. La pagina del sito lo descrive come diario della collaborazione creativa, gratuito e leggibile prima o dopo il romanzo senza spoiler importanti; Ada Vesper è presentata come voce/pseudonimo letterario della componente di IA, senza attribuirle identità personale o giuridica. PDF ed EPUB distribuiti dal sito sono copie byte-per-byte dei file canonici verificati dallo script di importazione; la sola cover web è un derivato 640 × 920 ridimensionato e ripulito della sottile cucitura sul bordo destro.

**Revisione editoriale successiva:** l’autore ha confermato che *Le Ombre Si Rivelano* è il suo romanzo d’esordio e ha autorizzato la presentazione del rapporto narrativo con *L’Immagine della Bestia*: il primo segue Marco Rinaldi in una fase precedente della sua vita, mentre il secondo riprende lo stesso personaggio; i due romanzi restano leggibili indipendentemente. La pagina è stata quindi ampliata con una sinossi promozionale coerente con il riferimento canonico `manoscritto/riferimenti/Le Ombre Si Rivelano.docx` nel repository privato `bestia`. Nessun prezzo, ISBN, recensione o formato commerciale è inserito.

## Diritti

© 2026 Giordano Sognatore. Tutti i diritti riservati. La visibilità del repository non concede una licenza d’uso di testi, copertine, immagini o identità grafica. Non viene attribuita automaticamente una licenza open source al codice. I font sono stack di sistema e non sono redistribuiti. Vedere `COPYRIGHT.md`.

## Review e decisioni dell’autore

- Review e merge delle singole Pull Request.
- Verifica periodica dei collegamenti agli store e della disponibilità dei formati.
- Eventuale adozione di un dominio personalizzato.
- Approvazione preventiva delle modifiche editoriali; i corpi degli articoli approvati non vengono riscritti dall’implementazione tecnica.

## Dal taccuino di Giordano

Nel Taccuino entra ciò che alimenta i libri, nasce dai libri o racconta il percorso dello scrittore. Le sorgenti sono in `contenuti/taccuino/`; `scripts/taccuino.mjs` gestisce metadati, Markdown, liste e RSS senza dipendenze. Per pubblicare un articolo basta aggiungere un file `.md`, eseguire `npm run build` e `npm run check`, quindi sottoporre sorgenti e `dist/` alla normale revisione.

```markdown
---
title: "Il titolo dell’appunto"
date: 2026-10-10
description: "Una breve descrizione per archivio, anteprime, SEO e feed."
category: taccuino
tags:
  - Dietro le quinte
  - Scrittura
slug: il-titolo-dell-appunto
showOnHome: true
relatedBooks: []
---

Il primo paragrafo con *corsivo* e **grassetto**.

## Un approfondimento

Un [collegamento al romanzo](l-immagine-della-bestia.html).
```

### Front matter supportato

Il blocco iniziale è delimitato da due righe `---`. È un formato limitato, non YAML generico: una coppia `campo: valore` per riga, nessun commento, oggetto o testo multilinea. Sono ammessi soltanto i campi seguenti; campi sconosciuti, duplicati o valori invalidi fanno fallire la build.

| Campo | Regola |
| --- | --- |
| `title` | Testo obbligatorio; diventa l’unico H1 della pagina. |
| `date` | Data obbligatoria e valida, `YYYY-MM-DD`. |
| `description` | Testo obbligatorio per anteprime e metadati; usare questo nome, non `summary`. |
| `category` | Obbligatoria: `taccuino` (etichetta “Dal taccuino”) o `comunicati-stampa`. |
| `tags` | Elenco di testi, ciascuno su una riga con due spazi e `- `; `tags: []` per nessun tag. |
| `slug` | Opzionale: lettere minuscole ASCII, cifre e trattini; deve essere unico. |
| `showOnHome` | Booleano non quotato `true`/`false`; predefinito `true` per Taccuino, `false` per comunicati. |
| `relatedBooks` | Elenco opzionale di ID opera: `bestia`, `ombre`, `sottutto`. Assente o `[]`: nessun richiamo. Solo per `category: taccuino`; ID sconosciuti e duplicati fanno fallire la build. |

Le stringhe possono essere non quotate, tra doppi apici con escape JSON (`\"`, `\\`), oppure tra apici singoli (raddoppiare l’apice interno). Senza `slug`, il nome del file senza `.md` viene trasformato in minuscolo, senza accenti, sostituendo gli altri separatori con trattini. Per mantenere un URL permanente, conservare lo slug anche se cambiano titolo o filename.

### Associazioni fra Taccuino e romanzi

Le associazioni sono una scelta editoriale esplicita, non sono dedotte da tag, citazioni, link nel corpo o `showOnHome`. Nell’handoff di un nuovo articolo, la redazione (anche dalla chat web) deve proporre il valore di `relatedBooks` per la revisione dell’autore: elenco pertinente oppure `[]`. Il parser mantiene il campo opzionale per compatibilità con le sorgenti esistenti. Non scrivere i riquadri nel corpo Markdown: li genera il sito. Le istruzioni della redazione sono in `giordanosognatore/promozione/redazione/taccuino/AGENTS.md`.

Nel front matter di un articolo pertinente aggiungere, per esempio:

```markdown
relatedBooks:
  - bestia
```

Si possono associare più opere (un ID per riga); la build valida gli ID contro `scripts/books.mjs`. Non associare un libro soltanto perché è menzionato incidentalmente. I comunicati stampa restano esclusi da questi richiami.

- **Pagina romanzo:** in fondo appare “Dal taccuino: dentro e intorno al romanzo”, con fino a tre articoli associati, ordinati dal più recente come nell’archivio (slug a parità di data). Il link “Tutti gli appunti” porta all’archivio completo, non filtrato. Se non ci sono associazioni la sezione non viene generata.
- **Pagina articolo:** dopo il corpo approvato, un riquadro separato rimanda alla storia e, soltanto se disponibile, all’estratto gratuito. Nessun pulsante d’acquisto. Con più opere compare un elenco; senza associazioni non compare nulla.
- `showOnHome: false` continua a escludere soltanto dalla Home: non impedisce un’associazione esplicita al romanzo. Rimuovere un ID elimina entrambi i richiami alla build successiva; rimuovere l’articolo elimina anche il richiamo dalla pagina romanzo.

Le associazioni iniziali collegano i sei articoli attuali alla Bestia: processo creativo e riflessioni con Ada Vesper, Giordano Bruno, incontri dopo la pubblicazione, Portici di Carta e audiolibro. Per *Le Ombre Si Rivelano* non è stato aggiunto un collegamento basato sulla sola menzione degli esperimenti vocali: la sezione resta nascosta finché non viene associato un articolo pertinente. Sono modificati soltanto i metadati, non i corpi degli articoli.

### Markdown e collegamenti

Sono supportati paragrafi separati da righe vuote, `##` e `###`, `*corsivo*`, `**grassetto**` (anche corsivo dentro il grassetto), link `[testo](URL)`, elenchi semplici con `- ` o `* `, citazioni con `> ` e separatori `---`. Un eventuale `# Titolo` iniziale deve coincidere con `title` e non viene duplicato nel corpo. L’HTML è mostrato come testo, mai eseguito. Tabelle, immagini, codice, liste annidate e altre estensioni Markdown non sono previste.

I link interni partono dalla radice logica di `dist/`, per esempio `l-immagine-della-bestia.html` o `taccuino/altro-appunto.html`; la build aggiunge il prefisso relativo necessario alle pagine articolo. Non usare `/` iniziale né `../`. Per link esterni usare URL completi `https://`/`http://`; sono ammessi anche `mailto:`. Non sono previsti attributi HTML o titoli aggiuntivi nei link.

### Cosa genera la build

- `taccuino.html`: tutti i contenuti, dal più recente; a parità di data, ordine lessicografico dello slug.
- `taccuino/<slug>.html`: articolo con data, categoria, tag, metadati Open Graph e JSON-LD `BlogPosting`; eventuale riquadro dei romanzi associati dopo il corpo.
- Home: ultimi tre contenuti con `showOnHome: true`, dopo romanzi e presentazione dell’autore. `showOnHome: false` esclude solo dalla Home.
- Press: due richiami distinti, fino a tre articoli ordinari e tre comunicati. I comunicati e il loro archivio `comunicati-stampa.html` compaiono soltanto quando esiste almeno un comunicato.
- `sitemap.xml` e `feed.xml`: archivio e URL permanenti, feed RSS 2.0 con tutti i contenuti e descrizioni, in ordine cronologico inverso. Le pagine offrono autodiscovery RSS.

Per creare un comunicato basta aggiungere un altro Markdown con `category: comunicati-stampa`. Non occorre modificare Press o altri template. Ogni file presente è pubblicato dalla build, anche con data futura: tenere le bozze fuori da `contenuti/taccuino/`. La build elimina gli HTML articolo obsoleti e l’archivio comunicati se rimane vuoto, senza toccare asset o download. Non vengono usati timestamp correnti: a parità di sorgenti e configurazione l’output è identico.

Canonical, feed, sitemap e JSON-LD seguono `SITE_URL` (o `site.config.json`); `SITE_INDEXABLE=false` mantiene `noindex` nelle pagine e `Disallow: /` in robots. Per verificare una preview sotto prefisso:

```sh
SITE_URL=https://example.test/anteprima SITE_INDEXABLE=false npm run build
SITE_URL=https://example.test/anteprima SITE_INDEXABLE=false npm run check
npm run build
npm run check
```

L’ultima coppia ripristina la configurazione normale. `npm run check` verifica anche il parser, l’aggiunta/rimozione di articoli e comunicati e una build preview in una directory temporanea isolata.

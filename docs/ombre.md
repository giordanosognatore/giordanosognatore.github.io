# Le Ombre Si Rivelano — edizione gratuita approvata

## Mandato e stato

L’autore ha autorizzato PDF, EPUB e lettura integrale, conservando copertina e sezioni, con adattamenti tecnici di reflow e rimozione dei font. Ha dichiarato cessata da tempo l’adesione a KDP Select e accettato l’eventuale adeguamento a zero del prezzo Amazon. Non viene certificato lo stato dell’account KDP. Nessun prezzo commerciale è fissato nel sito.

**L’autore ha verificato l’EPUB adattato e approvato la versione locale, autorizzando esplicitamente push e pubblicazione.** KPF, Pages, schermate dell’account e rapporti temporanei di verifica non vanno distribuiti.

## Fonti e provenienza

Repository sorgente `giordanosognatore/ombre`, commit `ab366df9e25a32898bd2c95f549eaa8e707d2b20`, letto senza modifiche:

| Sorgente | SHA-256 |
| --- | --- |
| `pages/export/Le Ombre Si Rivelano.epub` | `b8eaf7a646c3638bd0f3b9bdcab14c12da36bea3919e68a0f0054e06c6fcb87a` |
| `pages/export/Le Ombre Si Rivelano.pdf` | `02c8a9a30eb7ff8dc121bfc3ad3ad3f66d96b33d688e4b18ab88cc877940cab8` |

Il confronto preliminare con il DOCX incorporato in `kdp/Le Ombre Si Rivelano.kpf` ha verificato la corrispondenza del frontespizio/dedica/introduzione e del testo dal Prologo a “L’autore”, normalizzando spazi, Unicode NFC e separazione dei capilettera. L’indice DOCX contiene i numeri di pagina. Anche il testo dal Prologo alla fine dell’EPUB KDP corrisponde; quell’EPUB ha però un diverso frontespizio e un sommario collocato diversamente. Non è stato interpretato il documento binario Pages né il database KDF: non si afferma una verifica integrale di quei formati.

EPUBCheck **5.3.0** sull’originale: zero errori/warning, quattro `INFO RSC-004` per i font Charter con offuscamento IDPF; non è DRM del testo. Sull’EPUB adattato: **zero errori, warning e INFO**.

## Adattamenti, non riscritture

L’importatore manuale `scripts/import-ombre-assets.py` usa soltanto la libreria standard Python 3; non è una dipendenza della build o della CI. Prima di scrivere verifica entrambi gli SHA-256. Ricostruisce un EPUB reflowable deterministico esclusivamente dai sorgenti approvati:

- mantiene frontespizio, dedica, introduzione, indice, Prologo, 18 capitoli, epilogo, riflessioni finali e autore, nell’ordine originale;
- conserva testo, paragrafi non vuoti, interruzioni di riga e corsivi/grassetti, ricavati dagli stili Pages;
- sostituisce i 23 capilettera grafici con la lettera reale già presente nell’XHTML; non perde né duplica iniziali;
- elimina paragrafi vuoti di spaziatura e ancore vuote di impaginazione; rimuove il solo carattere segnaposto oggetto U+FFFC dell’intestazione dell’indice;
- trasforma le intestazioni in titoli semantici e conserva i collegamenti dell’indice;
- elimina font, offuscamento dei font, JavaScript vuoto, eventi `onload`, stili di posizionamento, UUID Pages e metadati applicativi;
- ricrea metadati minimi: autore **Giordano Sognatore**, titolo, italiano, diritti riservati, nuovo identificatore tecnico e data di modifica costante;
- conserva tutti i pixel della copertina PNG, rimuovendo i chunk accessori, compresi EXIF, testo e profili colore. Il derivato web è WebP 640 × 990, senza metadati. Nessun ritaglio;
- copia il PDF originale **byte per byte**. PDFKit ed ExifTool non hanno rilevato metadati autore privati: il `Creator` identifica Pages. Le 25 annotazioni PDF sono collegamenti, senza autori di annotazione privati. Non è una nuova impaginazione o un PDF con copertina aggiunta.

La gratuità non introduce una licenza libera: i diritti sui testi e sulle immagini rimangono riservati.

## Rigenerazione manuale

```sh
python3 scripts/import-ombre-assets.py ../ombre
node --input-type=module - <<'JS'
import {writeFileSync} from 'node:fs';
import {ombreEntries} from './scripts/ombre.mjs';
writeFileSync('/tmp/ombre-cover-clean.png',ombreEntries().get('OPS/cover.png'));
JS
cwebp -q 85 -m 6 -metadata none -resize 640 0 /tmp/ombre-cover-clean.png -o dist/assets/ombre-lettura-copertina.webp
epubcheck dist/downloads/le-ombre-si-rivelano.epub
npm run build
npm run check
```

`cwebp` ed EPUBCheck servono solo alla preparazione/verifica manuale. Non vengono eseguiti in build. Le dimensioni e gli hash dei due download sono fissati in `scripts/ombre.mjs`: una modifica ai sorgenti o agli asset richiede una nuova verifica e un aggiornamento esplicito, non un’accettazione automatica di hash nuovi.

## Lettura online e controlli

`leggi-le-ombre-si-rivelano.html` deriva **solo dall’EPUB adattato pubblico versionato**, verificato prima di interpretare ZIP/XHTML. Il parser è separato da quello dell’estratto della Bestia, che non è stato ampliato. La build non accede al repository privato e non richiede Python, encoder o rete.

La pagina riusa `.excerpt*`: indice con ancore, barra di lettura, navigazione precedente/successivo, EPUB/PDF e ritorno alla scheda. Gli adattamenti web sono `h1` → `h2`, `<br/>` → `<br>` e collegamenti dell’indice verso le ancore locali. Non introduce script, persistenza o tracciamento. Ha canonical, anteprima social Ombre e sitemap; non entra nel feed o nel Taccuino. La Home mantiene la Bestia come ingresso principale; cambia soltanto l’accesso alla lettura nella riga di catalogo Ombre.

La scheda Ombre offre lettura, EPUB e PDF, più il cartaceo Amazon (`B0F4Y71R6L`, rilevato nella libreria KDP fornita dall’autore). Nessun link inventato a Google Play.

`scripts/ombre-source-checks.json` registra impronte dei **279 blocchi** e della sequenza di caratteri con stato corsivo/grassetto risolta dagli stili dell’esportazione originale. Non è una trascrizione del romanzo. `scripts/check-ombre.mjs` verifica in modo indipendente tali impronte nell’EPUB adattato e nell’HTML, ordine delle 26 sezioni, hash dei download, rifiuto di un EPUB alterato, assenza di font/script/metadati della copertina, link e perimetro editoriale. I controlli generali verificano SEO e riferimenti anche sotto prefisso; quelli isolati coprono build deterministica e preview noindex.

Il controllo browser comprende tutte le pagine e i due nuovi percorsi sotto prefisso: **192 combinazioni** di viewport 1440/768/390/320, testo al 200% e spaziatura aumentata. Include tastiera, nomi accessibili, contrasto su fondi solidi, ancore del romanzo non coperte dalla barra e lettura senza JavaScript. Non è una certificazione WCAG.

## Revisione e limiti

- L’autore ha completato con esito positivo le verifiche richieste sull’EPUB e approvato la pubblicazione della versione locale.
- Controllo browser desktop/mobile completato; Safari/VoiceOver non sono stati collaudati in questa sessione. I test automatici non sostituiscono prove con tecnologie assistive e dispositivi reali.
- Verificare periodicamente condizioni e disponibilità Amazon.

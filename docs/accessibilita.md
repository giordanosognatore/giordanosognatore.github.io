# Accessibilità e comfort di lettura — verifica del 3 novembre 2026

Questa è una verifica tecnica mirata del sito, **non una certificazione WCAG** e non una prova con persone che usano tecnologie assistive. Riferimenti di lavoro: struttura e relazioni, uso del colore/contrasto, ridimensionamento del testo, reflow, spaziatura del testo, tastiera, salto dei blocchi ripetuti e visibilità del focus (WCAG 2.2).

## Problemi riscontrati e correzioni

| Area | Riscontro iniziale | Correzione |
|---|---|---|
| Testo personalizzato | La radice a `16px` non rispettava la dimensione predefinita scelta nel browser. | Radice a `100%`, preservando i 16 px quando il browser usa l’impostazione standard. |
| Testo al 200% | A 768 px il menu e varie griglie uscivano dal viewport; a 320 px alcuni titoli, collegamenti e il pulsante email diventavano troppo larghi. L’overflow nascosto poteva mascherare la perdita di contenuto. | Menu e header possono andare a capo; colonne con minimo zero, elementi di griglia restringibili e parole/etichette lunghe spezzabili. Non si riduce il testo per farlo entrare. |
| Tastiera | Il link «Vai al contenuto» aveva come destinazione un `main` non esplicitamente focalizzabile. | `tabindex="-1"` sul solo `main`: focus trasferibile senza aggiungere una tappa al normale ordine di Tab. |
| Menu mobile | Uscendo dal menu con Tab, il primo collegamento della pagina libro poteva ricevere il focus restando coperto dal menu aperto. | La navigazione si chiude quando il focus ne esce, senza rubare il focus al nuovo controllo. Rimane un pannello non modale, senza trappola di focus. |
| Focus | Il bordo esplicito era definito per i collegamenti e il menu, non per tutti i riepiloghi nativi dei formati. | Indicatore coerente su link, pulsanti e `summary`; margine di scorrimento per i controlli dell’estratto, così la barra di lettura non li copre. Corretto anche il colore del salto al contenuto in hover. |
| Struttura | Nella pagina Temi si passava da `h1` a `h3`; le etichette delle sezioni tematiche erano paragrafi. | Le cinque etichette già visibili diventano `h2`, con aspetto invariato; le singole voci restano `h3`. Nessun nuovo testo. |
| Formati | Il contenitore generico dei formati aveva un’etichetta ARIA senza un ruolo che la rendesse affidabilmente riconoscibile. | `role="group"` sul contenitore già etichettato, mantenendo `details`/`summary` nativi. |

## Contrasto

Non sono stati cambiati i colori. Rapporti della palette, arrotondati:

| Testo | Su sfondo principale | Su superficie secondaria |
|---|---:|---:|
| Chiaro | 15,43:1 | 14,34:1 |
| Secondario | 9,45:1 | 8,78:1 |
| Oro / focus | 9,22:1 | 8,56:1 |

Tutte queste coppie superano 4,5:1, anche per testo normale. Il test browser controlla inoltre i colori calcolati dei nodi di testo sui fondi CSS uniformi, tenendo conto delle trasparenze. Non valuta il testo contenuto nelle copertine o nelle altre immagini, né rende una garanzia sui gradienti o su ogni stato visivo possibile.

## Verifiche eseguite

- `npm run build` e `npm run check`: 17 pagine, 307 riferimenti locali; controlli delle strutture, una sola area principale, titoli senza salti, destinazione del salto focalizzabile, gruppi di formati nominati, dimensione di base relativa, contrasto della palette, link/metadati, build isolata e deterministica.
- `npm run check:browser` con Chrome headless: **160 combinazioni pagina/layout** al momento della verifica (tutte le 17 pagine alla radice e tre template rappresentativi sotto `/giordanosognatore/`, per otto configurazioni).
- Viewport da 320, 390, 768 e 1440 CSS px. Testo al 200% simulato impostando la base a 32 px, a 320 e 768 px. Non è una prova dello zoom nativo del browser: il reflow a 320 CSS px rappresenta anche la larghezza risultante da 1280 px al 400% di zoom.
- Spaziatura personalizzata a 320 e 768 px: interlinea 1,5, spazio fra paragrafi 2 em, fra lettere 0,12 em e fra parole 0,16 em. Controllati sia i rettangoli degli elementi sia quelli dei singoli nodi di testo: nessun contenuto oltre i lati del viewport nei casi verificati.
- Input reali da tastiera tramite CDP: salto iniziale → focus sul contenuto, ordine del menu mobile, apertura con Invio, chiusura con Escape e ritorno al pulsante, esclusione dei link nascosti dall’ordine di Tab, uscita dal menu verso il breadcrumb senza copertura né spostamento del focus, navigazione e chiusura dei formati nativi.
- Albero di accessibilità di Chrome su Home, Press ed estratto a 390 e 1440 px: landmark principale, titolo di livello 1, nomi di link/controlli/titoli e gruppo dei formati. Questo **non equivale** a un test con VoiceOver o NVDA.
- Estratto lungo: ancore di Prologo, capitoli 1 e 6 e fine estratto; titoli e collegamenti non coperti dagli strumenti di lettura, anche con base a 32 px. Testo e salto al contenuto disponibili anche con JavaScript disabilitato.
- Ispezione di catture desktop e mobile, focus sul riepilogo Ebook e Prologo. Testi visibili, articoli approvati, estratto, EPUB/PDF, immagini, feed e sitemap restano invariati; cambiano struttura HTML, presentazione, chiusura del menu al cambio di focus e strumenti di verifica.

## Aggiornamento — gruppi di azioni coerenti

La revisione dei pulsanti estende una griglia condivisa a Home, schede dei romanzi, companion, Press, contatti e letture online: colonne di uguale larghezza nel gruppo, una colonna fino a 700 px, testo centrato e spezzabile, carattere relativo, altezza minima 48 px e gap 12 px. Nessuna larghezza rigida globale; link editoriali e navigazione compatta dei lettori restano distinti. Nel catalogo i due romanzi condividono anche la larghezza dei controlli. Il menu Ebook conserva `details`/`summary`, opzioni raggiungibili da tastiera e pannello nel flusso su mobile.

Il controllo browser attuale copre **192 combinazioni** (19 pagine e cinque template sotto prefisso, per otto configurazioni). Controlla le larghezze uniformi dei gruppi e fra le due schede del catalogo, altezza minima, centratura, carattere relativo, impilamento mobile, reflow e contrasto. Aggiunge apertura/chiusura e dimensioni delle opzioni Ebook su scheda Bestia e Press a 1440 e 390 px. Una breve attesa dopo il caricamento precede misure e invio di tasti, anche con gli script della pagina disabilitati. Queste verifiche restano distinte da una certificazione e non colmano i limiti Safari/VoiceOver indicati sotto.

## Ripetere il controllo browser

Non servono pacchetti npm o librerie di automazione. Il controllo usa il protocollo di debug di Chrome tramite le API native di Node >=22; è facoltativo, non fa parte della build, non viene distribuito al lettore e non viene eseguito automaticamente in CI.

1. Generare il sito e avviare l’anteprima:

   ```sh
   npm run build
   npm run dev
   ```

2. In un altro terminale, avviare un’istanza separata di Chrome. Esempio macOS:

   ```sh
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless --disable-gpu --no-first-run \
     --user-data-dir="$(mktemp -d)" \
     --remote-debugging-address=127.0.0.1 \
     --remote-debugging-port=9223 about:blank
   ```

   Su altri sistemi usare il binario Chrome/Chromium locale. Non usare il profilo personale e non esporre la porta di debug in rete.

3. Dalla radice del progetto:

   ```sh
   npm run check:browser
   ```

   Per conservare catture locali fuori dal repository:

   ```sh
   A11Y_SCREENSHOT_DIR=/tmp/giordano-accessibilita npm run check:browser
   ```

   `PREVIEW_URL` e `CHROME_DEBUG_URL` permettono di cambiare le due destinazioni locali. Il server di anteprima deve servire anche `/giordanosognatore/`. Lo script apre e chiude una propria scheda, non il browser intero. Chiudere poi l’istanza di Chrome dedicata con Ctrl+C nel suo terminale.

## Verifiche ancora necessarie

- **Safari e telefono reale**: Safari 17.6 è disponibile nell’ambiente, ma il tentativo WebDriver è stato rifiutato perché «Allow remote automation» è disattivato. Non è stata cambiata alcuna preferenza. Non sono quindi dichiarati controlli Safari/iOS superati.
- **VoiceOver / NVDA e utenti reali**: verificare lettura dei titoli, passaggio fra landmark, annunci dei gruppi e dei controlli e comfort nell’estratto lungo.
- **Zoom nativo e preferenze personali**: provare 200% e 400% nel browser reale, dimensione caratteri personalizzata e navigazione completa senza mouse. I test di viewport/base tipografica sono copertura tecnica, non un sostituto universale.
- Modalità a contrasto forzato e ulteriori combinazioni di browser/sistema non coperte.

Un tema chiaro dedicato alla lettura resta un’eventuale scelta successiva, da valutare con riscontri d’uso: non è stato introdotto automaticamente durante questo audit.

# Istruzioni per agenti — sito Giordano Sognatore

Queste regole valgono per tutto il repository del sito ufficiale di **Giordano Sognatore**.

## Fonte canonica e boot

`origin/main` è la base canonica del sito. Prima di intervenire, leggere almeno:

1. `AGENTS.md`;
2. `README.md`;
3. il mandato o la richiesta corrente;
4. i file direttamente coinvolti dal task.

Non ricostruire decisioni operative dalla cronologia Git se il task non lo richiede. Le conversazioni e le fonti di progetto possono fornire contesto, ma il repository resta la fonte canonica per struttura, contenuti pubblicati e regole tecniche.

Il flusso ordinario usa un branch dedicato e una Pull Request verso `main`. Nessun agente effettua merge salvo autorizzazione esplicita dell’autore/proprietario nel task corrente.

## Identità pubblica e privacy

- L’identità pubblica dell’autore è **Giordano Sognatore**.
- Non pubblicare, inferire o ricostruire nome reale, indirizzo privato, numero personale o altri dati identificativi non già destinati esplicitamente alla pubblicazione.
- La scelta di pubblicare sotto pseudonimo e di non mostrare necessariamente il volto fa parte dell’identità autoriale; il sito può privilegiare testi, audio, libri, eventi e materiali editoriali.
- **Ada Vesper** è la voce/identità letteraria della componente di intelligenza artificiale nella collaborazione creativa. Descriverla con trasparenza senza attribuirle identità personale o giuridica.
- *L’Immagine della Bestia* non va presentato come un romanzo “contro l’IA”: il posizionamento distingue l’uso creativo/produttivo dell’IA dalla delega di autorità, giudizio o responsabilità.

## Flusso editoriale del Taccuino

Il Taccuino non è un blog generalista. Vi entra ciò che **alimenta i libri, nasce dai libri o racconta il percorso dello scrittore**: genesi, retroscena, letture, incontri, eventi, scoperte successive alla pubblicazione, riflessioni legate ai temi narrativi e anticipazioni pertinenti.

Evitare cronaca politica quotidiana, diario privato, polemiche fini a se stesse o resoconti interni di campagna che non abbiano valore editoriale per il lettore.

Il flusso ordinario separa quattro responsabilità:

1. **Redazione articoli** — la chat/ruolo editoriale “Articoli: Dal taccuino di Giordano” prepara bozze, ricerca, struttura e voce. Non pubblica autonomamente.
2. **Revisione promozionale/editoriale** — la chat/ruolo che coordina la campagna valuta insieme all’autore posizionamento, privacy, opportunità promozionale, chiarezza dei richiami ai libri e coerenza con l’identità pubblica.
3. **Approvazione** — Giordano Sognatore ha l’ultima parola sul testo. Una bozza non entra in `contenuti/taccuino/` finché non è stata esplicitamente approvata.
4. **Implementazione tecnica** — Codex o altro agente tecnico inserisce il testo approvato nell’infrastruttura, normalizza soltanto i metadati necessari, esegue build/check e apre o aggiorna la PR. Non riscrive il corpo dell’articolo salvo mandato esplicito.

Se una nuova chat eredita uno di questi ruoli, deve rispettare la stessa separazione anche se non dispone della cronologia delle chat precedenti.

## Articoli, categorie e comunicati

Le sorgenti pubblicabili stanno in `contenuti/taccuino/` e seguono il formato documentato nel `README.md`.

- `category: taccuino` identifica gli articoli ordinari.
- `category: comunicati-stampa` identifica comunicati destinati anche alla superficie Press.
- I tag descrivono temi e contesto; non sostituiscono la categoria funzionale.
- Le bozze non approvate devono restare fuori da `contenuti/taccuino/`, perché ogni file presente viene pubblicato dalla build.
- Conservare slug stabili per gli URL già pubblicati.
- Il richiamo commerciale deve restare pertinente e discreto: un articolo può rimandare al romanzo o ad altre pagine del sito, ma non va trasformato automaticamente in pubblicità.

Homepage e Press devono continuare a usare i richiami automatici previsti dalla pipeline; non duplicare manualmente elenchi di articoli se l’infrastruttura può generarli.

## Rapporto con la campagna promozionale

Lo stato operativo della campagna di *L’Immagine della Bestia* non è mantenuto in questo repository. CRM, checklist, follow-up e verifiche dei contatti sono canonici nel repository `giordanosognatore/bestia`, area `produzione/promozione/`.

Il Taccuino può diventare materiale utile per stampa, relazioni e follow-up, ma una decisione promozionale non autorizza automaticamente modifiche al testo già approvato o pubblicato.

I comunicati stampa possono essere pubblicati con la stessa infrastruttura Markdown, ma devono essere riconoscibili come categoria distinta dagli articoli del Taccuino.

## Regole tecniche

- Preservare l’architettura statica e senza dipendenze salvo decisione esplicita diversa.
- Leggere `README.md` per pipeline Markdown, front matter supportato, link interni, RSS, sitemap, SEO e deployment.
- Non introdurre CMS, database, tracking, cookie applicativi o dipendenze esterne senza mandato esplicito.
- Non modificare `dist/` a mano quando l’output è generato dalla build: intervenire sulla sorgente corretta e rigenerare.
- Preservare navigazione condivisa, menu mobile, responsive, canonical, Open Graph, JSON-LD, sitemap e feed.
- Per un articolo già approvato, il corpo è immutabile salvo correzione autorizzata; sono ammessi gli aggiustamenti tecnici strettamente necessari e dichiarati.

## Verifiche e handoff

Per modifiche ordinarie eseguire almeno:

```bash
npm run build
npm run check
git diff --check origin/main...HEAD
git status --short
```

Per modifiche visuali effettuare anche un controllo browser desktop/mobile quando l’ambiente lo consente; se non è disponibile, dichiararlo nella PR.

La PR deve indicare in modo conciso: obiettivo, contenuti modificati, eventuali decisioni editoriali, verifiche eseguite e ciò che resta da controllare. L’autore/proprietario effettua normalmente review e merge.

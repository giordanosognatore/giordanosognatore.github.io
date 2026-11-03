# Immagine simbolica di Giordano Sognatore

## Originale d’archivio

`viandante-cosmico-tra-mondi-celesti-originale.png` è una copia **byte per byte** del file «Viandante Cosmico tra Mondi Celesti.png» fornito dall’autore per questa integrazione. PNG RGB, 1254 × 1254 pixel, circa 3,4 MiB. L’autore ne ha indicato l’uso già attivo su Telegram e sulla propria pagina autore Amazon.

SHA-256 dell’originale:

```text
6efc4795cb8ee693a1753da30d5c17826decaae14336e28e505145ad941c32a6
```

Il file è conservato per archiviazione: non sovrascriverlo con immagini ottimizzate, ritagliate o prive di metadati. Si trova fuori da `dist/` e non viene distribuito da GitHub Pages; rimane comunque visibile a chi ha accesso al repository. La sua conservazione non concede una licenza di riutilizzo: valgono i diritti del progetto.

## Derivati pubblici

La pagina Autore usa soltanto:

- `dist/assets/autore-viandante-400.webp`: 400 × 400, circa 56 KiB;
- `dist/assets/autore-viandante-800.webp`: 800 × 800, circa 200 KiB.

Entrambi mantengono l’intera composizione quadrata, senza ritagli, sovrascritte o variazioni creative. I metadati dell’originale non sono trasferiti ai derivati. L’immagine è presentata esplicitamente come **immagine simbolica**, non come fotografia o ritratto realistico dell’autore. Non viene aggiunta alla Home, alle schede libro o alle anteprime social.

Per rigenerare i derivati con l’utility locale `cwebp` (libwebp), dalla radice del repository:

```sh
cwebp -q 85 -m 6 -metadata none -resize 400 400 materiali/autore/viandante-cosmico-tra-mondi-celesti-originale.png -o dist/assets/autore-viandante-400.webp
cwebp -q 85 -m 6 -metadata none -resize 800 800 materiali/autore/viandante-cosmico-tra-mondi-celesti-originale.png -o dist/assets/autore-viandante-800.webp
npm run build
npm run check
```

`cwebp` serve soltanto quando si rigenerano questi asset versionati, non per la build ordinaria o la CI. Non vengono introdotte dipendenze nel sito o nel browser. Versioni differenti dell’encoder possono produrre byte diversi a parità di dimensioni e qualità; non sostituire il sorgente d’archivio.

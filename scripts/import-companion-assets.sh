#!/usr/bin/env bash
set -euo pipefail

BESTIA="${1:-../bestia}"
SRC="${BESTIA%/}/documentazione/diario"
OUT="dist"

EPUB_SRC="${SRC}/Il giorno in cui nacque la Bestia - Ada Vesper - v2.epub"
PDF_SRC="${SRC}/Il giorno in cui nacque la Bestia - Ada Vesper - v2.pdf"
COVER_SRC="${SRC}/Il giorno in cui nacque la Bestia - copertina.png"

for f in "$EPUB_SRC" "$PDF_SRC" "$COVER_SRC"; do
  [[ -f "$f" ]] || { echo "File mancante: $f" >&2; exit 1; }
done

check_blob() {
  local file="$1" expected="$2"
  local actual
  actual="$(git hash-object "$file")"
  [[ "$actual" == "$expected" ]] || {
    echo "SHA Git inatteso per: $file" >&2
    echo "atteso: $expected" >&2
    echo "trovato: $actual" >&2
    exit 1
  }
}

check_blob "$EPUB_SRC" "ea70a59b55b268a487545f70206c8fac5ae210d9"
check_blob "$PDF_SRC"  "12d1b996cea3aa12225b5df0ebbeec3cad55149d"
check_blob "$COVER_SRC" "1165f5a3425bb1e5e7c3fc9209a41573648db125"

mkdir -p "$OUT/downloads" "$OUT/assets"
cp "$EPUB_SRC" "$OUT/downloads/il-giorno-in-cui-nacque-la-bestia-ada-vesper.epub"
cp "$PDF_SRC"  "$OUT/downloads/il-giorno-in-cui-nacque-la-bestia-ada-vesper.pdf"

COVER_OUT="$OUT/assets/companion-cover.png"
if command -v magick >/dev/null 2>&1; then
  magick "$COVER_SRC" -resize '640x1024>' -gravity center -crop '640x920+0+0' +repage -strip "$COVER_OUT"
elif command -v convert >/dev/null 2>&1; then
  convert "$COVER_SRC" -resize '640x1024>' -gravity center -crop '640x920+0+0' +repage -strip "$COVER_OUT"
elif command -v sips >/dev/null 2>&1; then
  sips -Z 1024 "$COVER_SRC" --out "$COVER_OUT" >/dev/null
  sips --cropToHeightWidth 920 640 --cropOffset 52 0 "$COVER_OUT" >/dev/null
else
  echo "Nessun ridimensionatore immagini disponibile: uso la cover PNG originale." >&2
  cp "$COVER_SRC" "$COVER_OUT"
fi

echo "Asset companion importati."
echo "  EPUB: $(wc -c < "$OUT/downloads/il-giorno-in-cui-nacque-la-bestia-ada-vesper.epub") byte"
echo "  PDF:  $(wc -c < "$OUT/downloads/il-giorno-in-cui-nacque-la-bestia-ada-vesper.pdf") byte"
echo "  Cover: $(wc -c < "$COVER_OUT") byte"
echo
echo "Ora esegui: npm run build && npm run check"

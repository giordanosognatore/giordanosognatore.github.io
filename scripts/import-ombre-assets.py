#!/usr/bin/env python3
"""Manual, deterministic import of the authorized Pages export; standard library only.
Not part of build/CI. Originals are read-only. See docs/ombre.md.
"""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED, ZIP_STORED
import hashlib, html, re, sys, struct, json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(sys.argv[1] if len(sys.argv) > 1 else '../ombre')
EXPECTED = {
 'epub': 'b8eaf7a646c3638bd0f3b9bdcab14c12da36bea3919e68a0f0054e06c6fcb87a',
 'pdf': '02c8a9a30eb7ff8dc121bfc3ad3ad3f66d96b33d688e4b18ab88cc877940cab8'
}
X = '{http://www.w3.org/1999/xhtml}'
E = html.escape

def normalized(s):
 return ' '.join(s.replace('\ufffc', '').split())

def png_without_metadata(data):
 assert data[:8] == b'\x89PNG\r\n\x1a\n'
 result = data[:8]; offset = 8
 while offset < len(data):
  size = struct.unpack('>I', data[offset:offset+4])[0]
  chunk = data[offset+4:offset+8]
  assert offset+size+12 <= len(data)
  # Preserve pixels, palette and transparency; drop EXIF, text and color profiles.
  if chunk in [b'IHDR', b'PLTE', b'IDAT', b'IEND', b'tRNS']:
   result += data[offset:offset+size+12]
  offset += size+12
 assert offset == len(data)
 return result

def main():
 originals = {ext: (SOURCE/'pages/export'/('Le Ombre Si Rivelano.'+ext)).read_bytes() for ext in EXPECTED}
 for ext, data in originals.items():
  assert hashlib.sha256(data).hexdigest() == EXPECTED[ext], 'Unapproved source '+ext
 from io import BytesIO
 with ZipFile(BytesIO(originals['epub'])) as source:
  css = source.read('OPS/css/book.css').decode()
  rules = {name: dict(re.findall(r'([\w-]+)\s*:\s*([^;]+);', body)) for name, body in re.findall(r'\.([\w-]+)\s*\{([^}]+)\}', css)}
  files = ['titlePageContent.xhtml']+['chapter-'+str(i)+'.xhtml' for i in range(1,26)]
  sections = []
  for filename in files:
   root = ET.fromstring(source.read('OPS/'+filename))
   body = root.find(X+'body').find(X+'div')
   title = 'Frontespizio' if filename == files[0] else normalized(''.join(body[0].itertext()))
   sections.append((filename, title, body))
  allowed = {'p','h1','span','br','a'}
  initials = 0
  def convert(node, inherited=(False, False)):
   nonlocal initials
   tag = node.tag.removeprefix(X)
   assert tag in allowed, 'Unexpected source tag '+tag
   assert set(node.attrib) <= {'class','id','style','href'}, 'Unexpected source attributes'
   style = {}
   for cls in node.get('class','').split():
    assert cls in rules, 'Unknown class '+cls
    style.update(rules[cls])
   style.update(dict(re.findall(r'([\w-]+)\s*:\s*([^;]+);', node.get('style',''))))
   italic = style.get('font-style', 'italic' if inherited[0] else 'normal') == 'italic'
   bold = style.get('font-weight', '700' if inherited[1] else '400') in ['700','bold']
   # Flatten graphical drop caps, retaining their actual, otherwise invisible letter.
   if 'background-image' in style:
    letter = ''.join(node.itertext())
    assert len(letter) == 1 and letter.isalpha()
    initials += 1
    return E(letter)
   content = E(node.text or '') + ''.join(convert(c,(italic,bold))+E(c.tail or '') for c in node)
   if italic != inherited[0]:
    assert italic, 'Unexpected italic reset'
    content = '<em>'+content+'</em>'
   if bold != inherited[1]:
    assert bold, 'Unexpected bold reset'
    content = '<strong>'+content+'</strong>'
   if tag == 'br':return '<br/>'
   if tag == 'span':return content
   if tag == 'a':
    assert node.get('href') in files
    return '<a href="'+E(node.get('href'))+'">'+content+'</a>'
   return '<'+tag+'>'+content+'</'+tag+'>'
  entries = {}
  checks = []
  def signature(node, inherited=(False,False)):
   style = {}
   for cls in node.get('class','').split():style.update(rules[cls])
   style.update(dict(re.findall(r'([\w-]+)\s*:\s*([^;]+);', node.get('style',''))))
   state = (style.get('font-style','italic' if inherited[0] else 'normal')=='italic', style.get('font-weight','700' if inherited[1] else '400') in ['bold','700'])
   def token(text):return ''.join(c+str(int(state[0]))+str(int(state[1])) for c in text if not c.isspace() and c!='\ufffc')
   value = token(node.text or '')
   for child in node:value += signature(child,state)+token(child.tail or '')
   return value
  for filename,title,body in sections:
   blocks = []
   for i,node in enumerate(body):
    if not normalized(''.join(node.itertext())):continue
    content = convert(node)
    if filename != files[0] and i == 0:
     content = re.sub(r'^<p>(.*)</p>$',r'<h1>\1</h1>',content,flags=re.S)
    content = content.replace('\ufffc','')
    blocks.append(content)
   rendered = '\n'.join(blocks)
   before = [normalized(''.join(n.itertext())) for n in body if normalized(''.join(n.itertext()))]
   after = [normalized(''.join(n.itertext())) for n in ET.fromstring('<div>'+rendered+'</div>')]
   assert before == after, 'Text/paragraph change '+filename
   checks.append({'file':filename,'title':title,'blocks':[hashlib.sha256(t.encode()).hexdigest() for t in before], 'lineBreaks':sum(len(list(n.iter(X+'br'))) for n in body if normalized(''.join(n.itertext()))), 'emphasisSha256':hashlib.sha256(''.join(signature(n) for n in body).encode()).hexdigest()})
   entries['OPS/'+filename] = ('<?xml version="1.0" encoding="UTF-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml" lang="it" xml:lang="it"><head><title>'+E(title)+'</title><link rel="stylesheet" href="book.css"/></head><body>'+rendered+'</body></html>').encode()
  assert initials == 23
  cover = png_without_metadata(source.read('OPS/images/copertina.png'))
  entries['OPS/cover.png'] = cover
  entries['OPS/cover.xhtml'] = b'<html xmlns="http://www.w3.org/1999/xhtml" lang="it" xml:lang="it"><head><title>Copertina</title><link rel="stylesheet" href="book.css"/></head><body><img class="cover" src="cover.png" alt="Copertina di Le Ombre Si Rivelano, Giordano Sognatore"/></body></html>'
  entries['OPS/book.css'] = b'body{font-family:serif;line-height:1.5;margin:5%;}p{margin:.65em 0;}h1{font-size:1.8em;line-height:1.2;margin:1em 0;}em{font-style:italic;}strong{font-weight:bold;}.cover{display:block;max-width:100%;max-height:95vh;margin:auto;}a{color:inherit;}'
  toc = ''.join('<li><a href="'+f+'">'+E(t)+'</a></li>' for f,t,_ in sections)
  entries['OPS/nav.xhtml'] = ('<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="it" xml:lang="it"><head><title>Indice</title></head><body><nav epub:type="toc"><h1>Indice</h1><ol><li><a href="cover.xhtml">Copertina</a></li>'+toc+'</ol></nav></body></html>').encode()
  manifest = ''.join('<item id="s'+str(i)+'" href="'+f+'" media-type="application/xhtml+xml"/>' for i,(f,_,_) in enumerate(sections))
  spine = ''.join('<itemref idref="s'+str(i)+'"/>' for i in range(len(sections)))
  entries['OPS/book.opf'] = ('<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="it"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">urn:uuid:3b647e54-436c-4f8c-b2d0-48368ac57eda</dc:identifier><dc:title>Le Ombre Si Rivelano</dc:title><dc:creator>Giordano Sognatore</dc:creator><dc:language>it</dc:language><dc:rights>© Giordano Sognatore. Tutti i diritti riservati.</dc:rights><meta property="dcterms:modified">2026-11-05T00:00:00Z</meta><meta property="rendition:layout">reflowable</meta></metadata><manifest><item id="cover-image" href="cover.png" media-type="image/png" properties="cover-image"/><item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="book.css" media-type="text/css"/>'+manifest+'</manifest><spine><itemref idref="cover"/>'+spine+'</spine></package>').encode()
  entries['META-INF/container.xml'] = b'<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OPS/book.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'
  destination = ROOT/'dist/downloads';destination.mkdir(parents=True,exist_ok=True)
  with ZipFile(destination/'le-ombre-si-rivelano.epub','w') as out:
   for filename,data in [('mimetype',b'application/epub+zip')]+sorted(entries.items()):
    info = ZipInfo(filename, (1980,1,1,0,0,0));info.compress_type = ZIP_STORED if filename == 'mimetype' else ZIP_DEFLATED
    info.create_system = 0;info.external_attr = 0o600 << 16
    out.writestr(info,data,compresslevel=9)
  (destination/'le-ombre-si-rivelano.pdf').write_bytes(originals['pdf'])
  (ROOT/'scripts/ombre-source-checks.json').write_text(json.dumps({'sourceSha256':EXPECTED['epub'],'sections':checks},ensure_ascii=False,indent=2)+'\n')
  print('Imported: 26 sections, 23 textual initials; original paragraphs/text verified; PDF unchanged.')
  for ext in EXPECTED:
   data=(destination/('le-ombre-si-rivelano.'+ext)).read_bytes()
   print(ext,len(data),hashlib.sha256(data).hexdigest())

if __name__ == '__main__':main()

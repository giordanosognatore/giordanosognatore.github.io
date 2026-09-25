// Local preview only. Production is a directory of static files.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
const args=process.argv.slice(2);
const port=Number(process.env.PORT||args[args.indexOf('--port')+1]||4173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
http.createServer(async(req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  // Also exercise the same output under the GitHub Pages project prefix.
  if(pathname.startsWith('/giordanosognatore/')) pathname=pathname.slice('/giordanosognatore'.length);
  let file=resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);return res.end();}
  if((await stat(file)).isDirectory()) file=resolve(file,'index.html');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(await readFile(file));
 }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(resolve(root,'404.html')));}
}).listen(port,'0.0.0.0',()=>console.log(`Static preview ready on ${port}`));

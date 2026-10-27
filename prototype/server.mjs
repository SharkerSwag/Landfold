// Local-only server for the throwaway visual prototype. No API or model backend.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.md': 'text/plain; charset=utf-8' };
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const target = path.resolve(root, '.' + relative);
  if (!target.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  try {
    let body = await readFile(target);
    if (path.extname(target) === '.html' && process.env.NODE_ENV === 'production') {
      body = body.toString().replace('data-mode="prototype"', 'data-mode="production"');
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch { response.writeHead(404).end('Not found'); }
});
server.listen(Number(process.env.PORT || 4178), '127.0.0.1', () => console.log('地景志视觉原型：http://127.0.0.1:' + server.address().port + '/?variant=A'));

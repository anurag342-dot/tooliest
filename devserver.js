// Simple dev server with directory index support for Tooliest's static routes.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.xml':  'application/xml',
  '.txt':  'text/plain',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
};

const STATIC_ROUTE_MAP = {
  '/about': '/about/index.html',
  '/contact': '/contact/index.html',
  '/privacy': '/privacy/index.html',
  '/terms': '/terms/index.html',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  const legacyToolMatch = urlPath.match(/^\/tool\/([^/]+)\/?$/);
  if (legacyToolMatch) {
    res.writeHead(301, { Location: `/${legacyToolMatch[1]}` });
    res.end();
    return;
  }
  if (STATIC_ROUTE_MAP[urlPath]) {
    urlPath = STATIC_ROUTE_MAP[urlPath];
  }
  if (urlPath.endsWith('/')) {
    urlPath += 'index.html';
  } else if (urlPath === '/') {
    urlPath = '/index.html';
  }

  let filePath = path.join(ROOT, urlPath);

  // Security: stay within root
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(ROOT, 'index.html')).pipe(res);
  }
});

server.listen(PORT, () => {
  console.log(`[Tooliest Dev] Server running at http://localhost:${PORT}`);
  console.log('[Tooliest Dev] History routes and static tool pages are enabled.');
});

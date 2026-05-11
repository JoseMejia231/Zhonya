const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.join(__dirname, 'dist');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3002);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function contentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function safeResolve(requestPath) {
  const normalized = path.normalize(requestPath).replace(/^(\.\.[\\/])+/, '');
  const resolved = path.join(ROOT, normalized);
  if (!resolved.startsWith(ROOT)) return path.join(ROOT, 'index.html');
  return resolved;
}

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(body);
}

http
  .createServer((req, res) => {
    try {
      const reqUrl = new URL(req.url || '/', `http://${req.headers.host || HOST}`);
      let pathname = decodeURIComponent(reqUrl.pathname);
      if (pathname === '/') pathname = '/index.html';

      let filePath = safeResolve(pathname);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(ROOT, 'index.html');
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          send(res, 404, 'Not found');
          return;
        }

        res.writeHead(200, {
          'Content-Type': contentType(filePath),
          'Cache-Control': path.extname(filePath) === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
        });
        res.end(data);
      });
    } catch (error) {
      send(res, 500, `Server error: ${error instanceof Error ? error.message : String(error)}`);
    }
  })
  .listen(PORT, HOST, () => {
    console.log(`Serving ${ROOT} at http://${HOST}:${PORT}`);
  });


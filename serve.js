const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg' };
http.createServer((req, res) => {
  let file = req.url === '/' ? '/index.html' : req.url;
  const fp = path.join(dir, file);
  const ext = path.extname(fp);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(8034, '0.0.0.0', () => console.log('Serving on http://0.0.0.0:8034'));

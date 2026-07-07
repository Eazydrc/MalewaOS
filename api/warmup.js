const http = require('http');
const fs = require('fs');
const port = parseInt(process.env.PORT || '3000', 10);
fs.writeFileSync('/tmp/warmup.pid', String(process.pid));
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'starting' }));
}).listen(port, '0.0.0.0', () => {
  process.stderr.write(`[WARMUP] pid=${process.pid} port=${port}\n`);
});

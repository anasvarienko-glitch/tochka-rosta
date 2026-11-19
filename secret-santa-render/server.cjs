'use strict';
const http = require('node:http');
const UPSTREAM = 'https://ozonfresh-secretsanta.anasvarienko.chatgpt.site';
const paths = new Set(['/', '/index.html', '/screens.js', '/screens.css', '/music.js', '/snowgame.js', '/fresh-logo.svg', '/courier-moscow-unified.png']);
const apiPaths = new Set(['state', 'fact', 'register', 'login', 'logout', 'recover', 'admin-password', 'admin-summary', 'admin-delete-user', 'test-draw', 'draw', 'vote', 'profile', 'wish'].map(p => '/api/' + p));
function createServer({ upstream = UPSTREAM, publicOrigin = process.env.RENDER_EXTERNAL_URL, fetchImpl = fetch } = {}) {
  return http.createServer(async (req, res) => {
    const reply = (status, error) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify({ error }));
    };
    try {
      const localOrigin = publicOrigin || 'http://' + req.headers.host;
      const url = new URL(req.url, localOrigin);
      if (url.pathname === '/healthz' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok'); return;
      }
      if (!paths.has(url.pathname) && !apiPaths.has(url.pathname)) return reply(404, 'Not found');
      if (!['GET', 'HEAD', 'POST'].includes(req.method)) return reply(405, 'Method not allowed');
      if (req.method === 'POST' && !apiPaths.has(url.pathname)) return reply(405, 'Method not allowed');
      if (req.method === 'POST' && req.headers.origin !== new URL(localOrigin).origin) return reply(403, 'Request from another site is not allowed');
      const headers = { Accept: req.headers.accept || '*/*' };
      const session = (req.headers.cookie || '').match(/(?:^|;\s*)fresh_santa_session=([a-f0-9]{64})(?:;|$)/);
      if (session) headers.Cookie = 'fresh_santa_session=' + session[1];
      let body;
      if (req.method === 'POST') {
        if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return reply(415, 'Use application/json');
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > 20000) return reply(413, 'Request too large'); chunks.push(chunk); }
        body = Buffer.concat(chunks);
        headers['Content-Type'] = 'application/json';
        headers.Origin = new URL(upstream).origin;
      }
      const target = new URL(url.pathname === '/index.html' ? '/' : url.pathname, upstream);
      target.search = url.search;
      const response = await fetchImpl(target, { method: req.method, headers, body, redirect: 'error', signal: AbortSignal.timeout(25000) });
      const out = {};
      for (const name of ['content-type', 'content-security-policy', 'cache-control', 'x-content-type-options', 'referrer-policy', 'retry-after']) {
        const value = response.headers.get(name); if (value) out[name] = value;
      }
      if (apiPaths.has(url.pathname)) out['cache-control'] = 'no-store';
      const cookies = response.headers.getSetCookie();
      if (cookies.length) out['set-cookie'] = cookies.filter(c => c.startsWith('fresh_santa_session='));
      res.writeHead(response.status, out);
      if (req.method === 'HEAD') return res.end();
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      if (!res.headersSent) reply(502, 'The game server is temporarily unavailable. Please try again.');
      else res.end();
    }
  });
}
if (require.main === module) {
  if (!process.env.RENDER_EXTERNAL_URL && process.env.NODE_ENV === 'production') throw new Error('Set RENDER_EXTERNAL_URL to this service HTTPS origin');
  createServer().listen(Number(process.env.PORT) || 10000, '0.0.0.0', () => console.log('Secret Santa gateway listening'));
}
module.exports = { createServer };

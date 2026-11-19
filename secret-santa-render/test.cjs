const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('./server.cjs');
test('gateway preserves API sessions, enforces origin, limits paths and fails safely', async () => {
  const calls = [];
  const cookie = 'fresh_santa_session=' + 'a'.repeat(64);
  let unavailable = false;
  const server = createServer({
    publicOrigin: 'https://game.example',
    fetchImpl: async (url, options) => {
      if (unavailable) throw Error('unreachable');
      calls.push({ url: String(url), ...options });
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie + '; Path=/; HttpOnly; Secure; SameSite=Lax' } });
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    assert.equal((await fetch(base + '/healthz')).status, 200);
    assert.equal(calls.length, 0);
    assert.equal((await fetch(base + '/api/profile', { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
    assert.equal(calls.length, 0);
    const r = await fetch(base + '/api/login', { method: 'POST', headers: { Origin: 'https://game.example', 'Content-Type': 'application/json', Cookie: cookie + '; unrelated=secret' }, body: '{"email":"a@example.com","password":"testpassword"}' });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.equal(calls[0].headers.Origin, 'https://ozonfresh-secretsanta.anasvarienko.chatgpt.site');
    assert.equal(calls[0].headers.Cookie, cookie);
    assert.equal(calls[0].body.toString(), '{"email":"a@example.com","password":"testpassword"}');
    assert.equal((await fetch(base + '/api/fact?exclude=abc')).status, 200);
    assert.ok(calls[1].url.endsWith('/api/fact?exclude=abc'));
    assert.equal((await fetch(base + '/organizer-access.txt')).status, 404);
    assert.equal((await fetch(base + '/api/unknown')).status, 404);
    assert.equal((await fetch(base + '/api/login', { method: 'POST', headers: { Origin: 'https://game.example', 'Content-Type': 'application/json' }, body: 'x'.repeat(20001) })).status, 413);
    assert.equal(calls.length, 2);
    unavailable = true;
    assert.equal((await fetch(base + '/api/state')).status, 502);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

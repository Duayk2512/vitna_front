import test from 'node:test';
import assert from 'node:assert/strict';
process.env.VITNA_BACKEND_URL = 'https://backend.test';
const { createConfig } = await import('../vercel.mjs');
test('API routes proxy to the configured public backend and never to index.html', () => {
  const config = createConfig('https://backend.test/');
  assert.deepEqual(config.rewrites, [
    { source: '/api', destination: 'https://backend.test/api' },
    { source: '/api/:path*', destination: 'https://backend.test/api/:path*' }
  ]);
  assert.equal(config.outputDirectory, 'dist/frontend/browser');
  assert.equal(config.headers[0].headers[0].value, 'private, no-store');
});
test('Missing, private, non-HTTPS and malformed backend origins prevent deployment', () => {
  for (const value of ['', 'invalid', 'http://backend.test', 'https://localhost', 'https://db.railway.internal', 'https://user:secret@backend.test', 'https://backend.test/api', 'https://backend.test?x=1', 'https://backend.test#x']) {
    assert.throws(() => createConfig(value));
  }
});

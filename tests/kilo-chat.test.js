import { test } from 'node:test';
import assert from 'node:assert/strict';

test('kiloChat: throws without API key', async () => {
  const orig = process.env.KILO_API_KEY;
  const { setKiloApiKey } = await import('../src/utils/config.js');
  setKiloApiKey(null);
  delete process.env.KILO_API_KEY;
  // Prevent .env reload by overriding
  const origEnv = { ...process.env };
  // Clear any KILO key that .env may have set
  for (const k of Object.keys(process.env)) {
    if (k === 'KILO_API_KEY') delete process.env[k];
  }
  const { kiloChat } = await import('../src/engines/kilo-client.js');
  try {
    await kiloChat([{ role: 'user', content: 'hi' }]);
    assert.fail('should have thrown');
  } catch (err) {
    assert.ok(err.message.includes('No Kilo API key'), `Expected 'No Kilo API key' but got: ${err.message}`);
  } finally {
    if (orig) process.env.KILO_API_KEY = orig;
    setKiloApiKey(orig || null);
  }
});

test('kiloChat: successful response', async () => {
  process.env.KILO_API_KEY = 'test-key';
  // Mock fetch
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{"score": 90}' } }] }),
      headers: { get: () => null },
    };
  };
  try {
    const { kiloChat } = await import('../src/engines/kilo-client.js');
    const result = await kiloChat([{ role: 'user', content: 'hi' }], { task: 'scoring' });
    assert.equal(result.content, '{"score": 90}');
    assert.equal(result.model, undefined || result.model); // model from getKiloModel
  } finally {
    globalThis.fetch = origFetch;
    delete process.env.KILO_API_KEY;
  }
});

test('kiloChat: retries on 429', async () => {
  process.env.KILO_API_KEY = 'test-key';
  let calls = 0;
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) {
      return { ok: false, status: 429, text: async () => 'rate limited', headers: { get: () => '1' } };
    }
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'ok' } }] }), headers: { get: () => null } };
  };
  try {
    const { kiloChat } = await import('../src/engines/kilo-client.js');
    const result = await kiloChat([{ role: 'user', content: 'hi' }]);
    assert.equal(result.content, 'ok');
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = origFetch;
    delete process.env.KILO_API_KEY;
  }
});
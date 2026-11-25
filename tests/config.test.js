import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getKiloApiKey, setKiloApiKey } from '../src/utils/config.js';

test('config: getKiloApiKey returns env or stored', () => {
  const key = getKiloApiKey();
  // Should return a string or null/undefined
  assert.ok(key === null || key === undefined || typeof key === 'string');
});

test('config: setKiloApiKey stores value', () => {
  setKiloApiKey('test-key-123');
  assert.equal(getKiloApiKey(), 'test-key-123');
  // cleanup
  setKiloApiKey(null);
});
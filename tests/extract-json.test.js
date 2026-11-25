import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractJson } from '../src/engines/kilo-client.js';

test('extractJson: fenced code block', () => {
  const text = 'Here is the result:\n```json\n{"score": 88, "reason": "good match"}\n```';
  const result = extractJson(text);
  assert.deepEqual(result, { score: 88, reason: 'good match' });
});

test('extractJson: fenced without language', () => {
  const text = '```\n{"a": 1}\n```';
  assert.deepEqual(extractJson(text), { a: 1 });
});

test('extractJson: raw JSON object', () => {
  const text = 'The answer is {"score": 42} thanks.';
  assert.deepEqual(extractJson(text), { score: 42 });
});

test('extractJson: raw JSON array', () => {
  const text = 'list: [1, 2, 3]';
  assert.deepEqual(extractJson(text), [1, 2, 3]);
});

test('extractJson: literal newlines in strings repaired', () => {
  const text = '{"msg": "line1\nline2"}';
  const result = extractJson(text);
  assert.equal(result.msg, 'line1\nline2');
});

test('extractJson: trailing comma repaired', () => {
  const text = '{"a": 1, "b": 2,}';
  assert.deepEqual(extractJson(text), { a: 1, b: 2 });
});

test('extractJson: nested objects', () => {
  const text = '{"outer": {"inner": [1,2]}, "x": 3}';
  assert.deepEqual(extractJson(text), { outer: { inner: [1, 2] }, x: 3 });
});

test('extractJson: returns null for no JSON', () => {
  assert.equal(extractJson('no json here'), null);
});

test('extractJson: returns null for empty', () => {
  assert.equal(extractJson(''), null);
  assert.equal(extractJson(null), null);
});

test('extractJson: multiple candidates picks first valid', () => {
  const text = 'first {bad json} then {"ok": true}';
  assert.deepEqual(extractJson(text), { ok: true });
});

test('extractJson: escaped quotes in strings', () => {
  const text = '{"msg": "he said \\"hi\\""}';
  const result = extractJson(text);
  assert.equal(result.msg, 'he said "hi"');
});
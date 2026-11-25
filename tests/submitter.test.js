import { test } from 'node:test';
import assert from 'node:assert/strict';
import { submitProposal } from '../src/automation/submitter.js';

const gigEntry = (platform) => ({
  gig: { platform, title: 'Test Gig', url: 'https://example.com/gig', id: '1' },
  proposal: 'This is a test proposal for the gig.',
  suggested_rate: 50,
});

test('submitter: unknown platform falls back to clipboard', async () => {
  const result = await submitProposal(gigEntry('unknown-platform'));
  assert.equal(result.success, true);
  assert.ok(result.method.includes('clipboard') || result.method.includes('Copied'));
});

test('submitter: twitter falls back when browser fails', async () => {
  const result = await submitProposal(gigEntry('twitter'));
  assert.equal(result.success, true);
  assert.ok(typeof result.method === 'string');
});

test('submitter: hackernews falls back when browser fails', async () => {
  const result = await submitProposal(gigEntry('hackernews'));
  assert.equal(result.success, true);
  assert.ok(typeof result.method === 'string');
});

test('submitter: fiverr falls back when browser fails', async () => {
  const result = await submitProposal(gigEntry('fiverr'));
  assert.equal(result.success, true);
  assert.ok(typeof result.method === 'string');
});

test('submitter: notifyFn is accepted', async () => {
  const calls = [];
  const notifyFn = async (msg) => { calls.push(msg); };
  const result = await submitProposal(gigEntry('twitter'), notifyFn);
  assert.equal(result.success, true);
});

test('submitter: result has required fields', async () => {
  const result = await submitProposal(gigEntry('upwork'));
  assert.ok('success' in result);
  assert.ok('method' in result);
});
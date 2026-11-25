import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectCaptcha, handleCaptcha } from '../src/browser/captcha-manager.js';

function mockPage({ selectors = [], url = 'https://example.com' } = {}) {
  return {
    url: () => url,
    locator: (sel) => ({
      count: async () => (selectors.includes(sel) ? 1 : 0),
    }),
    waitForTimeout: async () => {},
  };
}

test('detectCaptcha: no captcha', async () => {
  const page = mockPage({ selectors: [] });
  const result = await detectCaptcha(page);
  assert.equal(result.detected, false);
});

test('detectCaptcha: recaptcha iframe', async () => {
  const page = mockPage({ selectors: ['iframe[src*="recaptcha"]'] });
  const result = await detectCaptcha(page);
  assert.equal(result.detected, true);
});

test('detectCaptcha: cloudflare turnstile', async () => {
  const page = mockPage({ selectors: ['[class*="cf-turnstile"]'] });
  const result = await detectCaptcha(page);
  assert.equal(result.detected, true);
});

test('handleCaptcha: no captcha detected', async () => {
  const page = mockPage({ selectors: [] });
  const result = await handleCaptcha(page, null);
  assert.equal(result.resolved, true);
  assert.equal(result.method, 'none');
});

test('handleCaptcha: captcha present, notifyFn called on failure', async () => {
  const page = mockPage({ selectors: ['iframe[src*="recaptcha"]'], url: 'https://example.com/page' });
  // waitForCaptchaResolution will keep detecting (never resolves) → timeout
  // Override waitForTimeout to speed up
  page.waitForTimeout = async () => {};
  const notifyCalls = [];
  const notifyFn = async (msg) => { notifyCalls.push(msg); };
  const result = await handleCaptcha(page, notifyFn);
  // Since detectCaptcha keeps returning true, it should fail and notify
  assert.equal(result.resolved, false);
  assert.equal(result.method, 'manual');
  assert.ok(notifyCalls.length > 0, 'notifyFn should be called');
  assert.ok(notifyCalls[0].includes('CAPTCHA non résolu'));
});
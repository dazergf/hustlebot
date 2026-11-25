/**
 * CAPTCHA detection and resolution manager.
 * Detects reCAPTCHA, hCaptcha, Cloudflare Turnstile.
 * Uses NopeCHA extension for auto-resolution, falls back to manual.
 */

const CAPTCHA_SELECTORS = [
  'iframe[src*="recaptcha"]',
  'iframe[src*="hcaptcha"]',
  'iframe[src*="challenges.cloudflare.com"]',
  '[class*="cf-turnstile"]',
  '#cf-challenge-running',
  '.g-recaptcha',
];

export async function detectCaptcha(page) {
  for (const selector of CAPTCHA_SELECTORS) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) return { detected: true, type: selector };
    } catch {}
  }
  return { detected: false, type: null };
}

export async function waitForCaptchaResolution(page, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { detected } = await detectCaptcha(page);
    if (!detected) return true;
    await page.waitForTimeout(2000);
  }
  return false;
}

export async function handleCaptcha(page, notifyFn) {
  const { detected, type } = await detectCaptcha(page);
  if (!detected) return { resolved: true, method: 'none' };

  // Try NopeCHA auto-resolution (wait up to 30s)
  const resolved = await waitForCaptchaResolution(page, 30000);
  if (resolved) {
    return { resolved: true, method: 'nopecha' };
  }

  // Fallback: alert via Telegram
  const url = page.url();
  if (notifyFn) {
    await notifyFn(`⚠️ CAPTCHA non résolu (${type}) sur ${url} — action manuelle requise`);
  }
  return { resolved: false, method: 'manual', url, type };
}

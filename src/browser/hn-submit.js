import { launchBrowser, isLoggedIn, waitForLogin } from './playwright-manager.js';
import { handleCaptcha } from './captcha-manager.js';
import { ensureLoggedIn, loginWithCredentials } from './auto-login.js';
import { log, warn } from '../utils/logger.js';

export async function submitHackerNewsProposal(gig, proposal, notifyFn) {
  const { context, page } = await launchBrowser({ headless: false });
  try {
    // Ensure session (persistent or auto-login)
    const auth = await ensureLoggedIn(page, 'hackernews', notifyFn);
    if (!auth.success) {
      warn('[HN] Not logged in — falling back to clipboard');
      return { success: false, method: 'clipboard', error: auth.error };
    }
    log(`[HN] Session ready via ${auth.method}`);

    await page.goto(gig.url);
    await page.waitForTimeout(3000);

    const textarea = page.locator('textarea[name="text"], textarea').first();
    if (await textarea.count() === 0) {
      warn('[HN] Comment textarea not found — falling back to clipboard');
      return { success: false, method: 'clipboard', error: 'no textarea' };
    }

    await textarea.fill(proposal.substring(0, 500));
    await page.waitForTimeout(1000);

    const submitBtn = page.locator('input[type="submit"], button:has-text("add comment"), button:has-text("reply")').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      const captcha = await handleCaptcha(page, notifyFn);
      if (!captcha.resolved) return { success: false, method: 'manual', ...captcha };
      return { success: true, method: 'Playwright + NopeCHA' };
    }

    return { success: false, method: 'clipboard', error: 'no submit button' };
  } catch (err) {
    warn(`[HN] Error: ${err.message}`);
    return { success: false, method: 'clipboard', error: err.message };
  } finally {
    await context.close();
  }
}

export async function setupHackerNewsSession() {
  log('[HN] Starting login session setup...');
  const { context, page } = await launchBrowser({ headless: false });
  try {
    const loggedIn = await isLoggedIn(page, 'hackernews');
    if (loggedIn) {
      log('[HN] Already logged in!');
      return { success: true, message: 'Already logged into Hacker News' };
    }

    // Tentative automatique avec credentials .env
    const auto = await loginWithCredentials(page, {
      email: process.env.HACKERNEWS_USERNAME,
      password: process.env.HACKERNEWS_PASSWORD,
      platform: 'hackernews',
    });

    if (auto.success) {
      log('[HN] Auto-login successful — session saved');
      return { success: true, message: 'Hacker News session saved (auto-login)' };
    }

    log(`[HN] Auto-login failed: ${auto.error}. Falling back to manual login.`);
    await waitForLogin(page, 'hackernews');
    return { success: true, message: 'Hacker News session saved (manual login)' };
  } finally {
    await context.close();
  }
}

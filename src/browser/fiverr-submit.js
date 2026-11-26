import { launchBrowser, isLoggedIn, waitForLogin } from './playwright-manager.js';
import { handleCaptcha } from './captcha-manager.js';
import { ensureLoggedIn, loginWithCredentials } from './auto-login.js';
import { log, warn } from '../utils/logger.js';

export async function submitFiverrProposal(gig, proposal, notifyFn) {
  const { context, page } = await launchBrowser({ headless: false });
  try {
    // Ensure session (persistent or auto-login)
    const auth = await ensureLoggedIn(page, 'fiverr', notifyFn);
    if (!auth.success) {
      warn('[FIVERR] Not logged in — falling back to clipboard');
      return { success: false, method: 'clipboard', error: auth.error };
    }
    log(`[FIVERR] Session ready via ${auth.method}`);

    await page.goto(gig.url);
    await page.waitForTimeout(3000);

    const chatInput = page.locator('textarea[placeholder*="message"], div[contenteditable="true"], input[placeholder*="Type"]').first();
    if (await chatInput.count() === 0) {
      warn('[FIVERR] Chat input not found — falling back to clipboard');
      return { success: false, method: 'clipboard', error: 'no chat input' };
    }

    await chatInput.fill(proposal);
    await page.waitForTimeout(1000);

    const sendBtn = page.locator('button:has-text("Send"), button[type="submit"], [class*="send"]').first();
    if (await sendBtn.count() > 0) {
      await sendBtn.click();
      await page.waitForTimeout(3000);
      const captcha = await handleCaptcha(page, notifyFn);
      if (!captcha.resolved) return { success: false, method: 'manual', ...captcha };
      return { success: true, method: 'Playwright + NopeCHA' };
    }

    return { success: false, method: 'clipboard', error: 'no send button' };
  } catch (err) {
    warn(`[FIVERR] Error: ${err.message}`);
    return { success: false, method: 'clipboard', error: err.message };
  } finally {
    await context.close();
  }
}

export async function setupFiverrSession() {
  log('[FIVERR] Starting login session setup...');
  const { context, page } = await launchBrowser({ headless: false });
  try {
    const loggedIn = await isLoggedIn(page, 'fiverr');
    if (loggedIn) {
      log('[FIVERR] Already logged in!');
      return { success: true, message: 'Already logged into Fiverr' };
    }

    // Tentative automatique avec credentials .env
    const auto = await loginWithCredentials(page, {
      email: process.env.FIVERR_EMAIL,
      password: process.env.FIVERR_PASSWORD,
      platform: 'fiverr',
    });

    if (auto.success) {
      log('[FIVERR] Auto-login successful — session saved');
      return { success: true, message: 'Fiverr session saved (auto-login)' };
    }

    log(`[FIVERR] Auto-login failed: ${auto.error}. Falling back to manual login.`);
    await waitForLogin(page, 'fiverr');
    return { success: true, message: 'Fiverr session saved (manual login)' };
  } finally {
    await context.close();
  }
}

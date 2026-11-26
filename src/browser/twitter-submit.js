import { launchBrowser, isLoggedIn, waitForLogin } from './playwright-manager.js';
import { handleCaptcha } from './captcha-manager.js';
import { ensureLoggedIn, loginWithCredentials } from './auto-login.js';
import { log, warn } from '../utils/logger.js';

export async function submitTwitterProposal(gig, proposal, notifyFn) {
  const { context, page } = await launchBrowser({ headless: false });
  try {
    // Ensure session (persistent or auto-login)
    const auth = await ensureLoggedIn(page, 'twitter', notifyFn);
    if (!auth.success) {
      warn('[TWITTER] Not logged in — falling back to clipboard');
      return { success: false, method: 'clipboard', error: auth.error };
    }
    log(`[TWITTER] Session ready via ${auth.method}`);

    const profileUrl = gig.url || 'https://twitter.com';
    await page.goto(profileUrl);
    await page.waitForTimeout(3000);

    // Try to open DM
    const dmButton = page.locator('a[href*="/messages/compose"], button:has-text("Message")').first();
    if (await dmButton.count() > 0) {
      await dmButton.click();
      await page.waitForTimeout(2000);
    }

    // Find message input
    const input = page.locator('div[role="textbox"], textarea[placeholder*="message"], input[placeholder*="message"]').first();
    if (await input.count() === 0) {
      warn('[TWITTER] Message input not found — falling back to clipboard');
      return { success: false, method: 'clipboard', error: 'no input field' };
    }

    await input.fill(proposal.substring(0, 280));
    await page.waitForTimeout(1000);

    // Send
    const sendBtn = page.locator('button:has-text("Send"), [data-testid="dmComposerSendButton"]').first();
    if (await sendBtn.count() > 0) {
      await sendBtn.click();
      await page.waitForTimeout(2000);
      const captcha = await handleCaptcha(page, notifyFn);
      if (!captcha.resolved) return { success: false, method: 'manual', ...captcha };
      return { success: true, method: 'Playwright + NopeCHA' };
    }

    return { success: false, method: 'clipboard', error: 'no send button' };
  } catch (err) {
    warn(`[TWITTER] Error: ${err.message}`);
    return { success: false, method: 'clipboard', error: err.message };
  } finally {
    await context.close();
  }
}

export async function setupTwitterSession() {
  log('[TWITTER] Starting login session setup...');
  const { context, page } = await launchBrowser({ headless: false });
  try {
    const loggedIn = await isLoggedIn(page, 'twitter');
    if (loggedIn) {
      log('[TWITTER] Already logged in!');
      return { success: true, message: 'Already logged into X/Twitter' };
    }

    // Tentative automatique avec credentials .env
    const auto = await loginWithCredentials(page, {
      email: process.env.TWITTER_EMAIL,
      password: process.env.TWITTER_PASSWORD,
      platform: 'twitter',
    });

    if (auto.success) {
      log('[TWITTER] Auto-login successful — session saved');
      return { success: true, message: 'X/Twitter session saved (auto-login)' };
    }

    log(`[TWITTER] Auto-login failed: ${auto.error}. Falling back to manual login.`);
    await waitForLogin(page, 'twitter');
    return { success: true, message: 'X/Twitter session saved (manual login)' };
  } finally {
    await context.close();
  }
}

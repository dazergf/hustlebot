import { isLoggedIn, launchBrowser } from '../playwright-manager.js';
import { log, warn } from '../../utils/logger.js';
import { LOGIN_SUCCESS_CHECKS, LOGIN_URLS, normalizePlatform, getCredentialEnv } from './config.js';
import { loginWithCredentials } from './credentials.js';

const GOOGLE_SESSION_COOKIES = ['SID', 'SAPISID', '__Secure-1PSID', '__Secure-3PSID'];

/**
 * Click the "Continue with Google" button on a platform login page.
 * Returns true when a button was found and clicked.
 */
async function clickGoogleButton(page) {
  const selectors = [
    'button:has-text("Google")',
    'a:has-text("Google")',
    '[role="button"]:has-text("Google")',
    'input[type="button"][value*="Google" i]',
    'input[type="submit"][value*="Google" i]',
  ];

  for (const selector of selectors) {
    const button = page.locator(selector).first();
    try {
      if ((await button.count()) > 0 && (await button.isVisible())) {
        await button.click();
        return true;
      }
    } catch {
      // try next selector
    }
  }

  const googleFrame = page.frameLocator('iframe[src*="accounts.google.com"]').first();
  try {
    const frameButton = googleFrame.locator('button, [role="button"]').first();
    if ((await frameButton.count()) > 0) {
      await frameButton.click();
      return true;
    }
  } catch {
    // no iframe
  }

  return false;
}

/**
 * Wait for an OAuth popup/redirect to complete without navigating away.
 */
async function waitForOAuthComplete(page, platform, timeoutMs = 5 * 60 * 1000) {
  const check = LOGIN_SUCCESS_CHECKS[platform];
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      for (const p of page.context().pages()) {
        if (!p.isClosed() && check(p.url())) {
          return { success: true, method: 'google-oauth', url: p.url() };
        }
      }
    } catch {
      // page may be navigating
    }
    await page.waitForTimeout(2000);
  }

  return {
    success: false,
    method: 'google-oauth',
    error: 'Google login timed out after 5 minutes',
    url: page.url(),
  };
}

/**
 * Google sign-in flow: open the platform login page, click "Continue with
 * Google", then let the user finish the OAuth consent manually (2FA, account
 * chooser, etc.). The persistent browser profile saves the resulting session.
 */
export async function loginWithGoogle(page, platform) {
  platform = normalizePlatform(platform);

  if (platform === 'hackernews') {
    return { success: false, method: 'google-oauth', error: 'Hacker News does not support Google login' };
  }

  const loginUrl = LOGIN_URLS[platform];
  if (!loginUrl) {
    return { success: false, method: 'google-oauth', error: `Plateforme non supportée: ${platform}` };
  }

  log(`[GOOGLE-LOGIN][${platform}] Ouverture de ${loginUrl}`);
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const popupPromise = page.context().waitForEvent('page', { timeout: 8000 }).catch(() => null);

  const clicked = await clickGoogleButton(page);
  if (!clicked) {
    return {
      success: false,
      method: 'google-oauth',
      error: 'Bouton "Continuer avec Google" introuvable — connexion manuelle requise',
    };
  }

  const popup = await popupPromise;
  const activePage = popup || page;

  log('[GOOGLE-LOGIN] Connecte-toi avec Google dans la fenêtre (compte + 2FA si demandé)...');
  log('[GOOGLE-LOGIN] La session sera sauvegardée automatiquement après connexion.');

  const result = await waitForOAuthComplete(page, platform);
  if (result.success && !activePage.isClosed()) {
    await page.waitForTimeout(2000);
  }
  return result;
}

/**
 * Wait for a manual Google sign-in (accounts.google.com -> myaccount.google.com).
 */
async function waitForGoogleLogin(page, timeoutMs = 5 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const url = page.url();
      if (LOGIN_SUCCESS_CHECKS.google(url)) {
        return { success: true, url };
      }

      const cookies = await page.context().cookies('https://accounts.google.com');
      const hasSession = cookies.some(c => GOOGLE_SESSION_COOKIES.includes(c.name));
      if (hasSession) {
        return { success: true, url };
      }
    } catch {
      // page may be navigating
    }
    await page.waitForTimeout(2000);
  }

  return { success: false, error: 'Google login timed out after 5 minutes', url: page.url() };
}

/**
 * Full Google login setup: launch a visible browser, reuse an existing session
 * when possible, otherwise run the manual Google OAuth flow.
 *
 * Use platform "google" to sign in to Google itself first. The persistent
 * profile then lets `auth <platform> --google` reuse that Google session.
 */
export async function setupGoogleSession(platform) {
  platform = normalizePlatform(platform);

  if (platform === 'hackernews') {
    return { success: false, error: 'Hacker News ne supporte pas la connexion Google.' };
  }

  const { context, page } = await launchBrowser({ headless: false });
  try {
    if (platform === 'google') {
      if (await isLoggedIn(page, 'google')) {
        return { success: true, message: 'Google déjà connecté (session persistante)' };
      }

      const creds = getCredentialEnv('google');
      if (creds.email && creds.password) {
        log('[GOOGLE-LOGIN] Tentative auto-login Google avec .env...');
        const auto = await loginWithCredentials(page, { ...creds, platform: 'google' });
        if (auto.success) {
          return { success: true, message: 'Google connecté via .env — session sauvegardée' };
        }
        warn(`[GOOGLE-LOGIN] Auto-login échoué: ${auto.error}`);
      }

      await page.goto(LOGIN_URLS.google, { waitUntil: 'domcontentloaded', timeout: 30000 });
      log('[GOOGLE-LOGIN] Connecte-toi à ton compte Google (email + mot de passe + 2FA si demandé)...');
      log('[GOOGLE-LOGIN] La session sera sauvegardée dans ~/.hustlebot/browser-profile.');

      const result = await waitForGoogleLogin(page);
      return {
        success: result.success,
        message: result.success ? 'Google connecté — session sauvegardée' : null,
        error: result.error,
      };
    }

    if (await isLoggedIn(page, platform)) {
      return { success: true, message: `${platform} déjà connecté (session persistante)` };
    }

    if (!(await isLoggedIn(page, 'google'))) {
      return {
        success: false,
        error: 'Aucune session Google détectée. Lance d’abord: hustlebot auth google',
      };
    }

    const result = await loginWithGoogle(page, platform);
    return {
      success: result.success,
      message: result.success ? `${platform} connecté via Google — session sauvegardée` : null,
      error: result.error,
    };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    await context.close();
  }
}

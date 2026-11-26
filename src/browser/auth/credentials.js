import { handleCaptcha } from '../captcha-manager.js';
import { isLoggedIn } from '../playwright-manager.js';
import { log, warn } from '../../utils/logger.js';
import { LOGIN_URLS, getCredentialEnv, normalizePlatform } from './config.js';

const EMAIL_SELECTORS = {
  upwork: 'input[name="username"], input[type="email"]',
  freelancer: 'input[name="email"], input[type="email"]',
  twitter: 'input[autocomplete="username"], input[name="text"], input[type="text"]',
  hackernews: 'input[name="acct"], input[type="text"]',
  fiverr: 'input[name="email"], input[type="email"]',
};

const PASSWORD_SELECTOR = 'input[name="password"], input[type="password"]';

const SUBMIT_SELECTOR = [
  'button:has-text("Se connecter")',
  'button:has-text("Connexion")',
  'button:has-text("Log in")',
  'button:has-text("Login")',
  'button:has-text("Sign in")',
  'input[type="submit"]',
].join(', ');

/**
 * Tente une connexion automatique avec email/password + question secrète.
 * Utilise l'extension NopeCHA déjà chargée par playwright-manager.
 *
 * @param {import('playwright').Page} page
 * @param {Object} opts
 * @param {string} opts.email
 * @param {string} opts.password
 * @param {string} [opts.securityAnswer]
 * @param {'upwork'|'freelancer'|'twitter'|'hackernews'|'fiverr'} opts.platform
 * @returns {Promise<{success: boolean, error?: string, requiresManual?: boolean}>}
 */
export async function loginWithCredentials(page, { email, password, securityAnswer, platform }) {
  platform = normalizePlatform(platform);

  if (platform === 'google') {
    if (!email || !password) {
      return {
        success: false,
        error: 'GOOGLE_EMAIL et GOOGLE_PASSWORD manquants dans .env',
      };
    }

    log('[AUTO-LOGIN][google] Navigation vers accounts.google.com...');
    await page.goto(LOGIN_URLS.google, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"], input#identifierId').first();
    if ((await emailInput.count()) > 0) {
      await emailInput.fill(email);
      const nextBtn = page.locator('#identifierNext button, button:has-text("Suivant"), button:has-text("Next")').first();
      if ((await nextBtn.count()) > 0) {
        await nextBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    const passwordInput = page.locator('input[type="password"], input[name="Passwd"]').first();
    try {
      await passwordInput.waitFor({ timeout: 15000 });
      await passwordInput.fill(password);
      const nextBtn = page.locator('#passwordNext button, button:has-text("Suivant"), button:has-text("Next")').first();
      if ((await nextBtn.count()) > 0) {
        await nextBtn.click();
        await page.waitForTimeout(4000);
      }
    } catch {
      // Google may show an intermediate screen (2FA, captcha, account chooser)
    }

    const captcha = await handleCaptcha(page);
    if (!captcha.resolved) {
      return {
        success: false,
        error: 'CAPTCHA Google non résolu — action manuelle requise',
        requiresManual: true,
        ...captcha,
      };
    }

    const cookies = await page.context().cookies('https://accounts.google.com');
    const hasSession = cookies.some(c =>
      ['SID', 'SAPISID', '__Secure-1PSID', '__Secure-3PSID'].includes(c.name)
    );
    const url = page.url();
    return {
      success: hasSession,
      error: hasSession ? null : `Connexion Google non confirmée: ${url}`,
    };
  }

  if (!email || !password) {
    return {
      success: false,
      error: `${platform.toUpperCase()}_EMAIL et ${platform.toUpperCase()}_PASSWORD manquants dans .env`,
    };
  }

  const loginUrl = LOGIN_URLS[platform];
  if (!loginUrl) {
    return { success: false, error: `Plateforme non supportée pour auto-login: ${platform}` };
  }

  log(`[AUTO-LOGIN][${platform}] Navigation vers login...`);
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const emailSel = EMAIL_SELECTORS[platform];
  try {
    await page.waitForSelector(emailSel, { timeout: 15000 });
  } catch {
    // Twitter requires clicking "Next"
  }
  await page.fill(emailSel, email).catch(() => {});

  if (platform === 'upwork' || platform === 'twitter') {
    const continueBtn = page
      .locator('button:has-text("Continuer"), button:has-text("Next"), button:has-text("Suivant")')
      .first();
    if ((await continueBtn.count()) > 0) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  try {
    await page.waitForSelector(PASSWORD_SELECTOR, { timeout: 15000 });
    await page.fill(PASSWORD_SELECTOR, password);
  } catch {}

  const submitBtn = page.locator(SUBMIT_SELECTOR).first();
  if ((await submitBtn.count()) > 0) {
    await submitBtn.click();
    await page.waitForTimeout(3000);
  }

  if (platform === 'upwork' && securityAnswer) {
    const securityInput = page
      .locator('input[name="security_answer"], input[type="text"]')
      .first();
    if ((await securityInput.count()) > 0) {
      await securityInput.fill(securityAnswer);
      await page.waitForTimeout(1000);

      const verifyBtn = page
        .locator(
          'button:has-text("Vérifier"), button:has-text("Verify"), button:has-text("Continuer"), button:has-text("Next")'
        )
        .first();
      if ((await verifyBtn.count()) > 0) {
        await verifyBtn.click();
        await page.waitForTimeout(3000);
      }
    }
  }

  const captcha = await handleCaptcha(page);
  if (!captcha.resolved) {
    return {
      success: false,
      error: 'CAPTCHA non résolu — action manuelle requise',
      requiresManual: true,
      ...captcha,
    };
  }

  const url = page.url();
  const loggedIn =
    platform === 'hackernews'
      ? url.includes('news.ycombinator.com') && !url.includes('/login')
      : !url.includes('/login') &&
        !url.includes('account-security') &&
        !url.includes('signin') &&
        !url.includes('/i/flow/login');

  return {
    success: loggedIn,
    error: loggedIn ? null : `Toujours sur page login: ${url}`,
  };
}

/**
 * Ensure a session is available for a platform.
 * 1. Check if already logged in (persistent session).
 * 2. If not, attempt auto-login with env credentials.
 * 3. If auto-login fails, notify via Telegram (notifyFn) and return failure.
 *
 * @returns {Promise<{success: boolean, method: string, error?: string}>}
 */
export async function ensureLoggedIn(page, platform, notifyFn = null) {
  platform = normalizePlatform(platform);

  const loggedIn = await isLoggedIn(page, platform);
  if (loggedIn) {
    return { success: true, method: 'persistent-session' };
  }

  const creds = getCredentialEnv(platform);
  if (creds.email && creds.password) {
    log(`[AUTH] Auto-login attempt for ${platform}...`);
    const auto = await loginWithCredentials(page, { ...creds, platform });
    if (auto.success) {
      log(`[AUTH] Auto-login successful for ${platform}`);
      return { success: true, method: 'auto-login' };
    }
    warn(`[AUTH] Auto-login failed for ${platform}: ${auto.error}`);
  } else {
    warn(`[AUTH] No credentials in .env for ${platform}`);
  }

  const msg = `⚠️ Session ${platform} absente ou auto-login échoué — connexion manuelle requise (hustlebot auth ${platform})`;
  if (notifyFn) {
    try {
      await notifyFn(msg);
    } catch {}
  }
  return { success: false, method: 'manual', error: msg };
}

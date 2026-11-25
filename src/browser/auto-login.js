import { handleCaptcha } from './captcha-manager.js';
import { isLoggedIn } from './playwright-manager.js';
import { log, error as logError, warn } from '../utils/logger.js';

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
  if (!email || !password) {
    return {
      success: false,
      error: `${platform.toUpperCase()}_EMAIL et ${platform.toUpperCase()}_PASSWORD manquants dans .env`,
    };
  }

  const loginUrls = {
    upwork: 'https://www.upwork.com/ab/account-security/login',
    freelancer: 'https://www.freelancer.com/login',
    twitter: 'https://x.com/i/flow/login',
    hackernews: 'https://news.ycombinator.com/login',
    fiverr: 'https://www.fiverr.com/login',
  };

  const loginUrl = loginUrls[platform];
  if (!loginUrl) {
    return { success: false, error: `Plateforme non supportée pour auto-login: ${platform}` };
  }

  log(`[AUTO-LOGIN][${platform}] Navigation vers login...`);
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // --- Email / Username ---
  const emailSelectors = {
    upwork: 'input[name="username"], input[type="email"]',
    freelancer: 'input[name="email"], input[type="email"]',
    twitter: 'input[autocomplete="username"], input[name="text"], input[type="text"]',
    hackernews: 'input[name="acct"], input[type="text"]',
    fiverr: 'input[name="email"], input[type="email"]',
  };

  const emailSel = emailSelectors[platform];
  try {
    await page.waitForSelector(emailSel, { timeout: 15000 });
  } catch {
    // Twitter requires clicking "Next"
  }
  await page.fill(emailSel, email).catch(() => {});

  // --- Bouton Continuer (Upwork / Twitter) ---
  if (platform === 'upwork' || platform === 'twitter') {
    const continueBtn = page
      .locator('button:has-text("Continuer"), button:has-text("Next"), button:has-text("Suivant")')
      .first();
    if ((await continueBtn.count()) > 0) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // --- Mot de passe ---
  const passwordSel = 'input[name="password"], input[type="password"]';
  try {
    await page.waitForSelector(passwordSel, { timeout: 15000 });
    await page.fill(passwordSel, password);
  } catch {}

  // --- Bouton connexion ---
  const submitBtn = page
    .locator(
      'button:has-text("Se connecter"), button:has-text("Connexion"), button:has-text("Log in"), button:has-text("Login"), button:has-text("Sign in"), input[type="submit"]'
    )
    .first();
  if ((await submitBtn.count()) > 0) {
    await submitBtn.click();
    await page.waitForTimeout(3000);
  }

  // --- Question de sécurité (Upwork) ---
  if (platform === 'upwork' && securityAnswer) {
    const securityCount = await page
      .locator('input[name="security_answer"], input[type="text"]')
      .count();
    if (securityCount > 0) {
      const answerInput = page
        .locator('input[name="security_answer"], input[type="text"]')
        .first();
      await answerInput.fill(securityAnswer);
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

  // --- CAPTCHA via NopeCHA extension ---
  const captcha = await handleCaptcha(page);
  if (!captcha.resolved) {
    return {
      success: false,
      error: 'CAPTCHA non résolu — action manuelle requise',
      requiresManual: true,
      ...captcha,
    };
  }

  // --- Vérification finale ---
  const url = page.url();
  const loggedIn =
    platform === 'hackernews'
      ? url.includes('news.ycombinator.com') && !url.includes('/login')
      : !url.includes('/login') && !url.includes('account-security') && !url.includes('signin') && !url.includes('/i/flow/login');

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
  platform = platform.toLowerCase();
  if (platform === 'x') platform = 'twitter';
  if (platform === 'hn') platform = 'hackernews';

  const loggedIn = await isLoggedIn(page, platform);
  if (loggedIn) {
    return { success: true, method: 'persistent-session' };
  }

  // Attempt auto-login with env credentials
  const envMap = {
    upwork: { email: process.env.UPWORK_EMAIL, password: process.env.UPWORK_PASSWORD, securityAnswer: process.env.UPWORK_SECURITY_ANSWER },
    freelancer: { email: process.env.FREELANCER_EMAIL, password: process.env.FREELANCER_PASSWORD },
    twitter: { email: process.env.TWITTER_EMAIL, password: process.env.TWITTER_PASSWORD },
    hackernews: { email: process.env.HACKERNEWS_USERNAME, password: process.env.HACKERNEWS_PASSWORD },
    fiverr: { email: process.env.FIVERR_EMAIL, password: process.env.FIVERR_PASSWORD },
  };

  const creds = envMap[platform] || {};
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

  // Notify via Telegram if session missing/failed
  const msg = `⚠️ Session ${platform} absente ou auto-login échoué — connexion manuelle requise (hustlebot auth ${platform})`;
  if (notifyFn) {
    try { await notifyFn(msg); } catch {}
  }
  return { success: false, method: 'manual', error: msg };
}
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getConfigDir } from '../utils/config.js';

const EXTENSION_DIR = path.join(process.cwd(), 'extensions', 'nopecha');
const PROFILE_DIR = path.join(getConfigDir(), 'browser-profile');

/**
 * Launch a persistent Chromium context with NopeCHA extension loaded.
 * Returns { context, page } — caller must close context when done.
 */
export async function launchBrowser(options = {}) {
  const envHeadless = process.env.HUSTLEBOT_HEADLESS === 'true' || process.env.HEADLESS === 'true';
  const { headless = envHeadless, url = null } = options;

  if (!fs.existsSync(PROFILE_DIR)) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
  }

  const args = [];
  if (fs.existsSync(EXTENSION_DIR)) {
    args.push(`--disable-extensions-except=${EXTENSION_DIR}`);
    args.push(`--load-extension=${EXTENSION_DIR}`);
  }

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    args,
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });

  const page = await context.newPage();
  if (url) await page.goto(url);

  return { context, page };
}

export function getExtensionDir() {
  return EXTENSION_DIR;
}

export function getProfileDir() {
  return PROFILE_DIR;
}

// ---------------------------------------------------------------------------
// Compat helpers (migration Puppeteer → Playwright)
// ---------------------------------------------------------------------------

import { log } from '../utils/logger.js';

const HUSTLEBOT_DIR = path.join(os.homedir(), '.hustlebot');
const SCREENSHOTS_DIR = path.join(HUSTLEBOT_DIR, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

export async function takeScreenshot(page, name) {
  const filename = `${name}-${Date.now()}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  log(`[BROWSER] Screenshot saved: ${filepath}`);
  return filepath;
}

function normalizePlatform(platform) {
  const p = (platform || '').toLowerCase();
  if (p === 'x') return 'twitter';
  if (p === 'hn') return 'hackernews';
  return p;
}

export async function isLoggedIn(page, platform) {
  platform = normalizePlatform(platform);
  const checks = {
    upwork: async () => {
      await page.goto('https://www.upwork.com/nx/find-work/best-matches', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const url = page.url();
      return !url.includes('/login') && !url.includes('/ab/account-security/login');
    },
    freelancer: async () => {
      await page.goto('https://www.freelancer.com/dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const url = page.url();
      return !url.includes('/login');
    },
    twitter: async () => {
      await page.goto('https://x.com/home', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const url = page.url();
      return !url.includes('/i/flow/login') && !url.includes('/login');
    },
    hackernews: async () => {
      await page.goto('https://news.ycombinator.com/news', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const logout = await page.locator('a#logout, a[href*="logout"]').count();
      return logout > 0;
    },
    fiverr: async () => {
      await page.goto('https://www.fiverr.com/inbox', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const url = page.url();
      return !url.includes('/login') && !url.includes('/join');
    },
  };
  try {
    const check = checks[platform];
    if (!check) return false;
    return await check();
  } catch {
    return false;
  }
}

export async function waitForLogin(page, platform) {
  platform = normalizePlatform(platform);
  log(`[BROWSER] Waiting for manual ${platform} login...`);

  const loginUrls = {
    upwork: 'https://www.upwork.com/ab/account-security/login',
    freelancer: 'https://www.freelancer.com/login',
    twitter: 'https://x.com/i/flow/login',
    hackernews: 'https://news.ycombinator.com/login',
    fiverr: 'https://www.fiverr.com/login',
  };

  const successChecks = {
    upwork: url => !url.includes('/login') && !url.includes('account-security'),
    freelancer: url => !url.includes('/login'),
    twitter: url => !url.includes('/i/flow/login') && !url.includes('/login') && url.includes('x.com'),
    hackernews: url => url.includes('news.ycombinator.com') && !url.includes('/login'),
    fiverr: url => url.includes('fiverr.com') && !url.includes('/login') && !url.includes('/join'),
  };

  const loginUrl = loginUrls[platform];
  if (!loginUrl) throw new Error(`Unknown platform for login: ${platform}`);

  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const url = page.url();
    if (successChecks[platform](url)) {
      log(`[BROWSER] ${platform} login successful`);
      return true;
    }
  }

  throw new Error(`${platform} login timed out after 5 minutes`);
}

export async function closeBrowser(context) {
  if (context) await context.close();
}

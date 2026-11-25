import { getKiloApiKey } from '../config/kilo-models.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { log, warn } from './logger.js';

const PROFILE_DIR = join(homedir(), '.hustlebot', 'browser-profile');

/**
 * Validate configuration and environment for autonomous production.
 * Returns { ok: boolean, checks: Array<{name, ok, message}> }
 */
export async function healthCheck() {
  const checks = [];

  // 1. Kilo API key
  const kiloKey = getKiloApiKey();
  checks.push({
    name: 'kilo_api_key',
    ok: !!kiloKey,
    message: kiloKey ? 'Kilo API key present' : 'MISSING: set KILO_API_KEY or run hustlebot init',
  });

  // 2. Profile exists
  const profilePath = join(homedir(), '.hustlebot', 'profile.yaml');
  checks.push({
    name: 'profile',
    ok: existsSync(profilePath),
    message: existsSync(profilePath) ? 'Profile found' : 'MISSING: run hustlebot init',
  });

  // 3. Browser profile
  checks.push({
    name: 'browser_profile',
    ok: existsSync(PROFILE_DIR),
    message: existsSync(PROFILE_DIR) ? 'Browser profile exists' : 'No browser profile yet (will be created on first auth)',
  });

  // 4. NopeCHA extension
  const extDir = join(process.cwd(), 'extensions', 'nopecha');
  const manifestPath = join(extDir, 'manifest.json');
  checks.push({
    name: 'nopecha_extension',
    ok: existsSync(manifestPath),
    message: existsSync(manifestPath) ? 'NopeCHA extension loaded' : 'MISSING: extensions/nopecha/manifest.json',
  });

  // 5. Playwright browsers
  let pwOk = false;
  try {
    const { chromium } = await import('playwright');
    const execPath = chromium.executablePath();
    pwOk = existsSync(execPath);
  } catch {}
  checks.push({
    name: 'playwright_chromium',
    ok: pwOk,
    message: pwOk ? 'Playwright Chromium installed' : 'MISSING: npx playwright install chromium',
  });

  const ok = checks.every((c) => c.ok || c.name === 'browser_profile');
  if (!ok) {
    warn('[HEALTH] Some checks failed:');
    for (const c of checks) {
      if (!c.ok && c.name !== 'browser_profile') {
        warn(`  - ${c.name}: ${c.message}`);
      }
    }
  } else {
    log('[HEALTH] All checks passed');
  }

  return { ok, checks };
}
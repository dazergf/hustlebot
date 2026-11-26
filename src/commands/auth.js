import chalk from 'chalk';
import { setupUpworkSession } from '../browser/upwork-submit.js';
import { setupFreelancerSession } from '../browser/freelancer-submit.js';
import { setupTwitterSession } from '../browser/twitter-submit.js';
import { setupHackerNewsSession } from '../browser/hn-submit.js';
import { setupFiverrSession } from '../browser/fiverr-submit.js';
import { setupGoogleSession } from '../browser/auto-login.js';
import { isLoggedIn, launchBrowser } from '../browser/playwright-manager.js';

function normalizePlatform(platform) {
  const p = (platform || '').toLowerCase();
  if (p === 'x') return 'twitter';
  if (p === 'hn') return 'hackernews';
  return p;
}

export async function authPlatform(platform, options = {}) {
  platform = normalizePlatform(platform);

  const handlers = {
    upwork: {
      label: 'Upwork',
      setup: setupUpworkSession,
      success: 'HustleBot can now submit proposals on Upwork automatically.',
    },
    freelancer: {
      label: 'Freelancer.com',
      setup: setupFreelancerSession,
      success: 'HustleBot can now submit bids on Freelancer automatically.',
    },
    twitter: {
      label: 'X/Twitter',
      setup: setupTwitterSession,
      success: 'HustleBot can now send X/Twitter DMs automatically.',
    },
    hackernews: {
      label: 'Hacker News',
      setup: setupHackerNewsSession,
      success: 'HustleBot can now post Hacker News comments automatically.',
    },
    fiverr: {
      label: 'Fiverr',
      setup: setupFiverrSession,
      success: 'HustleBot can now send Fiverr messages automatically.',
    },
  };

  if (platform === 'django') {
    console.log(chalk.hex('#FF6B00')('\n  Django Community Jobs\n'));
    console.log(chalk.green('  ✓ No authentication required — public RSS feed.\n'));
    console.log(chalk.gray('  Jobs are aggregated from djangojobboard.com and builtwithdjango.com.'));
    console.log(chalk.gray('  Applications are submitted directly on each job posting URL.\n'));
    return;
  }

  if (platform === 'google') {
    console.log(chalk.hex('#FF6B00')('\n  Google Account Sign-In\n'));
    console.log(chalk.gray('  A Chromium window will open on accounts.google.com.'));
    console.log(chalk.gray('  Log in once (email + password + 2FA if asked).'));
    console.log(chalk.gray('  The Google session is saved in ~/.hustlebot/browser-profile and'));
    console.log(chalk.gray('  reused by: hustlebot auth <platform> --google\n'));

    try {
      const result = await setupGoogleSession('google');
      if (result?.success) {
        console.log(chalk.green(`\n  ✓ ${result.message}`));
        console.log(chalk.gray('  Next: hustlebot auth upwork --google (or freelancer/fiverr/twitter)\n'));
      } else {
        console.log(chalk.red(`\n  ⚠ Google login not completed: ${result?.error || 'unknown error'}\n`));
      }
    } catch (err) {
      console.log(chalk.red(`\n  ⚠ Error: ${err.message}\n`));
    }
    return;
  }

  if (platform === 'status') {
    console.log(chalk.hex('#FF6B00')('\n  Session Status\n'));
    const { context, page } = await launchBrowser({ headless: true });
    try {
      for (const p of ['google', 'upwork', 'freelancer', 'twitter', 'hackernews', 'fiverr']) {
        let ok = false;
        try {
          ok = await isLoggedIn(page, p);
        } catch {}
        console.log(`  ${ok ? chalk.green('✅') : chalk.red('❌')} ${p}`);
      }
      console.log(chalk.gray('\n  Lance `hustlebot auth <platform>` ou `--google` pour connecter.\n'));
    } finally {
      await context.close();
    }
    return;
  }

  const handler = handlers[platform];
  if (!handler) {
    console.log(chalk.red(`\n  ⚠ Unknown platform: ${platform}`));
    console.log(chalk.gray(`  Available: ${Object.keys(handlers).join(', ')}\n`));
    return;
  }

  if (options.google && platform === 'hackernews') {
    console.log(chalk.yellow('\n  ⚠ Hacker News ne supporte pas la connexion Google.'));
    console.log(chalk.gray('  Utilise: hustlebot auth hackernews\n'));
    return;
  }

  if (options.google) {
    console.log(chalk.hex('#FF6B00')(`\n  ${handler.label} — Google Sign-In\n`));
    console.log(chalk.gray('  A Chromium window will open and click "Continue with Google".'));
    console.log(chalk.gray('  Complete the Google login manually (account + 2FA if asked).'));
    console.log(chalk.gray('  Your session will be saved in ~/.hustlebot/browser-profile.\n'));

    try {
      const result = await setupGoogleSession(platform);
      if (result?.success) {
        console.log(chalk.green(`\n  ✓ ${result.message}`));
        console.log(chalk.gray(`  ${handler.success}\n`));
      } else {
        console.log(chalk.red(`\n  ⚠ Google login not completed: ${result?.error || 'unknown error'}\n`));
      }
    } catch (err) {
      console.log(chalk.red(`\n  ⚠ Error: ${err.message}\n`));
    }
    return;
  }

  console.log(chalk.hex('#FF6B00')(`\n  ${handler.label} Login\n`));
  console.log(chalk.gray('  A Chromium window will open. Log in manually if needed.'));
  console.log(chalk.gray('  Tip: use --google to sign in with Google instead of email/password.'));
  console.log(chalk.gray('  Your session will be saved in ~/.hustlebot/browser-profile for future automation.\n'));

  try {
    const result = await handler.setup();
    if (result?.success) {
      console.log(chalk.green(`\n  ✓ ${result.message}`));
      console.log(chalk.gray(`  ${handler.success}\n`));
    } else {
      console.log(chalk.red(`\n  ⚠ Login not completed: ${result?.error || 'unknown error'}\n`));
    }
  } catch (err) {
    console.log(chalk.red(`\n  ⚠ Error: ${err.message}\n`));
  }
}

import chalk from 'chalk';
import { setupUpworkSession } from '../browser/upwork-submit.js';
import { setupFreelancerSession } from '../browser/freelancer-submit.js';
import { setupTwitterSession } from '../browser/twitter-submit.js';
import { setupHackerNewsSession } from '../browser/hn-submit.js';
import { setupFiverrSession } from '../browser/fiverr-submit.js';

function normalizePlatform(platform) {
  const p = (platform || '').toLowerCase();
  if (p === 'x') return 'twitter';
  if (p === 'hn') return 'hackernews';
  return p;
}

export async function authPlatform(platform) {
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

  const handler = handlers[platform];
  if (!handler) {
    console.log(chalk.red(`\n  ⚠ Unknown platform: ${platform}`));
    console.log(chalk.gray(`  Available: ${Object.keys(handlers).join(', ')}\n`));
    return;
  }

  console.log(chalk.hex('#FF6B00')(`\n  ${handler.label} Login\n`));
  console.log(chalk.gray('  A Chromium window will open. Log in manually if needed.'));
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

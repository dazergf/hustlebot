import chalk from 'chalk';
import inquirer from 'inquirer';
import { getGrowthQueue, approveQueueItem } from '../../factory/growth-engine.js';
import { loadDeployConfig, saveDeployConfig } from '../../factory/deployer.js';

export async function handleGrowth() {
  const queue = getGrowthQueue();
  const pending = queue.filter(q => q.status === 'pending_approval');

  if (pending.length === 0) {
    console.log(chalk.yellow('\n  No pending marketing posts. Products need to be built and deployed first.\n'));
    return;
  }

  console.log(chalk.bold(`\n  📬 Growth Queue (${pending.length} pending)\n`));

  for (const [i, item] of pending.entries()) {
    const platform = item.platform === 'twitter' ? '🐦 Twitter' : '📮 Reddit';
    console.log(`  ${i + 1}. ${platform}${item.subreddit ? ` r/${item.subreddit}` : ''}`);
    console.log(`     ${chalk.dim(item.content?.slice(0, 100) || item.title?.slice(0, 100))}`);
    console.log('');
  }

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What do you want to do?',
    choices: [
      { name: 'Approve all', value: 'approve_all' },
      { name: 'Skip for now', value: 'skip' },
    ],
  }]);

  if (action === 'approve_all') {
    pending.forEach((_, i) => approveQueueItem(i));
    console.log(chalk.green(`\n  ✅ ${pending.length} posts approved!\n`));
  }
}

/**
 * Configure deployment keys
 */
export async function handleConfig() {
  const config = loadDeployConfig();

  console.log(chalk.bold('\n  ⚙️ Factory Configuration\n'));
  console.log(`  Vercel Token: ${config.vercel?.token ? chalk.green('✓ Set') : chalk.red('✗ Not set')}`);
  console.log(`  GitHub Org:   ${config.github?.org ? chalk.green(config.github.org) : chalk.red('✗ Not set')}`);
  console.log(`  Lemon Squeezy: ${config.lemonsqueezy?.apiKey ? chalk.green('✓ Set') : chalk.red('✗ Not set')}`);
  console.log(`  Domain:       ${config.domain ? chalk.green(config.domain) : chalk.dim('Not set')}`);

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'vercelToken',
      message: 'Vercel Token (from vercel.com/account/tokens):',
      default: config.vercel?.token || '',
      when: () => !config.vercel?.token,
    },
    {
      type: 'input',
      name: 'githubOrg',
      message: 'GitHub username/org for repos:',
      default: config.github?.org || '',
    },
    {
      type: 'input',
      name: 'lemonApiKey',
      message: 'Lemon Squeezy API Key (from dashboard.lemonsqueezy.com):',
      default: config.lemonsqueezy?.apiKey || '',
      when: () => !config.lemonsqueezy?.apiKey,
    },
    {
      type: 'input',
      name: 'lemonStoreId',
      message: 'Lemon Squeezy Store ID:',
      default: config.lemonsqueezy?.storeId || '',
      when: () => !config.lemonsqueezy?.storeId,
    },
    {
      type: 'input',
      name: 'domain',
      message: 'Custom domain (optional):',
      default: config.domain || '',
    },
  ]);

  // Update config
  if (answers.vercelToken) config.vercel = { ...config.vercel, token: answers.vercelToken };
  if (answers.githubOrg) config.github = { ...config.github, org: answers.githubOrg };
  if (answers.lemonApiKey) config.lemonsqueezy = { ...config.lemonsqueezy, apiKey: answers.lemonApiKey };
  if (answers.lemonStoreId) config.lemonsqueezy = { ...config.lemonsqueezy, storeId: answers.lemonStoreId };
  if (answers.domain) config.domain = answers.domain;

  saveDeployConfig(config);
  console.log(chalk.green('\n  ✅ Configuration saved!\n'));
}

import chalk from 'chalk';
import { initProfile } from '../commands/init.js';
import { scanGigs } from '../commands/scan.js';
import { proposeGig } from '../commands/propose.js';
import { showStatus } from '../commands/status.js';
import { healthCheck } from '../utils/health.js';
import { deliverProject } from '../commands/deliver.js';
import { launchDashboard } from '../commands/dashboard.js';
import { authPlatform } from '../commands/auth.js';
import { getConfig } from '../utils/config.js';

export default function registerCoreCommands(program) {
  program
    .command('init')
    .description('Set up your skill profile — tell HustleBot who you are')
    .action(async () => {
      await initProfile();
    });

  program
    .command('scan')
    .description('Scan platforms for matching freelance gigs')
    .option('-p, --platform <platform>', 'Scan specific platform (upwork|twitter|hackernews|freelancer|fiverr|django|all)', 'all')
    .option('-l, --limit <number>', 'Max results to show', '20')
    .option('--min-rate <number>', 'Minimum hourly rate filter')
    .option('--min-score <number>', 'Minimum match score (0-100)', '50')
    .action(async (opts) => {
      const config = getConfig();
      if (!config.profile) {
        console.log(chalk.red('\n  ⚠ No profile found. Run ') + chalk.white('hustlebot init') + chalk.red(' first.\n'));
        process.exit(1);
      }
      await scanGigs(opts, config);
    });

  program
    .command('propose')
    .description('Generate a winning proposal for a specific gig')
    .argument('<gig-id>', 'Gig ID from scan results')
    .option('--tone <tone>', 'Proposal tone (professional|casual|bold)', 'professional')
    .option('--length <length>', 'Proposal length (short|medium|long)', 'medium')
    .action(async (gigId, opts) => {
      const config = getConfig();
      if (!config.profile) {
        console.log(chalk.red('\n  ⚠ No profile found. Run ') + chalk.white('hustlebot init') + chalk.red(' first.\n'));
        process.exit(1);
      }
      await proposeGig(gigId, opts, config);
    });

  program
    .command('deliver')
    .description('Set up a project workspace and scaffold deliverables')
    .argument('<gig-id>', 'Gig ID for the won project')
    .action(async (gigId) => {
      const config = getConfig();
      await deliverProject(gigId, config);
    });

  program
    .command('status')
    .description('Show your hustle dashboard — earnings, pipeline, activity')
    .action(async () => {
      const config = getConfig();
      await showStatus(config);
    });

  program
    .command('health')
    .description('Check production readiness (API keys, browser, extensions)')
    .action(async () => {
      const result = await healthCheck();
      console.log();
      for (const c of result.checks) {
        const icon = c.ok ? '✅' : '❌';
        console.log(`  ${icon} ${c.name}: ${c.message}`);
      }
      console.log();
      console.log(result.ok ? '  ✅ All checks passed — ready for production' : '  ❌ Some checks failed — fix before running daemon');
      console.log();
    });

  program
    .command('dashboard')
    .description('Open the web dashboard in your browser')
    .option('-p, --port <port>', 'Port to run on', '3456')
    .action(async (opts) => {
      await launchDashboard(opts);
    });

  program
    .command('auth')
    .description('Authenticate with a freelance platform (persistent browser session)')
    .argument('<platform>', 'Platform to log into (google|upwork|freelancer|twitter|hackernews|fiverr|django)')
    .option('-g, --google', 'Sign in with Google (manual OAuth, session saved)')
    .action(async (platform, opts) => {
      await authPlatform(platform, opts);
    });
}

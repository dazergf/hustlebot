import chalk from 'chalk';
import boxen from 'boxen';

export const VERSION = '3.0.0';

export const banner = chalk.hex('#FF6B00')(`
██╗  ██╗██╗   ██╗███████╗████████╗██╗     ███████╗██████╗  ██████╗ ████████╗
██║  ██║██║   ██║██╔════╝╚══██╔══╝██║     ██╔════╝██╔══██╗██╔═══██╗╚══██╔══╝
███████║██║   ██║███████╗   ██║   ██║     █████╗  ██████╔╝██║   ██║   ██║   
██╔══██║██║   ██║╚════██║   ██║   ██║     ██╔══╝  ██╔══██╗██║   ██║   ██║   
██║  ██║╚██████╔╝███████║   ██║   ███████╗███████╗██████╔╝╚██████╔╝   ██║   
╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝╚══════╝╚═════╝  ╚═════╝    ╚═╝   
`);

export function showBanner() {
  console.log(banner);
  console.log(boxen(
    chalk.white('Your AI hustle agent') + chalk.gray(' • ') + chalk.hex('#FF6B00')(`v${VERSION}`),
    { padding: { left: 2, right: 2, top: 0, bottom: 0 }, borderColor: '#FF6B00', borderStyle: 'round' }
  ));
  console.log();
}

export function showDefaultHelp() {
  console.log(banner);
  console.log(boxen(
    chalk.white('Your AI hustle agent') + chalk.gray(' • ') + chalk.hex('#FF6B00')(`v${VERSION}`),
    { padding: { left: 2, right: 2, top: 0, bottom: 0 }, borderColor: '#FF6B00', borderStyle: 'round' }
  ));
  console.log();
  console.log(chalk.hex('#FF6B00')('  🏭 Product Factory (v3):'));
  console.log(chalk.gray('  ─────────────────────────────────────────'));
  console.log(chalk.white('   1.') + chalk.gray(' hustlebot factory           ') + chalk.dim('→ Factory dashboard'));
  console.log(chalk.white('   2.') + chalk.gray(' hustlebot factory research  ') + chalk.dim('→ Find product opportunities'));
  console.log(chalk.white('   3.') + chalk.gray(' hustlebot factory build-one ') + chalk.dim('→ Build a product'));
  console.log(chalk.white('   4.') + chalk.gray(' hustlebot factory launch    ') + chalk.dim('→ Full pipeline (research→build→deploy→sell)'));
  console.log(chalk.white('   5.') + chalk.gray(' hustlebot factory deploy    ') + chalk.dim('→ Deploy to Vercel + Lemon Squeezy'));
  console.log(chalk.white('   6.') + chalk.gray(' hustlebot factory catalog   ') + chalk.dim('→ View all products'));
  console.log(chalk.white('   7.') + chalk.gray(' hustlebot factory growth    ') + chalk.dim('→ Marketing queue'));
  console.log(chalk.white('   8.') + chalk.gray(' hustlebot factory config    ') + chalk.dim('→ Set up Vercel/Stripe keys'));
  console.log();
  console.log(chalk.hex('#FF6B00')('  🔍 Freelance Scanner:'));
  console.log(chalk.gray('  ─────────────────────────────────────────'));
  console.log(chalk.white('   9.') + chalk.gray(' hustlebot scan             ') + chalk.dim('→ Find gigs (5 platforms)'));
  console.log(chalk.white('  10.') + chalk.gray(' hustlebot propose <#>      ') + chalk.dim('→ AI-write a proposal'));
  console.log(chalk.white('  11.') + chalk.gray(' hustlebot auto-deliver <#> ') + chalk.dim('→ AI-generate deliverables'));
  console.log();
  console.log(chalk.hex('#FF6B00')('  💰 Earnings & Status:'));
  console.log(chalk.gray('  ─────────────────────────────────────────'));
  console.log(chalk.white('  12.') + chalk.gray(' hustlebot earnings stats   ') + chalk.dim('→ Revenue analytics'));
  console.log(chalk.white('  13.') + chalk.gray(' hustlebot status           ') + chalk.dim('→ Terminal dashboard'));
  console.log(chalk.white('  14.') + chalk.gray(' hustlebot dashboard        ') + chalk.dim('→ Web UI dashboard'));
  console.log();
  console.log(chalk.hex('#FF6B00')('  ⚙️  Automation:'));
  console.log(chalk.gray('  ─────────────────────────────────────────'));
  console.log(chalk.white('  15.') + chalk.gray(' hustlebot autopilot start  ') + chalk.dim('→ Start daemon'));
  console.log(chalk.white('  16.') + chalk.gray(' hustlebot factory nightly  ') + chalk.dim('→ Nightly consolidation'));
  console.log(chalk.white('  17.') + chalk.gray(' hustlebot init             ') + chalk.dim('→ Set up profile'));
  console.log();
  process.exit(0);
}

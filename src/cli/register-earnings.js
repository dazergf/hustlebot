import chalk from 'chalk';
import {
  trackProject,
  recordPayment,
  getEarningsStats,
  getProjects,
  logTime,
} from '../engines/payment-tracker.js';

export default function registerEarningsCommands(program) {
  const earnings = program
    .command('earnings')
    .description('Track earnings, payments, and project financials');

  earnings
    .command('stats')
    .description('Show earnings statistics and analytics')
    .option('--period <period>', 'Time period (week|month|year|all)', 'all')
    .action(async (opts) => {
      const stats = getEarningsStats(opts.period);
      console.log(chalk.hex('#FF6B00')('\n  💰 Earnings Dashboard\n'));
      console.log(chalk.white(`  Total Earned:    `) + chalk.green(`$${stats.total_earnings.toLocaleString()}`));
      console.log(chalk.white(`  Net (after fees):`) + chalk.green(` $${stats.total_net.toLocaleString()}`));
      console.log(chalk.white(`  Platform Fees:   `) + chalk.red(`$${stats.total_fees.toLocaleString()}`));
      console.log(chalk.white(`  Hours Logged:    `) + chalk.cyan(`${stats.total_hours}h`));
      console.log(chalk.white(`  Effective Rate:  `) + chalk.cyan(`$${stats.effective_hourly_rate}/hr`));
      console.log(chalk.white(`  Pipeline Value:  `) + chalk.yellow(`$${stats.pipeline_value.toLocaleString()}`));
      console.log(chalk.gray(`\n  Conversion: ${stats.funnel.proposals_sent} sent → ${stats.funnel.accepted} accepted → ${stats.funnel.paid} paid (${stats.funnel.conversion_rate}%)`));
      if (Object.keys(stats.by_platform).length > 0) {
        console.log(chalk.hex('#FF6B00')('\n  By Platform:'));
        for (const [p, d] of Object.entries(stats.by_platform)) {
          console.log(chalk.gray(`    ${p}: $${d.earnings} (${d.count} payments, $${d.fees} fees)`));
        }
      }
      console.log();
    });

  earnings
    .command('add-project')
    .description('Track a won project')
    .argument('<title>', 'Project title')
    .option('--amount <amount>', 'Agreed amount', '0')
    .option('--platform <platform>', 'Platform', 'direct')
    .option('--client <client>', 'Client name', 'Unknown')
    .action(async (title, opts) => {
      const project = trackProject({ title, amount: parseFloat(opts.amount), platform: opts.platform, client: opts.client });
      console.log(chalk.green(`\n  ✅ Project tracked: ${project.gig_title} ($${project.agreed_amount})`));
      console.log(chalk.gray(`  ID: ${project.id}\n`));
    });

  earnings
    .command('add-payment')
    .description('Record a payment received')
    .argument('<amount>', 'Amount received')
    .option('--project <id>', 'Project ID')
    .option('--platform <platform>', 'Platform', 'direct')
    .option('--fee <fee>', 'Platform fee', '0')
    .option('--desc <description>', 'Description', '')
    .action(async (amount, opts) => {
      const payment = recordPayment({
        amount: parseFloat(amount), project_id: opts.project, platform: opts.platform,
        platform_fee: parseFloat(opts.fee), description: opts.desc,
      });
      console.log(chalk.green(`\n  ✅ Payment recorded: $${payment.net_amount} net`));
      console.log(chalk.gray(`  ID: ${payment.id}\n`));
    });

  earnings
    .command('projects')
    .description('List all tracked projects')
    .option('--status <status>', 'Filter by status')
    .action(async (opts) => {
      const projects = getProjects(opts.status);
      if (projects.length === 0) {
        console.log(chalk.yellow('\n  No projects tracked yet. Use: hustlebot earnings add-project "Title" --amount 500\n'));
        return;
      }
      console.log(chalk.hex('#FF6B00')(`\n  📋 Projects (${projects.length})\n`));
      for (const p of projects) {
        const statusColor = p.status === 'paid' ? chalk.green : p.status === 'delivered' ? chalk.cyan :
          p.status === 'in_progress' ? chalk.yellow : chalk.gray;
        console.log(`  ${statusColor(`[${p.status.toUpperCase()}]`)} ${chalk.white(p.gig_title)} — ${chalk.green(`$${p.agreed_amount}`)} (${p.platform})`);
        console.log(chalk.gray(`    ID: ${p.id}`));
      }
      console.log();
    });

  earnings
    .command('log-time')
    .description('Log hours worked on a project')
    .argument('<project-id>', 'Project ID')
    .argument('<hours>', 'Hours worked')
    .argument('[description]', 'What you worked on', 'Development work')
    .action(async (projectId, hours, description) => {
      const project = logTime(projectId, parseFloat(hours), description);
      const totalH = project.time_logged.reduce((s, t) => s + t.hours, 0);
      console.log(chalk.green(`\n  ✅ Logged ${hours}h on "${project.gig_title}" (total: ${totalH}h)\n`));
    });
}

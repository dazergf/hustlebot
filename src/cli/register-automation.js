import chalk from 'chalk';
import { getConfig } from '../utils/config.js';
import { generateDelivery } from '../engines/delivery-engine.js';
import { showWorkers, testClassify } from '../commands/workers.js';
import {
  autopilotStart,
  autopilotStop,
  autopilotStatus,
  autopilotConfig,
  autopilotLogs,
  autopilotRunNow,
} from '../commands/autopilot.js';

export default function registerAutomationCommands(program) {
  program
    .command('auto-deliver')
    .description('Auto-generate project deliverables using AI')
    .argument('<gig-id>', 'Gig ID to generate delivery for')
    .action(async (gigId) => {
      const config = getConfig();
      const gigs = config.gigs || [];
      const gig = gigs.find(g => g.display_id === parseInt(gigId) || g.id === gigId);
      if (!gig) {
        console.log(chalk.red(`\n  ⚠ Gig #${gigId} not found. Run hustlebot scan first.\n`));
        process.exit(1);
      }
      console.log(chalk.hex('#FF6B00')(`\n  🤖 Auto-generating deliverables for: ${gig.title}\n`));
      const result = await generateDelivery(gig);
      console.log(chalk.green(`\n  ✅ Generated ${result.deliverables.length} files`));
      console.log(chalk.gray(`  📁 Location: ${result.delivery_path}`));
      console.log(chalk.gray(`  📝 Notes: ${result.delivery_notes}\n`));
    });

  const workers = program
    .command('workers')
    .description('Show AI worker agents and test classification');

  workers
    .command('list')
    .description('List all available worker agents')
    .action(showWorkers);

  workers
    .command('test')
    .description('Test gig classification with a sample title')
    .argument('[title]', 'Gig title to classify', 'Build a portfolio website')
    .action(async (title) => {
      await testClassify(title);
    });

  const autopilot = program
    .command('autopilot')
    .description('Manage the autonomous hustle daemon');

  autopilot.command('start').description('Start the autopilot daemon').action(autopilotStart);
  autopilot.command('stop').description('Stop the autopilot daemon').action(autopilotStop);
  autopilot.command('status').description('Show autopilot pipeline and daemon status').action(autopilotStatus);
  autopilot.command('config').description('Configure autopilot settings').action(autopilotConfig);
  autopilot.command('logs').description('View autopilot activity logs').action(autopilotLogs);
  autopilot.command('run-now').description('Trigger an immediate scan + propose cycle').action(autopilotRunNow);
}

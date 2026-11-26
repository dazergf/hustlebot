#!/usr/bin/env node

import { Command } from 'commander';
import { showBanner, showDefaultHelp, VERSION } from './cli/banner.js';
import registerCoreCommands from './cli/register-core.js';
import registerEarningsCommands from './cli/register-earnings.js';
import registerAutomationCommands from './cli/register-automation.js';
import registerFactoryCommand from './commands/factory.js';

const program = new Command();

program
  .name('hustlebot')
  .description('AI Product Factory — Build, deploy, and sell digital products autonomously')
  .version(VERSION)
  .hook('preAction', () => {
    showBanner();
  });

registerCoreCommands(program);
registerEarningsCommands(program);
registerAutomationCommands(program);
registerFactoryCommand(program);

if (process.argv.length <= 2) {
  showDefaultHelp();
}

program.parse();

/**
 * Factory CLI Command — The user-facing interface to the Product Factory
 *
 * Usage:
 *   hustlebot factory              — Show factory status dashboard
 *   hustlebot factory research     — Scan market for opportunities
 *   hustlebot factory build        — Build top product ideas
 *   hustlebot factory build-one    — Build a specific product
 *   hustlebot factory deploy <id>  — Deploy a built product
 *   hustlebot factory launch       — Full pipeline: research → build → deploy → market
 *   hustlebot factory catalog      — Show all products
 *   hustlebot factory growth       — Show marketing queue
 *   hustlebot factory config       — Configure deployment keys
 *   hustlebot factory nightly      — Run nightly consolidation
 */

import { nightlyConsolidation } from '../factory/factory.js';
import { handleStatus, handleCatalog } from './factory/status.js';
import { handleResearch, handleBuild, handleBuildOne } from './factory/build.js';
import { handleDeploy, handleLaunch } from './factory/deploy.js';
import { handleGrowth, handleConfig } from './factory/growth.js';

export default function registerFactoryCommand(program) {
  program
    .command('factory [action]')
    .description('🏭 AI Product Factory — Build & sell digital products autonomously')
    .option('--max <n>', 'Max products to build', '3')
    .option('--skip-deploy', 'Skip deployment step')
    .option('--skip-marketing', 'Skip marketing step')
    .option('--skip-research', 'Use curated ideas instead of live research')
    .action(async (action, options) => {
      switch (action) {
        case 'research':
          await handleResearch();
          break;
        case 'build':
          await handleBuild(options);
          break;
        case 'build-one':
          await handleBuildOne();
          break;
        case 'deploy':
          await handleDeploy();
          break;
        case 'launch':
          await handleLaunch(options);
          break;
        case 'catalog':
          handleCatalog();
          break;
        case 'growth':
          await handleGrowth();
          break;
        case 'config':
          await handleConfig();
          break;
        case 'nightly':
          await nightlyConsolidation();
          break;
        default:
          handleStatus();
          break;
      }
    });
}

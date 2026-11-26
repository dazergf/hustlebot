import chalk from 'chalk';
import inquirer from 'inquirer';
import { ProductState, getProductsByState } from '../../factory/product-catalog.js';
import { fullDeploy } from '../../factory/deployer.js';
import { runFullPipeline } from '../../factory/factory.js';

export async function handleDeploy() {
  const ready = getProductsByState(ProductState.READY);
  const tested = getProductsByState(ProductState.TESTING);
  const deployable = [...ready, ...tested];

  if (deployable.length === 0) {
    console.log(chalk.yellow('\n  No products ready to deploy. Run: hustlebot factory build\n'));
    return;
  }

  const { productId } = await inquirer.prompt([{
    type: 'list',
    name: 'productId',
    message: 'Which product to deploy?',
    choices: deployable.map(p => ({
      name: `${p.name} ($${p.price}) — ${p.state}`,
      value: p.id,
    })),
  }]);

  const product = deployable.find(p => p.id === productId);
  console.log(chalk.bold(`\n  🚀 Deploying: ${product.name}\n`));

  const result = await fullDeploy(product);
  console.log(`\n  ${result.summary}`);
}

/**
 * Full launch pipeline
 */
export async function handleLaunch(options) {
  await runFullPipeline({
    maxProducts: parseInt(options.max) || 3,
    skipDeploy: options.skipDeploy,
    skipMarketing: options.skipMarketing,
    skipResearch: options.skipResearch,
  });
}

/**
 * Show product catalog
 */

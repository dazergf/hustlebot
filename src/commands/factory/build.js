import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { runMarketResearch, getCuratedIdeas } from '../../factory/market-research.js';
import { addProduct, ProductTypes } from '../../factory/product-catalog.js';
import { buildProduct, runProductQuality } from '../../factory/product-builder.js';
import { buildSingleProduct } from '../../factory/factory.js';

export async function handleResearch() {
  console.log(chalk.bold('\n  🔍 Running Market Research...\n'));

  const research = await runMarketResearch();

  console.log(chalk.bold('\n  💡 Top Product Ideas:\n'));

  const table = new Table({
    head: ['#', 'Score', 'Product Idea', 'Type', 'Price'].map(h => chalk.cyan(h)),
    style: { head: [], border: ['grey'] },
    colWidths: [4, 7, 45, 20, 8],
  });

  research.ideas.slice(0, 15).forEach((idea, i) => {
    const typeInfo = ProductTypes[idea.type] || {};
    const scoreColor = idea.demandScore >= 80 ? chalk.green : idea.demandScore >= 60 ? chalk.yellow : chalk.red;
    table.push([
      i + 1,
      scoreColor(idea.demandScore),
      idea.name.slice(0, 43),
      typeInfo.name?.slice(0, 18) || idea.type,
      `$${idea.price || typeInfo.defaultPrice || 29}`,
    ]);
  });

  console.log(table.toString());

  console.log(chalk.dim(`\n  Sources: PH:${research.sources.productHunt} Reddit:${research.sources.reddit} HN:${research.sources.hackerNews} GH:${research.sources.github} Curated:${research.sources.curated}`));
  console.log(chalk.dim('  Run: hustlebot factory build — to build top ideas'));
  console.log(chalk.dim('  Run: hustlebot factory build-one — to build a specific one\n'));
}

/**
 * Build products from top ideas
 */
export async function handleBuild(options) {
  const max = parseInt(options.max) || 3;
  const ideas = getCuratedIdeas(max);

  console.log(chalk.bold(`\n  🏗 Building top ${max} products...\n`));

  for (const idea of ideas) {
    const product = addProduct(idea);
    console.log(chalk.bold(`\n  ━━━ ${product.name} ━━━`));

    const result = await buildProduct(product);
    if (result.success) {
      console.log(chalk.green(`  ✅ Built: ${result.files.length} files`));

      const quality = await runProductQuality(product);
      console.log(`  Quality: ${quality.summary}`);
    } else {
      console.log(chalk.red(`  ❌ Failed: ${result.error?.slice(0, 100)}`));
    }
  }
}

/**
 * Build a specific product (interactive)
 */
export async function handleBuildOne() {
  const ideas = getCuratedIdeas(20);

  const choices = ideas.map((idea, i) => ({
    name: `[${idea.demandScore}] $${idea.price} — ${idea.name}`,
    value: i,
  }));

  const { selection } = await inquirer.prompt([{
    type: 'list',
    name: 'selection',
    message: 'Which product do you want to build?',
    choices,
    pageSize: 20,
  }]);

  const idea = ideas[selection];
  console.log(chalk.bold(`\n  🏗 Building: ${idea.name}\n`));

  const result = await buildSingleProduct(idea);

  if (result.success) {
    console.log(chalk.green(`\n  ✅ Product built! ${result.files.length} files created`));
    console.log(`  Quality: ${result.quality.summary}`);
    console.log(`  Directory: ${result.product.buildDir}`);
    console.log(chalk.dim('\n  Next: hustlebot factory deploy'));
  } else {
    console.log(chalk.red(`\n  ❌ Build failed: ${result.error?.slice(0, 200)}`));
  }
}

/**
 * Deploy a ready product
 */

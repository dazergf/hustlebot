import chalk from 'chalk';
import Table from 'cli-table3';
import { loadCatalog, ProductState, ProductTypes } from '../../factory/product-catalog.js';
import { getFactoryStatus } from '../../factory/factory.js';

export function handleStatus() {
  const status = getFactoryStatus();

  console.log(chalk.bold('\n  🏭 AI Product Factory — Status\n'));

  // Product pipeline
  const table = new Table({
    head: ['', 'Count'].map(h => chalk.cyan(h)),
    style: { head: [], border: ['grey'] },
  });

  table.push(
    ['💡 Ideas', status.catalog.byState.ideas],
    ['🏗 Building', status.catalog.byState.building],
    ['🟢 Live', status.catalog.byState.live],
    ['⏸ Paused', status.catalog.byState.paused],
    ['💀 Killed', status.catalog.byState.killed],
  );
  console.log(table.toString());

  // Revenue
  console.log(chalk.bold('\n  💰 Revenue'));
  console.log(`  Total: ${chalk.green('$' + status.catalog.revenue.total)}`);
  console.log(`  Top Product: ${status.catalog.revenue.topProduct}`);

  // Growth queue
  if (status.growthQueue.pending > 0) {
    console.log(chalk.yellow(`\n  📬 ${status.growthQueue.pending} marketing posts awaiting approval`));
    console.log('  Run: hustlebot factory growth');
  }

  // Top products
  if (status.topProducts.length > 0) {
    console.log(chalk.bold('\n  🏆 Top Products'));
    status.topProducts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} — $${p.revenue} (${p.sales} sales)`);
    });
  }

  // Stalled
  if (status.stalledProducts > 0) {
    console.log(chalk.yellow(`\n  ⚠ ${status.stalledProducts} products with no sales in 7 days`));
  }

  console.log(chalk.dim('\n  Commands:'));
  console.log(chalk.dim('  hustlebot factory research  — Find new opportunities'));
  console.log(chalk.dim('  hustlebot factory launch    — Full pipeline (research → build → deploy → market)'));
  console.log(chalk.dim('  hustlebot factory build-one — Build a specific product'));
  console.log(chalk.dim('  hustlebot factory catalog   — View all products'));
  console.log(chalk.dim('  hustlebot factory config    — Set up Vercel/Lemon Squeezy keys\n'));
}

/**
 * Run market research
 */

export function handleCatalog() {
  const catalog = loadCatalog();

  if (catalog.products.length === 0) {
    console.log(chalk.yellow('\n  No products yet. Run: hustlebot factory launch\n'));
    return;
  }

  console.log(chalk.bold(`\n  📦 Product Catalog (${catalog.products.length} products)\n`));

  const table = new Table({
    head: ['Name', 'Type', 'State', 'Price', 'Sales', 'Revenue', 'URL'].map(h => chalk.cyan(h)),
    style: { head: [], border: ['grey'] },
    colWidths: [30, 15, 12, 8, 7, 10, 30],
  });

  for (const p of catalog.products) {
    const stateColors = {
      [ProductState.IDEA]: chalk.dim,
      [ProductState.BUILDING]: chalk.yellow,
      [ProductState.LIVE]: chalk.green,
      [ProductState.PAUSED]: chalk.gray,
      [ProductState.KILLED]: chalk.red,
    };
    const colorFn = stateColors[p.state] || chalk.white;

    table.push([
      p.name.slice(0, 28),
      ProductTypes[p.type]?.name?.slice(0, 13) || p.type,
      colorFn(p.state),
      `$${p.price}`,
      p.totalSales,
      chalk.green(`$${p.totalRevenue}`),
      (p.deployUrl || '').slice(0, 28) || '-',
    ]);
  }

  console.log(table.toString());
  console.log(`\n  Total Revenue: ${chalk.green('$' + catalog.stats.totalRevenue)}\n`);
}

/**
 * Show and manage growth queue
 */

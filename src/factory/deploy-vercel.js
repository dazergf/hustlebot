import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { updateProduct, ProductState } from './product-catalog.js';
import { loadDeployConfig } from './deploy-config.js';
import { runCommand } from './deploy-utils.js';

export async function deployToVercel(product) {
  const config = loadDeployConfig();
  const productDir = product.buildDir;

  if (!productDir || !fs.existsSync(productDir)) {
    return { success: false, error: 'Build directory not found' };
  }

  console.log(`  🚀 Deploying ${product.name} to Vercel...`);

  updateProduct(product.id, { state: ProductState.DEPLOYING });

  try {
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch {
      console.log('  📦 Installing Vercel CLI...');
      execSync('npm install -g vercel', { stdio: 'pipe' });
    }

    // Create vercel.json if not exists
    const vercelConfig = path.join(productDir, 'vercel.json');
    if (!fs.existsSync(vercelConfig)) {
      // Check if it's a Next.js project
      const packageJson = path.join(productDir, 'package.json');
      const isNextJs = fs.existsSync(packageJson) &&
        fs.readFileSync(packageJson, 'utf-8').includes('next');

      if (!isNextJs) {
        // Static site config
        fs.writeFileSync(vercelConfig, JSON.stringify({
          version: 2,
          builds: [{ src: './**', use: '@vercel/static' }],
          routes: [
            { src: '/(.*)', dest: '/$1' },
          ],
        }, null, 2));
      }
    }

    // Deploy using Vercel CLI
    const args = ['--yes', '--prod'];
    if (config.vercel?.token) {
      args.push('--token', config.vercel.token);
    }

    const result = await runCommand('vercel', args, { cwd: productDir });

    if (result.success) {
      // Extract URL from output
      const urlMatch = result.output.match(/https:\/\/[^\s]+\.vercel\.app/);
      const deployUrl = urlMatch ? urlMatch[0] : null;

      console.log(`  ✅ Deployed: ${deployUrl || 'URL not captured'}`);

      updateProduct(product.id, {
        state: ProductState.LIVE,
        deployUrl,
        deployedAt: new Date().toISOString(),
      });

      return { success: true, url: deployUrl };
    } else {
      console.log(`  ❌ Deploy failed: ${result.error.slice(0, 200)}`);
      updateProduct(product.id, { state: ProductState.READY });
      return { success: false, error: result.error };
    }
  } catch (err) {
    console.log(`  ❌ Deploy error: ${err.message}`);
    updateProduct(product.id, { state: ProductState.READY });
    return { success: false, error: err.message };
  }
}

/**
 * Push product code to GitHub
 */

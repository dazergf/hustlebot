import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { updateProduct } from './product-catalog.js';
import { loadDeployConfig } from './deploy-config.js';
import { runCommand } from './deploy-utils.js';

export async function pushToGitHub(product) {
  const config = loadDeployConfig();
  const productDir = product.buildDir;

  if (!productDir || !fs.existsSync(productDir)) {
    return { success: false, error: 'Build directory not found' };
  }

  console.log(`  📤 Pushing ${product.name} to GitHub...`);

  try {
    // Check if gh CLI is available
    try {
      execSync('gh --version', { stdio: 'pipe' });
    } catch {
      return { success: false, error: 'GitHub CLI (gh) not installed. Run: winget install GitHub.cli' };
    }

    // Generate a clean repo name from product name
    const repoName = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    // Initialize git repo if needed
    if (!fs.existsSync(path.join(productDir, '.git'))) {
      execSync('git init', { cwd: productDir, stdio: 'pipe' });
      execSync('git add -A', { cwd: productDir, stdio: 'pipe' });
      execSync('git commit -m "Initial product build"', { cwd: productDir, stdio: 'pipe' });
    }

    // Create GitHub repo
    const result = await runCommand('gh', [
      'repo', 'create', repoName,
      '--public',
      '--source', productDir,
      '--push',
      '--description', product.description || product.name,
    ], { cwd: productDir });

    if (result.success) {
      const repoUrl = `https://github.com/${config.github?.org || 'hustlebot'}/${repoName}`;
      console.log(`  ✅ Pushed to: ${repoUrl}`);

      updateProduct(product.id, { repoUrl });
      return { success: true, url: repoUrl };
    }

    return { success: false, error: result.error };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Create a Lemon Squeezy product listing
 */

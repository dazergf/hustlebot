/**
 * Deployer — Auto-deploys products to Vercel, GitHub, and marketplaces
 *
 * Takes a built product and pushes it live so people can buy it.
 */

import { loadDeployConfig, saveDeployConfig } from './deploy-config.js';
import { deployToVercel } from './deploy-vercel.js';
import { pushToGitHub } from './deploy-github.js';
import { createLemonSqueezyProduct } from './deploy-payment.js';

export { loadDeployConfig, saveDeployConfig } from './deploy-config.js';
export { deployToVercel } from './deploy-vercel.js';
export { pushToGitHub } from './deploy-github.js';
export { createLemonSqueezyProduct } from './deploy-payment.js';

/**
 * Full deployment pipeline: GitHub → Vercel → Payment
 */
export async function fullDeploy(product) {
  const results = {};

  results.github = await pushToGitHub(product);
  if (results.github.success) {
    console.log(`  ✓ GitHub: ${results.github.url}`);
  }

  results.vercel = await deployToVercel(product);
  if (results.vercel.success) {
    console.log(`  ✓ Vercel: ${results.vercel.url}`);
  }

  results.payment = await createLemonSqueezyProduct(product);
  if (results.payment.success) {
    console.log(`  ✓ Payment: ${results.payment.url}`);
  }

  const allSuccess = results.vercel?.success && results.payment?.success;

  return {
    success: allSuccess,
    results,
    summary: allSuccess
      ? `🎉 Product LIVE at ${results.vercel.url} — Buy: ${results.payment.url}`
      : `Partial deploy: ${Object.entries(results).map(([k, v]) => `${k}: ${v.success ? '✓' : '✗'}`).join(', ')}`,
  };
}

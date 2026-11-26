import {
  checkProjectStructure,
  checkFileCount,
  checkNoEmptyFiles,
  checkReadme,
  checkNoSecrets,
  checkFileSizes,
} from './quality-checks.js';
import {
  checkFileTypes,
  checkNpmInstall,
  checkPythonSyntax,
  checkHTMLValid,
  checkJSSyntax,
} from './quality-builders.js';

export {
  checkFileTypes,
  checkNpmInstall,
  checkPythonSyntax,
  checkHTMLValid,
  checkJSSyntax,
} from './quality-builders.js';

/**
 * Quality Runner — runs automated checks on deliverables before sending to client.
 *
 * Universal checks + domain-specific checks from each agent.
 */

/**
 * Run all quality checks for a delivery
 */
export async function runQualityChecks(projectDir, checks = []) {
  const results = [];

  results.push(await checkProjectStructure(projectDir));
  results.push(await checkFileCount(projectDir));
  results.push(await checkNoEmptyFiles(projectDir));
  results.push(await checkReadme(projectDir));
  results.push(await checkNoSecrets(projectDir));
  results.push(await checkFileSizes(projectDir));

  for (const check of checks) {
    try {
      const result = await check(projectDir);
      results.push(result);
    } catch (e) {
      results.push({
        name: 'Custom check',
        passed: false,
        message: `Check threw error: ${e.message}`,
      });
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed);

  return {
    passed: failed.length === 0,
    checksRun: results.length,
    checksPassed: passed,
    checksFailed: failed.length,
    details: results,
    summary: failed.length === 0
      ? `All ${results.length} checks passed ✅`
      : `${failed.length}/${results.length} checks failed: ${failed.map(f => f.name).join(', ')}`,
  };
}

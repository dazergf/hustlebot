import chalk from 'chalk';
import { tryUpworkRSS, tryUpworkFetch, tryUpworkPuppeteer } from './upwork-sources.js';
import { getDemoUpworkJobs } from './upwork-demo.js';

const UPWORK_SEARCH_URL = 'https://www.upwork.com/nx/search/jobs/';

/**
 * Scan Upwork job listings by keyword.
 *
 * Strategy (in order of preference):
 * 1. Upwork RSS feed (may still work for some queries)
 * 2. Upwork API with fetch + rotating headers
 * 3. Puppeteer browser scraping (headless Chrome)
 * 4. Demo fallback with clearly marked results
 */
export async function scanUpwork(keywords, options = {}) {
  const jobs = [];
  const limit = options.limit || 20;

  for (const keyword of keywords.slice(0, 5)) {
    const rssJobs = await tryUpworkRSS(keyword);
    if (rssJobs.length > 0) {
      jobs.push(...rssJobs);
      continue;
    }

    const apiJobs = await tryUpworkFetch(keyword);
    if (apiJobs.length > 0) {
      jobs.push(...apiJobs);
      continue;
    }

    const browserJobs = await tryUpworkPuppeteer(keyword);
    if (browserJobs.length > 0) {
      jobs.push(...browserJobs);
      continue;
    }

    console.log(chalk.yellow(`  ⚠ Upwork blocked for "${keyword}" — using demo results. Auth with 'hustlebot auth upwork' for live data.`));
    jobs.push(...getDemoUpworkJobs(keyword));

    await new Promise(r => setTimeout(r, 1500));
  }

  const seen = new Set();
  const unique = jobs.filter(j => {
    const key = j.title.toLowerCase().substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, limit);
}

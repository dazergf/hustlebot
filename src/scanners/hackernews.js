import chalk from 'chalk';
import { scanFreelancerThreads, scanAskHN, scanWhoIsHiring } from './hackernews-threads.js';
import { getDemoHNJobs } from './hackernews-utils.js';

/**
 * Scan HackerNews for FREELANCE opportunities only.
 *
 * Sources:
 * 1. Monthly "Freelancer? Seeking Freelancer?" threads (PRIMARY - actual freelance gigs)
 * 2. "Ask HN" posts where people need technical help
 * 3. "Who's Hiring" threads filtered to contract/freelance/remote ONLY
 *
 * HN free API: https://hacker-news.firebaseio.com/v0/
 * Algolia search: https://hn.algolia.com/api
 */
export async function scanHackerNews(keywords, options = {}) {
  const jobs = [];
  const limit = options.limit || 15;

  try {
    const freelanceJobs = await scanFreelancerThreads(keywords);
    jobs.push(...freelanceJobs);

    const askJobs = await scanAskHN(keywords);
    jobs.push(...askJobs);

    const hiringJobs = await scanWhoIsHiring(keywords);
    jobs.push(...hiringJobs);
  } catch (err) {
    console.log(chalk.yellow(`  ⚠ HackerNews scan error: ${err.message}`));
  }

  if (jobs.length === 0) {
    jobs.push(...getDemoHNJobs(keywords));
  }

  jobs.sort((a, b) => {
    const aFreelance = a.is_freelance ? 1 : 0;
    const bFreelance = b.is_freelance ? 1 : 0;
    if (aFreelance !== bFreelance) return bFreelance - aFreelance;
    return new Date(b.scraped_at) - new Date(a.scraped_at);
  });

  return jobs.slice(0, limit);
}

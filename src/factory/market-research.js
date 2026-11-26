/**
 * Market Research Engine — Finds profitable product opportunities
 *
 * Combines live market signals with curated high-demand niches.
 */

import {
  scanProductHunt,
  scanRedditDemand,
  scanHackerNews,
  scanGitHubTrending,
} from './market-research-sources.js';
import { generateIdeasFromSignals, getCuratedIdeas } from './market-research-ideas.js';

export { getCuratedIdeas } from './market-research-ideas.js';

/**
 * Full market research scan — combines all sources
 */
export async function runMarketResearch() {
  console.log('  🔍 Scanning market for opportunities...\n');

  const [phIdeas, redditIdeas, hnIdeas, ghIdeas] = await Promise.allSettled([
    scanProductHunt(),
    scanRedditDemand(),
    scanHackerNews(),
    scanGitHubTrending(),
  ]);

  const allSignals = [
    ...(phIdeas.status === 'fulfilled' ? phIdeas.value : []),
    ...(redditIdeas.status === 'fulfilled' ? redditIdeas.value : []),
    ...(hnIdeas.status === 'fulfilled' ? hnIdeas.value : []),
    ...(ghIdeas.status === 'fulfilled' ? ghIdeas.value : []),
  ];

  console.log(`  📡 Found ${allSignals.length} market signals`);

  const liveIdeas = generateIdeasFromSignals(allSignals);
  console.log(`  💡 Generated ${liveIdeas.length} product ideas from live data`);

  const curatedIdeas = getCuratedIdeas(10);
  console.log(`  ⭐ ${curatedIdeas.length} curated high-demand product ideas`);

  const allIdeas = [...liveIdeas, ...curatedIdeas]
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, 20);

  return {
    signals: allSignals,
    ideas: allIdeas,
    scannedAt: new Date().toISOString(),
    sources: {
      productHunt: phIdeas.status === 'fulfilled' ? phIdeas.value.length : 0,
      reddit: redditIdeas.status === 'fulfilled' ? redditIdeas.value.length : 0,
      hackerNews: hnIdeas.status === 'fulfilled' ? hnIdeas.value.length : 0,
      github: ghIdeas.status === 'fulfilled' ? ghIdeas.value.length : 0,
      curated: curatedIdeas.length,
    },
  };
}

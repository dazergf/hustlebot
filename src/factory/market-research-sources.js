/**
 * Live market signal scanners (Product Hunt, Reddit, Hacker News, GitHub).
 */

import fetch from 'node-fetch';

export async function scanProductHunt() {
  const ideas = [];
  try {
    // Product Hunt's homepage shows trending products
    const res = await fetch('https://www.producthunt.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (res.ok) {
      const html = await res.text();
      // Extract trending categories and product names
      const trendMatches = html.match(/data-test="post-name"[^>]*>([^<]+)/g) || [];
      for (const match of trendMatches.slice(0, 10)) {
        const name = match.replace(/data-test="post-name"[^>]*>/, '').trim();
        ideas.push({
          source: 'producthunt',
          trend: name,
          signal: 'trending_product',
        });
      }
    }
  } catch (e) {
    // Product Hunt may block, that's fine
  }
  return ideas;
}

/**
 * Scan Reddit for what people are asking for / paying for
 */
export async function scanRedditDemand() {
  const ideas = [];
  const subreddits = [
    'SideProject', 'indiehackers', 'SaaS', 'Entrepreneur',
    'webdev', 'reactjs', 'nextjs', 'artificial',
    'ChatGPT', 'ClaudeAI', 'MachineLearning',
  ];

  for (const sub of subreddits.slice(0, 5)) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=10`, {
        headers: { 'User-Agent': 'HustleBot/3.0' },
      });
      if (res.ok) {
        const data = await res.json();
        const posts = data?.data?.children || [];
        for (const post of posts) {
          const title = post.data?.title || '';
          const score = post.data?.score || 0;

          // Look for demand signals
          const demandSignals = [
            /looking for|need a|wish there was|anyone built|does .* exist/i,
            /built|launched|made \$|revenue|sold|paying customers/i,
            /tool|app|template|extension|plugin|api|saas/i,
          ];

          if (demandSignals.some(s => s.test(title)) && score > 10) {
            ideas.push({
              source: `reddit:${sub}`,
              trend: title,
              signal: score > 100 ? 'high_demand' : 'moderate_demand',
              score,
            });
          }
        }
      }
    } catch (e) {
      // Rate limited, skip
    }
  }
  return ideas;
}

/**
 * Scan Hacker News for demand signals
 */
export async function scanHackerNews() {
  const ideas = [];
  try {
    // Check "Show HN" and "Ask HN" for what people are building/wanting
    const res = await fetch('https://hacker-news.firebaseio.com/v0/showstories.json');
    if (res.ok) {
      const storyIds = await res.json();
      // Check top 15 stories
      for (const id of storyIds.slice(0, 15)) {
        try {
          const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (storyRes.ok) {
            const story = await storyRes.json();
            if (story?.title && story?.score > 20) {
              ideas.push({
                source: 'hackernews:show',
                trend: story.title,
                signal: story.score > 100 ? 'viral' : 'trending',
                score: story.score,
                url: story.url,
              });
            }
          }
        } catch (e) { /* skip */ }
      }
    }
  } catch (e) {
    // HN API failed
  }
  return ideas;
}

/**
 * Scan GitHub trending for popular project types
 */
export async function scanGitHubTrending() {
  const ideas = [];
  try {
    const res = await fetch('https://api.github.com/search/repositories?q=stars:>100+created:>2026-01-01&sort=stars&order=desc&per_page=20', {
      headers: { 'User-Agent': 'HustleBot/3.0' },
    });
    if (res.ok) {
      const data = await res.json();
      for (const repo of (data.items || []).slice(0, 15)) {
        ideas.push({
          source: 'github:trending',
          trend: `${repo.name}: ${repo.description || 'Popular repo'}`,
          signal: repo.stargazers_count > 1000 ? 'viral' : 'trending',
          score: repo.stargazers_count,
          language: repo.language,
          topics: repo.topics,
        });
      }
    }
  } catch (e) { /* skip */ }
  return ideas;
}

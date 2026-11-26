import {
  FREELANCE_SIGNALS,
  FULL_TIME_SIGNALS,
  decodeHtmlEntities,
  extractBudgetFromHN,
  extractSkillsFromHN,
} from './hackernews-utils.js';

export async function scanFreelancerThreads(keywords) {
  const jobs = [];

  try {
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent('freelancer seeking')}&tags=story&numericFilters=created_at_i>${Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 45}`;

    const searchResp = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
    if (!searchResp.ok) return [];

    const searchData = await searchResp.json();

    const freelanceThreads = (searchData.hits || []).filter(h =>
      h.title?.toLowerCase().includes('freelancer') && h.title?.toLowerCase().includes('seeking')
    );

    for (const thread of freelanceThreads.slice(0, 2)) {
      const threadUrl = `https://hn.algolia.com/api/v1/search?tags=comment,story_${thread.objectID}&hitsPerPage=200`;
      const threadResp = await fetch(threadUrl, { signal: AbortSignal.timeout(10000) });

      if (!threadResp.ok) continue;

      const threadData = await threadResp.json();

      for (const comment of (threadData.hits || [])) {
        const text = comment.comment_text || '';
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/&[#\w]+;/g, (m) => decodeHtmlEntities(m)).replace(/\s+/g, ' ').trim();
        const textLower = cleanText.toLowerCase();

        // Must match at least one keyword
        const matchedKeyword = keywords.find(kw => textLower.includes(kw.toLowerCase()));
        if (!matchedKeyword || cleanText.length < 50) continue;

        // Only accept posts where someone is HIRING a freelancer (not a freelancer offering services)
        const isOfferingServices = textLower.includes('seeking work') ||
          textLower.includes('seeking freelance') ||
          textLower.includes('available for') ||
          textLower.includes("i'm a ") ||
          textLower.includes("i am a ") ||
          textLower.includes("i'm an ") ||
          textLower.includes("i am an ") ||
          textLower.includes('my portfolio') ||
          textLower.includes('my github') ||
          textLower.includes('open to opportunities') ||
          textLower.includes('open to work') ||
          textLower.startsWith('seeking ') ||
          textLower.startsWith('freelancer |') ||
          textLower.startsWith('freelancer:');

        const isHiring = !isOfferingServices && (
          textLower.includes('seeking freelancer') ||
          textLower.includes('hiring') ||
          textLower.includes('looking for a') ||
          textLower.includes('need help') ||
          textLower.includes('project:') ||
          textLower.includes('contract:')
        );

        if (isHiring) {
          jobs.push({
            id: `hn-freelance-${comment.objectID}`,
            platform: 'hackernews',
            title: `HN Freelance: ${cleanText.substring(0, 80)}...`,
            description: cleanText.substring(0, 500),
            budget: extractBudgetFromHN(cleanText),
            skills: extractSkillsFromHN(cleanText, keywords),
            url: `https://news.ycombinator.com/item?id=${comment.objectID}`,
            search_keyword: matchedKeyword,
            scraped_at: new Date().toISOString(),
            client_info: `HN thread: ${thread.title}`,
            parent_thread: thread.title,
            is_freelance: true,
          });
        }
      }

      await new Promise(r => setTimeout(r, 500));
    }
  } catch (e) {
    // silently fail
  }

  return jobs;
}

/**
 * Scan "Ask HN" posts — people asking for technical help
 */
export async function scanAskHN(keywords) {
  const jobs = [];

  for (const keyword of keywords.slice(0, 3)) {
    try {
      const askUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(keyword)}&tags=ask_hn&numericFilters=created_at_i>${Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30}&hitsPerPage=5`;

      const askResp = await fetch(askUrl, { signal: AbortSignal.timeout(10000) });
      if (!askResp.ok) continue;

      const askData = await askResp.json();

      for (const post of (askData.hits || [])) {
        if (post.title && post.num_comments > 0) {
          const storyText = (post.story_text || '').replace(/<[^>]*>/g, ' ').replace(/&[#\w]+;/g, (m) => decodeHtmlEntities(m)).trim();

          jobs.push({
            id: `hn-ask-${post.objectID}`,
            platform: 'hackernews',
            title: post.title,
            description: (storyText || post.title).substring(0, 500),
            budget: 'Engagement opportunity',
            skills: [keyword],
            url: `https://news.ycombinator.com/item?id=${post.objectID}`,
            search_keyword: keyword,
            scraped_at: new Date().toISOString(),
            client_info: `${post.num_comments} comments • ${post.points} points`,
            is_freelance: false,
          });
        }
      }
    } catch (e) { /* skip */ }

    await new Promise(r => setTimeout(r, 500));
  }

  return jobs;
}

/**
 * Scan "Who's Hiring" threads — ONLY freelance/contract/remote opportunities
 */
export async function scanWhoIsHiring(keywords) {
  const jobs = [];

  try {
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent('who is hiring')}&tags=story&numericFilters=created_at_i>${Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 45}`;

    const searchResp = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
    if (!searchResp.ok) return [];

    const searchData = await searchResp.json();

    const hiringThreads = (searchData.hits || []).filter(h =>
      h.title?.toLowerCase().includes('who is hiring')
    );

    for (const thread of hiringThreads.slice(0, 1)) {
      const threadUrl = `https://hn.algolia.com/api/v1/search?tags=comment,story_${thread.objectID}&hitsPerPage=200`;
      const threadResp = await fetch(threadUrl, { signal: AbortSignal.timeout(10000) });

      if (!threadResp.ok) continue;

      const threadData = await threadResp.json();

      for (const comment of (threadData.hits || [])) {
        const text = comment.comment_text || '';
        const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/&[#\w]+;/g, (m) => decodeHtmlEntities(m)).replace(/\s+/g, ' ').trim();
        const textLower = cleanText.toLowerCase();

        // Must match at least one keyword
        const matchedKeyword = keywords.find(kw => textLower.includes(kw.toLowerCase()));
        if (!matchedKeyword || cleanText.length < 50) continue;

        // Skip freelancers offering their services (not gigs)
        const isOfferingServices = textLower.includes('seeking work') ||
          textLower.includes('seeking freelance') ||
          textLower.includes('available for') ||
          textLower.includes("i'm a ") ||
          textLower.includes("i am a ") ||
          textLower.includes("i'm an ") ||
          textLower.includes("i am an ") ||
          textLower.includes('my portfolio') ||
          textLower.includes('my github') ||
          textLower.includes('open to opportunities') ||
          textLower.includes('open to work') ||
          textLower.startsWith('seeking ') ||
          textLower.startsWith('freelancer |') ||
          textLower.startsWith('freelancer:');
        if (isOfferingServices) continue;

        // FILTER: Must have freelance signals AND must NOT be purely full-time
        const hasFreelanceSignal = FREELANCE_SIGNALS.some(s => textLower.includes(s));
        const hasFullTimeSignal = FULL_TIME_SIGNALS.some(s => textLower.includes(s));

        // Only include if it has freelance signals OR is contract-compatible
        if (!hasFreelanceSignal) continue;
        // Skip if it's heavily full-time focused with no freelance option
        if (hasFullTimeSignal && !textLower.includes('contract') && !textLower.includes('freelance')) continue;

        jobs.push({
          id: `hn-hiring-${comment.objectID}`,
          platform: 'hackernews',
          title: `HN Contract: ${cleanText.substring(0, 80)}...`,
          description: cleanText.substring(0, 500),
          budget: extractBudgetFromHN(cleanText),
          skills: extractSkillsFromHN(cleanText, keywords),
          url: `https://news.ycombinator.com/item?id=${comment.objectID}`,
          search_keyword: matchedKeyword,
          scraped_at: new Date().toISOString(),
          client_info: `HN thread: ${thread.title}`,
          parent_thread: thread.title,
          is_freelance: hasFreelanceSignal,
        });
      }

      await new Promise(r => setTimeout(r, 500));
    }
  } catch (e) {
    // silently fail
  }

  return jobs;
}


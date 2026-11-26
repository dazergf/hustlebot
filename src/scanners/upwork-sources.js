/**
 * Upwork scraping strategies.
 */

const UPWORK_SEARCH_URL = 'https://www.upwork.com/nx/search/jobs/';
const UPWORK_RSS_URL = 'https://www.upwork.com/ab/feed/jobs/rss';

export async function tryUpworkRSS(keyword) {
  try {
    const query = encodeURIComponent(keyword);
    const url = `${UPWORK_RSS_URL}?q=${query}&sort=recency&paging=0%3B10`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const xml = await response.text();
    if (!xml.includes('<item>')) return [];

    // Parse RSS items manually (avoid cheerio XML mode issues)
    const items = xml.split('<item>').slice(1);
    const jobs = [];

    for (const item of items.slice(0, 10)) {
      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link');
      const description = extractTag(item, 'description')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();

      if (title && title.length > 5) {
        // Extract budget from description
        const budgetMatch = description.match(/Budget:\s*\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*\/\s*(?:hr|hour))?/i);
        const budget = budgetMatch ? budgetMatch[0].replace('Budget:', '').trim() : 'Not specified';

        // Extract skills
        const skillsMatch = description.match(/Skills?:\s*([^.]+)/i);
        const skills = skillsMatch
          ? skillsMatch[1].split(',').map(s => s.trim()).filter(Boolean).slice(0, 8)
          : [keyword];

        jobs.push({
          id: `upwork-rss-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          platform: 'upwork',
          title: title.replace(/ - Upwork$/i, ''),
          description: description.substring(0, 500),
          budget,
          skills,
          url: link || `${UPWORK_SEARCH_URL}?q=${encodeURIComponent(keyword)}`,
          search_keyword: keyword,
          scraped_at: new Date().toISOString(),
          client_info: null,
          source: 'rss',
        });
      }
    }

    return jobs;
  } catch (e) {
    return [];
  }
}

export function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
  return match ? match[1].trim() : '';
}

/**
 * Try Upwork with enhanced fetch headers
 */
export async function tryUpworkFetch(keyword) {
  try {
    const query = encodeURIComponent(keyword);
    const url = `${UPWORK_SEARCH_URL}?q=${query}&sort=recency&per_page=10`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return [];

    const html = await response.text();

    // Try to find JSON data embedded in the page (Upwork sometimes embeds job data in script tags)
    const scriptMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/);
    if (scriptMatch) {
      try {
        const state = JSON.parse(scriptMatch[1]);
        const searchResults = state?.search?.jobs || state?.jobs || [];
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          return searchResults.slice(0, 10).map((job, i) => ({
            id: `upwork-${job.id || job.uid || Date.now()}-${i}`,
            platform: 'upwork',
            title: job.title || 'Untitled',
            description: (job.description || job.snippet || '').substring(0, 500),
            budget: job.budget?.amount ? `$${job.budget.amount} ${job.type || 'Fixed'}` : (job.hourlyBudget ? `$${job.hourlyBudget.min}-${job.hourlyBudget.max}/hr` : 'Not specified'),
            skills: (job.skills || job.attrs?.skills || []).map(s => typeof s === 'string' ? s : s.name).slice(0, 8),
            url: job.ciphertext ? `https://www.upwork.com/jobs/${job.ciphertext}` : `${UPWORK_SEARCH_URL}?q=${query}`,
            search_keyword: keyword,
            scraped_at: new Date().toISOString(),
            client_info: job.client?.paymentVerificationStatus === 'verified' ? '✓ Payment verified' : null,
            source: 'fetch',
          }));
        }
      } catch (e) { /* JSON parse failed */ }
    }

    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Try Puppeteer browser automation for Upwork
 */
export async function tryUpworkPuppeteer(keyword) {
  try {
    const { launchBrowser } = await import('../browser/playwright-manager.js');
    const { context, page } = await launchBrowser({ headless: true });
    if (!page) return [];

    const query = encodeURIComponent(keyword);
    await page.goto(`${UPWORK_SEARCH_URL}?q=${query}&sort=recency`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    // Wait for job tiles to load
    await page.waitForSelector('article, [data-test="job-tile-list"], .job-tile', { timeout: 10000 }).catch(() => {});

    const jobs = await page.evaluate((kw) => {
      const results = [];
      const tiles = document.querySelectorAll('article, [data-test="job-tile-list"] > div, .job-tile, section[data-v-job]');

      tiles.forEach((tile, i) => {
        if (i >= 10) return;
        const titleEl = tile.querySelector('h2 a, .job-tile-title a, [data-test="job-tile-title-link"], a[data-test="UpLink"]');
        const descEl = tile.querySelector('.job-description, [data-test="job-description-text"], .text-body-sm, p');
        const budgetEl = tile.querySelector('.budget, [data-test="budget"], [data-test="is-fixed-price"], [data-test="hourly-rate"]');
        const linkEl = tile.querySelector('a[href*="/jobs/"], a[href*="/nx/"]');

        const title = titleEl?.textContent?.trim();
        const description = descEl?.textContent?.trim();
        const budget = budgetEl?.textContent?.trim();
        const link = linkEl?.getAttribute('href');

        const skillEls = tile.querySelectorAll('.skill-tag, [data-test="skill"], .air3-token, [data-test="attr-item"]');
        const skills = Array.from(skillEls).map(s => s.textContent.trim()).filter(Boolean);

        if (title && title.length > 5) {
          results.push({
            title,
            description: (description || '').substring(0, 500),
            budget: budget || 'Not specified',
            skills: skills.slice(0, 8),
            link: link ? (link.startsWith('http') ? link : `https://www.upwork.com${link}`) : null,
          });
        }
      });
      return results;
    }, keyword);

    await context.close();

    return jobs.map((job, i) => ({
      id: `upwork-browser-${Date.now()}-${i}`,
      platform: 'upwork',
      title: job.title,
      description: job.description,
      budget: job.budget,
      skills: job.skills.length > 0 ? job.skills : [keyword],
      url: job.link || `${UPWORK_SEARCH_URL}?q=${encodeURIComponent(keyword)}`,
      search_keyword: keyword,
      scraped_at: new Date().toISOString(),
      client_info: null,
      source: 'browser',
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Demo/fallback jobs when all strategies fail
 */

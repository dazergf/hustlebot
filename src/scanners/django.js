import chalk from 'chalk';

/**
 * Scan Django community jobs (https://www.djangoproject.com/community/jobs/).
 *
 * The Django community jobs page aggregates postings from the Django Job Board
 * and "Built with Django" jobs. We consume its public RSS feed, which is far
 * more stable than scraping the HTML page.
 *
 * No authentication required.
 */
const RSS_URL = 'https://www.djangoproject.com/rss/community/jobs/';

export async function scanDjango(keywords, options = {}) {
  const jobs = [];
  const limit = options.limit || 20;

  try {
    const response = await fetch(RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);

    items.forEach((item, index) => {
      const title = clean(decodeEntities(getTag(item, 'title')));
      const link = clean(getTag(item, 'link'));
      const guid = clean(getTag(item, 'guid'));
      const descriptionRaw = getTag(item, 'description');
      const creator = clean(decodeEntities(getTag(item, 'dc:creator') || getTag(item, 'author') || ''));
      const pubDate = clean(getTag(item, 'pubDate'));

      if (!title) return;

      const description = clean(stripHtml(decodeEntities(descriptionRaw)));
      const text = `${title} ${description}`;
      const matchedKeywords = (keywords || []).filter(kw =>
        text.toLowerCase().includes(String(kw).toLowerCase())
      );
      const searchKeyword = matchedKeywords.length
        ? matchedKeywords[0]
        : (keywords && keywords.length ? keywords[0] : 'django');

      const skills = Array.from(new Set([
        ...matchedKeywords,
        'Django',
        'Python',
      ]));

      const budget = extractBudget(description) || extractBudget(title) || 'See posting';

      jobs.push({
        id: `django-${guid || link || index}-${Date.now()}`,
        platform: 'django',
        title,
        description: description.substring(0, 1500),
        budget,
        skills,
        url: link || guid || RSS_URL,
        search_keyword: searchKeyword,
        scraped_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        client_info: creator || 'Django community job board',
        source: 'rss',
        is_demo: false,
      });
    });

    let filtered = jobs;
    if (keywords && keywords.length) {
      const kwFiltered = jobs.filter(j =>
        keywords.some(kw => `${j.title} ${j.description}`.toLowerCase().includes(String(kw).toLowerCase()))
      );
      if (kwFiltered.length > 0) filtered = kwFiltered;
    }

    const seen = new Set();
    const unique = filtered.filter(j => {
      const key = j.title.toLowerCase().substring(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (unique.length === 0) {
      console.log(chalk.yellow('  ⚠ Django jobs: no matching results — using demo data'));
      return getDemoDjangoJobs(keywords).slice(0, limit);
    }

    return unique.slice(0, limit);
  } catch (err) {
    console.log(chalk.yellow(`  ⚠ Django jobs scan error: ${err.message} — using demo data`));
    return getDemoDjangoJobs(keywords).slice(0, limit);
  }
}

function getTag(xml, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1].trim();
}

function decodeEntities(text) {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function extractBudget(text) {
  if (!text) return '';
  const dollarMatch = text.match(/\$\s?[\d,]+(?:\.\d+)?(?:\s*[kK])?(?:\s*[–\-]\s*\$?\s*[\d,]+(?:\.\d+)?(?:\s*[kK])?)?/);
  if (dollarMatch) return dollarMatch[0].trim();
  const usdMatch = text.match(/USD\s*[\d,]+(?:\.\d+)?(?:\s*[kK])?(?:\s*[–\-]\s*(?:USD\s*)?[\d,]+(?:\.\d+)?(?:\s*[kK])?)?/i);
  if (usdMatch) return usdMatch[0].trim();
  return '';
}

function getDemoDjangoJobs(keyword) {
  const demoJobs = [
    {
      title: 'Django Backend Engineer (Remote)',
      description: 'Build and maintain Django REST Framework APIs, PostgreSQL data models, Celery workers. Remote-friendly, contract-to-hire possible.',
      budget: '$80 - $120/hr',
      skills: ['Django', 'DRF', 'PostgreSQL', 'Celery', 'Python'],
    },
    {
      title: 'Senior Python Engineer — Django & FastAPI',
      description: 'Design and scale backend services with Django/FastAPI. Strong SQL, async Python, cloud experience. Remote.',
      budget: '$100 - $150/hr',
      skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'AWS'],
    },
    {
      title: 'AI Engineer — LLM features for Django apps',
      description: 'Build RAG, semantic search, AI agents integrated into Django services. LLM APIs, vector DBs, prompt engineering.',
      budget: '$90 - $140/hr',
      skills: ['AI', 'LLM', 'RAG', 'Django', 'Python'],
    },
    {
      title: 'Django Developer — Wagtail CMS',
      description: 'Maintain and deliver Django/Wagtail solutions for mission-driven organisations. Remote, contract.',
      budget: '$60 - $90/hr',
      skills: ['Django', 'Wagtail', 'Python', 'PostgreSQL'],
    },
  ];

  const kw = String(keyword || '').toLowerCase();
  const relevant = demoJobs.filter(j =>
    !kw ||
    j.title.toLowerCase().includes(kw) ||
    j.description.toLowerCase().includes(kw) ||
    j.skills.some(s => s.toLowerCase().includes(kw))
  );
  const results = relevant.length > 0 ? relevant : demoJobs.slice(0, 2);

  return results.map((j, i) => ({
    ...j,
    id: `django-demo-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
    platform: 'django',
    url: RSS_URL,
    search_keyword: keyword || 'django',
    scraped_at: new Date().toISOString(),
    client_info: 'Demo — Django community job board',
    is_demo: false ? false : true,
    source: 'demo',
  }));
}
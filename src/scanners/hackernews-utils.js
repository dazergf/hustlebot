/**
 * Shared Hacker News parsing helpers and demo fallback jobs.
 */

export const FULL_TIME_SIGNALS = [
  'full-time', 'fulltime', 'full time',
  'salary', 'equity', 'benefits', 'w-2', 'w2',
  '401k', '401(k)', 'health insurance',
  'on-site only', 'onsite only',
  'visa sponsor', 'h1b',
  '$\\d+k/year', '$\\d+k-\\d+k',
  'stock options', 'pto',
];

export function decodeHtmlEntities(text) {
  return text
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

export const FREELANCE_SIGNALS = [
  'freelance', 'contract', 'contractor', 'consulting',
  'part-time', 'part time', 'parttime',
  'remote', 'project-based', 'project based',
  'hourly', '/hr', 'per hour',
  'short-term', 'short term', 'gig',
  'open to contractors', 'freelancers welcome',
  'contract-to-hire', 'c2h',
];

export function extractBudgetFromHN(text) {
  // Match hourly rates first (most relevant for freelance)
  const hourlyMatch = text.match(/\$\s*[\d,]+(?:\s*[-–]\s*\$?\s*[\d,]+)?\s*\/\s*(?:hr|hour)/i);
  if (hourlyMatch) return hourlyMatch[0];

  // Match fixed budgets
  const fixedMatch = text.match(/\$\s*[\d,]+(?:k|K)?(?:\s*[-–]\s*\$?\s*[\d,]+(?:k|K)?)?/);
  if (fixedMatch) return fixedMatch[0];

  return 'Not specified';
}

export function extractSkillsFromHN(text, keywords) {
  const commonSkills = [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'PostgreSQL',
    'AWS', 'Docker', 'Kubernetes', 'AI', 'ML', 'LLM', 'Claude', 'GPT', 'OpenAI',
    'Anthropic', 'LangChain', 'RAG', 'OpenClaw', 'n8n', 'automation', 'data pipeline',
    'Rust', 'Go', 'Ruby', 'Rails', 'Django', 'FastAPI', 'Next.js', 'Supabase',
    'Claude Code', 'Codex', 'Cursor', 'Vercel', 'Stripe',
  ];

  const found = commonSkills.filter(skill =>
    text.toLowerCase().includes(skill.toLowerCase())
  );

  const matchedKeywords = keywords.filter(kw =>
    text.toLowerCase().includes(kw.toLowerCase())
  );

  return [...new Set([...found, ...matchedKeywords])].slice(0, 8);
}

export function getDemoHNJobs(keywords) {
  return [
    {
      id: 'hn-demo-1',
      platform: 'hackernews',
      title: 'Ask HN: Best way to set up an AI agent for my small business?',
      description: 'I run a small e-commerce shop and keep hearing about AI agents that can handle customer support, inventory, and social media. Has anyone set this up? Would love to hire someone who knows OpenClaw or similar.',
      budget: 'Engagement opportunity',
      skills: ['AI agents', 'OpenClaw', 'automation'],
      url: 'https://news.ycombinator.com/',
      search_keyword: keywords[0] || 'AI',
      scraped_at: new Date().toISOString(),
      client_info: '47 comments • 89 points',
      is_demo: true,
      is_freelance: false,
    },
    {
      id: 'hn-demo-2',
      platform: 'hackernews',
      title: 'HN Freelance: AI/ML startup needs contract data engineer — Remote, $150-200/hr',
      description: 'Building AI-powered analytics for healthcare. Looking for a contract data engineer to build real-time pipelines. Python, SQL, Spark. Remote. Open to freelancers, 3-6 month engagement.',
      budget: '$150-200/hr',
      skills: ['Python', 'SQL', 'data pipeline', 'AI', 'healthcare'],
      url: 'https://news.ycombinator.com/',
      search_keyword: keywords[0] || 'data',
      scraped_at: new Date().toISOString(),
      client_info: 'HN Freelancer? Seeking Freelancer? March 2026',
      is_demo: true,
      is_freelance: true,
    },
  ];
}

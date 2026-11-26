/**
 * Demo fallback jobs for Upwork.
 */

const UPWORK_SEARCH_URL = 'https://www.upwork.com/nx/search/jobs/';

export function getDemoUpworkJobs(keyword) {
  const demoJobs = [
    {
      title: 'OpenClaw AI Agent Setup & Configuration on Mac Mini',
      description: 'Looking for someone experienced with OpenClaw to set up a fully configured instance on a Mac Mini. Need Telegram integration, custom skills, and a nightly consolidation cron job. Docker preferred. Must have real OpenClaw experience.',
      budget: '$300 - $800 Fixed',
      skills: ['OpenClaw', 'Docker', 'AI Agents', 'Telegram API', 'Linux'],
    },
    {
      title: 'Claude Code Expert — Build AI-Powered Dashboard',
      description: 'Need a developer who knows Claude Code well to build a React dashboard that uses the Anthropic API for real-time data analysis. Must deploy to Vercel. Looking for someone who can work autonomously.',
      budget: '$50-75/hr',
      skills: ['Claude Code', 'React', 'Anthropic API', 'Vercel', 'TypeScript'],
    },
    {
      title: 'AI Automation Specialist — n8n + LLM Integration',
      description: 'We need someone to build AI-powered automation workflows using n8n. Process incoming customer emails, categorize with LLM, auto-generate draft responses. Must integrate with Gmail and Slack.',
      budget: '$1,000 - $2,500 Fixed',
      skills: ['n8n', 'AI Automation', 'LLM', 'Gmail API', 'Slack API'],
    },
    {
      title: 'Data Pipeline Engineer — Python/SQL Real-time Analytics',
      description: 'Building a real-time analytics pipeline for e-commerce. Need strong Python and SQL skills. Data sources: Shopify, Google Analytics, Stripe. Output to Metabase dashboard.',
      budget: '$75-100/hr',
      skills: ['Python', 'SQL', 'Data Pipeline', 'Shopify API', 'ETL'],
    },
    {
      title: 'Build Custom AI Chatbot for Customer Support',
      description: 'SaaS product needs custom AI chatbot trained on our docs. Should use RAG with our knowledge base. Must integrate with Intercom. Prefer Claude or GPT-4 as the base model.',
      budget: '$2,000 - $5,000 Fixed',
      skills: ['AI Chatbot', 'RAG', 'LangChain', 'Anthropic', 'Intercom'],
    },
  ];

  const kw = keyword.toLowerCase();
  const relevant = demoJobs.filter(j =>
    j.title.toLowerCase().includes(kw) ||
    j.description.toLowerCase().includes(kw) ||
    j.skills.some(s => s.toLowerCase().includes(kw))
  );

  const results = relevant.length > 0 ? relevant : demoJobs.slice(0, 2);

  return results.map((j, i) => ({
    ...j,
    id: `upwork-demo-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
    platform: 'upwork',
    url: `${UPWORK_SEARCH_URL}?q=${encodeURIComponent(keyword)}`,
    search_keyword: keyword,
    scraped_at: new Date().toISOString(),
    client_info: 'Demo data — run hustlebot auth upwork for live results',
    is_demo: true,
    source: 'demo',
  }));
}

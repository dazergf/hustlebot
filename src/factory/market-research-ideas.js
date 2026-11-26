/**
 * Product idea generation from market signals and curated niches.
 */

import { ProductTypes } from './product-catalog.js';

export const HOT_NICHES = [
  // AI & Automation
  { niche: 'AI agents', audience: 'developers', demand: 95 },
  { niche: 'Claude Code automation', audience: 'developers', demand: 90 },
  { niche: 'AI prompt engineering', audience: 'marketers', demand: 88 },
  { niche: 'ChatGPT alternatives', audience: 'businesses', demand: 85 },
  { niche: 'AI workflow automation', audience: 'businesses', demand: 92 },
  { niche: 'LLM fine-tuning', audience: 'ML engineers', demand: 80 },
  { niche: 'RAG applications', audience: 'developers', demand: 87 },
  { niche: 'AI coding assistants', audience: 'developers', demand: 93 },

  // SaaS & Tools
  { niche: 'micro-SaaS starter kits', audience: 'indie hackers', demand: 90 },
  { niche: 'landing page builders', audience: 'startups', demand: 85 },
  { niche: 'email automation', audience: 'marketers', demand: 82 },
  { niche: 'SEO tools', audience: 'content creators', demand: 88 },
  { niche: 'social media schedulers', audience: 'marketers', demand: 80 },
  { niche: 'invoice generators', audience: 'freelancers', demand: 78 },
  { niche: 'project management', audience: 'teams', demand: 75 },

  // Content & Templates
  { niche: 'Notion templates', audience: 'productivity enthusiasts', demand: 90 },
  { niche: 'resume builders', audience: 'job seekers', demand: 85 },
  { niche: 'pitch deck templates', audience: 'founders', demand: 82 },
  { niche: 'business plan templates', audience: 'entrepreneurs', demand: 78 },
  { niche: 'email templates', audience: 'sales teams', demand: 80 },

  // Developer Tools
  { niche: 'Next.js boilerplates', audience: 'developers', demand: 92 },
  { niche: 'Tailwind CSS components', audience: 'frontend devs', demand: 88 },
  { niche: 'API starter kits', audience: 'backend devs', demand: 85 },
  { niche: 'Chrome extensions', audience: 'general users', demand: 90 },
  { niche: 'VS Code extensions', audience: 'developers', demand: 80 },
  { niche: 'CLI tools', audience: 'developers', demand: 75 },

  // Business & Finance
  { niche: 'financial dashboards', audience: 'business owners', demand: 82 },
  { niche: 'expense trackers', audience: 'freelancers', demand: 78 },
  { niche: 'CRM tools', audience: 'sales teams', demand: 85 },
  { niche: 'lead generation', audience: 'marketers', demand: 90 },

  // Trending 2026
  { niche: 'MCP servers', audience: 'AI developers', demand: 95 },
  { niche: 'AI agent frameworks', audience: 'developers', demand: 93 },
  { niche: 'OpenClaw skills', audience: 'AI enthusiasts', demand: 88 },
  { niche: 'vibe coding tools', audience: 'non-technical creators', demand: 85 },
];

export function generateIdeasFromSignals(signals) {
  const ideas = [];

  for (const signal of signals) {
    const trend = signal.trend.toLowerCase();

    // Match signals to product types we can build
    for (const [typeKey, typeInfo] of Object.entries(ProductTypes)) {
      let relevance = 0;

      // Score relevance based on signal content
      if (/template|notion|obsidian/.test(trend)) {
        if (typeKey === 'notion_template') relevance += 40;
      }
      if (/chrome|extension|browser/.test(trend)) {
        if (typeKey === 'chrome_extension') relevance += 40;
      }
      if (/saas|app|tool|dashboard/.test(trend)) {
        if (['web_tool', 'full_app'].includes(typeKey)) relevance += 35;
      }
      if (/api|endpoint|backend/.test(trend)) {
        if (typeKey === 'api_service') relevance += 35;
      }
      if (/ai|claude|gpt|llm|agent/.test(trend)) {
        if (['ai_tool', 'prompt_library'].includes(typeKey)) relevance += 40;
      }
      if (/guide|tutorial|course|learn/.test(trend)) {
        if (typeKey === 'pdf_guide') relevance += 35;
      }
      if (/starter|boilerplate|template|kit/.test(trend)) {
        if (['starter_kit', 'website_template'].includes(typeKey)) relevance += 35;
      }

      // Boost based on signal strength
      if (signal.signal === 'viral') relevance += 20;
      else if (signal.signal === 'high_demand') relevance += 15;
      else if (signal.signal === 'trending') relevance += 10;

      if (relevance >= 40) {
        ideas.push({
          name: `${typeInfo.name} inspired by: ${signal.trend.slice(0, 80)}`,
          type: typeKey,
          niche: signal.trend.slice(0, 100),
          source: signal.source,
          demandScore: Math.min(100, relevance + (signal.score ? Math.min(30, signal.score / 10) : 0)),
          targetAudience: signal.audience || 'general',
        });
      }
    }
  }

  // Deduplicate by type+niche similarity
  const seen = new Set();
  return ideas.filter(idea => {
    const key = `${idea.type}:${idea.niche.slice(0, 30)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.demandScore - a.demandScore);
}

/**
 * Get curated product ideas from hot niches (always available, no API needed)
 */
export function getCuratedIdeas(count = 10) {
  const ideas = [];

  // Pair niches with product types for maximum fit
  const highValueCombos = [
    // IMMEDIATE REVENUE — Things we can build and sell TODAY
    { niche: 'AI agents', type: 'starter_kit', name: 'AI Agent Starter Kit — Build Your Own Claude Agent', price: 49, demand: 95 },
    { niche: 'Claude Code automation', type: 'pdf_guide', name: 'The Claude Code Masterclass — From Zero to Full Automation', price: 29, demand: 92 },
    { niche: 'Next.js boilerplates', type: 'starter_kit', name: 'ShipFast Next.js — Auth + Payments + Dashboard in 5 Minutes', price: 79, demand: 93 },
    { niche: 'Notion templates', type: 'notion_template', name: 'The Solopreneur OS — Complete Notion Business System', price: 19, demand: 90 },
    { niche: 'AI prompt engineering', type: 'prompt_library', name: '500+ Battle-Tested AI Prompts for Developers', price: 19, demand: 88 },
    { niche: 'MCP servers', type: 'starter_kit', name: 'MCP Server Builder Kit — Create Custom Claude Tools', price: 39, demand: 95 },
    { niche: 'landing page builders', type: 'website_template', name: 'LaunchPage — Beautiful Landing Page Templates (10 Pack)', price: 29, demand: 85 },
    { niche: 'SEO tools', type: 'web_tool', name: 'SEO Analyzer — Instant Website Audit & Recommendations', price: 19, demand: 88 },
    { niche: 'resume builders', type: 'web_tool', name: 'AI Resume Builder — ATS-Optimized Resumes in 60 Seconds', price: 9, demand: 85 },
    { niche: 'Chrome extensions', type: 'chrome_extension', name: 'PageGist — AI Summary of Any Web Page', price: 5, demand: 90 },
    { niche: 'email automation', type: 'web_tool', name: 'ColdMail AI — Personalized Cold Emails at Scale', price: 29, demand: 82 },
    { niche: 'financial dashboards', type: 'web_tool', name: 'BurnRate — Startup Financial Dashboard', price: 39, demand: 82 },
    { niche: 'lead generation', type: 'ai_tool', name: 'LeadMagnet AI — Generate Lead Magnets in 2 Minutes', price: 19, demand: 88 },
    { niche: 'pitch deck templates', type: 'pdf_guide', name: 'The $10M Pitch Deck — Templates That Actually Raise Money', price: 29, demand: 82 },
    { niche: 'OpenClaw skills', type: 'starter_kit', name: 'OpenClaw Skill Builder — Create & Sell AI Skills', price: 39, demand: 88 },
    { niche: 'AI workflow automation', type: 'ai_tool', name: 'WorkflowGPT — Turn English into n8n/Make Automations', price: 29, demand: 92 },
    { niche: 'micro-SaaS starter kits', type: 'starter_kit', name: 'SaaSKit — Complete Micro-SaaS Boilerplate (Auth+Billing+Dashboard)', price: 99, demand: 90 },
    { niche: 'vibe coding tools', type: 'web_tool', name: 'VibeCode — Describe Your App, Get Working Code', price: 19, demand: 85 },
    { niche: 'Tailwind CSS components', type: 'website_template', name: 'TailwindUI Pro — 200+ Beautiful Component Blocks', price: 39, demand: 88 },
    { niche: 'AI coding assistants', type: 'chrome_extension', name: 'CodeReview AI — Instant PR Reviews in Your Browser', price: 9, demand: 90 },
  ];

  return highValueCombos
    .sort((a, b) => b.demand - a.demand)
    .slice(0, count)
    .map(combo => ({
      name: combo.name,
      type: combo.type,
      description: ProductTypes[combo.type]?.description || '',
      niche: combo.niche,
      targetAudience: HOT_NICHES.find(n => n.niche === combo.niche)?.audience || 'general',
      demandScore: combo.demand,
      price: combo.price,
      tags: [combo.niche, combo.type],
    }));
}

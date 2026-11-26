/**
 * PRD generation for factory products.
 */

import { ProductTypes } from './product-catalog.js';

export function generatePRD(product) {
  const typeInfo = ProductTypes[product.type] || {};

  return `# Product Requirements Document

## Product: ${product.name}
## Type: ${typeInfo.name || product.type}
## Target Audience: ${product.targetAudience || 'General'}
## Price Point: $${product.price}

---

## What To Build

${product.description || product.name}

Niche: ${product.niche}

## Requirements

### Core Requirements
1. This must be a COMPLETE, POLISHED, PRODUCTION-READY product
2. It must look professional — no placeholder text, no "Lorem ipsum"
3. It must solve a real problem for the target audience
4. It must be worth the asking price of $${product.price}

### Technical Requirements
${getTypeRequirements(product.type)}

### Quality Standards
- Clean, modern design (use Tailwind CSS for web projects)
- Mobile responsive (if web-based)
- Fast loading (<3 seconds)
- No bugs, no console errors
- Proper error handling
- SEO optimized (meta tags, Open Graph, sitemap)
- Accessibility basics (alt text, semantic HTML, keyboard nav)

### Sales Page Requirements
Every product MUST include a landing/sales page with:
- Compelling headline that speaks to the pain point
- Clear value proposition (what they get, why it's worth $${product.price})
- Feature list with benefits (not just features)
- Social proof section (even if placeholder initially)
- Clear CTA button linking to payment
- FAQ section (3-5 common questions)
- Mobile responsive design
- Professional typography and spacing

### Delivery
- All files should be in the project directory
- Include a README.md with setup instructions
- Include a package.json (for web projects)
- The product should work immediately when deployed

---
`;
}

/**
 * Get type-specific build requirements
 */
function getTypeRequirements(type) {
  const requirements = {
    pdf_guide: `
- Generate a comprehensive, well-structured PDF guide (use HTML → PDF conversion)
- Minimum 20 pages of high-quality, actionable content
- Include a table of contents
- Professional formatting with headings, code blocks, diagrams (ASCII)
- Create a sales page (index.html) for the guide
- Include a "preview" page showing the first 3 pages
`,
    notion_template: `
- Create a Notion-compatible template (exported as .md files with structure)
- Include detailed setup instructions
- Create screenshots/previews of the template
- Build a sales page (index.html) showcasing the template
- Include a demo/preview that shows value before purchase
`,
    website_template: `
- Build with HTML + Tailwind CSS (or Next.js if complex)
- Include multiple page templates (home, about, pricing, blog, contact)
- Dark mode support
- Customizable color scheme
- Create a demo site AND a sales page
- Include all assets (icons, placeholder images via Unsplash URLs)
`,
    web_tool: `
- Build as a standalone web app (Next.js or vanilla HTML/CSS/JS)
- Must be functional — users should get value immediately
- Include user-facing features that justify the price
- Responsive design for mobile/tablet/desktop
- Fast, no unnecessary dependencies
- Include payment integration placeholder (Lemon Squeezy button)
`,
    chrome_extension: `
- Create a complete Chrome extension (manifest.json v3)
- Include popup UI, content scripts, and background service worker as needed
- Professional popup design with branding
- Include extension store assets (icon 128x128, screenshots, description)
- Build a landing page for the extension
`,
    api_service: `
- Build as a serverless API (Vercel Functions or similar)
- Include API documentation page (interactive if possible)
- Rate limiting and authentication
- Example requests and responses
- Client libraries or code examples in 3+ languages
- Pricing page with different tiers
`,
    starter_kit: `
- Complete project boilerplate that developers can clone and build on
- Well-organized directory structure
- Authentication built in (if applicable)
- Payment integration (Stripe/Lemon Squeezy if applicable)
- Documentation (README + inline comments)
- Example pages/components showing common patterns
- Build a landing/sales page separate from the kit itself
`,
    full_app: `
- Complete, deployable web application
- Modern stack (Next.js + Tailwind recommended)
- Database integration (SQLite or Supabase for simplicity)
- User authentication (if applicable)
- Admin dashboard (if applicable)
- Landing page with pricing
- Mobile responsive
`,
    prompt_library: `
- Create a well-organized collection of prompts
- Group by category/use case
- Include expected output examples for each prompt
- Build as a searchable web page (HTML + JS)
- Include copy-to-clipboard for each prompt
- Sales page with preview of 10-15 prompts, full library behind paywall
`,
    ai_tool: `
- Build a web app that leverages AI APIs
- Must provide clear, immediate value to users
- Include a free tier/demo mode so users can try before buying
- Clean UI that makes the AI capabilities accessible
- Handle errors gracefully (API failures, rate limits)
- Landing page with live demo if possible
`,
  };

  return requirements[type] || `
- Build a complete, polished product
- Include a landing/sales page
- Make it production-ready
`;
}

/**
 * Build a product using Kilo Gateway (API-based)
 */

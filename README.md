# 🤖 HustleBot

### Autonomous AI Job & Opportunity Hunter — finds gigs, writes proposals, submits them, delivers work, and tracks payments. All while you sleep.

> **A personalized fork of [Teja-2k/HustleBot](https://github.com/Teja-2k/hustlebot) — customized for my own workflow with a few extra automations and improvements.**

---

## 📌 Origin & Personalization

**Origin:** Based on [Teja-2k/HustleBot](https://github.com/Teja-2k/hustlebot) (MIT License). Original copyright and license notices are preserved.

**What I changed for my own use:**

- Switched LLM provider from Anthropic/Claude to **Kilo Gateway** (free models, task-based routing)
- Added **Playwright** browser automation for Twitter/X, Hacker News, and Fiverr (original only had Upwork/Freelancer via Puppeteer)
- Integrated **NopeCHA** for CAPTCHA auto-resolution with Telegram alert fallback
- Unified auth for all platforms (auto-login from `.env` + manual fallback)
- Added Django Community Jobs as a 6th platform (RSS scanner)
- Added preferred language + languages to profile (injected into AI prompts)
- Added regression tests, health check, retry/backoff, .env auto-loading
- HN scanner now filters out "seeking work" posts

Nothing groundbreaking — just adapted it to fit my needs and automated a few more things along the way.

---

## 🐳 Docker Deployment

```bash
# Build and run
docker compose up -d

# View logs
docker compose logs -f

# Health check
docker compose exec hustlebot node src/index.js health

# Auth a platform (interactive)
docker compose exec hustlebot node src/index.js auth upwork

# Stop
docker compose down
```

Volumes persist data across restarts. Set your `.env` before starting.

## 📋 What's Inside

- **6 platform scanners** (Upwork, Freelancer, Twitter/X, Hacker News, Fiverr, Django Community Jobs)
- **AI scoring & proposal generation** via Kilo Gateway (free models)
- **Playwright automation** for auto-submission with persistent sessions
- **NopeCHA** CAPTCHA solving with Telegram alert fallback
- **Autopilot daemon** with 3 autonomy levels
- **Earnings tracking** and project management
- **Web dashboard** with analytics
- **47 regression tests** + health check

---

```
$ hustlebot scan

  🔍 Scanning for gigs...

  Keywords: OpenClaw, Claude Code, AI automation, data pipeline
  Platforms: upwork, twitter, hackernews, freelancer, fiverr, django

  ✓ upwork: found 8 potential gigs
  ✓ twitter: found 5 potential gigs
  ✓ hackernews: found 3 potential gigs
  ✓ freelancer: found 6 potential gigs
  ✓ fiverr: found 4 demand signals

  ━━━ Found 26 matching gigs ━━━

  #  │ Score │ Platform    │ Title                                          │ Budget
  1  │ 95%   │ upwork      │ OpenClaw AI Agent Setup & Configuration         │ $300-$800 Fixed
  2  │ 92%   │ freelancer  │ AI Chatbot Development with RAG Architecture    │ $2,000-$5,000
  3  │ 88%   │ twitter     │ @saas_builder: Looking for Claude Code expert   │ DM to discuss
  4  │ 85%   │ fiverr      │ Need: AI-Powered Document Processing           │ $500-$3,000
```

---

## What HustleBot Does

| Phase | Manual Way | HustleBot Way |
|-------|-----------|---------------|
| **Find gigs** | Browse Upwork for hours | Scans 5 platforms automatically |
| **Evaluate** | Read each listing | AI scores 0-100% against your skills |
| **Write proposals** | Stare at blank page | AI generates personalized, winning proposals |
| **Submit** | Copy-paste into each platform | Browser automation auto-submits |
| **Client comms** | Check messages constantly | AI monitors & auto-replies |
| **Deliver work** | Build from scratch | AI generates complete project files |
| **Track money** | Spreadsheet | Built-in earnings analytics |

**The AI doesn't replace you. It removes ALL the friction so you can focus on high-value work.**

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/Teja-2k/hustlebot.git
cd hustlebot
npm install
npm link

# Set up your profile (3 minutes)
hustlebot init

# Find gigs across 5 platforms
hustlebot scan

# Write a proposal
hustlebot propose 1

# Start full automation
hustlebot autopilot config
hustlebot autopilot start

# Open the web dashboard
hustlebot dashboard
```

### Requirements

- Node.js 18+
- Kilo API key ([get one here](https://kilo.ai)) — free models available
- Chrome/Chromium browser (for auto-submission)
- Optional: Discord webhook + Telegram bot for notifications
- Optional: NopeCHA API key for higher CAPTCHA quota

---

## All Commands

### Core Workflow
| Command | What it does |
|---------|-------------|
| `hustlebot init` | Set up your skill profile, API keys, and preferences |
| `hustlebot scan` | Scan all 5 platforms for matching gigs |
| `hustlebot scan -p freelancer` | Scan specific platform (upwork/twitter/hackernews/freelancer/fiverr/django) |
| `hustlebot propose <#>` | Generate a personalized proposal for a gig |
| `hustlebot propose <#> --tone bold` | Generate with different tone (professional/casual/bold) |
| `hustlebot deliver <#>` | Create project workspace + CLAUDE.md |
| `hustlebot auto-deliver <#>` | AI-generate complete project deliverables |
| `hustlebot status` | Terminal dashboard |
| `hustlebot dashboard` | Web UI dashboard with analytics |

### Earnings & Projects
| Command | What it does |
|---------|-------------|
| `hustlebot earnings stats` | Revenue analytics (total/net/fees/conversion) |
| `hustlebot earnings stats --period month` | Filter by period (week/month/year/all) |
| `hustlebot earnings add-project "Title" --amount 500` | Track a won project |
| `hustlebot earnings add-payment 500 --platform upwork --fee 100` | Record payment received |
| `hustlebot earnings projects` | List all tracked projects |
| `hustlebot earnings log-time <project-id> 4 "Built API"` | Log hours worked |

### Automation
| Command | What it does |
|---------|-------------|
| `hustlebot autopilot config` | Configure autonomy level, notifications, thresholds |
| `hustlebot autopilot start` | Start the background daemon |
| `hustlebot autopilot stop` | Stop the daemon |
| `hustlebot autopilot status` | Pipeline state + daemon status |
| `hustlebot autopilot run-now` | Trigger immediate scan + propose cycle |
| `hustlebot autopilot logs` | View activity logs |
| `hustlebot auth upwork` | Set up browser session for Upwork auto-submit |
| `hustlebot auth freelancer` | Set up browser session for Freelancer auto-submit |
| `hustlebot auth twitter` (or `x`) | Set up browser session for Twitter/X DM automation |
| `hustlebot auth hackernews` (or `hn`) | Set up browser session for Hacker News comments |
| `hustlebot auth fiverr` | Set up browser session for Fiverr messages |
| `hustlebot auth django` | No auth needed (public RSS feed) |
| `hustlebot health` | Check production readiness (API keys, browser, extensions) |

---

## How It Works

### 1. Profile — Your AI learns who you are
`hustlebot init` creates a skill profile the AI uses to match gigs and write proposals in your voice.

### 2. Scan — Find opportunities on 5 platforms
- **Upwork** — web scraping for latest job posts
- **Freelancer.com** — public API for active projects
- **Fiverr** — demand signal detection from marketplace
- **Twitter/X** — finds people asking for help with your skills
- **HackerNews** — "Who's Hiring" threads + freelance posts
- **Django Community Jobs** — RSS feed from djangojobboard.com and builtwithdjango.com

Each gig gets an AI score (0-100%) based on your skills, rate, and availability.

### 3. Propose — Write winning proposals
Claude analyzes the job, cross-references your profile, and generates proposals that win:
- Opens with a hook about their specific problem
- Includes a mini-plan (3-4 steps)
- References your relevant experience
- Ends with a clear call to action

### 4. Auto-Submit — Browser automation (Playwright + NopeCHA)
HustleBot uses Playwright to automatically submit proposals across all 5 platforms:
- **Persistent Chromium profile** (login once, submit forever — shared across all platforms)
- **NopeCHA extension** for automatic CAPTCHA resolution (reCAPTCHA, hCaptcha, Turnstile)
- **Telegram alert fallback** when CAPTCHA resolution fails or session is missing
- **Auto-login** from `.env` credentials with manual fallback
- **Graceful fallback** to clipboard + URL when browser automation fails

Supported platforms: Upwork, Freelancer, Twitter/X, Hacker News, Fiverr.

```bash
# One-time setup: login to your accounts (or set credentials in .env for auto-login)
hustlebot auth upwork
hustlebot auth freelancer
hustlebot auth twitter
hustlebot auth hackernews
hustlebot auth fiverr
```

### 5. Client Communication — AI-powered
The daemon monitors your messages every 10 minutes:
- AI classifies intent (question, revision, approval, payment)
- Auto-replies to routine messages
- Escalates urgent or scope-change messages via Telegram/Discord
- Professional tone matching your profile

### 6. Auto-Deliver — AI generates complete projects
```bash
hustlebot auto-deliver 1
```
Claude analyzes the gig requirements and generates:
- Complete working code files
- README with setup instructions
- All necessary config files
- Quality review before sending to client

Deliverables are packaged as ZIP files ready for submission.

### 7. Earnings Tracking — Know your numbers
```bash
hustlebot earnings stats

  💰 Earnings Dashboard

  Total Earned:    $12,500
  Net (after fees): $10,625
  Platform Fees:   $1,875
  Hours Logged:    156h
  Effective Rate:  $68/hr
  Pipeline Value:  $4,200

  Conversion: 45 sent → 12 accepted → 8 paid (18%)
```

### 8. Autopilot — Full Automation

Three autonomy levels:

| Level | Behavior |
|-------|----------|
| **Supervised** | Auto-scan + score + draft proposals. Pauses for your approval. |
| **Semi-Auto** | Auto-submits for gigs scoring 85+. Pauses for 70-84. |
| **Full-Auto** | Auto-submits all 70+. Auto-delivers. Auto-replies to clients. You get notifications. |

The pipeline tracks every gig through its lifecycle:
```
DISCOVERED → SCORED → PROPOSAL_DRAFT → SUBMITTED → WON → DELIVERING → DELIVERED → PAID
```

### 9. Dashboard — See everything
`hustlebot dashboard` opens a web UI at localhost:3456 with:
- Pipeline funnel visualization
- Top scoring gigs with real-time updates
- Earnings chart and analytics
- Active projects and deliveries
- Configuration panel
- Live autopilot logs
- Auto-refreshes every 30 seconds

### 10. Notifications — Stay informed
- **Discord** — webhook for all pipeline events
- **Telegram** — bot notifications for new gigs, proposals, client messages

---

## The Stack

- **Runtime:** Node.js 18+ (ES modules)
- **AI:** Kilo Gateway (OpenAI-compatible, free models, task-based routing: scoring→auto, proposal→beam, clientReply→lfm)
- **Scraping:** Cheerio + fetch (5 platform scanners)
- **Browser Automation:** Playwright (persistent Chromium profile, all 5 platforms)
- **CAPTCHA:** NopeCHA extension (auto-resolution) + Telegram alert fallback
- **Scheduling:** node-schedule (cron-like daemon)
- **Notifications:** Discord webhooks + Telegram Bot API
- **Dashboard:** Express + single-page dark-themed UI
- **Delivery:** AI-powered code generation + ZIP packaging
- **Payments:** JSON-based earnings tracker with analytics
- **Testing:** node:test (47+ regression tests)
- **Storage:** Local YAML/JSON in ~/.hustlebot/

---

## Roadmap

- [x] Profile setup wizard
- [x] Upwork scanner
- [x] Twitter/X scanner
- [x] HackerNews scanner
- [x] Freelancer.com scanner
- [x] Fiverr demand scanner
- [x] AI-powered gig scoring
- [x] AI proposal generation
- [x] Project delivery scaffolding
- [x] AI auto-delivery (full code generation)
- [x] Terminal dashboard
- [x] Web dashboard with analytics
- [x] Autopilot daemon (background automation)
- [x] Gig pipeline state machine
- [x] Browser automation (Upwork + Freelancer auto-submit)
- [x] Client message monitoring + AI auto-reply
- [x] Discord webhook notifications
- [x] Telegram bot notifications
- [x] Three autonomy levels (supervised/semi-auto/full-auto)
- [x] Deduplication across scan cycles
- [x] Earnings tracking + analytics
- [x] Payment recording + project tracking
- [x] Kilo Gateway migration (all free models, task-based routing)
- [x] Playwright browser automation (all 5 platforms)
- [x] NopeCHA CAPTCHA auto-resolution + Telegram fallback
- [x] Unified auth for all platforms (auto-login + manual fallback)
- [x] Persistent shared browser session
- [x] Health check + production guide
- [x] 47+ regression tests
- [x] Retry/backoff on API calls
- [x] .env auto-loading
- [ ] LinkedIn scanner
- [ ] Proposal templates library
- [ ] Team mode (multiple profiles)
- [ ] Stripe/PayPal payment integration
- [ ] Landing page (React on Vercel)

---

## Architecture

```
~/.hustlebot/
  profile.yaml          # Your skill profile
  autopilot.yaml        # Automation config
  pipeline.json         # Gig lifecycle tracking
  gigs.json             # Discovered gigs
  proposals.json        # Generated proposals
  projects.json         # Tracked projects
  payments.json         # Payment records
  seen-gigs.json        # Dedup database
  deliveries/           # AI-generated project files
  browser-profile/      # Persistent Chromium profile (all platforms)
  sessions/             # Legacy browser login sessions
  screenshots/          # Submission audit trail
  logs/                 # Autopilot activity logs
```

---

## Contributing

PRs welcome! Check `CLAUDE.md` for development guidelines.

Add a new scanner: create a file in `src/scanners/` that exports a scan function returning an array of gig objects. Wire it into `scan.js` and `daemon.js`.

---

## License

MIT — use it, modify it, build a business on it. Original copyright and license notices from [Teja-2k/HustleBot](https://github.com/Teja-2k/hustlebot) are preserved.

---

**Derived from [Teja-2k/HustleBot](https://github.com/Teja-2k/hustlebot). Extensively enhanced with Kilo Gateway, Playwright, NopeCHA, and production readiness.**

⭐ **Star this repo if you think freelancing should be automated.**

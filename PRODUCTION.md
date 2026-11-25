# Production Deployment Guide

## Prerequisites

1. **Node.js 18+** (for fetch, ES modules)
2. **Playwright Chromium**: `npx playwright install chromium`
3. **NopeCHA extension**: placed in `extensions/nopecha/` (with `manifest.json`)
4. **Kilo API key**: set `KILO_API_KEY` in `.env` or run `hustlebot init`

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install browser
npx playwright install chromium

# 3. Configure
cp .env.example .env
# Edit .env: set KILO_API_KEY and platform credentials

# 4. Initialize profile
npm run init

# 5. Authenticate platforms
hustlebot auth upwork
hustlebot auth freelancer
hustlebot auth twitter
hustlebot auth hackernews
hustlebot auth fiverr

# 6. Health check
hustlebot health

# 7. Start autopilot
hustlebot autopilot config   # configure
hustlebot autopilot start    # start daemon
```

## Health Check

```bash
hustlebot health
```

Checks:
- ✅ Kilo API key present
- ✅ Profile exists
- ✅ Browser profile exists
- ✅ NopeCHA extension loaded
- ✅ Playwright Chromium installed

## Headless Mode (Server)

For server deployment without a display:

```bash
# Install Xvfb
sudo apt install xvfb

# Run with virtual display
xvfb-run --auto-servernum node src/index.js autopilot start

# Or set env var (launchBrowser respects HUSTLEBOT_HEADLESS=true)
HUSTLEBOT_HEADLESS=true xvfb-run node src/index.js autopilot start
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `KILO_API_KEY` | Yes | Kilo Gateway API key |
| `KILO_MODEL` | No | Override default model |
| `KILO_MODEL_<TASK>` | No | Override per-task model |
| `KILO_BASE_URL` | No | Override gateway URL |
| `UPWORK_EMAIL/PASSWORD` | No | Auto-login credentials |
| `FREELANCER_EMAIL/PASSWORD` | No | Auto-login credentials |
| `TWITTER_EMAIL/PASSWORD` | No | Auto-login credentials |
| `HACKERNEWS_USERNAME/PASSWORD` | No | Auto-login credentials |
| `FIVERR_EMAIL/PASSWORD` | No | Auto-login credentials |
| `HUSTLEBOT_HEADLESS` | No | Set to 'true' for headless |

## NopeCHA Configuration

For higher quota, add your API key to `extensions/nopecha/manifest.json`:
```json
{
  "nopecha": {
    "key": "YOUR_NOPECHA_KEY"
  }
}
```

## Monitoring

```bash
hustlebot autopilot status   # daemon status + pipeline
hustlebot autopilot logs     # recent logs
hustlebot status             # earnings dashboard
```

## Telegram Alerts

Configure in `hustlebot autopilot config`:
- Bot token from @BotFather
- Chat ID (your user/group ID)

Alerts sent for:
- New high-score gigs
- Proposals drafted (needs review)
- Proposals submitted
- CAPTCHA resolution failures
- Session/login failures
- Delivery milestones
- Errors

## Testing

```bash
npm test
```

Runs 47+ regression tests covering:
- JSON extraction (fenced, balanced, repair)
- Kilo model routing
- Pipeline state transitions
- Dedup logic
- CAPTCHA detection
- Submitter fallback
- Config loading
- Kilo chat (mocked)

## Troubleshooting

| Issue | Solution |
|---|---|
| `No Kilo API key` | Set `KILO_API_KEY` in `.env` or run `hustlebot init` |
| Browser won't launch | `npx playwright install chromium` |
| NopeCHA not loading | Verify `extensions/nopecha/manifest.json` exists |
| Session expired | `hustlebot auth <platform>` |
| CAPTCHA not resolving | Add NopeCHA API key to manifest.json |
| Daemon not starting | Check `hustlebot health` |

## Graceful Shutdown

```bash
hustlebot autopilot stop
```

The daemon handles SIGINT/SIGTERM gracefully.
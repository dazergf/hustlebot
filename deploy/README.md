# Deployment Guide — Remote Server (VPS/Cloud)

## Prerequisites

- Ubuntu 22.04+ or Debian 12+ VPS
- 2GB+ RAM (Playwright Chromium needs ~500MB)
- SSH access

## 1. Initial Setup

```bash
# On your VPS
curl -fsSL https://raw.githubusercontent.com/dazergf/hustlebot/master/deploy/setup.sh | bash
```

Or manually:

```bash
sudo apt update && sudo apt install -y nodejs npm xvfb git
git clone https://github.com/dazergf/hustlebot.git ~/hustlebot
cd ~/hustlebot
npm install
npx playwright install chromium
npx playwright install-deps chromium
```

## 2. Configure Environment

```bash
cd ~/hustlebot
cp .env.example .env
nano .env
```

Fill in:
```
KILO_API_KEY=your_kilo_key
UPWORK_EMAIL=your@email.com
UPWORK_PASSWORD=your_password
FREELANCER_EMAIL=your@email.com
FREELANCER_PASSWORD=your_password
TWITTER_EMAIL=your@email.com
TWITTER_PASSWORD=your_password
HACKERNEWS_USERNAME=your_username
HACKERNEWS_PASSWORD=your_password
FIVERR_EMAIL=your@email.com
FIVERR_PASSWORD=your_password
```

## 3. Initialize Profile

```bash
node src/index.js init
```

Follow the prompts to set up your skills, rate, platforms, languages.

## 4. Authenticate Platforms

```bash
# Each opens a browser (via Xvfb) for manual login if auto-login fails
node src/index.js auth upwork
node src/index.js auth freelancer
node src/index.js auth twitter
node src/index.js auth hackernews
node src/index.js auth fiverr

# Django doesn't need auth (public RSS)
```

## 5. Configure Autopilot

```bash
node src/index.js autopilot config
```

Set:
- Autonomy level (1=supervised, 2=semi-auto, 3=full-auto)
- Discord webhook (optional)
- Telegram bot token + chat ID (recommended for alerts)
- Scan interval (2h recommended)
- Min score (70 recommended)
- Max proposals/day (10 recommended)

## 6. Health Check

```bash
node src/index.js health
```

All checks should pass before proceeding.

## 7. Install Systemd Service

```bash
# Edit the service file with your username
sed -i "s/YOUR_USERNAME/$(whoami)/g" deploy/hustlebot.service
sudo cp deploy/hustlebot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable hustlebot
sudo systemctl start hustlebot
```

## 8. Monitor

```bash
# Service status
sudo systemctl status hustlebot

# Live logs
sudo journalctl -u hustlebot -f

# HustleBot status
node src/index.js autopilot status

# Health check
node src/index.js health
```

## 9. NopeCHA API Key (Optional, for higher CAPTCHA quota)

Edit `extensions/nopecha/manifest.json` and add your key:
```json
{
  "nopecha": {
    "key": "YOUR_NOPECHA_KEY"
  }
}
```

Then restart: `sudo systemctl restart hustlebot`

## Troubleshooting

| Issue | Solution |
|---|---|
| Service won't start | `sudo journalctl -u hustlebot -n 50` |
| Xvfb errors | `sudo apt install xvfb` |
| Browser crashes | Increase VPS RAM to 2GB+ |
| CAPTCHA not resolving | Add NopeCHA API key to manifest.json |
| Session expired | `node src/index.js auth <platform>` then restart |
| Health check fails | Run `node src/index.js health` for details |
#!/bin/bash
# HustleBot OpenClaw Integration Setup
# Run this script to install HustleBot as an OpenClaw skill

set -e

OPENCLAW_SKILLS_DIR="$HOME/.openclaw/workspace/skills"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== HustleBot OpenClaw Setup ==="
echo ""

# Check if OpenClaw is installed
if ! command -v openclaw &>/dev/null && ! npx openclaw --version &>/dev/null 2>&1; then
  echo "OpenClaw not found. Installing..."
  npm install -g openclaw
fi

# Initialize workspace if needed
if [ ! -d "$HOME/.openclaw/workspace" ]; then
  echo "Initializing OpenClaw workspace..."
  npx openclaw setup --non-interactive 2>/dev/null || true
fi

# Create skills directory
mkdir -p "$OPENCLAW_SKILLS_DIR/hustlebot"

# Copy skill file
cp "$SCRIPT_DIR/SKILL.md" "$OPENCLAW_SKILLS_DIR/hustlebot/SKILL.md"

echo "HustleBot skill installed!"
echo ""

# Enable Telegram plugin
echo "Enabling Telegram plugin..."
npx openclaw plugins enable telegram 2>/dev/null || true

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Add your Telegram bot token:"
echo "     npx openclaw channels add --channel telegram --token YOUR_BOT_TOKEN"
echo ""
echo "  2. Start the gateway:"
echo "     npx openclaw gateway"
echo ""
echo "  3. Message your bot on Telegram:"
echo "     'scan for gigs' - Find freelance opportunities"
echo "     'check earnings' - View revenue analytics"
echo "     'start autopilot' - Begin full automation"
echo ""
echo "  4. Verify skill is loaded:"
echo "     npx openclaw skills list"
echo ""

# ─────────────────────────────────────────────────────────────
# Optional: VPS / Server Deployment (systemd + Xvfb)
# ─────────────────────────────────────────────────────────────
echo ""
echo "=== Optional: VPS / Server Deployment ==="
echo ""
echo "For headless server deployment (no display):"
echo ""
echo "  1. Install system dependencies:"
echo "     sudo apt update && sudo apt install -y nodejs npm xvfb git"
echo ""
echo "  2. Clone and install:"
echo "     git clone https://github.com/dazergf/hustlebot.git ~/hustlebot"
echo "     cd ~/hustlebot && npm install"
echo "     npx playwright install chromium"
echo "     npx playwright install-deps chromium"
echo ""
echo "  3. Configure environment:"
echo "     cp .env.example .env && nano .env"
echo ""
echo "  4. Initialize profile:"
echo "     node src/index.js init"
echo ""
echo "  5. Authenticate platforms:"
echo "     node src/index.js auth upwork"
echo "     node src/index.js auth freelancer"
echo "     node src/index.js auth twitter"
echo "     node src/index.js auth hackernews"
echo "     node src/index.js auth fiverr"
echo ""
echo "  6. Health check:"
echo "     node src/index.js health"
echo ""
echo "  7. Install systemd service:"
echo "     sudo tee /etc/systemd/system/hustlebot.service > /dev/null <<'EOF'"
echo "     [Unit]"
echo "     Description=HustleBot Autopilot Daemon"
echo "     After=network.target"
echo "     [Service]"
echo "     Type=simple"
echo "     User=YOUR_USERNAME"
echo "     WorkingDirectory=/home/YOUR_USERNAME/hustlebot"
echo "     Environment=NODE_ENV=production"
echo "     Environment=HUSTLEBOT_HEADLESS=true"
echo "     EnvironmentFile=/home/YOUR_USERNAME/hustlebot/.env"
echo "     ExecStart=/usr/bin/xvfb-run --auto-servernum --server-args=\"-screen 0 1280x800x24\" /usr/bin/node src/index.js autopilot start"
echo "     Restart=on-failure"
echo "     RestartSec=30"
echo "     StandardOutput=journal"
echo "     StandardError=journal"
echo "     [Install]"
echo "     WantedBy=multi-user.target"
echo "     EOF"
echo "     sudo systemctl daemon-reload"
echo "     sudo systemctl enable --now hustlebot"
echo ""
echo "  8. Monitor:"
echo "     sudo journalctl -u hustlebot -f"
echo "     node src/index.js autopilot status"
echo "     node src/index.js health"
echo ""
echo "  Optional: NopeCHA API key for higher CAPTCHA quota:"
echo "     Edit extensions/nopecha/manifest.json → add {\"nopecha\": {\"key\": \"YOUR_KEY\"}}"
echo ""

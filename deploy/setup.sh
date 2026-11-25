#!/bin/bash
# HustleBot Production Deployment Script
# Run on a fresh Ubuntu/Debian VPS

set -e

echo "=== HustleBot Production Setup ==="

# 1. System dependencies
echo "[1/6] Installing system dependencies..."
sudo apt update
sudo apt install -y nodejs npm xvfb git curl

# 2. Clone repo
echo "[2/6] Cloning repository..."
if [ ! -d "$HOME/hustlebot" ]; then
  git clone https://github.com/dazergf/hustlebot.git "$HOME/hustlebot"
fi
cd "$HOME/hustlebot"

# 3. Install Node dependencies
echo "[3/6] Installing Node dependencies..."
npm install

# 4. Install Playwright Chromium
echo "[4/6] Installing Playwright Chromium..."
npx playwright install chromium
npx playwright install-deps chromium

# 5. Setup .env
echo "[5/6] Setting up .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Edit .env with your API keys and credentials before continuing!"
  echo "    nano $HOME/hustlebot/.env"
  exit 1
fi

# 6. Health check
echo "[6/6] Running health check..."
node src/index.js health

echo ""
echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. Edit .env: nano $HOME/hustlebot/.env"
echo "  2. Run init: node src/index.js init"
echo "  3. Auth platforms: node src/index.js auth upwork (etc.)"
echo "  4. Configure autopilot: node src/index.js autopilot config"
echo "  5. Install systemd service: sudo cp deploy/hustlebot.service /etc/systemd/system/"
echo "  6. Start: sudo systemctl enable --now hustlebot"
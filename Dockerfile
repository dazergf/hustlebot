# HustleBot - Autonomous AI Job Hunter
# Multi-stage build for production

FROM mcr.microsoft.com/playwright:v1.49.0-jammy AS base

# Install Xvfb for headed browser (NopeCHA requires headed mode)
RUN apt-get update && apt-get install -y \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /data/.hustlebot/browser-profile /data/.hustlebot/screenshots /data/.hustlebot/logs

# Set environment
ENV NODE_ENV=production
ENV HUSTLEBOT_HEADLESS=true
ENV HUSTLEBOT_DIR=/data/.hustlebot

# Expose dashboard port
EXPOSE 3456

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD node src/index.js health || exit 1

# Start with Xvfb
CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1280x800x24", "node", "src/index.js", "autopilot", "start"]
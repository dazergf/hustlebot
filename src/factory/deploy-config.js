import fs from 'fs';
import path from 'path';
import { getConfigDir } from '../utils/config.js';

export const DEPLOY_CONFIG_FILE = () => path.join(getConfigDir(), 'deploy-config.json');

export function loadDeployConfig() {
  const file = DEPLOY_CONFIG_FILE();
  if (!fs.existsSync(file)) {
    return {
      vercel: { token: null, teamId: null },
      github: { token: null, org: null },
      lemonsqueezy: { apiKey: null, storeId: null },
      domain: null,
    };
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function saveDeployConfig(config) {
  const file = DEPLOY_CONFIG_FILE();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(config, null, 2));
}

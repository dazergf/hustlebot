// Kilo Gateway free model routing for HustleBot
// All models are OpenAI-compatible via https://api.kilo.ai/api/gateway

export const KILO_BASE_URL = process.env.KILO_BASE_URL || 'https://api.kilo.ai/api/gateway';

export const KILO_MODELS = {
  // Auto-rotation among free models
  auto: 'kilo-auto/free',
  // High-quality free models for specific tasks
  beam: 'reflection/beam-free',
  nemotronUltra: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  nemotronLightning: 'nvidia/nemotron-3.5-lightning:free',
  nemotronSuperVl: 'nvidia/nemotron-3.5-super-vl:free',
  lfm: 'liquid/lfm-3-1.7b:free',
  ling: 'inclusionai/ling-3.2-flash:free',
  ernie: 'baidu/ernie-5.5-flash-preview:free',
  particle: 'particle-ai/particle-1:free',
  flint: 'recursive/flint-v1.0:free',
  dots: 'dots-studio/dots-3-note-preview:free',
  nemotronNano: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  openrouter: 'openrouter/free',
  glyph: 'stealth/glyph-cluster',
};

// Task -> model mapping (override via env KILO_MODEL_<TASK>)
export const TASK_MODEL_MAP = {
  default: KILO_MODELS.auto,
  scoring: KILO_MODELS.auto,
  classify: KILO_MODELS.auto,
  proposal: KILO_MODELS.beam,
  deliveryPlan: KILO_MODELS.auto,
  clientReply: KILO_MODELS.lfm,
  review: KILO_MODELS.beam,
  delivery: KILO_MODELS.beam,
  marketing: KILO_MODELS.beam,
};

export function getKiloModel(task = 'default') {
  const envKey = `KILO_MODEL_${task.toUpperCase()}`;
  if (process.env[envKey]) return process.env[envKey];
  if (process.env.KILO_MODEL) return process.env.KILO_MODEL;
  return TASK_MODEL_MAP[task] || TASK_MODEL_MAP.default;
}

import { getKiloApiKey as getStoredKiloApiKey } from '../utils/config.js';

export function getKiloApiKey() {
  return getStoredKiloApiKey() || process.env.KILO_API_KEY || null;
}

import { getKiloApiKey, getKiloModel, KILO_BASE_URL } from '../config/kilo-models.js';

/**
 * Minimal OpenAI-compatible client for Kilo Gateway.
 * All calls go through fetch (Node 18+).
 */

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function kiloChat(messages, options = {}) {
  const apiKey = getKiloApiKey();
  if (!apiKey) {
    throw new Error('No Kilo API key found. Set KILO_API_KEY env var or run hustlebot init.');
  }

  const task = options.task || 'default';
  const model = options.model || getKiloModel(task);
  const baseUrl = options.baseUrl || KILO_BASE_URL;

  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 1000,
  };

  if (options.response_format) {
    body.response_format = options.response_format;
  }

  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content ?? '';
        return { content, raw: data, model };
      }

      const text = await res.text();
      const status = res.status;

      // Retry on rate limit or server errors
      if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
        const retryAfter = res.headers.get('retry-after');
        const waitMs = retryAfter
          ? parseInt(retryAfter) * 1000
          : RETRY_BASE_MS * Math.pow(2, attempt);
        await sleep(waitMs);
        lastError = new Error(`Kilo API ${status}: ${text.substring(0, 300)}`);
        continue;
      }

      throw new Error(`Kilo API ${status}: ${text.substring(0, 300)}`);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES && !err.message?.startsWith('Kilo API 4')) {
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Kilo API request failed after retries');
}

/**
 * Extract JSON from a model response (robust to markdown fences, chatty
 * prefixes/suffixes, and sloppy model JSON such as raw newlines inside
 * string values or trailing commas).
 */
export function extractJson(text) {
  if (!text) return null;

  // 1. Try fenced code block first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    const parsed = tryParseJson(fenced[1].trim());
    if (parsed) return parsed;
  }

  // 2. Find balanced { } / [ ] candidates outside of strings, then parse
  const candidates = extractBalancedJsonCandidates(text);
  for (const candidate of candidates) {
    const parsed = tryParseJson(candidate.trim());
    if (parsed) return parsed;
  }

  return null;
}

/**
 * Attempt strict JSON.parse, then a lenient repair pass if it fails.
 * Repairs: raw control characters inside string values (e.g. literal
 * newlines emitted by the model), and trailing commas before } or ].
 */
function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {}
  try {
    return JSON.parse(repairJson(text));
  } catch {}
  return null;
}

/**
 * Escape unescaped control characters that appear inside JSON string
 * values. Strict JSON forbids literal \n, \r, \t inside strings.
 */
function repairJson(text) {
  let result = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      result += ch;
      escape = false;
      continue;
    }

    if (ch === '\\') {
      result += ch;
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && ch < ' ') {
      switch (ch) {
        case '\n': result += '\\n'; break;
        case '\r': result += '\\r'; break;
        case '\t': result += '\\t'; break;
        default:
          result += '\\u00' + ch.charCodeAt(0).toString(16).padStart(2, '0');
          break;
      }
      continue;
    }

    result += ch;
  }

  // Drop trailing commas before closing brackets (common LLM slip)
  return result.replace(/,\s*([}\]])/g, '$1');
}

/**
 * Return slices of `text` that form balanced top-level JSON objects or
 * arrays, ignoring brackets that appear inside strings.
 */
function extractBalancedJsonCandidates(text) {
  const candidates = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{' || ch === '[') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0 && start !== -1) {
        candidates.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return candidates;
}

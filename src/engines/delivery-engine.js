import { kiloChat, extractJson } from './kilo-client.js';
import { getKiloApiKey } from '../config/kilo-models.js';
import { log, warn } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DELIVERY_DIR = path.join(os.homedir(), '.hustlebot', 'deliveries');

export async function generateDelivery(gig, options = {}) {
  const apiKey = getKiloApiKey();
  if (!apiKey) throw new Error('API key required for auto-delivery');

  log(`[DELIVERY] Generating deliverables for: ${gig.title}`);

  // Step 1: Analyze the gig and create a work plan
  const planRes = await kiloChat([
    {
      role: 'system',
      content: 'You are a senior freelance developer planning a project delivery. Output ONLY valid JSON, no markdown fences.',
    },
    {
      role: 'user',
      content: `Analyze this gig and create a detailed work plan:

Title: ${gig.title}
Description: ${gig.description}
Skills required: ${(gig.skills || []).join(', ')}
Budget: ${gig.budget || 'Not specified'}
Preferred language: ${profile?.preferred_language || 'English'}
Languages: ${profile?.languages?.join(', ') || 'Not specified'}
${gig.client_requirements ? `Client requirements: ${gig.client_requirements}` : ''}

Return a JSON object with:
{
  "project_type": "web_app|script|api|bot|data|automation|documentation|other",
  "files_to_create": [{"path": "relative/path.ext", "purpose": "what this file does"}],
  "tech_stack": ["list", "of", "technologies"],
  "estimated_hours": number,
  "delivery_notes": "what to tell the client about the delivery",
  "folder_structure": "ASCII tree of the project"
}

Be realistic and match the budget scope. For small budgets ($100-500), keep it simple. For larger budgets, be thorough.
Return ONLY the JSON, no markdown fences.`,
    },
  ], { task: 'delivery', temperature: 0.2, max_tokens: 1500 });

  let plan;
  try {
    plan = extractJson(planRes.content);
    if (!plan) throw new Error('no json');
  } catch {
    warn('[DELIVERY] Failed to parse work plan, using defaults');
    plan = {
      project_type: 'script',
      files_to_create: [
        { path: 'main.py', purpose: 'Main application logic' },
        { path: 'README.md', purpose: 'Project documentation' },
        { path: 'requirements.txt', purpose: 'Dependencies' },
      ],
      tech_stack: ['Python'],
      estimated_hours: 5,
      delivery_notes: 'Complete implementation as described.',
      folder_structure: '.',
    };
  }

  log(`[DELIVERY] Plan: ${plan.files_to_create.length} files, ${plan.tech_stack.join(', ')}`);

  // Step 2: Generate each file
  const deliverables = [];
  const deliveryId = `delivery-${Date.now()}`;
  const deliveryPath = path.join(DELIVERY_DIR, deliveryId);

  if (!fs.existsSync(deliveryPath)) {
    fs.mkdirSync(deliveryPath, { recursive: true });
  }

  for (const file of plan.files_to_create.slice(0, 15)) {
    try {
      const fileRes = await kiloChat([
        {
          role: 'system',
          content: 'You are a senior developer creating a deliverable file. Output ONLY the file contents, no markdown fences, no explanations.',
        },
        {
          role: 'user',
          content: `Project: ${gig.title}
Description: ${gig.description}
Tech stack: ${plan.tech_stack.join(', ')}

Generate the complete contents of this file:
File: ${file.path}
Purpose: ${file.purpose}

Other files in the project:
${plan.files_to_create.map(f => `- ${f.path}: ${f.purpose}`).join('\n')}

Rules:
- Write production-quality code with proper error handling
- Include helpful comments
- Follow best practices for the language/framework
- Make it actually functional, not placeholder code
- If it's a README, include setup instructions and usage examples

Return ONLY the file contents. No markdown fences, no explanations.`,
        },
      ], { task: 'delivery', temperature: 0.3, max_tokens: 3000 });

      let content = fileRes.content;
      content = content.replace(/^```[\w]*\n/, '').replace(/\n```\s*$/, '');

      const filePath = path.join(deliveryPath, file.path);
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);

      deliverables.push({
        path: file.path,
        purpose: file.purpose,
        size: content.length,
        lines: content.split('\n').length,
      });

      log(`[DELIVERY] Generated: ${file.path} (${content.split('\n').length} lines)`);

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      warn(`[DELIVERY] Failed to generate ${file.path}: ${err.message}`);
    }
  }

  const summary = {
    delivery_id: deliveryId,
    gig_title: gig.title,
    gig_id: gig.id,
    plan,
    deliverables,
    delivery_path: deliveryPath,
    created_at: new Date().toISOString(),
    status: 'ready_for_review',
    delivery_notes: plan.delivery_notes,
  };

  fs.writeFileSync(
    path.join(deliveryPath, '_delivery_manifest.json'),
    JSON.stringify(summary, null, 2)
  );

  const indexPath = path.join(DELIVERY_DIR, 'deliveries-index.json');
  let index = [];
  try {
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
  } catch {}
  index.push({
    delivery_id: deliveryId,
    gig_id: gig.id,
    gig_title: gig.title,
    files_count: deliverables.length,
    status: 'ready_for_review',
    created_at: summary.created_at,
  });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  log(`[DELIVERY] Complete! ${deliverables.length} files at ${deliveryPath}`);

  return summary;
}

export async function packageDelivery(deliveryId) {
  const deliveryPath = path.join(DELIVERY_DIR, deliveryId);
  if (!fs.existsSync(deliveryPath)) {
    throw new Error(`Delivery not found: ${deliveryId}`);
  }

  const { execSync } = await import('child_process');
  const zipPath = path.join(DELIVERY_DIR, `${deliveryId}.zip`);

  try {
    if (process.platform === 'win32') {
      execSync(`powershell.exe -command "Compress-Archive -Path '${deliveryPath}\\*' -DestinationPath '${zipPath}' -Force"`, { timeout: 30000 });
    } else {
      execSync(`cd "${deliveryPath}" && zip -r "${zipPath}" . -x "_delivery_manifest.json"`, { timeout: 30000 });
    }
    log(`[DELIVERY] Packaged: ${zipPath}`);
    return zipPath;
  } catch (err) {
    warn(`[DELIVERY] Packaging failed: ${err.message}`);
    return deliveryPath;
  }
}

export function listDeliveries() {
  const indexPath = path.join(DELIVERY_DIR, 'deliveries-index.json');
  try {
    if (fs.existsSync(indexPath)) {
      return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }
  } catch {}
  return [];
}

export function getDelivery(deliveryId) {
  const manifestPath = path.join(DELIVERY_DIR, deliveryId, '_delivery_manifest.json');
  try {
    if (fs.existsSync(manifestPath)) {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
  } catch {}
  return null;
}

export function updateDeliveryStatus(deliveryId, status) {
  const manifestPath = path.join(DELIVERY_DIR, deliveryId, '_delivery_manifest.json');
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.status = status;
    manifest.updated_at = new Date().toISOString();
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  } catch {}

  const indexPath = path.join(DELIVERY_DIR, 'deliveries-index.json');
  try {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const entry = index.find(e => e.delivery_id === deliveryId);
    if (entry) {
      entry.status = status;
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    }
  } catch {}
}

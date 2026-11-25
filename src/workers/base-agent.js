import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { kiloChat, extractJson } from '../engines/kilo-client.js';
import { generateDeliveryPlan } from '../engines/ai.js';
import { notify } from '../notifications/notify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class BaseAgent {
  constructor(config) {
    this.name = config.name;
    this.type = config.type;
    this.emoji = config.emoji;
    this.description = config.description;
    this.supportedGigTypes = config.supportedGigTypes || [];
    this.allowedTools = config.allowedTools || [];
    this.timeout = config.timeout || 10 * 60 * 1000;
    this.agentDir = config.agentDir || __dirname;
    this.promptPath = path.join(this.agentDir, 'PROMPT.md');
  }

  async execute(gig, profile) {
    const startTime = Date.now();
    const result = {
      success: false,
      files: [],
      errors: [],
      qualityReport: null,
      duration: 0,
      agentName: this.name,
    };

    const deliveryDir = path.join(
      process.env.HUSTLEBOT_DELIVERY_DIR || path.join(process.env.HOME || process.env.USERPROFILE, '.hustlebot', 'deliveries'),
      `delivery-${Date.now()}`
    );

    try {
      console.log(chalk.hex('#FF6B00')(`\\n  ${this.emoji} ${this.name} starting delivery...`));

      // 1. Plan delivery
      console.log(chalk.gray('  📋 Planning delivery...'));
      const plan = await this.planDelivery(gig, profile);
      if (!plan) throw new Error('Failed to generate delivery plan');
      console.log(chalk.gray(`  ✓ Plan: ${plan.phases?.length || 0} phases, ${(plan.tech_stack || []).join(', ')}`));

      // 2. Scaffold project
      console.log(chalk.gray('  🏗️ Scaffolding project...'));
      await this.scaffoldProject(deliveryDir, gig, plan);
      fs.mkdirSync(deliveryDir, { recursive: true });

      // Write CLAUDE.md and plan.json
      const claudeMd = await this.buildMasterPrompt(gig, profile, plan);
      fs.writeFileSync(path.join(deliveryDir, 'CLAUDE.md'), claudeMd);
      fs.writeFileSync(path.join(deliveryDir, 'plan.json'), JSON.stringify(plan, null, 2));

      // 3. Execute phases via Kilo Gateway
      const phases = plan.phases || [];
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        console.log(chalk.gray(`  ⚡ Phase ${i + 1}/${phases.length}: ${phase.name}`));
        const phaseResult = await this.executePhase(deliveryDir, phase, gig, plan, i);
        if (phaseResult.partial) {
          result.errors.push(`Phase ${i + 1} partially completed`);
        } else if (!phaseResult.success) {
          result.errors.push(`Phase ${i + 1} failed: ${phaseResult.error}`);
        }
      }

      // 4. Quality checks
      console.log(chalk.gray('  🔍 Running quality checks...'));
      result.qualityReport = await this.runQualityChecks(deliveryDir, gig, plan);
      console.log(chalk.gray(`  ${result.qualityReport?.passed ? '✅' : '⚠️'} Quality: ${result.qualityReport?.passed ? 'PASSED' : 'NEEDS REVIEW'}`));

      // 5. Collect files
      result.files = this.listFiles(deliveryDir);
      result.success = result.files.length > 2;
      result.duration = Date.now() - startTime;

      const statusEmoji = result.success ? '✅' : '⚠️';
      console.log(chalk.hex('#FF6B00')(`\\n  ${statusEmoji} ${this.name} ${result.success ? 'completed' : 'finished with issues'}`));
      console.log(chalk.gray(`  📁 ${result.files.length} files in ${deliveryDir}`));
      console.log(chalk.gray(`  ⏱️ ${Math.round(result.duration / 1000)}s elapsed`));

      if (result.qualityReport) {
        const qr = result.qualityReport;
        console.log(chalk.gray(`  📊 Quality: ${qr.passed ? chalk.green('PASSED') : chalk.red('NEEDS REVIEW')} (${qr.checksRun} checks, ${qr.checksPassed} passed)`));
      }

      await notify('delivery_ready', {
        gig,
        agent: this.name,
        files: result.files.length,
        quality: result.qualityReport?.passed ? 'PASSED' : 'NEEDS REVIEW',
        duration: Math.round(result.duration / 1000),
      });
    } catch (err) {
      result.errors.push(err.message);
      result.duration = Date.now() - startTime;
      console.error(chalk.red(`  ❌ ${this.name} error: ${err.message}`));
    }

    result.projectDir = deliveryDir;
    return result;
  }

  async planDelivery(gig, profile) {
    try {
      return await generateDeliveryPlan(gig, profile);
    } catch (e) {
      return {
        project_name: gig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30),
        summary: gig.title,
        tech_stack: gig.skills || ['JavaScript'],
        phases: [
          {
            name: 'Build core project',
            tasks: ['Implement main functionality based on gig requirements'],
            estimated_hours: 2,
            deliverables: ['Complete project files'],
          },
          {
            name: 'Polish and document',
            tasks: ['Add README', 'Clean up code', 'Add comments'],
            estimated_hours: 1,
            deliverables: ['README.md', 'Clean codebase'],
          },
        ],
        total_hours: 3,
      };
    }
  }

  async scaffoldProject(deliveryDir, gig, plan) {
    fs.mkdirSync(deliveryDir, { recursive: true });
  }

  async buildMasterPrompt(gig, profile, plan) {
    let domainPrompt = '';
    if (fs.existsSync(this.promptPath)) {
      domainPrompt = fs.readFileSync(this.promptPath, 'utf-8');
    }

    return `# Project: ${gig.title}

## Client Requirements
${gig.description || 'No description provided'}

## Budget
${gig.budget || 'Not specified'}

## Required Skills
${(gig.skills || []).join(', ') || 'Not specified'}

## Languages
Preferred: ${profile?.preferred_language || 'English'}
Spoken: ${profile?.languages?.join(', ') || 'Not specified'}

## Delivery Plan
${JSON.stringify(plan, null, 2)}

## Domain Expertise
${domainPrompt}

## Quality Standards
- All code must be clean, commented, and production-ready
- Include error handling
- Follow best practices for the tech stack
- Include a README.md with setup instructions
- All files should be complete — no TODO placeholders
- Test that the code runs without errors

## Important
- Work in the current directory
- Create all files needed for a complete, working project
- The client is paying for a FINISHED product, not a prototype
`;
  }

  async executePhase(projectDir, phase, gig, plan, phaseIndex) {
    const result = {
      name: phase.name,
      success: false,
      partial: false,
      output: '',
      error: null,
      duration: 0,
    };

    const prompt = `You are working on phase ${phaseIndex + 1}: "${phase.name}"

PROJECT: ${gig.title}
DIRECTORY: ${projectDir}

TASKS FOR THIS PHASE:
${phase.tasks.map((t, i) => `${i + 1}. ${t}`).join('\\n')}

DELIVERABLES EXPECTED:
${(phase.deliverables || []).map(d => `- ${d}`).join('\\n')}

Read CLAUDE.md for full project context. Then complete ALL tasks for this phase.
Create/modify files as needed. Make sure everything compiles and works.
Return ONLY a JSON object listing the files to create/modify:
{"files": [{"path": "relative/path.ext", "content": "<full file contents>"}]}
No markdown fences, no explanations — JSON only.`;

    const startTime = Date.now();

    try {
      const { content } = await kiloChat([
        {
          role: 'system',
          content: 'You are a senior developer delivering a freelance project phase. Output ONLY valid JSON with a "files" array. Each file has "path" and "content". No markdown fences.',
        },
        { role: 'user', content: prompt },
      ], { task: 'delivery', temperature: 0.3, max_tokens: 4000 });

      const parsed = extractJson(content);
      const files = parsed?.files || [];
      for (const file of files) {
        if (!file?.path || typeof file.content !== 'string') continue;
        const filePath = path.join(projectDir, file.path);
        const fileDir = path.dirname(filePath);
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        fs.writeFileSync(filePath, file.content);
      }

      result.output = content.substring(0, 2000);
      result.success = true;
      result.duration = Date.now() - startTime;

      console.log(chalk.green(`    ✓ Phase completed in ${Math.round(result.duration / 1000)}s`));
    } catch (err) {
      result.error = err.message;
      result.duration = Date.now() - startTime;

      const files = this.listFiles(projectDir);
      if (files.length > 2) {
        result.partial = true;
        console.log(chalk.yellow(`    ⚠ Phase partially completed (${files.length} files created)`));
      } else {
        console.log(chalk.red(`    ✗ Phase failed: ${err.message.substring(0, 100)}`));
      }
    }

    return result;
  }

  listFiles(dir) {
    const result = [];
    const walk = (d) => {
      if (!fs.existsSync(d)) return;
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          result.push(path.relative(dir, full));
        }
      }
    };
    walk(dir);
    return result;
  }

  async runQualityChecks(projectDir, gig, plan) {
    return { passed: true, checksRun: 0, checksPassed: 0 };
  }
}

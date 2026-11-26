import fs from 'fs';
import path from 'path';

// --- Universal Checks ---

export async function checkProjectStructure(dir) {
  const exists = fs.existsSync(dir);
  const entries = exists ? fs.readdirSync(dir) : [];
  const projectFiles = entries.filter(e =>
    e !== 'CLAUDE.md' && e !== 'plan.json' && e !== 'node_modules' && e !== '.git'
  );

  return {
    name: 'Project structure',
    passed: projectFiles.length >= 1,
    message: projectFiles.length >= 1
      ? `${projectFiles.length} project files/dirs found`
      : 'No project files created',
  };
}

export async function checkFileCount(dir) {
  const files = listAllFiles(dir);
  return {
    name: 'Minimum files',
    passed: files.length >= 2,
    message: `${files.length} total files`,
  };
}

export async function checkNoEmptyFiles(dir) {
  const files = listAllFiles(dir);
  const empty = files.filter(f => {
    try {
      return fs.statSync(path.join(dir, f)).size === 0;
    } catch { return false; }
  });

  return {
    name: 'No empty files',
    passed: empty.length === 0,
    message: empty.length === 0 ? 'All files have content' : `Empty: ${empty.slice(0, 5).join(', ')}`,
  };
}

export async function checkReadme(dir) {
  const hasReadme = fs.existsSync(path.join(dir, 'README.md')) ||
                    fs.existsSync(path.join(dir, 'readme.md'));
  return {
    name: 'README present',
    passed: hasReadme,
    message: hasReadme ? 'README.md found' : 'Missing README.md',
  };
}

export async function checkNoSecrets(dir) {
  const files = listAllFiles(dir);
  const suspicious = [];

  for (const file of files) {
    const lower = file.toLowerCase();
    if (lower.includes('.env') && !lower.includes('.env.example')) suspicious.push(file);
    if (lower.includes('credentials')) suspicious.push(file);
    if (lower.includes('secret')) suspicious.push(file);
    if (lower.endsWith('.pem') || lower.endsWith('.key')) suspicious.push(file);

    // Check file content for API keys
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      if (content.match(/sk-[a-zA-Z0-9]{20,}/) || content.match(/AKIA[A-Z0-9]{16}/)) {
        suspicious.push(`${file} (contains API key pattern)`);
      }
    } catch {}
  }

  return {
    name: 'No secrets/credentials',
    passed: suspicious.length === 0,
    message: suspicious.length === 0
      ? 'No secrets detected'
      : `⚠ Potential secrets: ${suspicious.join(', ')}`,
  };
}

export async function checkFileSizes(dir) {
  const files = listAllFiles(dir);
  const oversized = files.filter(f => {
    try {
      return fs.statSync(path.join(dir, f)).size > 10 * 1024 * 1024; // 10MB
    } catch { return false; }
  });

  return {
    name: 'File sizes reasonable',
    passed: oversized.length === 0,
    message: oversized.length === 0
      ? 'All files under 10MB'
      : `Oversized: ${oversized.join(', ')}`,
  };
}


export function listAllFiles(dir) {
  const files = [];
  try {
    const walk = (d, prefix = '') => {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(path.join(d, entry.name), rel);
        } else {
          files.push(rel);
        }
      }
    };
    walk(dir);
  } catch {}
  return files;
}

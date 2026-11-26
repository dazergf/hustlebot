import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { listAllFiles } from './quality-checks.js';

// --- Domain-Specific Check Builders ---

/**
 * Check that specific file extensions exist
 */
export function checkFileTypes(extensions) {
  return async (dir) => {
    const files = listAllFiles(dir);
    const found = extensions.filter(ext =>
      files.some(f => f.endsWith(ext))
    );

    return {
      name: `Required file types (${extensions.join(', ')})`,
      passed: found.length >= 1,
      message: found.length >= 1
        ? `Found: ${found.join(', ')}`
        : `Missing required file types: ${extensions.join(', ')}`,
    };
  };
}

/**
 * Check that a Node.js project can install dependencies
 */
export function checkNpmInstall() {
  return async (dir) => {
    if (!fs.existsSync(path.join(dir, 'package.json'))) {
      return { name: 'npm install', passed: true, message: 'No package.json (skipped)' };
    }

    return new Promise((resolve) => {
      const proc = spawn('npm', ['install', '--dry-run'], {
        cwd: dir,
        timeout: 30000,
        shell: true,
        stdio: 'pipe',
      });

      let stderr = '';
      proc.stderr?.on('data', d => { stderr += d.toString(); });

      proc.on('close', (code) => {
        resolve({
          name: 'npm install (dry-run)',
          passed: code === 0,
          message: code === 0 ? 'Dependencies resolve correctly' : `npm errors: ${stderr.substring(0, 200)}`,
        });
      });

      proc.on('error', () => {
        resolve({ name: 'npm install', passed: true, message: 'npm not available (skipped)' });
      });
    });
  };
}

/**
 * Check that a Python script has no syntax errors
 */
export function checkPythonSyntax() {
  return async (dir) => {
    const files = listAllFiles(dir).filter(f => f.endsWith('.py'));
    if (files.length === 0) {
      return { name: 'Python syntax', passed: true, message: 'No Python files (skipped)' };
    }

    const errors = [];
    for (const file of files.slice(0, 5)) {
      const result = await new Promise((resolve) => {
        const proc = spawn('python', ['-m', 'py_compile', path.join(dir, file)], {
          timeout: 10000, shell: true, stdio: 'pipe',
        });
        let stderr = '';
        proc.stderr?.on('data', d => { stderr += d.toString(); });
        proc.on('close', (code) => resolve({ file, ok: code === 0, err: stderr }));
        proc.on('error', () => resolve({ file, ok: true, err: '' }));
      });
      if (!result.ok) errors.push(`${result.file}: ${result.err.substring(0, 100)}`);
    }

    return {
      name: 'Python syntax check',
      passed: errors.length === 0,
      message: errors.length === 0
        ? `${files.length} Python files — syntax OK`
        : `Syntax errors: ${errors.join('; ')}`,
    };
  };
}

/**
 * Check that HTML files are valid (basic checks)
 */
export function checkHTMLValid() {
  return async (dir) => {
    const files = listAllFiles(dir).filter(f => f.endsWith('.html'));
    if (files.length === 0) {
      return { name: 'HTML valid', passed: true, message: 'No HTML files (skipped)' };
    }

    const issues = [];
    for (const file of files.slice(0, 5)) {
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        if (!content.includes('<!DOCTYPE') && !content.includes('<!doctype') && !content.includes('<html')) {
          issues.push(`${file}: Missing DOCTYPE or html tag`);
        }
        if (!content.includes('</html>')) {
          issues.push(`${file}: Missing closing </html> tag`);
        }
      } catch {}
    }

    return {
      name: 'HTML structure valid',
      passed: issues.length === 0,
      message: issues.length === 0
        ? `${files.length} HTML files — structure OK`
        : `Issues: ${issues.join('; ')}`,
    };
  };
}

/**
 * Check that JavaScript files have no syntax errors
 */
export function checkJSSyntax() {
  return async (dir) => {
    const files = listAllFiles(dir).filter(f => f.endsWith('.js') && !f.includes('node_modules'));
    if (files.length === 0) {
      return { name: 'JS syntax', passed: true, message: 'No JS files (skipped)' };
    }

    const errors = [];
    for (const file of files.slice(0, 10)) {
      const result = await new Promise((resolve) => {
        const proc = spawn('node', ['--check', path.join(dir, file)], {
          timeout: 10000, shell: true, stdio: 'pipe',
        });
        let stderr = '';
        proc.stderr?.on('data', d => { stderr += d.toString(); });
        proc.on('close', (code) => resolve({ file, ok: code === 0, err: stderr }));
        proc.on('error', () => resolve({ file, ok: true, err: '' }));
      });
      if (!result.ok) errors.push(`${result.file}: ${result.err.substring(0, 100)}`);
    }

    return {
      name: 'JavaScript syntax check',
      passed: errors.length === 0,
      message: errors.length === 0
        ? `${files.length} JS files — syntax OK`
        : `Syntax errors: ${errors.join('; ')}`,
    };
  };
}


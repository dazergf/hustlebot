import { spawn } from 'child_process';

/**
 * Run a shell command and capture output
 */
export function runCommand(cmd, args, options = {}) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      shell: true,
      timeout: 120000,
      ...options,
    });

    let output = '';
    let errorOutput = '';

    proc.stdout?.on('data', (d) => { output += d.toString(); });
    proc.stderr?.on('data', (d) => { errorOutput += d.toString(); });

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
        error: errorOutput,
      });
    });

    proc.on('error', (err) => {
      resolve({ success: false, output: '', error: err.message });
    });
  });
}

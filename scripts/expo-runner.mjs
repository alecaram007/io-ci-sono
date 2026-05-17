import { spawn } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);

if (!args.length) {
  console.error('Usage: node scripts/expo-runner.mjs <expo-command> [...args]');
  process.exit(1);
}

const major = Number(process.versions.node.split('.')[0]);
const expoCliPath = path.resolve(process.cwd(), 'node_modules/expo/bin/cli');

const commands = [
  {
    label: 'current-node',
    command: process.execPath,
    commandArgs: [expoCliPath, ...args],
  },
];

if (Number.isFinite(major) && major >= 24) {
  commands.push({
    label: 'node20-fallback',
    command: 'npx',
    commandArgs: ['-y', 'node@20', expoCliPath, ...args],
  });
  console.log('[expo-runner] Node >= 24 rilevato, provo prima la CLI locale; fallback Node 20 solo se necessario.');
}

const run = (entry) =>
  new Promise((resolve) => {
    const child = spawn(entry.command, entry.commandArgs, {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        resolve({ signal, code: code ?? 1, failedToSpawn: false });
        return;
      }
      resolve({ code: code ?? 1, failedToSpawn: false });
    });

    child.on('error', (error) => {
      console.error(`[expo-runner] errore di avvio (${entry.label}):`, error.message);
      resolve({ code: 1, failedToSpawn: true });
    });
  });

let lastCode = 1;
for (let i = 0; i < commands.length; i += 1) {
  const entry = commands[i];
  const result = await run(entry);

  if (result.signal) {
    process.kill(process.pid, result.signal);
    process.exit(1);
  }

  if (result.code === 0) {
    process.exit(0);
  }

  lastCode = result.code;
  const hasFallback = i < commands.length - 1;
  if (hasFallback) {
    console.error('[expo-runner] tentativo fallito, provo il fallback compatibile.');
  }
}

process.exit(lastCode);

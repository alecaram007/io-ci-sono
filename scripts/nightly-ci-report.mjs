import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PROJECT_ROOT = process.cwd();
const NIGHTLY_REPORT_DIR_CONFIG = process.env.NIGHTLY_REPORT_DIR || 'nightly-report';
const PUBLIC_SUBDIR = normalizePublicSubdir(process.env.NIGHTLY_REPORT_PUBLIC_SUBDIR || 'nightly-ci');
const PUBLIC_REPORT_URL = resolvePublicReportUrl({
  explicitUrl: process.env.NIGHTLY_PUBLIC_REPORT_URL,
  repository: process.env.GITHUB_REPOSITORY,
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  publicSubdir: PUBLIC_SUBDIR,
});
const FAIL_ON_IMAGE_CHECK = parseBooleanFlag(process.env.NIGHTLY_FAIL_ON_IMAGE_CHECK, true);
const FAIL_ON_IMAGE_INCONCLUSIVE = parseBooleanFlag(
  process.env.NIGHTLY_FAIL_ON_IMAGE_INCONCLUSIVE,
  parseBooleanFlag(process.env.CI, false),
);
const DEFAULT_CHECK_TIMEOUT_MS = parsePositiveInt(process.env.NIGHTLY_CHECK_TIMEOUT_MS, 20 * 60 * 1000);
const TERMINATION_GRACE_MS = parsePositiveInt(process.env.NIGHTLY_TERMINATION_GRACE_MS, 10000);

let REPORT_DIR = path.resolve(PROJECT_ROOT, 'nightly-report');
let LOGS_DIR = path.join(REPORT_DIR, 'logs');
let MARKDOWN_PATH = path.join(REPORT_DIR, 'nightly-ci-report.md');
let JSON_PATH = path.join(REPORT_DIR, 'nightly-ci-report.json');
let HTML_PATH = path.join(REPORT_DIR, 'nightly-ci-report.html');
let STATUS_JSON_PATH = path.join(REPORT_DIR, 'nightly-ci-status.json');
let IMAGE_SUMMARY_PATH = path.join(REPORT_DIR, 'image-check-summary.json');

try {
  await runNightlyReport();
} catch (error) {
  try {
    await writeFatalFallbackReport(error);
  } catch (fallbackError) {
    const fallbackMessage = String(fallbackError?.stack || fallbackError?.message || fallbackError);
    console.error(`Impossibile scrivere il report di fallback: ${fallbackMessage}`);
  }
  process.exitCode = 1;
}

async function runNightlyReport() {
  REPORT_DIR = resolveReportDir(PROJECT_ROOT, NIGHTLY_REPORT_DIR_CONFIG);
  LOGS_DIR = path.join(REPORT_DIR, 'logs');
  MARKDOWN_PATH = path.join(REPORT_DIR, 'nightly-ci-report.md');
  JSON_PATH = path.join(REPORT_DIR, 'nightly-ci-report.json');
  HTML_PATH = path.join(REPORT_DIR, 'nightly-ci-report.html');
  STATUS_JSON_PATH = path.join(REPORT_DIR, 'nightly-ci-status.json');
  IMAGE_SUMMARY_PATH = path.join(REPORT_DIR, 'image-check-summary.json');

  const checks = buildChecks();

  await fs.rm(REPORT_DIR, { recursive: true, force: true });
  await fs.mkdir(LOGS_DIR, { recursive: true });

  const startedAtIso = new Date().toISOString();
  const results = [];

  for (const check of checks) {
    const startedAt = Date.now();
    const logPath = path.join(LOGS_DIR, `${check.id}.log`);
    const runResult = await runCommand(check.command, logPath, check.env, check.timeoutMs);
    const durationMs = Date.now() - startedAt;

    results.push({
      ...check,
      exitCode: runResult.exitCode,
      timedOut: runResult.timedOut,
      durationMs,
      logPath: path.relative(process.cwd(), logPath),
    });
  }

  const imageCheckSummary = await readOptionalJson(IMAGE_SUMMARY_PATH);
  const enrichedResults = results.map((item) => ({
    ...item,
    status: resolveCheckStatus(item, imageCheckSummary),
  }));
  const hasBlockingFailure = enrichedResults.some((item) => item.required && isBlockingStatus(item.status));
  const hasWarnings = enrichedResults.some(
    (item) => item.status === 'WARN' || (!item.required && isBlockingStatus(item.status)),
  );

  const reportMarkdown = await renderMarkdown(
    startedAtIso,
    enrichedResults,
    hasBlockingFailure,
    hasWarnings,
    imageCheckSummary,
    PUBLIC_REPORT_URL,
  );
  await fs.writeFile(MARKDOWN_PATH, reportMarkdown, 'utf8');
  const reportHtml = await renderHtml(
    startedAtIso,
    enrichedResults,
    hasBlockingFailure,
    hasWarnings,
    imageCheckSummary,
    PUBLIC_REPORT_URL,
  );
  await fs.writeFile(HTML_PATH, reportHtml, 'utf8');

  const reportJson = {
    generatedAt: new Date().toISOString(),
    startedAt: startedAtIso,
    hasBlockingFailure,
    hasWarnings,
    publicReportUrl: PUBLIC_REPORT_URL || null,
    imageCheckSummary,
    results: enrichedResults.map((item) => ({
      id: item.id,
      label: item.label,
      command: item.command,
      required: item.required,
      status: item.status,
      exitCode: item.exitCode,
      timedOut: item.timedOut,
      durationMs: item.durationMs,
      logPath: item.logPath,
    })),
  };

  await fs.writeFile(JSON_PATH, `${JSON.stringify(reportJson, null, 2)}\n`, 'utf8');
  await fs.writeFile(STATUS_JSON_PATH, `${JSON.stringify(buildPublicStatusJson(reportJson), null, 2)}\n`, 'utf8');

  console.log(`Report scritto in ${path.relative(process.cwd(), MARKDOWN_PATH)}`);
  console.log(`Report HTML in ${path.relative(process.cwd(), HTML_PATH)}`);
  console.log(`Dettagli JSON in ${path.relative(process.cwd(), JSON_PATH)}`);
  console.log(`Stato pubblico JSON in ${path.relative(process.cwd(), STATUS_JSON_PATH)}`);

  if (hasBlockingFailure) {
    process.exitCode = 1;
  }
}

function buildChecks() {
  return [
    {
      id: 'quality',
      label: 'Typecheck + tests',
      command: 'npm run check',
      required: true,
      timeoutMs: DEFAULT_CHECK_TIMEOUT_MS,
    },
    {
      id: 'web-export',
      label: 'Web export',
      command: 'npm run web:export',
      required: true,
      timeoutMs: DEFAULT_CHECK_TIMEOUT_MS,
    },
    {
      id: 'images',
      label: 'Image integrity',
      command: 'npm run check:images',
      required: FAIL_ON_IMAGE_CHECK,
      env: {
        IMAGE_CHECK_STRICT: '1',
        IMAGE_CHECK_FAIL_ON_429: '0',
        IMAGE_CHECK_FAIL_ON_5XX: '1',
        IMAGE_CHECK_FAIL_ON_NETWORK: '0',
        IMAGE_CHECK_FAIL_ON_INCONCLUSIVE: FAIL_ON_IMAGE_INCONCLUSIVE ? '1' : '0',
        IMAGE_CHECK_RESULT_JSON_PATH: path.relative(process.cwd(), IMAGE_SUMMARY_PATH),
      },
      timeoutMs: DEFAULT_CHECK_TIMEOUT_MS,
    },
  ];
}

async function writeFatalFallbackReport(error) {
  const normalizedError = normalizeError(error);
  const checks = buildChecks();
  const startedAtIso = new Date().toISOString();

  await fs.mkdir(LOGS_DIR, { recursive: true });

  const fatalLogPath = path.join(LOGS_DIR, 'internal-error.log');
  await fs.writeFile(
    fatalLogPath,
    [
      '$ node scripts/nightly-ci-report.mjs',
      '',
      '[fatal] nightly report generator crashed',
      `[error] ${normalizedError.message}`,
      '',
      normalizedError.stack,
      '',
    ].join('\n'),
    'utf8',
  );

  const fallbackImageSummary = buildFallbackImageSummary(normalizedError.message);
  await fs.writeFile(IMAGE_SUMMARY_PATH, `${JSON.stringify(fallbackImageSummary, null, 2)}\n`, 'utf8');

  const fallbackResults = [];
  for (const check of checks) {
    const checkLogPath = path.join(LOGS_DIR, `${check.id}.log`);
    await fs.writeFile(
      checkLogPath,
      [
        `$ ${check.command}`,
        '',
        '[skipped] check not executed because nightly report generator failed before completion.',
        `[fatal] ${normalizedError.message}`,
        '',
      ].join('\n'),
      'utf8',
    );

    fallbackResults.push({
      ...check,
      status: check.required ? 'FAIL' : 'WARN',
      exitCode: 1,
      timedOut: false,
      durationMs: 1,
      logPath: path.relative(process.cwd(), checkLogPath),
    });
  }

  const hasWarnings = fallbackResults.some((item) => item.status === 'WARN');
  const reportJson = {
    generatedAt: new Date().toISOString(),
    startedAt: startedAtIso,
    hasBlockingFailure: true,
    hasWarnings,
    publicReportUrl: PUBLIC_REPORT_URL || null,
    imageCheckSummary: fallbackImageSummary,
    results: fallbackResults.map((item) => ({
      id: item.id,
      label: item.label,
      command: item.command,
      required: item.required,
      status: item.status,
      exitCode: item.exitCode,
      timedOut: item.timedOut,
      durationMs: item.durationMs,
      logPath: item.logPath,
    })),
  };

  const reportMarkdown = await renderMarkdown(
    startedAtIso,
    fallbackResults,
    true,
    hasWarnings,
    fallbackImageSummary,
    PUBLIC_REPORT_URL,
  );
  const reportHtml = await renderHtml(
    startedAtIso,
    fallbackResults,
    true,
    hasWarnings,
    fallbackImageSummary,
    PUBLIC_REPORT_URL,
  );

  await fs.writeFile(MARKDOWN_PATH, reportMarkdown, 'utf8');
  await fs.writeFile(HTML_PATH, reportHtml, 'utf8');
  await fs.writeFile(JSON_PATH, `${JSON.stringify(reportJson, null, 2)}\n`, 'utf8');
  await fs.writeFile(STATUS_JSON_PATH, `${JSON.stringify(buildPublicStatusJson(reportJson), null, 2)}\n`, 'utf8');

  console.error(`Errore fatale durante la generazione del report: ${normalizedError.message}`);
  console.error(`Dettagli: ${path.relative(process.cwd(), fatalLogPath)}`);
}

function parseBooleanFlag(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function parsePositiveInt(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) return fallback;
  return Math.floor(numeric);
}

function resolveReportDir(projectRoot, configuredDir) {
  const resolved = path.resolve(projectRoot, configuredDir);
  const relative = path.relative(projectRoot, resolved);
  const insideProject = relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);

  if (!insideProject) {
    throw new Error(
      `Unsafe NIGHTLY_REPORT_DIR="${configuredDir}". Choose a path inside the repository (e.g. "nightly-report").`,
    );
  }

  return resolved;
}

function normalizeError(error) {
  const message = String(error?.message || error || 'Unknown error');
  const stack = String(error?.stack || message);
  return { message, stack };
}

function buildFallbackImageSummary(errorMessage) {
  return {
    dataDirectory: 'src/data',
    scannedFiles: 0,
    checked: 0,
    ok: 0,
    missing: 0,
    throttled: 0,
    unstable: 0,
    networkErrors: 0,
    strictMode: true,
    failOn429: false,
    failOn5xx: true,
    failOnNetwork: false,
    failOnInconclusive: FAIL_ON_IMAGE_INCONCLUSIVE,
    retryAttempts: 0,
    maxAttemptsPerUrl: 1,
    retryBackoffMs: 0,
    retryOnNetwork: false,
    retriedUrls: 0,
    totalAttempts: 0,
    shouldFail: true,
    hadAnyHttpResponse: false,
    inconclusive: true,
    fatalError: String(errorMessage),
    generatedAt: new Date().toISOString(),
  };
}

async function runCommand(command, logPath, extraEnv, timeoutMs) {
  const childEnv = { ...process.env, ...(extraEnv || {}) };
  const commandLabel = command.replace(/\s+/g, ' ').trim();
  const header = [
    `$ ${commandLabel}`,
    extraEnv ? `Env override: ${JSON.stringify(extraEnv)}` : null,
    timeoutMs ? `Timeout: ${formatDuration(timeoutMs)}` : null,
    '',
  ]
    .filter(Boolean)
    .join('\n');

  await fs.writeFile(logPath, header, 'utf8');

  return new Promise((resolve) => {
    const logStream = createWriteStream(logPath, { flags: 'a' });
    let settled = false;
    let timedOut = false;
    let timeoutHandle = null;
    let forceKillHandle = null;
    const finish = (exitCode) => {
      if (settled) return;
      settled = true;
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (forceKillHandle) {
        clearTimeout(forceKillHandle);
      }
      logStream.end(() => resolve({ exitCode, timedOut }));
    };

    const child = spawn(command, {
      cwd: process.cwd(),
      env: childEnv,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (timeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        if (settled) return;
        timedOut = true;
        logStream.write(`\n[timeout] command exceeded ${formatDuration(timeoutMs)}\n`);
        child.kill('SIGTERM');
        forceKillHandle = setTimeout(() => {
          if (!settled) {
            child.kill('SIGKILL');
          }
        }, TERMINATION_GRACE_MS);
        if (typeof forceKillHandle.unref === 'function') {
          forceKillHandle.unref();
        }
      }, timeoutMs);
      if (typeof timeoutHandle.unref === 'function') {
        timeoutHandle.unref();
      }
    }

    child.stdout.on('data', (chunk) => {
      logStream.write(chunk);
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      logStream.write(chunk);
      process.stderr.write(chunk);
    });

    child.on('error', (error) => {
      logStream.write(`\n[spawn-error] ${error.message}\n`);
      finish(1);
    });

    child.on('close', (code, signal) => {
      const finalCode = timedOut ? 124 : code ?? 1;
      logStream.write(`\n[exit] ${finalCode}${signal ? ` (signal ${signal})` : ''}\n`);
      finish(finalCode);
    });
  });
}

async function readOptionalJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }

    return {
      parseError: String(error?.message || error),
      source: path.relative(process.cwd(), filePath),
    };
  }
}

async function renderMarkdown(startedAtIso, items, hasBlockingFailure, hasWarnings, imageCheckSummary, publicReportUrl) {
  const imageCoverageLine = renderImageCoverageLine(imageCheckSummary);
  const header = [
    '# Nightly CI report',
    '',
    `- Run start (UTC): ${startedAtIso}`,
    `- Blocking status: ${hasBlockingFailure ? 'FAILED' : 'PASSED'}`,
    `- Warning status: ${hasWarnings ? 'PRESENT' : 'NONE'}`,
    imageCoverageLine,
    publicReportUrl ? `- Public report URL: ${publicReportUrl}` : null,
    '',
    '| Check | Status | Required | Duration |',
    '|---|---|---:|---:|',
  ].filter(Boolean);

  const rows = items.map((item) => {
    const status = item.status;
    const required = item.required ? 'yes' : 'no';
    return `| ${item.label} | ${status} | ${required} | ${formatDuration(item.durationMs)} |`;
  });

  const details = [];
  for (const item of items) {
    const status = item.status;
    const required = item.required ? 'required' : 'optional';
    const logText = await fs.readFile(path.resolve(process.cwd(), item.logPath), 'utf8');
    const tail = tailLines(logText, 40);

    const extraLines = [];
    if (item.timedOut) {
      extraLines.push('- Timeout: `yes`');
    }
    if (item.id === 'images' && imageCheckSummary) {
      if (imageCheckSummary.parseError) {
        extraLines.push(`- Image summary parse error: \`${imageCheckSummary.parseError}\``);
      } else {
        extraLines.push(`- Image checked: \`${imageCheckSummary.checked}\``);
        if (typeof imageCheckSummary.scannedFiles === 'number' && imageCheckSummary.dataDirectory) {
          extraLines.push(`- Data scanned: \`${imageCheckSummary.scannedFiles}\` files in \`${imageCheckSummary.dataDirectory}\``);
        }
        if (typeof imageCheckSummary.retriedUrls === 'number') {
          const maxAttempts = typeof imageCheckSummary.maxAttemptsPerUrl === 'number' ? imageCheckSummary.maxAttemptsPerUrl : 1;
          extraLines.push(`- Retry usage: \`${imageCheckSummary.retriedUrls}\` URL retried (max \`${maxAttempts}\` attempts/URL)`);
        }
        extraLines.push(`- HTTP responses received: \`${imageCheckSummary.hadAnyHttpResponse ? 'yes' : 'no'}\``);
        extraLines.push(`- Inconclusive network verdict: \`${imageCheckSummary.inconclusive ? 'yes' : 'no'}\``);
      }
    }

    details.push(
      `## ${item.label}`,
      '',
      `- Command: \`${item.command}\``,
      `- Status: \`${status}\` (${required})`,
      `- Exit code: \`${item.exitCode}\``,
      `- Duration: \`${formatDuration(item.durationMs)}\``,
      `- Log: \`${item.logPath}\``,
      ...extraLines,
      '',
      '```text',
      tail,
      '```',
      '',
    );
  }

  return [...header, ...rows, '', ...details].join('\n');
}

async function renderHtml(startedAtIso, items, hasBlockingFailure, hasWarnings, imageCheckSummary, publicReportUrl) {
  const rows = items
    .map((item) => {
      const status = item.status;
      const required = item.required ? 'yes' : 'no';
      const statusClass = status.toLowerCase();
      return [
        '<tr>',
        `<td>${escapeHtml(item.label)}</td>`,
        `<td class="status ${statusClass}">${status}</td>`,
        `<td>${required}</td>`,
        `<td>${escapeHtml(formatDuration(item.durationMs))}</td>`,
        '</tr>',
      ].join('');
    })
    .join('\n');

  const details = [];
  for (const item of items) {
    const status = item.status;
    const required = item.required ? 'required' : 'optional';
    const logText = await fs.readFile(path.resolve(process.cwd(), item.logPath), 'utf8');
    const tail = tailLines(logText, 40);

    const extraLines = [];
    if (item.timedOut) {
      extraLines.push('Timeout: yes');
    }
    if (item.id === 'images' && imageCheckSummary) {
      if (imageCheckSummary.parseError) {
        extraLines.push(`Image summary parse error: ${String(imageCheckSummary.parseError)}`);
      } else {
        extraLines.push(`Image checked: ${imageCheckSummary.checked}`);
        if (typeof imageCheckSummary.scannedFiles === 'number' && imageCheckSummary.dataDirectory) {
          extraLines.push(`Data scanned: ${imageCheckSummary.scannedFiles} files in ${imageCheckSummary.dataDirectory}`);
        }
        if (typeof imageCheckSummary.retriedUrls === 'number') {
          const maxAttempts = typeof imageCheckSummary.maxAttemptsPerUrl === 'number' ? imageCheckSummary.maxAttemptsPerUrl : 1;
          extraLines.push(`Retry usage: ${imageCheckSummary.retriedUrls} URL retried (max ${maxAttempts} attempts/URL)`);
        }
        extraLines.push(`HTTP responses received: ${imageCheckSummary.hadAnyHttpResponse ? 'yes' : 'no'}`);
        extraLines.push(`Inconclusive network verdict: ${imageCheckSummary.inconclusive ? 'yes' : 'no'}`);
      }
    }

    details.push(
      [
        '<section class="check">',
        `<h2>${escapeHtml(item.label)}</h2>`,
        '<ul>',
        `<li><strong>Command:</strong> <code>${escapeHtml(item.command)}</code></li>`,
        `<li><strong>Status:</strong> <span class="status ${status.toLowerCase()}">${status}</span> (${required})</li>`,
        `<li><strong>Exit code:</strong> ${item.exitCode}</li>`,
        `<li><strong>Duration:</strong> ${escapeHtml(formatDuration(item.durationMs))}</li>`,
        `<li><strong>Log:</strong> <code>${escapeHtml(item.logPath)}</code></li>`,
        ...extraLines.map((line) => `<li>${escapeHtml(line)}</li>`),
        '</ul>',
        `<pre>${escapeHtml(tail)}</pre>`,
        '</section>',
      ].join('\n'),
    );
  }

  const imageSummaryState = !imageCheckSummary
    ? 'summary unavailable'
    : imageCheckSummary.parseError
      ? 'summary parsing error'
      : imageCheckSummary.inconclusive
        ? `${imageCheckSummary.ok}/${imageCheckSummary.checked} OK (inconclusive)`
        : `${imageCheckSummary.ok}/${imageCheckSummary.checked} OK (conclusive)`;

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '  <title>Nightly CI report</title>',
    '  <style>',
    '    :root { color-scheme: light dark; }',
    '    body { margin: 24px auto; max-width: 980px; padding: 0 16px; font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }',
    '    h1, h2 { line-height: 1.2; }',
    '    table { border-collapse: collapse; width: 100%; margin: 16px 0 24px; }',
    '    th, td { border: 1px solid #d7d7d7; padding: 8px 10px; text-align: left; }',
    '    .status { font-weight: 700; }',
    '    .status.pass { color: #1f8a46; }',
    '    .status.warn { color: #b87400; }',
    '    .status.fail, .status.timeout { color: #c43131; }',
    '    .summary { margin: 0; padding-left: 18px; }',
    '    .check { margin-top: 28px; }',
    '    pre { overflow: auto; white-space: pre-wrap; border: 1px solid #d7d7d7; border-radius: 8px; padding: 12px; }',
    '    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }',
    '    .meta-links { margin-top: 12px; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <h1>Nightly CI report</h1>',
    '  <ul class="summary">',
    `    <li>Run start (UTC): ${escapeHtml(startedAtIso)}</li>`,
    `    <li>Blocking status: <strong>${hasBlockingFailure ? 'FAILED' : 'PASSED'}</strong></li>`,
    `    <li>Warning status: <strong>${hasWarnings ? 'PRESENT' : 'NONE'}</strong></li>`,
    `    <li>Image check coverage: ${escapeHtml(imageSummaryState)}</li>`,
    publicReportUrl ? `    <li>Public report URL: <a href="${escapeHtml(publicReportUrl)}">${escapeHtml(publicReportUrl)}</a></li>` : '',
    '  </ul>',
    '  <table>',
    '    <thead>',
    '      <tr><th>Check</th><th>Status</th><th>Required</th><th>Duration</th></tr>',
    '    </thead>',
    '    <tbody>',
    rows,
    '    </tbody>',
    '  </table>',
    '  <p class="meta-links">',
    '    <a href="./nightly-ci-report.md">Markdown</a> |',
    '    <a href="./nightly-ci-report.json">JSON</a> |',
    '    <a href="./nightly-ci-status.json">Status JSON</a> |',
    '    <a href="./image-check-summary.json">Image summary</a> |',
    '    <a href="./logs/">Logs</a>',
    '  </p>',
    ...details,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function formatDuration(durationMs) {
  const seconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  return `${minutes}m ${rest}s`;
}

function renderImageCoverageLine(imageCheckSummary) {
  if (!imageCheckSummary) {
    return '- Image check coverage: summary unavailable';
  }
  if (imageCheckSummary.parseError) {
    return '- Image check coverage: summary parsing error';
  }

  const state = imageCheckSummary.inconclusive ? 'inconclusive' : 'conclusive';
  return `- Image check coverage: ${imageCheckSummary.ok}/${imageCheckSummary.checked} OK (${state})`;
}

function resolveCheckStatus(item, imageCheckSummary) {
  if (item.timedOut) return item.required ? 'TIMEOUT' : 'WARN';
  if (item.exitCode !== 0) return item.required ? 'FAIL' : 'WARN';
  if (item.id === 'images' && imageCheckSummary) {
    if (imageCheckSummary.parseError) {
      return item.required ? 'FAIL' : 'WARN';
    }
    if (imageCheckSummary.inconclusive) {
      return 'WARN';
    }

    const checked = toNonNegativeNumber(imageCheckSummary.checked);
    const ok = toNonNegativeNumber(imageCheckSummary.ok);
    const missing = toNonNegativeNumber(imageCheckSummary.missing);
    const unstable = toNonNegativeNumber(imageCheckSummary.unstable);
    const throttled = toNonNegativeNumber(imageCheckSummary.throttled);
    const networkErrors = toNonNegativeNumber(imageCheckSummary.networkErrors);

    if (checked > 0 && (missing > 0 || unstable > 0)) {
      return item.required ? 'FAIL' : 'WARN';
    }

    if (checked > 0 && (ok < checked || throttled > 0 || networkErrors > 0)) {
      return 'WARN';
    }
  }
  return 'PASS';
}

function isBlockingStatus(status) {
  return status === 'FAIL' || status === 'TIMEOUT';
}

function toNonNegativeNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function normalizePublicSubdir(rawSubdir) {
  return String(rawSubdir || '')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
}

function resolvePublicReportUrl({ explicitUrl, repository, owner, publicSubdir }) {
  if (typeof explicitUrl === 'string' && explicitUrl.trim()) {
    return `${explicitUrl.trim().replace(/\/+$/, '')}/`;
  }

  if (typeof repository !== 'string' || !repository.includes('/')) {
    return '';
  }

  const [repoOwner, repoName] = repository.split('/');
  if (!repoOwner || !repoName) {
    return '';
  }

  const effectiveOwner = (owner || repoOwner).toLowerCase();
  const repoLower = repoName.toLowerCase();
  const isUserSiteRepo = repoLower === `${effectiveOwner}.github.io`;
  const baseUrl = isUserSiteRepo ? `https://${effectiveOwner}.github.io` : `https://${effectiveOwner}.github.io/${encodePath(repoName)}`;
  const reportSuffix = publicSubdir ? `/${encodePath(publicSubdir)}` : '';
  return `${baseUrl}${reportSuffix}/`;
}

function encodePath(pathValue) {
  return String(pathValue)
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function tailLines(text, maxLines) {
  const normalized = text.replace(/\r\n/g, '\n').trimEnd();
  const lines = normalized.split('\n');
  return lines.slice(-maxLines).join('\n');
}

function buildPublicStatusJson(reportJson) {
  const message = reportJson.hasBlockingFailure ? 'failing' : reportJson.hasWarnings ? 'warnings' : 'passing';
  return {
    schemaVersion: 1,
    label: 'nightly ci',
    status: reportJson.hasBlockingFailure ? 'fail' : reportJson.hasWarnings ? 'warn' : 'pass',
    message,
    generatedAt: reportJson.generatedAt,
    startedAt: reportJson.startedAt,
    hasBlockingFailure: reportJson.hasBlockingFailure,
    hasWarnings: reportJson.hasWarnings,
    publicReportUrl: reportJson.publicReportUrl,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

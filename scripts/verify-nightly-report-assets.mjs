import fs from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const PROJECT_ROOT = process.cwd();
const REPORT_DIR = resolveDirInside(PROJECT_ROOT, process.env.NIGHTLY_REPORT_DIR || 'nightly-report', 'NIGHTLY_REPORT_DIR');
const DIST_DIR = resolveDirInside(PROJECT_ROOT, process.env.NIGHTLY_DIST_DIR || 'dist', 'NIGHTLY_DIST_DIR');
const TARGET_SUBDIR = normalizeSubdir(process.env.NIGHTLY_REPORT_PUBLIC_SUBDIR || 'nightly-ci');
const TARGET_DIR = resolveDirInside(DIST_DIR, TARGET_SUBDIR, 'NIGHTLY_REPORT_PUBLIC_SUBDIR');

const requiredReportFiles = [
  'nightly-ci-report.md',
  'nightly-ci-report.json',
  'nightly-ci-report.html',
  'nightly-ci-status.json',
  'image-check-summary.json',
];

await assertDirectoryExists(REPORT_DIR);
await assertDirectoryExists(path.join(REPORT_DIR, 'logs'));
await assertDirectoryExists(TARGET_DIR);
await assertDirectoryExists(path.join(TARGET_DIR, 'logs'));

for (const fileName of requiredReportFiles) {
  await assertFileExists(path.join(REPORT_DIR, fileName));
  await assertFileExists(path.join(TARGET_DIR, fileName));
}

await assertFileExists(path.join(TARGET_DIR, 'index.html'));

const reportJson = await readJson(path.join(REPORT_DIR, 'nightly-ci-report.json'));
const statusJson = await readJson(path.join(REPORT_DIR, 'nightly-ci-status.json'));
const imageSummaryJson = await readJson(path.join(REPORT_DIR, 'image-check-summary.json'));
const publicImageSummaryJson = await readJson(path.join(TARGET_DIR, 'image-check-summary.json'));
const reportHtml = await fs.readFile(path.join(REPORT_DIR, 'nightly-ci-report.html'), 'utf8');
const reportMarkdown = await fs.readFile(path.join(REPORT_DIR, 'nightly-ci-report.md'), 'utf8');
const publicHtml = await fs.readFile(path.join(TARGET_DIR, 'nightly-ci-report.html'), 'utf8');
const publicIndex = await fs.readFile(path.join(TARGET_DIR, 'index.html'), 'utf8');

validateReportJson(reportJson, imageSummaryJson);
validateStatusJson(statusJson, reportJson);
validateImageSummaryJson(imageSummaryJson);
validatePublishedJsonCopy('image-check-summary.json', publicImageSummaryJson, imageSummaryJson);
validateReportMarkdown(reportMarkdown);
validateReportHtml(reportHtml);
validatePublishedHtml(publicIndex, publicHtml);

console.log(`Nightly report assets verificati con successo in ${path.relative(PROJECT_ROOT, TARGET_DIR)}/`);

function validateReportJson(reportJson, imageSummaryJson) {
  assertObject(reportJson, 'nightly-ci-report.json');

  assertIsoDate(reportJson.generatedAt, 'generatedAt');
  assertIsoDate(reportJson.startedAt, 'startedAt');
  assertBoolean(reportJson.hasBlockingFailure, 'hasBlockingFailure');
  assertBoolean(reportJson.hasWarnings, 'hasWarnings');
  assertNullableString(reportJson.publicReportUrl, 'publicReportUrl');
  assertArray(reportJson.results, 'results');

  if (reportJson.results.length === 0) {
    throw new Error('nightly-ci-report.json: results must contain at least one check.');
  }

  const allowedStatuses = new Set(['PASS', 'WARN', 'FAIL', 'TIMEOUT']);
  for (const [index, result] of reportJson.results.entries()) {
    assertObject(result, `results[${index}]`);
    assertNonEmptyString(result.id, `results[${index}].id`);
    assertNonEmptyString(result.label, `results[${index}].label`);
    assertNonEmptyString(result.command, `results[${index}].command`);
    assertBoolean(result.required, `results[${index}].required`);
    assertNonEmptyString(result.status, `results[${index}].status`);
    assertInteger(result.exitCode, `results[${index}].exitCode`);
    assertBoolean(result.timedOut, `results[${index}].timedOut`);
    assertPositiveInteger(result.durationMs, `results[${index}].durationMs`);
    assertNonEmptyString(result.logPath, `results[${index}].logPath`);

    if (!allowedStatuses.has(result.status)) {
      throw new Error(`results[${index}].status has invalid value: ${result.status}`);
    }
  }

  const expectedBlockingFailure = reportJson.results.some(
    (result) => result.required && (result.status === 'FAIL' || result.status === 'TIMEOUT'),
  );
  const expectedWarnings = reportJson.results.some(
    (result) => result.status === 'WARN' || (!result.required && (result.status === 'FAIL' || result.status === 'TIMEOUT')),
  );

  if (reportJson.hasBlockingFailure !== expectedBlockingFailure) {
    throw new Error(
      `hasBlockingFailure mismatch: expected ${expectedBlockingFailure}, got ${reportJson.hasBlockingFailure}.`,
    );
  }

  if (reportJson.hasWarnings !== expectedWarnings) {
    throw new Error(`hasWarnings mismatch: expected ${expectedWarnings}, got ${reportJson.hasWarnings}.`);
  }

  if (typeof reportJson.publicReportUrl === 'string' && reportJson.publicReportUrl !== '' && !reportJson.publicReportUrl.endsWith('/')) {
    throw new Error('publicReportUrl must end with "/" when present.');
  }

  if (!isDeepStrictEqual(reportJson.imageCheckSummary, imageSummaryJson)) {
    throw new Error('nightly-ci-report.json imageCheckSummary does not match image-check-summary.json.');
  }
}

function validateStatusJson(statusJson, reportJson) {
  assertObject(statusJson, 'nightly-ci-status.json');

  const expectedStatus = reportJson.hasBlockingFailure ? 'fail' : reportJson.hasWarnings ? 'warn' : 'pass';
  const expectedMessage = reportJson.hasBlockingFailure ? 'failing' : reportJson.hasWarnings ? 'warnings' : 'passing';

  assertInteger(statusJson.schemaVersion, 'schemaVersion');
  if (statusJson.schemaVersion !== 1) {
    throw new Error(`schemaVersion must be 1, got ${statusJson.schemaVersion}`);
  }

  assertNonEmptyString(statusJson.label, 'label');
  assertNonEmptyString(statusJson.status, 'status');
  assertNonEmptyString(statusJson.message, 'message');
  assertIsoDate(statusJson.generatedAt, 'generatedAt');
  assertIsoDate(statusJson.startedAt, 'startedAt');
  assertBoolean(statusJson.hasBlockingFailure, 'hasBlockingFailure');
  assertBoolean(statusJson.hasWarnings, 'hasWarnings');
  assertNullableString(statusJson.publicReportUrl, 'publicReportUrl');

  if (!['pass', 'warn', 'fail'].includes(statusJson.status)) {
    throw new Error(`status must be one of pass|warn|fail, got ${statusJson.status}`);
  }

  if (statusJson.status !== expectedStatus) {
    throw new Error(`status mismatch: expected ${expectedStatus}, got ${statusJson.status}`);
  }

  if (statusJson.message !== expectedMessage) {
    throw new Error(`message mismatch: expected ${expectedMessage}, got ${statusJson.message}`);
  }

  if (statusJson.hasBlockingFailure !== reportJson.hasBlockingFailure) {
    throw new Error('status JSON hasBlockingFailure does not match report JSON.');
  }

  if (statusJson.hasWarnings !== reportJson.hasWarnings) {
    throw new Error('status JSON hasWarnings does not match report JSON.');
  }

  if (statusJson.startedAt !== reportJson.startedAt) {
    throw new Error('status JSON startedAt does not match report JSON.');
  }
}

function validateReportMarkdown(markdownText) {
  if (!markdownText.startsWith('# Nightly CI report')) {
    throw new Error('nightly-ci-report.md must start with "# Nightly CI report".');
  }

  const requiredSections = ['| Check | Status | Required | Duration |', '## Typecheck + tests', '## Web export', '## Image integrity'];
  for (const section of requiredSections) {
    if (!markdownText.includes(section)) {
      throw new Error(`nightly-ci-report.md is missing required section: ${section}`);
    }
  }
}

function validateReportHtml(htmlText) {
  const requiredSnippets = [
    '<title>Nightly CI report</title>',
    '<a href="./nightly-ci-report.md">Markdown</a>',
    '<a href="./nightly-ci-report.json">JSON</a>',
    '<a href="./nightly-ci-status.json">Status JSON</a>',
    '<a href="./image-check-summary.json">Image summary</a>',
    '<a href="./logs/">Logs</a>',
  ];

  for (const snippet of requiredSnippets) {
    if (!htmlText.includes(snippet)) {
      throw new Error(`nightly-ci-report.html is missing expected link/snippet: ${snippet}`);
    }
  }
}

function validatePublishedHtml(indexHtml, reportHtml) {
  if (indexHtml !== reportHtml) {
    throw new Error('Published index.html must be an exact copy of nightly-ci-report.html.');
  }
}

function validatePublishedJsonCopy(label, publishedJson, sourceJson) {
  if (!isDeepStrictEqual(publishedJson, sourceJson)) {
    throw new Error(`Published ${label} must be an exact JSON copy of the report source file.`);
  }
}

function validateImageSummaryJson(imageSummary) {
  assertObject(imageSummary, 'image-check-summary.json');

  assertNonEmptyString(imageSummary.dataDirectory, 'dataDirectory');
  assertInteger(imageSummary.scannedFiles, 'scannedFiles');
  assertInteger(imageSummary.checked, 'checked');
  assertInteger(imageSummary.ok, 'ok');
  assertInteger(imageSummary.missing, 'missing');
  assertInteger(imageSummary.throttled, 'throttled');
  assertInteger(imageSummary.unstable, 'unstable');
  assertInteger(imageSummary.networkErrors, 'networkErrors');
  assertBoolean(imageSummary.hadAnyHttpResponse, 'hadAnyHttpResponse');
  assertBoolean(imageSummary.inconclusive, 'inconclusive');
  assertBoolean(imageSummary.strictMode, 'strictMode');
  assertBoolean(imageSummary.failOn429, 'failOn429');
  assertBoolean(imageSummary.failOn5xx, 'failOn5xx');
  assertBoolean(imageSummary.failOnNetwork, 'failOnNetwork');
  assertBoolean(imageSummary.failOnInconclusive, 'failOnInconclusive');
  assertInteger(imageSummary.retryAttempts, 'retryAttempts');
  assertInteger(imageSummary.maxAttemptsPerUrl, 'maxAttemptsPerUrl');
  assertInteger(imageSummary.retryBackoffMs, 'retryBackoffMs');
  assertBoolean(imageSummary.retryOnNetwork, 'retryOnNetwork');
  assertInteger(imageSummary.retriedUrls, 'retriedUrls');
  assertInteger(imageSummary.totalAttempts, 'totalAttempts');
  assertBoolean(imageSummary.shouldFail, 'shouldFail');
  assertIsoDate(imageSummary.generatedAt, 'generatedAt');

  if (
    imageSummary.scannedFiles < 0
    || imageSummary.checked < 0
    || imageSummary.ok < 0
    || imageSummary.missing < 0
    || imageSummary.throttled < 0
    || imageSummary.unstable < 0
    || imageSummary.networkErrors < 0
    || imageSummary.retryAttempts < 0
    || imageSummary.retryBackoffMs < 0
    || imageSummary.retriedUrls < 0
    || imageSummary.totalAttempts < 0
  ) {
    throw new Error('image-check-summary.json contains negative counters.');
  }

  if (imageSummary.maxAttemptsPerUrl < 1) {
    throw new Error('image-check-summary.json maxAttemptsPerUrl must be >= 1.');
  }

  if (imageSummary.totalAttempts < imageSummary.checked) {
    throw new Error('image-check-summary.json totalAttempts cannot be lower than checked URLs.');
  }

  if (typeof imageSummary.fatalError !== 'undefined' && typeof imageSummary.fatalError !== 'string') {
    throw new Error('image-check-summary.json fatalError must be a string when present.');
  }
}

async function readJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Unable to read JSON ${path.relative(PROJECT_ROOT, filePath)}: ${String(error.message || error)}`);
  }
}

async function assertDirectoryExists(dirPath) {
  try {
    const info = await fs.stat(dirPath);
    if (!info.isDirectory()) {
      throw new Error(`${dirPath} is not a directory`);
    }
  } catch (error) {
    throw new Error(`Required directory not found: ${path.relative(PROJECT_ROOT, dirPath)} (${String(error.message || error)})`);
  }
}

async function assertFileExists(filePath) {
  try {
    const info = await fs.stat(filePath);
    if (!info.isFile()) {
      throw new Error(`${filePath} is not a file`);
    }
  } catch (error) {
    throw new Error(`Required file not found: ${path.relative(PROJECT_ROOT, filePath)} (${String(error.message || error)})`);
  }
}

function normalizeSubdir(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value || value === '.' || value === '/') {
    throw new Error('NIGHTLY_REPORT_PUBLIC_SUBDIR must point to a subdirectory (for example: "nightly-ci").');
  }

  return value
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/');
}

function resolveDirInside(rootDir, configuredDir, envName) {
  const resolved = path.resolve(rootDir, configuredDir);
  const relative = path.relative(rootDir, resolved);
  const isInside = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));

  if (!isInside) {
    throw new Error(
      `Unsafe ${envName}="${configuredDir}". Choose a path inside ${path.relative(PROJECT_ROOT, rootDir) || '.'}.`,
    );
  }

  return resolved;
}

function assertObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }
}

function assertArray(value, field) {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array.`);
  }
}

function assertBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new Error(`${field} must be a boolean.`);
  }
}

function assertNullableString(value, field) {
  if (value !== null && typeof value !== 'string') {
    throw new Error(`${field} must be null or a string.`);
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string.`);
  }
}

function assertInteger(value, field) {
  if (!Number.isInteger(value)) {
    throw new Error(`${field} must be an integer.`);
  }
}

function assertPositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
}

function assertIsoDate(value, field) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} must be a valid ISO date string.`);
  }
}

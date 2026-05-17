import fs from 'node:fs/promises';
import path from 'node:path';

const USER_AGENT = 'io-ci-sono/1.0 image-qa';
const REQUEST_TIMEOUT_MS = Number(process.env.IMAGE_CHECK_TIMEOUT_MS || 8000);
const STRICT_MODE = parseBooleanFlag(process.env.IMAGE_CHECK_STRICT, false);
const FAIL_ON_429 = parseBooleanFlag(process.env.IMAGE_CHECK_FAIL_ON_429, STRICT_MODE);
const FAIL_ON_5XX = parseBooleanFlag(process.env.IMAGE_CHECK_FAIL_ON_5XX, STRICT_MODE);
const FAIL_ON_NETWORK = parseBooleanFlag(process.env.IMAGE_CHECK_FAIL_ON_NETWORK, STRICT_MODE);
const FAIL_ON_INCONCLUSIVE = parseBooleanFlag(process.env.IMAGE_CHECK_FAIL_ON_INCONCLUSIVE, false);
const MAX_LIST_ITEMS = parsePositiveInt(process.env.IMAGE_CHECK_MAX_LIST_ITEMS, 25);
const CHECK_CONCURRENCY = parsePositiveInt(process.env.IMAGE_CHECK_CONCURRENCY, 4);
const INTER_REQUEST_DELAY_MS = parseNonNegativeInt(process.env.IMAGE_CHECK_INTER_REQUEST_DELAY_MS, 120);
const RETRY_ATTEMPTS = parseNonNegativeInt(process.env.IMAGE_CHECK_RETRY_ATTEMPTS, 1);
const RETRY_BACKOFF_MS = parseNonNegativeInt(process.env.IMAGE_CHECK_RETRY_BACKOFF_MS, 350);
const RETRY_ON_NETWORK = parseBooleanFlag(process.env.IMAGE_CHECK_RETRY_ON_NETWORK, false);
const DATA_DIR = path.resolve(process.cwd(), process.env.IMAGE_CHECK_DATA_DIR || 'src/data');
const RESULT_JSON_PATH = process.env.IMAGE_CHECK_RESULT_JSON_PATH
  ? path.resolve(process.cwd(), process.env.IMAGE_CHECK_RESULT_JSON_PATH)
  : '';
const IMAGE_URL_REGEX = /imageUrl:\s*(img\((['"])(.*?)\2\)|(['"])(.*?)\4)/g;

const imageHelper = (fileName) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=900`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function parseNonNegativeInt(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  return Math.floor(numeric);
}

async function listTypeScriptFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listTypeScriptFiles(fullPath);
      files.push(...nested);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.ts')) continue;
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.d.ts')) continue;
    files.push(fullPath);
  }

  files.sort((left, right) => left.localeCompare(right));
  return files;
}

async function extractImageRefs(files) {
  const refs = [];

  for (const filePath of files) {
    const text = await fs.readFile(filePath, 'utf8');
    IMAGE_URL_REGEX.lastIndex = 0;
    let match = IMAGE_URL_REGEX.exec(text);

    while (match) {
      if (match[3]) {
        refs.push({ url: imageHelper(match[3]), source: filePath });
      } else if (match[5]) {
        refs.push({ url: match[5], source: filePath });
      }
      match = IMAGE_URL_REGEX.exec(text);
    }
  }

  return refs;
}

const probe = async (url, method) => {
  const response = await fetch(url, {
    method,
    redirect: 'follow',
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  return {
    status: response.status,
    ok: response.ok,
  };
};

const checkUrl = async (url) => {
  const maxAttempts = RETRY_ATTEMPTS + 1;
  let attempts = 0;
  let lastResult = null;

  while (attempts < maxAttempts) {
    attempts += 1;
    lastResult = await probeWithFallback(url);

    if (!shouldRetry(lastResult) || attempts >= maxAttempts) {
      return {
        ...lastResult,
        attempts,
      };
    }

    if (RETRY_BACKOFF_MS > 0) {
      await delay(RETRY_BACKOFF_MS * attempts);
    }
  }

  return {
    ...(lastResult || { url, status: 0, ok: false, error: 'Unknown image probe failure' }),
    attempts,
  };
};

const probeWithFallback = async (url) => {
  const headResult = await probeSafe(url, 'HEAD');
  if (headResult.status !== 0 && headResult.status !== 429 && headResult.status < 500 && headResult.status !== 405) {
    return {
      url,
      status: headResult.status,
      ok: headResult.ok,
      method: 'HEAD',
    };
  }

  await delay(300);
  const getResult = await probeSafe(url, 'GET');

  if (getResult.status === 0 && headResult.status > 0) {
    return {
      url,
      status: headResult.status,
      ok: headResult.ok,
      method: 'HEAD',
      error: getResult.error,
    };
  }

  return {
    url,
    status: getResult.status,
    ok: getResult.ok,
    method: 'GET',
    ...(getResult.error ? { error: getResult.error } : {}),
  };
};

const probeSafe = async (url, method) => {
  try {
    return await probe(url, method);
  } catch (error) {
    return { status: 0, ok: false, error: String(error) };
  }
};

const shouldRetry = (result) => {
  if (!result) return false;
  if (result.status === 429 || result.status >= 500) return true;
  if (result.status === 0) return RETRY_ON_NETWORK;
  return false;
};

async function runChecks(urls) {
  if (urls.length === 0) return [];

  const output = new Array(urls.length);
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= urls.length) return;

      if (INTER_REQUEST_DELAY_MS > 0 && index >= CHECK_CONCURRENCY) {
        await delay(INTER_REQUEST_DELAY_MS);
      }

      output[index] = await checkUrl(urls[index]);
    }
  };

  const workers = Array.from({ length: Math.min(CHECK_CONCURRENCY, urls.length) }, () => worker());
  await Promise.all(workers);
  return output;
}

const dataFiles = await listTypeScriptFiles(DATA_DIR);
const extractedImageRefs = await extractImageRefs(dataFiles);
const uniqueUrls = [...new Set(extractedImageRefs.map((item) => item.url))];
const results = await runChecks(uniqueUrls);

const missing = results.filter((item) => item.status === 404);
const throttled = results.filter((item) => item.status === 429);
const network = results.filter((item) => item.status === 0);
const ok = results.filter((item) => item.ok);
const unstable = results.filter((item) => item.status >= 500);
const retried = results.filter((item) => item.attempts > 1);
const totalAttempts = results.reduce((sum, item) => sum + (item.attempts || 1), 0);
const hadAnyHttpResponse = results.some((item) => item.status > 0);
const inconclusive = uniqueUrls.length > 0 && !hadAnyHttpResponse;

const printList = (title, items) => {
  if (!items.length) return;

  console.log(`\n${title}:`);
  const shown = items.slice(0, MAX_LIST_ITEMS);
  shown.forEach((item) => console.log(`- ${item.url}`));
  if (items.length > shown.length) {
    console.log(`- ... altri ${items.length - shown.length} URL`);
  }
};

const relativeDataDir = path.relative(process.cwd(), DATA_DIR) || '.';
console.log(`Controllate ${uniqueUrls.length} URL immagini`);
console.log(`Dataset scansionato: ${dataFiles.length} file TypeScript in ${relativeDataDir}`);
console.log(`OK: ${ok.length} | 404: ${missing.length} | 429: ${throttled.length} | 5xx: ${unstable.length} | errori rete: ${network.length}`);
console.log(
  `Modalita: strict=${STRICT_MODE ? 'on' : 'off'} fail429=${FAIL_ON_429 ? 'on' : 'off'} fail5xx=${FAIL_ON_5XX ? 'on' : 'off'} failNetwork=${FAIL_ON_NETWORK ? 'on' : 'off'} failInconclusive=${FAIL_ON_INCONCLUSIVE ? 'on' : 'off'} concurrency=${CHECK_CONCURRENCY} retryAttempts=${RETRY_ATTEMPTS} retryBackoffMs=${RETRY_BACKOFF_MS} retryOnNetwork=${RETRY_ON_NETWORK ? 'on' : 'off'}`,
);
console.log(`Retry usati: ${retried.length} URL su ${uniqueUrls.length} (tentativi totali: ${totalAttempts})`);

printList('URL con 404', missing);
printList('URL con 429 (rate limit temporaneo)', throttled);
printList('URL con 5xx (instabili)', unstable);
printList('URL con errori rete', network);

if (!hadAnyHttpResponse) {
  console.log('\nNessuna verifica HTTP completata: ambiente senza accesso rete/DNS o firewall restrittivo.');
}

const shouldFail =
  missing.length > 0
  || (FAIL_ON_429 && throttled.length > 0)
  || (FAIL_ON_5XX && unstable.length > 0)
  || (FAIL_ON_NETWORK && network.length > 0)
  || (FAIL_ON_INCONCLUSIVE && inconclusive);

if (RESULT_JSON_PATH) {
  const summary = {
    dataDirectory: relativeDataDir,
    scannedFiles: dataFiles.length,
    checked: uniqueUrls.length,
    ok: ok.length,
    missing: missing.length,
    throttled: throttled.length,
    unstable: unstable.length,
    networkErrors: network.length,
    hadAnyHttpResponse,
    inconclusive,
    strictMode: STRICT_MODE,
    failOn429: FAIL_ON_429,
    failOn5xx: FAIL_ON_5XX,
    failOnNetwork: FAIL_ON_NETWORK,
    failOnInconclusive: FAIL_ON_INCONCLUSIVE,
    retryAttempts: RETRY_ATTEMPTS,
    maxAttemptsPerUrl: RETRY_ATTEMPTS + 1,
    retryBackoffMs: RETRY_BACKOFF_MS,
    retryOnNetwork: RETRY_ON_NETWORK,
    retriedUrls: retried.length,
    totalAttempts,
    shouldFail,
    generatedAt: new Date().toISOString(),
  };

  await fs.mkdir(path.dirname(RESULT_JSON_PATH), { recursive: true });
  await fs.writeFile(RESULT_JSON_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

if (shouldFail) {
  process.exitCode = 1;
}

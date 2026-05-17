import fs from 'node:fs/promises';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const REPORT_DIR = resolveDirInside(PROJECT_ROOT, process.env.NIGHTLY_REPORT_DIR || 'nightly-report', 'NIGHTLY_REPORT_DIR');
const DIST_DIR = resolveDirInside(PROJECT_ROOT, process.env.NIGHTLY_DIST_DIR || 'dist', 'NIGHTLY_DIST_DIR');
const TARGET_SUBDIR = (process.env.NIGHTLY_REPORT_PUBLIC_SUBDIR || 'nightly-ci').trim();
if (!TARGET_SUBDIR || TARGET_SUBDIR === '.' || TARGET_SUBDIR === '/') {
  throw new Error('NIGHTLY_REPORT_PUBLIC_SUBDIR must point to a subdirectory (for example: "nightly-ci").');
}
const TARGET_DIR = resolveDirInside(DIST_DIR, TARGET_SUBDIR, 'NIGHTLY_REPORT_PUBLIC_SUBDIR');

const requiredFiles = ['nightly-ci-report.md', 'nightly-ci-report.json', 'nightly-ci-report.html', 'nightly-ci-status.json'];

await assertDirectoryExists(REPORT_DIR);
for (const fileName of requiredFiles) {
  await assertFileExists(path.join(REPORT_DIR, fileName));
}

await fs.mkdir(DIST_DIR, { recursive: true });
await fs.rm(TARGET_DIR, { recursive: true, force: true });
await fs.cp(REPORT_DIR, TARGET_DIR, { recursive: true });
await fs.copyFile(path.join(TARGET_DIR, 'nightly-ci-report.html'), path.join(TARGET_DIR, 'index.html'));
await fs.writeFile(path.join(DIST_DIR, '.nojekyll'), '', 'utf8');

console.log(`Report pubblico aggiornato in ${path.relative(PROJECT_ROOT, TARGET_DIR)}/`);
console.log(`Pagina principale: ${path.relative(PROJECT_ROOT, path.join(TARGET_DIR, 'index.html'))}`);
console.log(`Marker GitHub Pages scritto in ${path.relative(PROJECT_ROOT, path.join(DIST_DIR, '.nojekyll'))}`);

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

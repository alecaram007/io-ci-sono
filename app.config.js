const appJson = require('./app.json');

function normalizeBaseUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed || trimmed === '/') return '';

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

function inferBaseUrl() {
  const override = process.env.EXPO_DEPLOY_BASE_URL;
  if (override) {
    return normalizeBaseUrl(override);
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) return '';

  const [ownerRaw, repoRaw] = repository.split('/');
  if (!ownerRaw || !repoRaw) return '';

  const owner = ownerRaw.toLowerCase();
  const repo = repoRaw.toLowerCase();
  if (repo === `${owner}.github.io`) return '';

  return normalizeBaseUrl(`/${repoRaw}`);
}

module.exports = ({ config }) => {
  const baseConfig = appJson.expo || config || {};
  const baseUrl = inferBaseUrl();

  return {
    ...baseConfig,
    experiments: {
      ...(baseConfig.experiments || {}),
      baseUrl,
    },
    extra: {
      ...(baseConfig.extra || {}),
      webBaseUrl: baseUrl || '/',
    },
  };
};

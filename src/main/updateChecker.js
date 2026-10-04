const packageJson = require('../../package.json');

const GITHUB_REPO = 'kutomi86/google-slide-downloader';
const GITHUB_LATEST_RELEASE_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

function normalizeVersion(version) {
  return String(version || '').trim().replace(/^v/i, '');
}

function parseVersion(version) {
  const parts = normalizeVersion(version)
    .split('.')
    .map((part) => Number.parseInt(part, 10));

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }

  return parts;
}

function compareVersions(localVersion, remoteVersion) {
  const localParts = parseVersion(localVersion);
  const remoteParts = parseVersion(remoteVersion);

  if (!localParts || !remoteParts) {
    return null;
  }

  for (let index = 0; index < 3; index += 1) {
    if (remoteParts[index] > localParts[index]) {
      return 1;
    }

    if (remoteParts[index] < localParts[index]) {
      return -1;
    }
  }

  return 0;
}

async function fetchLatestReleaseInfo() {
  const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'google-slide-downloader',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub release request failed with status ${response.status}`);
  }

  const release = await response.json();
  return {
    version: normalizeVersion(release.tag_name || release.name || ''),
    tagName: release.tag_name || '',
    name: release.name || '',
    htmlUrl: release.html_url || '',
    publishedAt: release.published_at || '',
  };
}

async function checkForUpdates() {
  const localVersion = normalizeVersion(packageJson.version);
  const latestRelease = await fetchLatestReleaseInfo();
  const comparison = compareVersions(localVersion, latestRelease.version);

  return {
    localVersion,
    remoteVersion: latestRelease.version,
    latestRelease,
    comparison,
    isNewerVersionAvailable: comparison === 1,
  };
}

module.exports = {
  checkForUpdates,
  compareVersions,
  fetchLatestReleaseInfo,
  normalizeVersion,
};
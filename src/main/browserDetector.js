const fs = require('fs');
const path = require('path');

function getBrowserPath(browserName) {
  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
  const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';

  const paths = {
    chrome: [
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe')
    ],
    edge: [
      path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    ],
    brave: [
      path.join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
    ]
  };

  const possiblePaths = paths[browserName];
  if (!possiblePaths) return null;

  for (const executablePath of possiblePaths) {
    if (fs.existsSync(executablePath)) {
      return executablePath;
    }
  }

  return null;
}

module.exports = { getBrowserPath };

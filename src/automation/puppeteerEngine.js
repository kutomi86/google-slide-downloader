const puppeteer = require('puppeteer-core');
const { getBrowserPath } = require('../main/browserDetector');
const { captureSlides } = require('./slideCapturer');

async function startCaptureSession(url, browserName, tempFolder, mainWindow) {
  const executablePath = getBrowserPath(browserName);
  
  if (!executablePath) {
    throw new Error(`Executable for ${browserName} not found.`);
  }

  // Normalize URL to presentation mode
  let presentUrl = url;
  if (url.includes('/edit')) {
    presentUrl = url.replace(/\/edit.*$/, '/present');
  } else if (!url.endsWith('/present')) {
    presentUrl = url + '/present';
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: null, // Allow window to dictate size
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  // Set viewport to 1080p if you want a fixed resolution, otherwise it uses the maximized window size.
  // await page.setViewport({ width: 1920, height: 1080 });
  
  await page.goto(presentUrl, { waitUntil: 'networkidle2' });

  try {
    await captureSlides(page, tempFolder, mainWindow);
  } finally {
    await browser.close();
  }
}

module.exports = { startCaptureSession };

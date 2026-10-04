const puppeteer = require('puppeteer-core');
const http = require('http');
const { getBrowserPath } = require('../main/browserDetector');
const { captureSlides } = require('./slideCapturer');

async function getRemoteDebuggerWebSocketUrl(port = 9222) {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: '/json/version',
        timeout: 1000,
      },
      (response) => {
        let body = '';

        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed.webSocketDebuggerUrl || null);
          } catch (error) {
            resolve(null);
          }
        });
      }
    );

    request.on('timeout', () => {
      request.destroy();
      resolve(null);
    });

    request.on('error', () => {
      resolve(null);
    });
  });
}

async function connectToExistingBrowser() {
  const webSocketDebuggerUrl = await getRemoteDebuggerWebSocketUrl();

  if (!webSocketDebuggerUrl) {
    return null;
  }

  try {
    return await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl });
  } catch (error) {
    return null;
  }
}

async function findPageByExactUrl(browser, targetUrl) {
  const pages = await browser.pages();
  return pages.find((page) => page.url() === targetUrl) || null;
}

async function closeBlankTabs(browser, activePage) {
  const pages = await browser.pages();

  for (const page of pages) {
    if (page !== activePage && page.url() === 'about:blank') {
      await page.close();
    }
  }
}

function normalizePresentationUrl(url) {
  const parsedUrl = new URL(url);
  const pathname = parsedUrl.pathname;

  if (pathname.includes('/edit')) {
    parsedUrl.pathname = pathname.replace(/\/edit.*$/, '/present');
    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString();
  }

  if (pathname.includes('/d/') && !pathname.includes('/present') && !pathname.includes('/pubembed')) {
    parsedUrl.pathname = pathname.endsWith('/') ? `${pathname}present` : `${pathname}/present`;
    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString();
  }

  if ((pathname.includes('/pub') || pathname.includes('/pubhtml')) && parsedUrl.searchParams.has('slide')) {
    parsedUrl.searchParams.delete('slide');
    return parsedUrl.toString();
  }

  return url;
}

async function getPresentationAccessError(page) {
  const pageTitle = (await page.title()).toLowerCase();
  const bodyText = await page.evaluate(() => document.body ? document.body.innerText.toLowerCase() : '');
  const combinedText = `${pageTitle}\n${bodyText}`;

  const accessErrorPatterns = [
    'you need access',
    'request access',
    'not found',
    'file you requested does not exist',
    'sorry, the file you have requested does not exist',
    'sorry, unable to open the file',
  ];

  if (accessErrorPatterns.some((pattern) => combinedText.includes(pattern))) {
    return 'The current browser profile cannot access this presentation. Please check sharing permissions or sign in with an account that has access.';
  }

  return null;
}

async function startCaptureSession(url, browserName, tempFolder, mainWindow) {
  const executablePath = getBrowserPath(browserName);
  
  if (!executablePath) {
    throw new Error(`Executable for ${browserName} not found.`);
  }

  const presentUrl = normalizePresentationUrl(url);

  let browser = await connectToExistingBrowser();
  let shouldCloseBrowser = false;

  if (!browser) {
    browser = await puppeteer.launch({
      executablePath,
      headless: false,
      defaultViewport: null, // Allow window to dictate size
      args: ['--start-maximized']
    });
    shouldCloseBrowser = true;
  }

  let page = await findPageByExactUrl(browser, presentUrl);

  if (page) {
    await page.bringToFront();
    await page.reload({ waitUntil: 'networkidle2' });
  } else {
    page = await browser.newPage();
    await page.goto(presentUrl, { waitUntil: 'networkidle2' });
  }

  const accessError = await getPresentationAccessError(page);
  if (accessError) {
    throw new Error(accessError);
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.moveTop();
  }

  await closeBlankTabs(browser, page);
  
  // Set viewport to 1080p if you want a fixed resolution, otherwise it uses the maximized window size.
  // await page.setViewport({ width: 1920, height: 1080 });

  try {
    await captureSlides(page, tempFolder, mainWindow);
  } finally {
    if (shouldCloseBrowser) {
      await browser.close();
    }
  }
}

module.exports = { startCaptureSession };

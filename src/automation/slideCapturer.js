const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureSlides(page, tempFolder, mainWindow) {
  let slideIndex = 1;

  // Wait for the slide container to be present. In Google Slides presentation mode, 
  // '.punch-viewer-content' or '#slide-stage' is usually the main container for the slides.
  try {
    await page.waitForSelector('.punch-viewer-content', { timeout: 15000 });
  } catch (e) {
    console.warn('Timeout waiting for .punch-viewer-content, proceeding anyway...');
  }
  
  // Give it an initial moment to fully render
  await delay(2000);

  while (true) {
    mainWindow.webContents.send('capture:progress', {
      currentSlide: slideIndex,
      status: 'Capturing screenshot...'
    });

    const fileName = `slide_${String(slideIndex).padStart(3, '0')}.png`;
    const filePath = path.join(tempFolder, fileName);

    const currentScreenshot = await page.screenshot({ fullPage: false });
    await fs.writeFile(filePath, currentScreenshot);

    // Advance to next slide
    await page.keyboard.press('ArrowRight');
    
    // Wait for transition animation
    await delay(1500);
    
    const nextScreenshot = await page.screenshot({ fullPage: false });
    const currentHash = crypto.createHash('sha1').update(currentScreenshot).digest('hex');
    const nextHash = crypto.createHash('sha1').update(nextScreenshot).digest('hex');

    // If the rendered slide did not change, we probably reached the end.
    if (nextHash === currentHash) {
      break;
    }

    slideIndex++;
  }

  mainWindow.webContents.send('capture:complete', {
    totalSlides: slideIndex,
    tempFolder
  });
}

module.exports = { captureSlides };

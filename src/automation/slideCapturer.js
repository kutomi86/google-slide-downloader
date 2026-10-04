const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureSlides(page, tempFolder, mainWindow) {
  let slideIndex = 1;
  let hasNextSlide = true;
  let previousUrl = '';

  // Wait for the slide container to be present. In Google Slides presentation mode, 
  // '.punch-viewer-content' or '#slide-stage' is usually the main container for the slides.
  try {
    await page.waitForSelector('.punch-viewer-content', { timeout: 15000 });
  } catch (e) {
    console.warn('Timeout waiting for .punch-viewer-content, proceeding anyway...');
  }
  
  // Give it an initial moment to fully render
  await delay(2000);

  while (hasNextSlide) {
    mainWindow.webContents.send('capture:progress', {
      currentSlide: slideIndex,
      status: 'Capturing screenshot...'
    });

    const fileName = `slide_${String(slideIndex).padStart(3, '0')}.png`;
    const filePath = path.join(tempFolder, fileName);

    await page.screenshot({ path: filePath, fullPage: false });

    previousUrl = page.url();

    // Advance to next slide
    await page.keyboard.press('ArrowRight');
    
    // Wait for transition animation
    await delay(1000);
    
    const currentUrl = page.url();
    
    // If the URL hasn't changed after pressing Right Arrow, we probably reached the end.
    if (currentUrl === previousUrl) {
       hasNextSlide = false;
    } else {
       slideIndex++;
    }
  }

  mainWindow.webContents.send('capture:complete', {
    totalSlides: slideIndex,
    tempFolder
  });
}

module.exports = { captureSlides };

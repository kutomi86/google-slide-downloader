const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureSlides(page, tempFolder, mainWindow) {
  let slideIndex = 1;
  let previousHash = null;
  let lastImageBuffer = null;

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
    const slideInfo = await page.evaluate(() => {
      const posElement = document.querySelector('[aria-posinset]');
      return {
        hash: window.location.hash,
        pos: posElement ? posElement.getAttribute('aria-posinset') : null
      };
    });
    const currentHash = slideInfo.pos || slideInfo.hash;
    const isNewPage = (currentHash !== previousHash) || !currentHash;
    
    // Always update UI so it doesn't look stuck
    mainWindow.webContents.send('capture:progress', {
      currentSlide: slideIndex,
      status: isNewPage ? 'Saving slide...' : 'Capturing animation step...'
    });

    if (isNewPage) {
      // This is a NEW slide (or fallback mode). If we have a previous slide buffered, 
      // it has reached its final state, so we write it to disk now.
      if (lastImageBuffer) {
        const fileName = `slide_${String(slideIndex).padStart(3, '0')}.png`;
        const filePath = path.join(tempFolder, fileName);
        await fs.writeFile(filePath, lastImageBuffer);
        slideIndex++;
      }
      previousHash = currentHash;
    }

    // Capture the current state. We keep overwriting this to get the latest animation state.
    lastImageBuffer = await page.screenshot({ fullPage: false });

    // Advance to next step/slide
    await page.keyboard.press('ArrowRight');
    
    // Wait for transition animation
    await delay(1500);
    
    const newSlideInfo = await page.evaluate(() => {
      const posElement = document.querySelector('[aria-posinset]');
      return {
        hash: window.location.hash,
        pos: posElement ? posElement.getAttribute('aria-posinset') : null
      };
    });
    const newHash = newSlideInfo.pos || newSlideInfo.hash;
    const nextScreenshot = await page.screenshot({ fullPage: false });
    const currentImgHash = crypto.createHash('sha1').update(lastImageBuffer).digest('hex');
    const nextImgHash = crypto.createHash('sha1').update(nextScreenshot).digest('hex');

    // If the URL hash didn't change AND the pixels didn't change, we are at the end of the presentation.
    if (newHash === currentHash && currentImgHash === nextImgHash) {
      // Write the final slide to disk
      if (lastImageBuffer) {
        mainWindow.webContents.send('capture:progress', {
          currentSlide: slideIndex,
          status: 'Saving final slide...'
        });
        const fileName = `slide_${String(slideIndex).padStart(3, '0')}.png`;
        const filePath = path.join(tempFolder, fileName);
        await fs.writeFile(filePath, lastImageBuffer);
      }
      break;
    }
  }

  mainWindow.webContents.send('capture:complete', {
    totalSlides: slideIndex,
    tempFolder
  });
}

module.exports = { captureSlides };

const { ipcMain, dialog } = require('electron');
const { getBrowserPath } = require('./browserDetector');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { PDFDocument } = require('pdf-lib');
const { checkForUpdates } = require('./updateChecker');

let currentTempFolder = null;

function formatDefaultFolderName(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `GoogleSlide ${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function sanitizeNameSegment(value, fallback) {
  const safeName = path.basename(String(value || '').trim())
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '');

  return safeName || fallback;
}

async function createPdfFromImages(imagePaths, outputPath) {
  const pdfDocument = await PDFDocument.create();

  for (const imagePath of imagePaths) {
    const imageBytes = await fs.readFile(imagePath);
    const extension = path.extname(imagePath).toLowerCase();
    const embeddedImage = extension === '.png'
      ? await pdfDocument.embedPng(imageBytes)
      : await pdfDocument.embedJpg(imageBytes);
    const { width, height } = embeddedImage.scale(1);
    const page = pdfDocument.addPage([width, height]);

    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDocument.save();
  await fs.writeFile(outputPath, pdfBytes);
}

function setupIpcHandlers(mainWindow, updateManager) {
  ipcMain.handle('app:get-version', () => require('electron').app.getVersion());

  ipcMain.handle('updates:check', async () => {
    try {
      return await updateManager.checkForUpdates();
    } catch (error) {
      console.error('Update check error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('updates:download', async () => {
    try {
      return await updateManager.downloadUpdate();
    } catch (error) {
      console.error('Update download error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('updates:install', async () => {
    try {
      return await updateManager.installUpdate();
    } catch (error) {
      console.error('Update install error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('browser:select', async (event, payload) => {
    const { browser } = payload;
    const executablePath = getBrowserPath(browser);
    
    if (executablePath) {
      return { success: true, path: executablePath };
    } else {
      return { success: false, error: `${browser} executable not found on the system.` };
    }
  });

  ipcMain.handle('slides:start-capture', async (event, payload) => {
    const { url, browser } = payload;
    
    // Generate new temp folder
    const sessionId = Date.now().toString();
    currentTempFolder = path.join(os.tmpdir(), 'gslide_downloader', sessionId);
    await fs.ensureDir(currentTempFolder);
    
    try {
      const { startCaptureSession } = require('../automation/puppeteerEngine');
      
      startCaptureSession(url, browser, currentTempFolder, mainWindow).catch(error => {
        console.error('Capture session error:', error);
        mainWindow.webContents.send('capture:error', { message: error.message });
      });
      
      return { success: true, tempFolder: currentTempFolder };
    } catch (error) {
      console.error('Error starting capture:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('dialog:select-directory', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { path: null };
    }
    
    return { path: result.filePaths[0] };
  });

  ipcMain.handle('files:transfer', async (event, payload) => {
    const { destinationPath, folderName, downloadImages = true, downloadPdf = false } = payload;
    
    try {
      if (!currentTempFolder || !(await fs.pathExists(currentTempFolder))) {
        throw new Error('No temporary capture folder found to transfer.');
      }

      if (!downloadImages && !downloadPdf) {
        throw new Error('Select at least one download mode.');
      }

      const targetFolderName = sanitizeNameSegment(folderName, formatDefaultFolderName());
      let finalDestinationPath;
      
      if (!downloadImages && downloadPdf) {
        finalDestinationPath = destinationPath;
      } else {
        finalDestinationPath = path.join(destinationPath, targetFolderName);
        await fs.ensureDir(finalDestinationPath);
      }
      
      const files = (await fs.readdir(currentTempFolder)).sort();
      const imageFiles = files.filter((file) => /\.(png|jpe?g)$/i.test(file));

      if (downloadPdf) {
        if (imageFiles.length === 0) {
          throw new Error('No captured images found to convert into a PDF.');
        }

        const pdfFilePath = path.join(finalDestinationPath, `${targetFolderName}.pdf`);
        const imagePaths = imageFiles.map((file) => path.join(currentTempFolder, file));
        await createPdfFromImages(imagePaths, pdfFilePath);
      }

      if (downloadImages) {
        for (const file of imageFiles) {
          const srcPath = path.join(currentTempFolder, file);
          const destPath = path.join(finalDestinationPath, file);
          await fs.move(srcPath, destPath, { overwrite: true });
        }
      }
      
      // Cleanup temp folder
      await fs.remove(currentTempFolder);
      currentTempFolder = null;
      
      return { success: true, destinationPath: finalDestinationPath };
    } catch (error) {
      console.error('Transfer error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = setupIpcHandlers;

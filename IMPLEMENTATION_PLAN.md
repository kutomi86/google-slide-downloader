# Google Slides Downloader - Implementation Plan

This document outlines the step-by-step implementation plan for the Google Slides Downloader desktop application. The project is broken down into sequential phases to ensure a structured development process.

## Phase 1: Project Initialization & Setup
1. **Initialize Node.js Project:** Run `npm init -y` in the project root.
2. **Install Dependencies:**
   - Production: `npm install puppeteer-core fs-extra`
   - Development: `npm install -D electron electron-builder tailwindcss postcss autoprefixer`
3. **Scaffold Directory Structure:** Create the `src/main`, `src/automation`, `src/preload`, and `src/renderer` directories as outlined in the README.
4. **Configure Build Tools:** Set up `package.json` scripts (e.g., `start: electron .`) and initialize Tailwind CSS configuration (`npx tailwindcss init`).

## Phase 2: Main Process & IPC Foundation
1. **Entry Point (`src/main/index.js`):** Create the main Electron window with appropriate settings (Node integration disabled, context isolation enabled).
2. **Preload Script (`src/preload/index.js`):** Implement the `contextBridge` to securely expose IPC methods to the renderer (e.g., `selectBrowser`, `startCapture`, `selectDirectory`, `transferFiles`, and event listeners like `onCaptureProgress`).
3. **IPC Handlers Skeleton (`src/main/ipcHandlers.js`):** Register `ipcMain.handle` and `ipcMain.on` listeners for the defined channels, wiring them up to return stubbed responses.

## Phase 3: Browser Detection Module
1. **Browser Resolver (`src/main/browserDetector.js`):**
   - Implement logic to check standard Windows installation paths for Chrome, Edge, and Brave.
   - Use `fs.existsSync` to verify the presence of the executables.
   - Return the resolved path to the IPC handler for `browser:select`.

## Phase 4: Frontend UI (Renderer)
1. **HTML Structure (`src/renderer/index.html`):** Build the static structure for the 5 screens defined in the spec (Browser Selection, URL Input, Progress State, Transfer Modal, Success).
2. **Styling (`src/renderer/styles.css`):** Apply Tailwind CSS utility classes and custom CSS for animations/spinners and full-screen blocking modals.
3. **State Management (`src/renderer/app.js`):**
   - Implement DOM selectors and a simple state machine to toggle visibility between the screens.
   - Attach event listeners to UI buttons and wire them up to the exposed `window.api` (Preload) methods.

## Phase 5: File System & Dialogs
1. **Temp Directory Logic:** Generate a unique temporary directory using `os.tmpdir()` and a unique session ID in the main process when capturing starts.
2. **Directory Selection:** Implement the `dialog.showOpenDialog` handler in the main process to prompt the user for a destination folder.
3. **File Transfer (`files:transfer`):** Implement the logic to move the captured slides from the temporary directory to the chosen destination using `fs-extra.move()`, followed by cleaning up the temp folder.

## Phase 6: Puppeteer Automation Engine
1. **Browser Session (`src/automation/puppeteerEngine.js`):**
   - Implement the launcher using `puppeteer.launch({ executablePath, headless: false, ... })`.
   - Normalize the Google Slides URL to append `/present`.
2. **Slide Capture Logic (`src/automation/slideCapturer.js`):**
   - Wait for the slide stage to load.
   - Implement a loop that takes a screenshot (`page.screenshot`), presses `ArrowRight`, and waits for a transition delay (e.g., 500ms).
   - Use DOM evaluation or URL hash checking to detect the end of the presentation and break the loop.
   - Send progress updates (`capture:progress`) back to the renderer process after each slide.

## Phase 7: Integration & Testing
1. **End-to-End Wiring:** Ensure the UI correctly triggers the automation engine, displays progress, handles the native save dialog, and successfully moves files.
2. **Edge Case Handling:**
   - Add error handling for invalid URLs.
   - Handle scenarios where the chosen browser isn't installed.
   - Handle interruptions or closed windows during capture.
3. **Packaging:** Configure `electron-builder.json` and build the standalone Windows `.exe` to verify production behavior.

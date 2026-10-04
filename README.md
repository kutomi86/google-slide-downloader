# Google Slides Downloader Desktop Application

A desktop utility designed to automate the process of capturing high-resolution slide screenshots from Google Slides presentations across various Chromium-based browsers.

---

## 📌 App Workflow Outline

```
[ Launch App ]
      │
      ▼
[ Screen 1: Select Browser ] ───► (Chrome / Edge / Brave)
      │
      ▼
[ Screen 2: Input URL ] ────────► Enter Google Slides Link
      │
      ▼
[ Automation Processing ]
  ├─ 1. Locate or launch selected browser
  ├─ 2. Connect to tab matching the input URL
  ├─ 3. Navigate through slides (Slide 1 to End)
  └─ 4. Capture & save screenshots to temp directory
      │
      ▼
[ Windows Explorer Dialog ] ────► Select Target Output Directory
      │
      ▼
[ File Transfer Modal ] ────────► Non-cancelable loading state while moving files
      │
      ▼
[ Completion ] ─────────────────► Reset state & return to URL input page
```

---

## ⚙️ Detailed Functional Requirements

### 1. Browser Selection Page
* **Supported Browsers:** Google Chrome, Microsoft Edge, Brave.
* **UI Behavior:** Visual browser icons for quick selection.
* **Navigation:** Ability to switch selected browser at any point in the workflow.

### 2. URL Input & Session Hooking
* **Input Field:** Accepts valid Google Slides presentation URLs.
* **Session Detection:**
  * Checks if the target browser process is active.
  * If the browser is open, attempts to detect an existing tab with the matching presentation URL.
  * If the browser/tab is not found, launches the browser and opens the URL automatically.

### 3. Automated Screenshot Capture Engine
* **Execution:**
  * Navigates presentation slides sequentially from index `1` to `N`.
  * Captures each slide viewport or canvas as an image file (e.g., `slide_001.png`).
  * Saves images to a temporary working directory inside the application's local workspace (`/temp/downloads/<session_id>/`).

### 4. File Export & Directory Selection
* **Directory Picker:** Calls the native Windows File Explorer directory picker (`dialog.showOpenDialog`).
* **File Relocation:**
  * Displays a non-dismissible modal with an active loading indicator.
  * Moves the captured images from the temporary workspace into the user-selected target folder.
  * Cleans up temporary artifacts.

### 5. Loop & Reset Logic
* Upon successful relocation, clears the active task state and returns the user to the **URL Input Page** for further downloads.
* Includes a global header/back button to return to the **Browser Selection Page**.

---

## 🛠️ Technical Considerations & Challenges

### Chrome DevTools Protocol (CDP) & Remote Debugging
Automating an **already running** browser instance requires that the browser was launched with remote debugging enabled (e.g., `--remote-debugging-port=9222`). Standard browser security models prevent outside programs from interacting with arbitrary running browser tabs.
* **Solution Strategy:**
  * Option A: Launch a dedicated automated browser instance (headless or headed) using Playwright/Puppeteer.
  * Option B: Instruct the user or auto-relaunch the target browser with remote debugging flags attached.

---

## 📂 Proposed Project Structure

```text
google-slides-downloader/
├── src/
├── ui/              # Desktop Frontend Layout & Pages
│   ├── components/  # Buttons, Modals, Loading Animations
│   └── views/       # BrowserSelect, UrlInput, ProcessingModal
├── automation/      # Browser Control & Screenshot Engine
│   ├── browser.js   # Browser Process Hooking (Playwright/Puppeteer)
│   └── capturer.js  # Slide navigation & screen capture logic
└── utils/           # File System & Native Dialog Helpers
```
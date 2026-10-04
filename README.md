# 📊 Google Slides Downloader

A native Electron desktop application that automates the extraction of high-resolution, slide-by-slide screenshots from any accessible Google Slides presentation using powerful `puppeteer-core` browser automation.

## ✨ Key Features

- **Multi-Browser Support**: Connects securely to your local installations of Google Chrome, Microsoft Edge, or Brave Browser without bundling a heavy Chromium instance.
- **Native File Export**: Automatically saves all slides to a temporary workspace and lets you pick the final destination using the native Windows Explorer directory dialog.
- **Multi-Theme UI**: Seamlessly switch between **Light (Default)**, **GitHub Dark**, and **Ayu Dark** visual themes in real-time.
- **Internationalization (i18n)**: Full interface translation support built-in for **English** and **Bahasa Indonesia**.
- **Keyboard Navigation**: Assign a default browser to bypass the selection screen instantly by pressing `[ENTER]`.

---

## 🖥️ Prerequisites & System Requirements

To run this application locally, ensure your system meets the following requirements:
- **Operating System:** Windows 10/11
- **Runtime:** Node.js (v18 or higher recommended)
- **Browser Requirement:** At least one supported browser installed on your machine:
  - Google Chrome
  - Microsoft Edge
  - Brave Browser

---

## 🚀 Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kutomi86/google-slide-downloader.git
   cd google-slide-downloader
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Launch the app in development mode:**
   ```bash
   npm start
   ```

---

## 🔄 How It Works (Workflow)

The application simplifies a complex automation flow into 5 easy steps:

1. **Browser Selection:** The app auto-detects installed browsers on your Windows machine. Select the one you wish to use (or hit `[ENTER]` if you've set a default).
2. **URL Input:** Paste the URL of the Google Slides presentation. The app automatically normalizes it into presentation mode.
3. **Automated Slide Extraction:** The Puppeteer engine hooks into your browser, waits for slides to render, captures high-res screenshots, and uses simulated keyboard inputs (`ArrowRight`) to traverse the entire deck.
4. **Native Directory Selection:** Once captured, the app opens a native Windows folder picker for you to decide where the images should be saved.
5. **File Transfer Completion:** The slides are moved safely across your system to the final destination, and temporary artifacts are instantly cleaned up.

---

## ⚙️ Settings & Customization

Click the **Settings (⚙️)** gear icon in the top-right corner of the application to customize your experience. The app uses local storage to remember your preferences:

- **Language Switching:** Toggle instantly between English and Bahasa Indonesia.
- **UI Themes:** Choose a comfortable color palette (Light, GitHub Dark, or Ayu Dark). Theme changes are applied instantaneously using custom CSS variables.
- **Default Browser Binding:** Set your preferred automation browser so you don't have to select it every time you open the app.

---

## 🏗️ Tech Stack & Architecture

- **Desktop Shell:** Electron (Node Integration disabled, secure Context Isolation)
- **Automation Engine:** Puppeteer-Core
- **Frontend UI:** HTML5, CSS3 (Custom CSS Properties & Tailwind utilities), Vanilla JS
- **File Operations:** Node.js `fs-extra` (for robust cross-drive file moving)

---

## 📦 Building for Production

To package the application into a standalone Windows executable (`.exe`) installer, run the following command:

```bash
npm run build
```

This triggers `electron-builder` using the configurations set in `electron-builder.json`. The final compiled installer will be available in the `dist/` directory.

---

## 📄 License & Acknowledgments

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
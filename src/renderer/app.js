// Settings & i18n State
const defaultSettings = { theme: 'light', language: 'en', defaultBrowser: 'none' };
let settings = JSON.parse(localStorage.getItem('gslides_settings')) || defaultSettings;
let translations = {};

function saveSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  localStorage.setItem('gslides_settings', JSON.stringify(settings));
}

function getSettings() {
  return settings;
}

// i18n Loader
async function loadTranslations(lang) {
  try {
    const res = await fetch(`./i18n/${lang}.json`);
    translations = await res.json();
  } catch (err) {
    console.error('Failed to load translations:', err);
  }
}

// Translation Helper
function t(key, params = {}) {
  const keys = key.split('.');
  let val = translations;
  for (const k of keys) {
    if (val) val = val[k];
  }
  if (!val) return key;
  
  let result = val;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(`{${k}}`, v);
  }
  return result;
}

function renderTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });
}

// Initialization
(async function init() {
  document.documentElement.setAttribute('data-theme', settings.theme);
  await loadTranslations(settings.language);
  renderTranslations();
  renderBrowserSelectionScreen();
})();

// App State
let selectedBrowser = null;
let currentUrl = '';
let activeScreenIndex = 1;

function isHomepageScreen() {
  return activeScreenIndex === 1 || activeScreenIndex === 2;
}

function syncUpdateCheckVisibility() {
  if (!btnCheckUpdates) return;
  btnCheckUpdates.classList.toggle('hidden', !isHomepageScreen());
}

// DOM Elements
const screens = [
  document.getElementById('screen-1'),
  document.getElementById('screen-2'),
  document.getElementById('screen-3'),
  document.getElementById('screen-4'),
  document.getElementById('screen-5'),
  document.getElementById('screen-6'),
  document.getElementById('screen-7')
];

function showScreen(index) {
  activeScreenIndex = index;
  screens.forEach((screen, i) => {
    if (i === index - 1) {
      screen.classList.add('active');
    } else {
      screen.classList.remove('active');
    }
  });
  syncUpdateCheckVisibility();
  if (index === 1) {
    renderBrowserSelectionScreen();
  }
}

// Screen 1: Browser Selection
const browserBtns = document.querySelectorAll('.browser-btn');
const browserError = document.getElementById('browser-error');

function renderBrowserSelectionScreen() {
  // Clear any existing badges or classes
  browserBtns.forEach(btn => {
    btn.classList.remove('is-default-focused');
    const existingBadge = btn.querySelector('.default-badge');
    if (existingBadge) existingBadge.remove();
  });
  
  const hintText = document.getElementById('browser-hint-text');
  if (hintText) hintText.remove();

  if (settings.defaultBrowser !== 'none') {
    const defaultCard = document.querySelector(`[data-browser="${settings.defaultBrowser}"]`);
    if (defaultCard) {
      defaultCard.classList.add('is-default-focused');
      
      const badge = document.createElement('div');
      badge.className = 'default-badge absolute -top-3 -right-3 bg-[var(--primary)] text-white text-xs font-bold px-2 py-1 rounded-full shadow-md';
      badge.textContent = t('browserSelect.defaultBadge');
      defaultCard.appendChild(badge);
      
      const screen1 = document.getElementById('screen-1');
      const hint = document.createElement('p');
      hint.id = 'browser-hint-text';
      hint.className = 'text-sm text-[var(--primary)] mt-6 font-semibold';
      hint.textContent = t('browserSelect.pressEnter');
      const errorBox = document.getElementById('browser-error');
      screen1.insertBefore(hint, errorBox);
    }
  }
}

function handleEnterShortcut(event) {
  if (event.key === 'Enter') {
    const screen1 = document.getElementById('screen-1');
    if (screen1.classList.contains('active') && settings.defaultBrowser !== 'none') {
      const defaultCard = document.querySelector(`[data-browser="${settings.defaultBrowser}"]`);
      if (defaultCard && !settingsModal.classList.contains('hidden') === false) {
        defaultCard.click();
      }
    }
  }
}
document.addEventListener('keydown', handleEnterShortcut);

browserBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    const browser = btn.dataset.browser;
    browserError.classList.add('hidden');
    
    // Check if browser is installed
    const result = await window.api.selectBrowser({ browser });
    if (result.success) {
      selectedBrowser = browser;
      showScreen(2);
    } else {
      browserError.textContent = t('errors.browserNotFound');
      browserError.classList.remove('hidden');
    }
  });
});

// Screen 2: URL Input
const btnBackBrowsers = document.getElementById('btn-back-browsers');
const urlInput = document.getElementById('url-input');
const btnStartCapture = document.getElementById('btn-start-capture');
const urlError = document.getElementById('url-error');

btnBackBrowsers.addEventListener('click', () => {
  showScreen(1);
  selectedBrowser = null;
});

btnStartCapture.addEventListener('click', async () => {
  currentUrl = urlInput.value.trim();
  urlError.classList.add('hidden');
  urlError.textContent = '';
  
  if (!currentUrl || !currentUrl.includes('docs.google.com/presentation')) {
    urlError.textContent = t('errors.invalidUrl');
    urlError.classList.remove('hidden');
    return;
  }
  
  showScreen(3);
  showLoadingState(t('status.searchingBrowser'), t('status.searchingBrowser'));
  
  // Trigger Capture
  const result = await window.api.startCapture({ url: currentUrl, browser: selectedBrowser });
  if (!result.success) {
    // Show error if immediate failure
    urlError.textContent = t('errors.captureFailed');
    urlError.classList.remove('hidden');
    showScreen(2);
  }
});

// Screen 3: IPC Listeners for Progress
const loadingTitle = document.getElementById('loading-title');
const loadingStatus = document.getElementById('loading-status');

function showLoadingState(title, status) {
  loadingTitle.textContent = title;
  loadingStatus.textContent = status;
  showScreen(3);
}

window.api.onCaptureProgress((data) => {
  urlError.classList.add('hidden');
  urlError.textContent = '';
  loadingTitle.textContent = t('status.loadingSlides');
  loadingStatus.textContent = t('status.capturing', { current: data.currentSlide, total: '?' });
});

window.api.onCaptureComplete((data) => {
  urlError.classList.add('hidden');
  urlError.textContent = '';
  loadingTitle.textContent = t('status.complete');
  loadingStatus.textContent = t('status.saving');
  showScreen(4);
});

window.api.onCaptureError((data) => {
  urlError.textContent = t('errors.captureFailed');
  urlError.classList.remove('hidden');
  showScreen(2);
});

// Screen 4: Directory Selection
const btnSelectDir = document.getElementById('btn-select-dir');
const folderNameInput = document.getElementById('folder-name-input');
const transferStatus = document.getElementById('transfer-status');

function getFolderName() {
  return folderNameInput.value.trim();
}

btnSelectDir.addEventListener('click', async () => {
  const result = await window.api.selectDirectory();
  
  if (result.path) {
    btnSelectDir.disabled = true;
    folderNameInput.disabled = true;
    transferStatus.classList.remove('hidden');

    const transferResult = await window.api.transferFiles({
      destinationPath: result.path,
      folderName: getFolderName(),
    });

    if (transferResult.success) {
      showScreen(5);
    } else {
      alert(`Transfer failed: ${transferResult.error}`);
      btnSelectDir.disabled = false;
      folderNameInput.disabled = false;
      transferStatus.classList.add('hidden');
    }
  }
});

window.api.onTransferComplete((data) => {
  if (data.success) {
    showScreen(5);
  }
});

// Screen 5: Success
const btnReset = document.getElementById('btn-reset');
btnReset.addEventListener('click', () => {
  urlInput.value = '';
  folderNameInput.value = '';
  showLoadingState(t('status.searchingBrowser'), t('status.searchingBrowser'));
  showScreen(2);
});

// Phase 3: Settings Modal Logic
const btnSettings = document.getElementById('btn-settings');
const settingsModal = document.getElementById('settings-modal');
const btnCloseSettings = document.getElementById('btn-close-settings');
const selectTheme = document.getElementById('select-theme');
const selectLang = document.getElementById('select-lang');
const selectBrowser = document.getElementById('select-browser');
const btnCheckUpdates = document.getElementById('btn-check-updates');
const btnUpdateAccept = document.getElementById('btn-update-accept');
const btnUpdateDecline = document.getElementById('btn-update-decline');
const btnRestartNow = document.getElementById('btn-restart-now');
const btnRestartLater = document.getElementById('btn-restart-later');

// Initialize dropdowns with current settings
selectTheme.value = settings.theme;
selectLang.value = settings.language;
selectBrowser.value = settings.defaultBrowser;

btnSettings.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
});

btnCloseSettings.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

async function runUpdateCheck() {
  settingsModal.classList.add('hidden');
  showLoadingState(t('updateCheck.loadingTitle'), t('updateCheck.loadingStatus'));

  const result = await window.api.checkForUpdates();

  if (!result.success) {
    alert(result.error || t('updateCheck.errorFallback'));
    showScreen(1);
    return;
  }

  if (result.isNewerVersionAvailable) {
    showScreen(6);
    return;
  }

  alert(t('updateCheck.noUpdate'));
  showScreen(1);
}

btnCheckUpdates.addEventListener('click', () => {
  if (!isHomepageScreen()) return;
  runUpdateCheck();
});

btnUpdateDecline.addEventListener('click', () => {
  showScreen(1);
});

btnUpdateAccept.addEventListener('click', () => {
  showLoadingState(t('updateCheck.downloadingTitle'), t('updateCheck.downloadingStatus'));

  window.api.downloadUpdate().then((result) => {
    if (!result.success) {
      alert(result.error || t('updateCheck.errorFallback'));
      showScreen(1);
    }
  });
});

btnUpdateDecline.addEventListener('click', () => {
  showScreen(1);
});

btnRestartNow.addEventListener('click', async () => {
  showLoadingState(t('restartPrompt.restartingTitle'), t('restartPrompt.restartingStatus'));

  const result = await window.api.installUpdate();
  if (!result.success) {
    alert(result.error || t('updateCheck.errorFallback'));
    showScreen(1);
  }
});

btnRestartLater.addEventListener('click', () => {
  showScreen(1);
});

window.api.onUpdateDownloadProgress((progress) => {
  loadingTitle.textContent = t('updateCheck.downloadingTitle');
  loadingStatus.textContent = t('updateCheck.downloadProgress', {
    percent: Math.round(progress.percent || 0),
    transferred: Math.round((progress.transferred || 0) / 1024 / 1024),
    total: Math.round((progress.total || 0) / 1024 / 1024),
  });
});

window.api.onUpdateDownloaded((data) => {
  showScreen(7);
});

window.api.onUpdateError((data) => {
  alert(data.message || t('updateCheck.errorFallback'));
  showScreen(1);
});

selectTheme.addEventListener('change', (e) => {
  const newTheme = e.target.value;
  saveSettings({ theme: newTheme });
  document.documentElement.setAttribute('data-theme', newTheme);
});

selectLang.addEventListener('change', async (e) => {
  const newLang = e.target.value;
  saveSettings({ language: newLang });
  await loadTranslations(newLang);
  if (typeof renderTranslations === 'function') {
    renderTranslations();
  }
});

selectBrowser.addEventListener('change', (e) => {
  const newBrowser = e.target.value;
  saveSettings({ defaultBrowser: newBrowser });
  if (document.getElementById('screen-1').classList.contains('active')) {
    renderBrowserSelectionScreen();
  }
});

syncUpdateCheckVisibility();


# Google Slides Downloader - Settings & Theming Implementation Plan (V2)

This document outlines the step-by-step strategy for seamlessly integrating Settings, Internationalization (i18n), and Visual Themes into the existing Google Slides Downloader architecture, based on the updated specification.

## Phase 1: Foundation (Settings & i18n Data)
1. **Settings Manager:** Create a lightweight settings state manager inside `src/renderer/app.js` (or a separate module) to handle reading and writing to `localStorage`.
   - Default state: `{ "theme": "light", "language": "en", "defaultBrowser": "none" }`.
2. **Translation Dictionaries:** Create the `src/renderer/i18n` directory.
   - Add `en.json` and `id.json` containing the translation maps.
3. **i18n Core Engine:** Implement a translation loader in `app.js` that fetches the JSON dictionaries (or bundles them) and provides a global `t(key, params)` function.

## Phase 2: Themes & CSS Refactoring
1. **CSS Variables:** Update `src/renderer/styles.css` to include the CSS custom properties for `[data-theme="light"]`, `[data-theme="github-dark"]`, and `[data-theme="ayu-dark"]`.
2. **Specialized Classes:** Add the required `.error-box` dashed-border class and `.is-default-focused` ring class to `styles.css`.
3. **Tailwind Adaptation:** Update `src/renderer/index.html` classes. 
   - Replace hardcoded Tailwind colors (e.g., `text-gray-500`, `bg-blue-600`) with dynamic theme variable mappings or arbitrary Tailwind values (e.g., `bg-[var(--primary)]`, `text-[var(--text-main)]`).
   - Add `transition-colors duration-200` to body and interactive elements for smooth theme switching.
4. **Theme Bootstrap:** Ensure on app load, `document.documentElement.setAttribute('data-theme', settings.theme)` is executed immediately.

## Phase 3: Settings Modal UI
1. **Modal DOM:** Add a Settings gear icon button in the top-right corner of `src/renderer/index.html`.
2. **Modal Content:** Build a modal overlay structure in `index.html` containing three `<select>` dropdowns: Theme, Language, and Default Browser, plus a "Save & Close" button.
3. **Modal Logic:** Wire up the UI in `app.js`:
   - Open/Close events for the modal.
   - Bind `<select>` values to the Settings Manager.
   - Instantly apply theme changes when the Theme dropdown changes.
   - Instantly trigger a re-render of translations when the Language dropdown changes.

## Phase 4: UI Translation & Error Styling Application
1. **DOM Attributes:** Add `data-i18n="key.name"` attributes to all static HTML text nodes in `index.html`.
2. **Translation Renderer:** Write a `renderTranslations()` function in `app.js` that queries all `[data-i18n]` elements and updates their `textContent` using the `t()` function.
3. **Dynamic Translations:** Replace all hardcoded alert messages, error messages, and progress statuses inside `app.js` (e.g., `captureStatus.textContent = ...`) with localized strings via `t()`.
4. **Error Styling:** Apply the `.error-box` class to `#browser-error` and `#url-error` elements, removing their generic `text-red-500` styling.

## Phase 5: Keyboard Navigation & Default Browser Flow
1. **Screen 1 Initialization:** Update the `showScreen(1)` logic. When displaying the Browser Selection screen:
   - Check if `settings.defaultBrowser` is not `"none"`.
   - Apply the `.is-default-focused` class to the corresponding browser button.
   - Inject the "Default" badge (`t('browserSelect.defaultBadge')`) and Hint Text (`t('browserSelect.pressEnter')`) dynamically into the DOM.
2. **Global Keydown Listener:** Add a `keydown` listener active *only* when Screen 1 is visible. If `Enter` is pressed and a default browser exists, automatically trigger the browser selection flow as if the user clicked it.

(function () {
  'use strict';

  const VERSION = '1.0.0';
  const ROOT_ID = 'atw-root';
  const GLOBAL_STYLE_ID = 'atw-global-style';
  const FONT_LINK_ID = 'atw-opendyslexic-font';
  const DEFAULT_STORAGE_KEY = 'atw-accessibility-settings';
  const OPEN_DYSLEXIC_STYLESHEET = 'https://unpkg.com/@fontsource/opendyslexic/index.css';
  const PAGE_CLASSES = Object.freeze({
    highContrast: 'atw-high-contrast',
    darkMode: 'atw-dark-mode',
    lowVision: 'atw-low-vision',
    largeCursor: 'atw-large-cursor',
    underlineLinks: 'atw-underline-links',
    highlightLinks: 'atw-highlight-links',
    readableFont: 'atw-readable-font',
    letterSpacing: 'atw-letter-spacing-wide',
    lineHeight: 'atw-line-height-large',
    readingMode: 'atw-reading-mode'
  });
  const TOGGLE_DEFINITIONS = Object.freeze([
    {
      key: 'highContrast',
      label: 'High Contrast',
      help: 'Black and white contrast mode'
    },
    {
      key: 'darkMode',
      label: 'Dark Mode',
      help: 'Reduce eye strain in low light'
    },
    {
      key: 'lowVision',
      label: 'Low Vision Mode',
      help: 'Black background with yellow text'
    },
    {
      key: 'largeCursor',
      label: 'Large Cursor',
      help: 'Make the pointer easier to track'
    },
    {
      key: 'underlineLinks',
      label: 'Underline Links',
      help: 'Show links with strong underlines'
    },
    {
      key: 'highlightLinks',
      label: 'Highlight Links',
      help: 'Add a highlight behind links'
    },
    {
      key: 'readableFont',
      label: 'Dyslexia Font',
      help: 'Switch to OpenDyslexic'
    },
    {
      key: 'letterSpacing',
      label: 'Letter Spacing',
      help: 'Increase space between characters'
    },
    {
      key: 'lineHeight',
      label: 'Line Height',
      help: 'Increase space between lines'
    },
    {
      key: 'readingMode',
      label: 'Reading Mode',
      help: 'Focus with a reading band'
    }
  ]);

  let initialized = false;
  let initScheduled = false;
  let config = null;
  let state = getDefaultState();
  let hostElement = null;
  let shadowRootNode = null;
  let menuOpen = false;
  let originalRootFontSize = '';
  let baseRootFontSizePixels = 16;
  let elements = {};

  const scriptDatasetConfig = readScriptDataset();

  function getDefaultState() {
    return {
      fontSize: 100,
      highContrast: false,
      darkMode: false,
      lowVision: false,
      largeCursor: false,
      underlineLinks: false,
      highlightLinks: false,
      readableFont: false,
      letterSpacing: false,
      lineHeight: false,
      readingMode: false
    };
  }

  function readScriptDataset() {
    const activeScript = document.currentScript;

    if (!activeScript || !activeScript.dataset) {
      return {};
    }

    return {
      position: activeScript.dataset.position,
      accent: activeScript.dataset.accent,
      storageKey: activeScript.dataset.storageKey,
      zIndex: activeScript.dataset.zIndex,
      readingBandSize: activeScript.dataset.readingBandSize
    };
  }

  function normalizeConfig(overrides) {
    const mergedConfig = Object.assign(
      {
        position: 'bottom-left',
        accent: '#2563eb',
        storageKey: DEFAULT_STORAGE_KEY,
        zIndex: 2147483000,
        readingBandSize: 130
      },
      scriptDatasetConfig,
      overrides || {}
    );

    const position = mergedConfig.position === 'bottom-right' ? 'bottom-right' : 'bottom-left';
    const zIndex = parseInteger(mergedConfig.zIndex, 2147483000);
    const readingBandSize = parseInteger(mergedConfig.readingBandSize, 130);

    return {
      position: position,
      accent: isValidCssColor(mergedConfig.accent) ? mergedConfig.accent : '#2563eb',
      storageKey: mergedConfig.storageKey || DEFAULT_STORAGE_KEY,
      zIndex: zIndex,
      readingBandSize: readingBandSize
    };
  }

  function parseInteger(value, fallbackValue) {
    const parsedValue = parseInt(value, 10);
    return Number.isNaN(parsedValue) ? fallbackValue : parsedValue;
  }

  function isValidCssColor(value) {
    if (!value) {
      return false;
    }

    const probe = document.createElement('span');
    probe.style.color = '';
    probe.style.color = value;
    return probe.style.color !== '';
  }

  function injectGlobalStyles() {
    if (document.getElementById(GLOBAL_STYLE_ID)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = GLOBAL_STYLE_ID;
    styleElement.textContent = buildGlobalStyles();
    document.head.appendChild(styleElement);
  }

  function buildGlobalStyles() {
    return `
body.${PAGE_CLASSES.highContrast},
body.${PAGE_CLASSES.highContrast} :not(#${ROOT_ID}) {
  background-color: #000 !important;
  color: #fff !important;
  border-color: #fff !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

body.${PAGE_CLASSES.highContrast} a {
  color: #fff !important;
  text-decoration: underline !important;
}

body.${PAGE_CLASSES.highContrast} img,
body.${PAGE_CLASSES.highContrast} video,
body.${PAGE_CLASSES.highContrast} svg,
body.${PAGE_CLASSES.highContrast} canvas {
  background: transparent !important;
  filter: grayscale(1) contrast(1.2) !important;
}

body.${PAGE_CLASSES.darkMode},
body.${PAGE_CLASSES.darkMode} :not(#${ROOT_ID}) {
  background-color: #0f172a !important;
  color: #f8fafc !important;
  border-color: #334155 !important;
}

body.${PAGE_CLASSES.darkMode} a {
  color: #93c5fd !important;
}

body.${PAGE_CLASSES.darkMode} img,
body.${PAGE_CLASSES.darkMode} video,
body.${PAGE_CLASSES.darkMode} svg,
body.${PAGE_CLASSES.darkMode} canvas {
  background: transparent !important;
}

body.${PAGE_CLASSES.lowVision},
body.${PAGE_CLASSES.lowVision} :not(#${ROOT_ID}) {
  background-color: #000 !important;
  color: #ffeb3b !important;
  border-color: #ffeb3b !important;
}

body.${PAGE_CLASSES.lowVision} a {
  color: #ffeb3b !important;
  text-decoration: underline !important;
}

body.${PAGE_CLASSES.largeCursor},
body.${PAGE_CLASSES.largeCursor} * {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24'%3E%3Cpath fill='%232563eb' d='M5 3l6.75 15.2 2.24-5.16L19 11z'/%3E%3C/svg%3E") 2 2, auto !important;
}

body.${PAGE_CLASSES.underlineLinks} a {
  text-decoration: underline !important;
  text-decoration-thickness: 2px !important;
  text-underline-offset: 0.14em !important;
  font-weight: 700 !important;
}

body.${PAGE_CLASSES.highlightLinks} a {
  background: #ffeb3b !important;
  color: #111827 !important;
  padding: 0.08em 0.24em !important;
  border-radius: 0.2em !important;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.16) !important;
}

body.${PAGE_CLASSES.readableFont},
body.${PAGE_CLASSES.readableFont} * {
  font-family: 'OpenDyslexic', Arial, Helvetica, sans-serif !important;
}

body.${PAGE_CLASSES.letterSpacing},
body.${PAGE_CLASSES.letterSpacing} * {
  letter-spacing: 0.12em !important;
}

body.${PAGE_CLASSES.lineHeight},
body.${PAGE_CLASSES.lineHeight} * {
  line-height: 2 !important;
}
`;
  }

  function ensureOpenDyslexicStylesheet() {
    if (document.getElementById(FONT_LINK_ID)) {
      return;
    }

    const linkElement = document.createElement('link');
    linkElement.id = FONT_LINK_ID;
    linkElement.rel = 'stylesheet';
    linkElement.href = OPEN_DYSLEXIC_STYLESHEET;
    document.head.appendChild(linkElement);
  }

  function buildWidget() {
    hostElement = document.createElement('div');
    hostElement.id = ROOT_ID;
    hostElement.className = config.position === 'bottom-right' ? 'atw-pos-right' : 'atw-pos-left';
    hostElement.style.setProperty('--atw-accent', config.accent);
    shadowRootNode = hostElement.attachShadow({ mode: 'open' });
    shadowRootNode.innerHTML = buildShadowMarkup();
    document.body.appendChild(hostElement);

    elements = {
      launcher: shadowRootNode.getElementById('atw-launcher'),
      menu: shadowRootNode.getElementById('atw-menu'),
      overlay: shadowRootNode.getElementById('atw-reading-overlay'),
      fontSizeDisplay: shadowRootNode.getElementById('atw-font-size-display'),
      fontDecrease: shadowRootNode.getElementById('atw-font-decrease'),
      fontIncrease: shadowRootNode.getElementById('atw-font-increase'),
      resetButton: shadowRootNode.getElementById('atw-reset-button')
    };

    elements.overlay.style.setProperty('--atw-reading-band-size', config.readingBandSize + 'px');
    elements.launcher.style.zIndex = String(config.zIndex);
    elements.menu.style.zIndex = String(config.zIndex + 1);
    elements.overlay.style.zIndex = String(config.zIndex - 1);

    bindWidgetEvents();
  }

  function buildShadowMarkup() {
    const toggleRows = TOGGLE_DEFINITIONS.map(function (definition) {
      return (
        '<button class="atw-toggle" type="button" data-setting="' + definition.key + '" aria-pressed="false">' +
          '<span class="atw-copy">' +
            '<span class="atw-label">' + definition.label + '</span>' +
            '<span class="atw-help">' + definition.help + '</span>' +
          '</span>' +
          '<span class="atw-switch" aria-hidden="true"><span class="atw-switch-knob"></span></span>' +
        '</button>'
      );
    }).join('');

    return `
      <style>
        :host {
          all: initial;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #0f172a;
          --atw-accent: #2563eb;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        button {
          font: inherit;
        }

        #atw-launcher {
          position: fixed;
          bottom: 20px;
          left: 20px;
          width: 60px;
          height: 60px;
          border: none;
          border-radius: 999px;
          background: var(--atw-accent);
          color: #fff;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.03em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.28);
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          padding: 0;
        }

        :host(.atw-pos-right) #atw-launcher {
          left: auto;
          right: 20px;
        }

        #atw-launcher:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 20px 36px rgba(15, 23, 42, 0.32);
        }

        #atw-launcher:focus-visible,
        .atw-toggle:focus-visible,
        .atw-font-button:focus-visible,
        #atw-reset-button:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.35);
          outline-offset: 3px;
        }

        #atw-menu {
          position: fixed;
          bottom: 92px;
          left: 20px;
          width: min(320px, calc(100vw - 24px));
          max-height: min(78vh, 720px);
          overflow-y: auto;
          background: #fff;
          border: 1px solid rgba(148, 163, 184, 0.35);
          border-radius: 18px;
          box-shadow: 0 24px 72px rgba(15, 23, 42, 0.24);
          padding: 18px;
          display: none;
        }

        :host(.atw-pos-right) #atw-menu {
          left: auto;
          right: 20px;
        }

        #atw-menu[data-open='true'] {
          display: block;
          animation: atw-pop 0.18s ease-out;
        }

        @keyframes atw-pop {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .atw-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .atw-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .atw-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: #475569;
        }

        .atw-section {
          display: grid;
          gap: 10px;
        }

        .atw-font-row,
        .atw-toggle {
          width: 100%;
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 14px;
          background: #f8fafc;
        }

        .atw-font-row {
          padding: 12px 14px 14px;
        }

        .atw-row-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .atw-copy {
          display: grid;
          gap: 2px;
          text-align: left;
        }

        .atw-label {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .atw-help {
          font-size: 12px;
          line-height: 1.45;
          color: #475569;
        }

        .atw-font-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .atw-font-button {
          min-width: 42px;
          border: none;
          border-radius: 10px;
          background: var(--atw-accent);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          padding: 10px 12px;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .atw-font-button:hover,
        #atw-reset-button:hover {
          transform: translateY(-1px);
        }

        #atw-font-size-display {
          min-width: 58px;
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          color: var(--atw-accent);
        }

        .atw-toggle {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          transition: border-color 0.18s ease, background 0.18s ease;
        }

        .atw-toggle:hover {
          border-color: rgba(37, 99, 235, 0.3);
        }

        .atw-toggle[data-active='true'] {
          background: #eff6ff;
          border-color: rgba(37, 99, 235, 0.35);
        }

        .atw-switch {
          position: relative;
          width: 46px;
          height: 26px;
          border-radius: 999px;
          background: #cbd5e1;
          flex: 0 0 auto;
          transition: background 0.18s ease;
        }

        .atw-toggle[data-active='true'] .atw-switch {
          background: var(--atw-accent);
        }

        .atw-switch-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
          transition: transform 0.18s ease;
        }

        .atw-toggle[data-active='true'] .atw-switch-knob {
          transform: translateX(20px);
        }

        #atw-reset-button {
          width: 100%;
          border: none;
          border-radius: 12px;
          background: #0f172a;
          color: #fff;
          cursor: pointer;
          padding: 12px 14px;
          font-weight: 700;
          margin-top: 4px;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        #atw-reading-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.18s ease;
          background: linear-gradient(
            to bottom,
            rgba(4, 10, 24, 0.8) 0%,
            rgba(4, 10, 24, 0.8) calc(var(--atw-reading-y, 50vh) - (var(--atw-reading-band-size, 130px) / 2)),
            rgba(4, 10, 24, 0.04) calc(var(--atw-reading-y, 50vh) - (var(--atw-reading-band-size, 130px) / 2)),
            rgba(4, 10, 24, 0.04) calc(var(--atw-reading-y, 50vh) + (var(--atw-reading-band-size, 130px) / 2)),
            rgba(4, 10, 24, 0.8) calc(var(--atw-reading-y, 50vh) + (var(--atw-reading-band-size, 130px) / 2)),
            rgba(4, 10, 24, 0.8) 100%
          );
        }

        #atw-reading-overlay[data-active='true'] {
          opacity: 1;
        }

        @media (max-width: 640px) {
          #atw-launcher {
            bottom: 12px;
            left: 12px;
            width: 54px;
            height: 54px;
          }

          :host(.atw-pos-right) #atw-launcher {
            left: auto;
            right: 12px;
          }

          #atw-menu {
            bottom: 78px;
            left: 12px;
            width: calc(100vw - 24px);
            max-height: 74vh;
          }

          :host(.atw-pos-right) #atw-menu {
            left: auto;
            right: 12px;
          }
        }
      </style>

      <div id="atw-reading-overlay" aria-hidden="true"></div>

      <button id="atw-launcher" type="button" aria-label="Open accessibility toolbar" aria-controls="atw-menu" aria-expanded="false">
        Aa
      </button>

      <section id="atw-menu" role="dialog" aria-modal="false" aria-label="Accessibility toolbar">
        <div class="atw-header">
          <div>
            <div class="atw-title">Accessibility Tools</div>
            <div class="atw-subtitle">Reusable widget loaded from one script</div>
          </div>
        </div>

        <div class="atw-section">
          <div class="atw-font-row">
            <div class="atw-row-header">
              <span class="atw-copy">
                <span class="atw-label">Font Size</span>
                <span class="atw-help">Increase or decrease page text size</span>
              </span>
              <span id="atw-font-size-display">100%</span>
            </div>

            <div class="atw-font-controls">
              <button class="atw-font-button" id="atw-font-decrease" type="button" aria-label="Decrease font size">A-</button>
              <button class="atw-font-button" id="atw-font-increase" type="button" aria-label="Increase font size">A+</button>
            </div>
          </div>

          ${toggleRows}

          <button id="atw-reset-button" type="button">Reset All Settings</button>
        </div>
      </section>
    `;
  }

  function bindWidgetEvents() {
    elements.launcher.addEventListener('click', function () {
      setMenuOpen(!menuOpen);
    });

    elements.fontDecrease.addEventListener('click', function () {
      changeFontSize('decrease');
    });

    elements.fontIncrease.addEventListener('click', function () {
      changeFontSize('increase');
    });

    elements.resetButton.addEventListener('click', resetSettings);

    shadowRootNode.querySelectorAll('[data-setting]').forEach(function (toggleButton) {
      toggleButton.addEventListener('click', function () {
        toggleSetting(toggleButton.getAttribute('data-setting'));
      });
    });

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeydown);
    document.addEventListener('mousemove', handlePointerMove, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
  }

  function handleDocumentClick(event) {
    if (!menuOpen) {
      return;
    }

    const eventPath = typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (!eventPath.includes(hostElement)) {
      setMenuOpen(false);
    }
  }

  function handleDocumentKeydown(event) {
    if (event.key === 'Escape' && menuOpen) {
      setMenuOpen(false);
      elements.launcher.focus();
    }
  }

  function handlePointerMove(event) {
    if (!state.readingMode) {
      return;
    }

    updateReadingBand(event.clientY);
  }

  function handleTouchMove(event) {
    if (!state.readingMode || !event.touches || event.touches.length === 0) {
      return;
    }

    updateReadingBand(event.touches[0].clientY);
  }

  function updateReadingBand(yPosition) {
    elements.overlay.style.setProperty('--atw-reading-y', yPosition + 'px');
  }

  function setMenuOpen(nextValue) {
    menuOpen = nextValue;
    elements.menu.dataset.open = menuOpen ? 'true' : 'false';
    elements.launcher.setAttribute('aria-expanded', menuOpen ? 'true' : 'false');
  }

  function changeFontSize(direction) {
    if (direction === 'increase' && state.fontSize < 200) {
      state.fontSize += 10;
    }

    if (direction === 'decrease' && state.fontSize > 80) {
      state.fontSize -= 10;
    }

    applyState();
    persistState();
  }

  function toggleSetting(settingName) {
    if (!Object.prototype.hasOwnProperty.call(state, settingName) || settingName === 'fontSize') {
      return;
    }

    state[settingName] = !state[settingName];

    if (settingName === 'highContrast' && state.highContrast) {
      state.darkMode = false;
      state.lowVision = false;
    }

    if (settingName === 'darkMode' && state.darkMode) {
      state.highContrast = false;
      state.lowVision = false;
    }

    if (settingName === 'lowVision' && state.lowVision) {
      state.highContrast = false;
      state.darkMode = false;

      if (state.fontSize < 130) {
        state.fontSize = 130;
      }
    }

    if (settingName === 'readableFont' && state.readableFont) {
      ensureOpenDyslexicStylesheet();
    }

    applyState();
    persistState();
  }

  function applyState() {
    const rootElement = document.documentElement;
    const bodyElement = document.body;

    if (state.fontSize === 100) {
      rootElement.style.fontSize = originalRootFontSize;
    } else {
      rootElement.style.fontSize = baseRootFontSizePixels * (state.fontSize / 100) + 'px';
    }

    bodyElement.classList.toggle(PAGE_CLASSES.highContrast, state.highContrast);
    bodyElement.classList.toggle(PAGE_CLASSES.darkMode, state.darkMode);
    bodyElement.classList.toggle(PAGE_CLASSES.lowVision, state.lowVision);
    bodyElement.classList.toggle(PAGE_CLASSES.largeCursor, state.largeCursor);
    bodyElement.classList.toggle(PAGE_CLASSES.underlineLinks, state.underlineLinks);
    bodyElement.classList.toggle(PAGE_CLASSES.highlightLinks, state.highlightLinks);
    bodyElement.classList.toggle(PAGE_CLASSES.readableFont, state.readableFont);
    bodyElement.classList.toggle(PAGE_CLASSES.letterSpacing, state.letterSpacing);
    bodyElement.classList.toggle(PAGE_CLASSES.lineHeight, state.lineHeight);
    bodyElement.classList.toggle(PAGE_CLASSES.readingMode, state.readingMode);

    if (state.readableFont) {
      ensureOpenDyslexicStylesheet();
    }

    elements.fontSizeDisplay.textContent = state.fontSize + '%';
    elements.overlay.dataset.active = state.readingMode ? 'true' : 'false';

    if (state.readingMode) {
      updateReadingBand(window.innerHeight / 2);
    }

    syncToggleUi();
  }

  function syncToggleUi() {
    shadowRootNode.querySelectorAll('[data-setting]').forEach(function (toggleButton) {
      const settingName = toggleButton.getAttribute('data-setting');
      const isActive = Boolean(state[settingName]);
      toggleButton.dataset.active = isActive ? 'true' : 'false';
      toggleButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function persistState() {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify(state));
    } catch (error) {
      return;
    }
  }

  function loadState() {
    try {
      const rawState = localStorage.getItem(config.storageKey);

      if (!rawState) {
        return getDefaultState();
      }

      const parsedState = JSON.parse(rawState);
      return Object.assign(getDefaultState(), parsedState || {});
    } catch (error) {
      return getDefaultState();
    }
  }

  function resetSettings() {
    state = getDefaultState();
    applyState();

    try {
      localStorage.removeItem(config.storageKey);
    } catch (error) {
      return;
    }
  }

  function removePageClasses() {
    const bodyElement = document.body;

    Object.keys(PAGE_CLASSES).forEach(function (pageClassKey) {
      bodyElement.classList.remove(PAGE_CLASSES[pageClassKey]);
    });
  }

  function mount() {
    if (initialized || !document.body || !document.head) {
      return;
    }

    originalRootFontSize = document.documentElement.style.fontSize;
    baseRootFontSizePixels = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;

    injectGlobalStyles();
    buildWidget();

    state = loadState();
    applyState();
    updateReadingBand(window.innerHeight / 2);

    initialized = true;
    initScheduled = false;
  }

  function init(overrides) {
    config = normalizeConfig(overrides);

    if (initialized || initScheduled) {
      return api;
    }

    initScheduled = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
      mount();
    }

    return api;
  }

  function destroy() {
    if (!initialized) {
      return;
    }

    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleDocumentKeydown);
    document.removeEventListener('mousemove', handlePointerMove);
    document.removeEventListener('touchmove', handleTouchMove);

    removePageClasses();
    document.documentElement.style.fontSize = originalRootFontSize;

    if (hostElement && hostElement.parentNode) {
      hostElement.parentNode.removeChild(hostElement);
    }

    const globalStyleElement = document.getElementById(GLOBAL_STYLE_ID);
    if (globalStyleElement && globalStyleElement.parentNode) {
      globalStyleElement.parentNode.removeChild(globalStyleElement);
    }

    hostElement = null;
    shadowRootNode = null;
    elements = {};
    menuOpen = false;
    initialized = false;
    initScheduled = false;
    state = getDefaultState();
  }

  const api = {
    version: VERSION,
    init: init,
    destroy: destroy,
    getState: function () {
      return Object.assign({}, state);
    }
  };

  window.AccessibilityToolbar = api;
  init();
})();
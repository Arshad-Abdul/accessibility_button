(function () {
  'use strict';

  const VERSION = '1.1.0';
  const ROOT_ID = 'atw-root';
  const GLOBAL_STYLE_ID = 'atw-global-style';
  const FONT_LINK_ID = 'atw-opendyslexic-font';
  const DEFAULT_STORAGE_KEY = 'atw-accessibility-settings';
  const OPEN_DYSLEXIC_STYLESHEET = 'https://unpkg.com/@fontsource/opendyslexic/index.css';
  const FONT_AWESOME_STYLESHEET = 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css';
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
  const HOST_THEME_CLASSES = Object.freeze({
    highContrast: 'atw-theme-high-contrast',
    darkMode: 'atw-theme-dark-mode',
    lowVision: 'atw-theme-low-vision',
    largeCursor: 'atw-theme-large-cursor',
    readableFont: 'atw-theme-readable-font',
    letterSpacing: 'atw-theme-letter-spacing',
    lineHeight: 'atw-theme-line-height'
  });
  const TOGGLE_DEFINITIONS = Object.freeze([
    {
      key: 'highContrast',
      label: 'High Contrast',
      iconClass: 'fa-adjust',
      switchId: 'contrastToggle'
    },
    {
      key: 'darkMode',
      label: 'Dark Mode',
      iconClass: 'fa-moon-o',
      switchId: 'darkModeToggle'
    },
    {
      key: 'lowVision',
      label: 'Low Vision Mode',
      iconClass: 'fa-binoculars',
      switchId: 'lowVisionToggle'
    },
    {
      key: 'largeCursor',
      label: 'Large Cursor',
      iconClass: 'fa-mouse-pointer',
      switchId: 'cursorToggle'
    },
    {
      key: 'underlineLinks',
      label: 'Underline Links',
      iconClass: 'fa-underline',
      switchId: 'underlineToggle'
    },
    {
      key: 'highlightLinks',
      label: 'Highlight Links',
      iconClass: 'fa-lightbulb-o',
      switchId: 'highlightToggle'
    },
    {
      key: 'readableFont',
      label: 'Dyslexia Font',
      iconClass: 'fa-book',
      switchId: 'fontToggle'
    },
    {
      key: 'letterSpacing',
      label: 'Letter Spacing',
      iconClass: 'fa-text-width',
      switchId: 'spacingToggle'
    },
    {
      key: 'lineHeight',
      label: 'Line Height',
      iconClass: 'fa-align-justify',
      switchId: 'lineHeightToggle'
    },
    {
      key: 'readingMode',
      label: 'Reading Mode',
      iconClass: 'fa-eye',
      switchId: 'readingModeToggle'
    }
  ]);

  let initialized = false;
  let initScheduled = false;
  let config = null;
  let state = getDefaultState();
  let hostElement = null;
  let shadowRootNode = null;
  let menuOpen = false;
  let originalBodyFontSize = '';
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
        accent: '#0d9488',
        storageKey: DEFAULT_STORAGE_KEY,
        zIndex: 2147483000,
        readingBandSize: 130
      },
      scriptDatasetConfig,
      overrides || {}
    );

    return {
      position: mergedConfig.position === 'bottom-right' ? 'bottom-right' : 'bottom-left',
      accent: isValidCssColor(mergedConfig.accent) ? mergedConfig.accent : '#0d9488',
      storageKey: mergedConfig.storageKey || DEFAULT_STORAGE_KEY,
      zIndex: parseInteger(mergedConfig.zIndex, 2147483000),
      readingBandSize: parseInteger(mergedConfig.readingBandSize, 130)
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
body.${PAGE_CLASSES.highContrast} {
  background: #000 !important;
  color: #fff !important;
}

body.${PAGE_CLASSES.highContrast} :not(#${ROOT_ID}):not(script):not(style) {
  background: #000 !important;
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

body.${PAGE_CLASSES.darkMode} {
  background: #1a1a1a !important;
  color: #fff !important;
}

body.${PAGE_CLASSES.darkMode} :not(#${ROOT_ID}):not(script):not(style) {
  background-color: #111827 !important;
  color: #fff !important;
  border-color: #374151 !important;
}

body.${PAGE_CLASSES.darkMode} a {
  color: #fff !important;
}

body.${PAGE_CLASSES.lowVision} {
  background: #000 !important;
  color: #ffeb3b !important;
  font-size: 130% !important;
}

body.${PAGE_CLASSES.lowVision} :not(#${ROOT_ID}):not(script):not(style) {
  background: #000 !important;
  color: #ffeb3b !important;
  border-color: #ffeb3b !important;
}

body.${PAGE_CLASSES.lowVision} a {
  color: #ffeb3b !important;
  text-decoration: underline !important;
}

body.${PAGE_CLASSES.lowVision} button,
body.${PAGE_CLASSES.lowVision} input,
body.${PAGE_CLASSES.lowVision} select,
body.${PAGE_CLASSES.lowVision} textarea {
  background: #ffeb3b !important;
  color: #000 !important;
  border: 1px solid #ffeb3b !important;
}

body.${PAGE_CLASSES.largeCursor},
body.${PAGE_CLASSES.largeCursor} * {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24'%3E%3Cpath d='M2%202V19L7%2014L10%2022L13%2021L10%2013H18L2%202Z' fill='white' stroke='black' stroke-width='1.4' stroke-linejoin='round'/%3E%3C/svg%3E") 3 2, auto !important;
}

body.${PAGE_CLASSES.underlineLinks} a {
  text-decoration: underline !important;
  font-weight: bold !important;
}

body.${PAGE_CLASSES.highlightLinks} a {
  background: #ffeb3b !important;
  padding: 2px 4px !important;
  border-radius: 3px !important;
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
    hostElement.style.zIndex = String(config.zIndex);
    shadowRootNode = hostElement.attachShadow({ mode: 'open' });
    shadowRootNode.innerHTML = buildShadowMarkup();
    document.body.appendChild(hostElement);

    elements = {
      launcher: shadowRootNode.getElementById('atw-launcher'),
      menu: shadowRootNode.getElementById('accessibilityMenu'),
      overlay: shadowRootNode.getElementById('atw-reading-overlay'),
      fontSizeDisplay: shadowRootNode.getElementById('fontSizeDisplay'),
      fontDecrease: shadowRootNode.getElementById('atw-font-decrease'),
      fontIncrease: shadowRootNode.getElementById('atw-font-increase'),
      resetButton: shadowRootNode.getElementById('atw-reset-button'),
      toggleButtons: Array.from(shadowRootNode.querySelectorAll('[data-setting]'))
    };

    elements.overlay.style.setProperty('--reading-band-size', config.readingBandSize + 'px');
    bindWidgetEvents();
  }

  function buildShadowMarkup() {
    const toggleRows = TOGGLE_DEFINITIONS.map(function (definition) {
      return (
        '<div class="menu-item">' +
          '<button class="menu-toggle" type="button" data-setting="' + definition.key + '" aria-pressed="false">' +
            '<span><i class="fa ' + definition.iconClass + '" aria-hidden="true"></i> ' + definition.label + '</span>' +
            '<div class="toggle-switch" id="' + definition.switchId + '"></div>' +
          '</button>' +
        '</div>'
      );
    }).join('');

    return `
      <link rel="stylesheet" href="${FONT_AWESOME_STYLESHEET}">
      <style>
        :host {
          all: initial;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          --atw-accent: #0d9488;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        button {
          font: inherit;
        }

        .accessibility-button {
          position: fixed;
          bottom: 20px;
          left: 20px;
          width: 60px;
          height: 60px;
          background: var(--atw-accent);
          border: none;
          border-radius: 50%;
          color: #fff;
          font-size: 28px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 2;
          padding: 0;
        }

        :host(.atw-pos-right) .accessibility-button {
          left: auto;
          right: 20px;
        }

        .accessibility-button:hover {
          transform: scale(1.1) rotate(90deg);
          box-shadow: 0 6px 20px rgba(13, 148, 136, 0.5);
        }

        .accessibility-button:active {
          transform: scale(0.95);
        }

        .accessibility-button:focus-visible,
        .font-btn:focus-visible,
        .menu-toggle:focus-visible,
        .reset-btn:focus-visible {
          outline: 3px solid rgba(13, 148, 136, 0.35);
          outline-offset: 3px;
        }

        .accessibility-menu {
          position: fixed;
          bottom: 90px;
          left: 20px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          padding: 20px;
          width: 280px;
          display: none;
          z-index: 1;
          max-height: 80vh;
          overflow-y: auto;
        }

        :host(.atw-pos-right) .accessibility-menu {
          left: auto;
          right: 20px;
        }

        .accessibility-menu.active {
          display: block;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(0);
          }

          to {
            opacity: 1;
            transform: translateY(-20px);
          }
        }

        .menu-header {
          font-size: 18px;
          font-weight: bold;
          color: var(--atw-accent);
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--atw-accent);
        }

        .menu-signature {
          margin: 8px 0 12px;
          text-align: center;
          font-size: 12px;
          color: #475569;
        }

        .menu-item {
          margin: 12px 0;
          padding: 10px;
          border-radius: 5px;
          transition: background 0.2s;
        }

        .menu-item:hover {
          background: #f8f9fa;
        }

        .menu-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          font-size: 14px;
          color: #333;
          background: transparent;
          border: none;
          padding: 0;
          text-align: left;
        }

        .menu-toggle span {
          display: flex;
          align-items: center;
        }

        .menu-item i {
          margin-right: 10px;
          width: 20px;
          text-align: center;
          color: var(--atw-accent);
        }

        .toggle-switch {
          position: relative;
          width: 50px;
          height: 24px;
          background: #ccc;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.3s;
          flex: 0 0 auto;
        }

        .toggle-switch.active {
          background: var(--atw-accent);
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          transition: left 0.3s;
        }

        .toggle-switch.active::after {
          left: 28px;
        }

        .font-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-top: 8px;
        }

        .font-btn {
          background: var(--atw-accent);
          color: #fff;
          border: none;
          padding: 5px 12px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .font-btn:hover {
          background: #0f766e;
          transform: scale(1.05);
        }

        .font-size-display {
          font-weight: bold;
          color: var(--atw-accent);
          min-width: 50px;
          text-align: center;
        }

        .reset-btn {
          width: 100%;
          background: #6c757d;
          color: #fff;
          border: none;
          padding: 10px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 15px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .reset-btn:hover {
          background: #5a6268;
          transform: translateY(-2px);
        }

        .reading-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          z-index: 0;
          transition: opacity 0.2s ease;
          background: linear-gradient(
            to bottom,
            rgba(4, 10, 24, 0.8) 0%,
            rgba(4, 10, 24, 0.8) calc(var(--reading-y, 50vh) - (var(--reading-band-size, 130px) / 2)),
            rgba(4, 10, 24, 0.05) calc(var(--reading-y, 50vh) - (var(--reading-band-size, 130px) / 2)),
            rgba(4, 10, 24, 0.05) calc(var(--reading-y, 50vh) + (var(--reading-band-size, 130px) / 2)),
            rgba(4, 10, 24, 0.8) calc(var(--reading-y, 50vh) + (var(--reading-band-size, 130px) / 2)),
            rgba(4, 10, 24, 0.8) 100%
          );
        }

        .reading-overlay.active {
          opacity: 1;
        }

        :host(.atw-theme-dark-mode) .accessibility-menu {
          background: #111827 !important;
          color: #fff !important;
          border: 1px solid #374151;
        }

        :host(.atw-theme-dark-mode) .menu-item:hover {
          background: #1f2937 !important;
        }

        :host(.atw-theme-dark-mode) .menu-header,
        :host(.atw-theme-dark-mode) .menu-toggle,
        :host(.atw-theme-dark-mode) .menu-toggle span,
        :host(.atw-theme-dark-mode) .font-size-display,
        :host(.atw-theme-dark-mode) .menu-signature {
          color: #fff !important;
        }

        :host(.atw-theme-dark-mode) .menu-item i {
          color: #fff !important;
        }

        :host(.atw-theme-dark-mode) .font-btn {
          background: var(--atw-accent) !important;
          color: #fff !important;
        }

        :host(.atw-theme-dark-mode) .font-btn:hover {
          background: #0f766e !important;
        }

        :host(.atw-theme-dark-mode) .toggle-switch {
          background: #4b5563;
        }

        :host(.atw-theme-low-vision) .accessibility-menu {
          background: #000 !important;
          color: #ffeb3b !important;
          border: 1px solid #ffeb3b !important;
        }

        :host(.atw-theme-low-vision) .menu-item:hover {
          background: #111 !important;
        }

        :host(.atw-theme-low-vision) .accessibility-button,
        :host(.atw-theme-low-vision) .font-btn,
        :host(.atw-theme-low-vision) .reset-btn {
          background: #ffeb3b !important;
          color: #000 !important;
          border: 1px solid #ffeb3b !important;
        }

        :host(.atw-theme-low-vision) .toggle-switch {
          background: #3f3f00 !important;
          border: 1px solid #ffeb3b;
        }

        :host(.atw-theme-low-vision) .toggle-switch.active {
          background: #ffeb3b !important;
        }

        :host(.atw-theme-low-vision) .toggle-switch::after {
          background: #000 !important;
          border: 1px solid #ffeb3b;
        }

        :host(.atw-theme-low-vision) .menu-toggle,
        :host(.atw-theme-low-vision) .menu-item i,
        :host(.atw-theme-low-vision) .font-size-display,
        :host(.atw-theme-low-vision) .menu-header,
        :host(.atw-theme-low-vision) .menu-signature {
          color: #ffeb3b !important;
        }

        :host(.atw-theme-high-contrast) .accessibility-menu {
          background: #000 !important;
          color: #fff !important;
          border: 2px solid #fff !important;
        }

        :host(.atw-theme-high-contrast) .accessibility-button,
        :host(.atw-theme-high-contrast) .font-btn,
        :host(.atw-theme-high-contrast) .reset-btn {
          background: #fff !important;
          color: #000 !important;
          border: 1px solid #fff !important;
        }

        :host(.atw-theme-high-contrast) .toggle-switch {
          background: #444 !important;
          border: 1px solid #fff;
        }

        :host(.atw-theme-high-contrast) .toggle-switch.active {
          background: #fff !important;
        }

        :host(.atw-theme-high-contrast) .toggle-switch::after {
          background: #fff !important;
          border: 1px solid #000;
        }

        :host(.atw-theme-high-contrast) .menu-item:hover {
          background: #111 !important;
        }

        :host(.atw-theme-high-contrast) .menu-header,
        :host(.atw-theme-high-contrast) .menu-toggle,
        :host(.atw-theme-high-contrast) .menu-toggle span,
        :host(.atw-theme-high-contrast) .menu-item i,
        :host(.atw-theme-high-contrast) .font-size-display,
        :host(.atw-theme-high-contrast) .menu-signature {
          color: #fff !important;
        }

        :host(.atw-theme-readable-font),
        :host(.atw-theme-readable-font) * {
          font-family: 'OpenDyslexic', Arial, Helvetica, sans-serif !important;
        }

        :host(.atw-theme-letter-spacing),
        :host(.atw-theme-letter-spacing) * {
          letter-spacing: 0.12em !important;
        }

        :host(.atw-theme-line-height),
        :host(.atw-theme-line-height) * {
          line-height: 2 !important;
        }

        :host(.atw-theme-large-cursor),
        :host(.atw-theme-large-cursor) * {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24'%3E%3Cpath d='M2%202V19L7%2014L10%2022L13%2021L10%2013H18L2%202Z' fill='white' stroke='black' stroke-width='1.4' stroke-linejoin='round'/%3E%3C/svg%3E") 3 2, auto !important;
        }

        @media (max-width: 768px) {
          .accessibility-menu {
            width: 250px;
          }

          .accessibility-button {
            width: 50px;
            height: 50px;
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .accessibility-button {
            bottom: 10px;
            left: 10px;
          }

          :host(.atw-pos-right) .accessibility-button {
            left: auto;
            right: 10px;
          }

          .accessibility-menu {
            bottom: 75px;
            left: 10px;
            width: calc(100vw - 20px);
          }

          :host(.atw-pos-right) .accessibility-menu {
            left: auto;
            right: 10px;
          }
        }
      </style>

      <div class="reading-overlay" id="atw-reading-overlay" aria-hidden="true"></div>

      <button class="accessibility-button" id="atw-launcher" type="button" aria-label="Toggle Accessibility Menu" aria-controls="accessibilityMenu" aria-expanded="false">
        <i class="fa fa-universal-access" aria-hidden="true"></i>
      </button>

      <div class="accessibility-menu" id="accessibilityMenu" role="dialog" aria-modal="false" aria-label="Accessibility Options">
        <div class="menu-header">
          <i class="fa fa-universal-access" aria-hidden="true"></i> Accessibility Options
        </div>

        <div class="menu-item">
          <div>
            <span><i class="fa fa-font" aria-hidden="true"></i> Font Size</span>
          </div>
          <div class="font-controls">
            <button class="font-btn" id="atw-font-decrease" type="button" aria-label="Decrease font size">A-</button>
            <span class="font-size-display" id="fontSizeDisplay">100%</span>
            <button class="font-btn" id="atw-font-increase" type="button" aria-label="Increase font size">A+</button>
          </div>
        </div>

        ${toggleRows}

        <div class="menu-signature">Made with Love by <a href="https://www.linkedin.com/in/arshad-abdul-6a3807253/">Arshad Abdul</a>, IITH</div>
        <p class="menu-signature"> Presented at <a href="https://library.iith.ac.in/events/aidl2026/">AIDL 2026 Symposium</a></p>
        <button class="reset-btn" id="atw-reset-button" type="button">
          <i class="fa fa-refresh" aria-hidden="true"></i> Reset All Settings
        </button>
      </div>
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

    elements.toggleButtons.forEach(function (toggleButton) {
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
    elements.overlay.style.setProperty('--reading-y', yPosition + 'px');
  }

  function setMenuOpen(nextValue) {
    menuOpen = nextValue;
    elements.menu.classList.toggle('active', menuOpen);
    elements.launcher.setAttribute('aria-expanded', menuOpen ? 'true' : 'false');
  }

  function changeFontSize(direction) {
    if (direction === 'increase' && state.fontSize < 200) {
      state.fontSize += 10;
    } else if (direction === 'decrease' && state.fontSize > 80) {
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
    const bodyElement = document.body;

    if (state.fontSize === 100) {
      bodyElement.style.fontSize = originalBodyFontSize;
    } else {
      bodyElement.style.fontSize = state.fontSize + '%';
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

    syncHostThemeClasses();

    if (state.readableFont) {
      ensureOpenDyslexicStylesheet();
    }

    elements.fontSizeDisplay.textContent = state.fontSize + '%';
    elements.overlay.classList.toggle('active', state.readingMode);

    if (state.readingMode) {
      updateReadingBand(window.innerHeight / 2);
    }

    syncToggleUi();
  }

  function syncHostThemeClasses() {
    hostElement.classList.toggle(HOST_THEME_CLASSES.highContrast, state.highContrast);
    hostElement.classList.toggle(HOST_THEME_CLASSES.darkMode, state.darkMode);
    hostElement.classList.toggle(HOST_THEME_CLASSES.lowVision, state.lowVision);
    hostElement.classList.toggle(HOST_THEME_CLASSES.largeCursor, state.largeCursor);
    hostElement.classList.toggle(HOST_THEME_CLASSES.readableFont, state.readableFont);
    hostElement.classList.toggle(HOST_THEME_CLASSES.letterSpacing, state.letterSpacing);
    hostElement.classList.toggle(HOST_THEME_CLASSES.lineHeight, state.lineHeight);
  }

  function syncToggleUi() {
    TOGGLE_DEFINITIONS.forEach(function (definition) {
      const toggleButton = shadowRootNode.querySelector('[data-setting="' + definition.key + '"]');
      const toggleSwitch = shadowRootNode.getElementById(definition.switchId);
      const isActive = Boolean(state[definition.key]);

      if (toggleButton) {
        toggleButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      }

      if (toggleSwitch) {
        toggleSwitch.classList.toggle('active', isActive);
      }
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

      return Object.assign(getDefaultState(), JSON.parse(rawState) || {});
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

    originalBodyFontSize = document.body.style.fontSize;

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
    document.body.style.fontSize = originalBodyFontSize;

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
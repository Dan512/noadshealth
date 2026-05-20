/* noadshealth — settings popover, NoAdsDude pattern.
 * Reads/writes localStorage. data-setting="key" on inputs.
 * No analytics, no telemetry, no third-party calls.
 */

(function () {
  'use strict';

  const DEFAULTS = {
    showSupportBtn: true
    // theme intentionally omitted: missing localStorage entry === follow OS.
  };
  const KNOWN_KEYS = ['theme', 'showSupportBtn'];

  function effectiveTheme() {
    const stored = (function () { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  function getSetting(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return DEFAULTS[key];
      if (raw === 'true') return true;
      if (raw === 'false') return false;
      return raw;
    } catch (e) {
      return DEFAULTS[key];
    }
  }

  function setSetting(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (e) { /* private mode / quota — silently ignore */ }
    applySettings();
  }

  function getSettingsBool(key, fallback) {
    const v = getSetting(key);
    if (typeof v === 'boolean') return v;
    if (v === 'true') return true;
    if (v === 'false') return false;
    return fallback !== undefined ? fallback : !!DEFAULTS[key];
  }

  function applySettings() {
    document.documentElement.setAttribute('data-theme', effectiveTheme());

    const show = getSettingsBool('showSupportBtn');
    const btn = document.getElementById('support-btn');
    if (btn) btn.style.display = show ? '' : 'none';
  }

  function reflectInputsFromStorage() {
    const currentTheme = effectiveTheme();
    document.querySelectorAll('[data-setting]').forEach(function (el) {
      const key = el.dataset.setting;
      if (key === 'theme') {
        if (el.type === 'radio') el.checked = el.value === currentTheme;
        return;
      }
      const value = getSetting(key);
      if (el.type === 'checkbox') {
        el.checked = !!value;
      } else if (el.type === 'radio') {
        el.checked = el.value === String(value);
      } else {
        el.value = value;
      }
    });
  }

  function initInputs() {
    reflectInputsFromStorage();
    document.querySelectorAll('[data-setting]').forEach(function (el) {
      el.addEventListener('change', function () {
        const key = el.dataset.setting;
        let value;
        if (el.type === 'checkbox') value = el.checked;
        else value = el.value;
        setSetting(key, value);
      });
    });
  }

  function initPopover() {
    const trigger = document.getElementById('settings-trigger');
    const popover = document.getElementById('settings-popover');
    if (!trigger || !popover) return;

    function open() {
      popover.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }
    function close() {
      popover.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
    function toggle() {
      if (popover.hidden) open(); else close();
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });

    document.addEventListener('click', function (e) {
      if (popover.hidden) return;
      if (popover.contains(e.target) || trigger.contains(e.target)) return;
      const wasFocusInside = popover.contains(document.activeElement);
      close();
      if (wasFocusInside) trigger.focus();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !popover.hidden) {
        close();
        trigger.focus();
      }
    });
  }

  function initRestore() {
    const btn = document.getElementById('restore-defaults');
    if (!btn) return;
    btn.addEventListener('click', function () {
      KNOWN_KEYS.forEach(function (k) {
        try { localStorage.removeItem(k); } catch (e) {}
      });
      reflectInputsFromStorage();
      applySettings();
    });
  }

  function watchSystemTheme() {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = function () {
      // Only follow OS changes when there's no explicit override stored.
      const stored = (function () { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();
      if (stored !== 'light' && stored !== 'dark') applySettings();
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  function init() {
    applySettings();
    initInputs();
    initPopover();
    initRestore();
    watchSystemTheme();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose helpers for other scripts
  window.NoAds = window.NoAds || {};
  window.NoAds.getSettingsBool = getSettingsBool;
  window.NoAds.applySettings = applySettings;
})();

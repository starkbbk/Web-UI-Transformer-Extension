/**
 * WebTransformer Pro — Popup Controller
 * Manages all popup UI interactions, theme switching,
 * intensity control, whitelist, and settings sync.
 */

'use strict';

// ─── Theme Definitions ────────────────────────────────────────────────────────
const THEMES = [
  {
    id:     'cyberpunk',
    label:  'Cyber',
    emoji:  '🌌',
    dots:   ['#7c3aed', '#3b82f6', '#06b6d4'],
    tcA:    '#7c3aed',
    tcB:    '#3b82f6',
  },
  {
    id:     'matrix',
    label:  'Matrix',
    emoji:  '🔥',
    dots:   ['#00ff41', '#00cc33', '#39ff14'],
    tcA:    '#00ff41',
    tcB:    '#00cc33',
  },
  {
    id:     'ocean',
    label:  'Ocean',
    emoji:  '🌊',
    dots:   ['#0284c7', '#06b6d4', '#22d3ee'],
    tcA:    '#0284c7',
    tcB:    '#06b6d4',
  },
  {
    id:     'sunset',
    label:  'Sunset',
    emoji:  '🌅',
    dots:   ['#f43f5e', '#fb923c', '#fbbf24'],
    tcA:    '#f43f5e',
    tcB:    '#fb923c',
  },
  {
    id:     'neon',
    label:  'Neon',
    emoji:  '⚡',
    dots:   ['#facc15', '#a855f7', '#e879f9'],
    tcA:    '#facc15',
    tcB:    '#a855f7',
  },
];

// ─── Intensity Map ────────────────────────────────────────────────────────────
const INTENSITIES = ['light', 'medium', 'full'];

// ─── State ────────────────────────────────────────────────────────────────────
let settings   = null;
let currentUrl = '';

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const powerToggle      = $('power-toggle');
const toggleStatus     = $('toggle-status');
const powerDesc        = $('power-desc');
const statusDot        = $('status-dot');
const statusText       = $('status-text');
const themeGrid        = $('theme-grid');
const intensitySlider  = $('intensity-slider');
const intensityBadge   = $('intensity-badge');
const btnParticles     = $('btn-particles');
const btnAnimations    = $('btn-animations');
const btnReload        = $('btn-reload');
const wlDomain         = $('wl-domain');
const wlSub            = $('wl-sub');
const wlBtn            = $('wl-btn');
const brandIcon        = $('brand-icon');

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadCurrentUrl();
  renderThemes();
  syncUI();
  attachListeners();
});

// ─── Load Settings from Background ───────────────────────────────────────────
async function loadSettings() {
  try {
    const res = await sendMessage({ type: 'GET_SETTINGS' });
    settings  = res?.settings ?? getDefaultSettings();
  } catch {
    settings = getDefaultSettings();
  }
}

// ─── Load Active Tab URL ──────────────────────────────────────────────────────
async function loadCurrentUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentUrl = tab?.url || '';
    const hostname = safeHostname(currentUrl);
    wlDomain.textContent = hostname || 'Unknown site';
    updateWhitelistButton(hostname);
  } catch {
    wlDomain.textContent = 'Unknown site';
  }
}

// ─── Render Theme Cards ───────────────────────────────────────────────────────
function renderThemes() {
  themeGrid.innerHTML = '';

  THEMES.forEach(theme => {
    const card = document.createElement('div');
    card.className = 'theme-card' + (settings.theme === theme.id ? ' active' : '');
    card.setAttribute('data-theme-id', theme.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${theme.label} theme`);
    card.style.setProperty('--tc-a', theme.tcA);
    card.style.setProperty('--tc-b', theme.tcB);

    const dotsHtml = theme.dots
      .map(c => `<span class="theme-dot" style="background:${c}"></span>`)
      .join('');

    card.innerHTML = `
      <span class="theme-emoji">${theme.emoji}</span>
      <div class="theme-dots">${dotsHtml}</div>
      <span class="theme-name">${theme.label}</span>
    `;

    // Click → ripple + select
    card.addEventListener('click', e => {
      createRipple(e, card);
      selectTheme(theme.id);
    });

    // Keyboard accessible
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectTheme(theme.id);
      }
    });

    themeGrid.appendChild(card);
  });
}

// ─── Select Theme ─────────────────────────────────────────────────────────────
async function selectTheme(themeId) {
  if (!settings) return;
  settings.theme = themeId;

  // Update popup's own theme (for color sync)
  document.documentElement.setAttribute('data-theme', themeId);

  // Highlight active card
  $$('.theme-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-theme-id') === themeId);
  });

  // Update brand icon emoji to match theme
  const t = THEMES.find(t => t.id === themeId);
  if (t) brandIcon.textContent = t.emoji;

  await saveSettings();
}

// ─── Sync UI to State ─────────────────────────────────────────────────────────
function syncUI() {
  if (!settings) return;

  // Power toggle
  powerToggle.checked = settings.enabled;
  updatePowerUI(settings.enabled);

  // Theme popup attribute
  document.documentElement.setAttribute('data-theme', settings.theme || 'cyberpunk');

  // Highlight active theme card
  $$('.theme-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-theme-id') === settings.theme);
  });

  // Brand icon
  const t = THEMES.find(th => th.id === settings.theme);
  if (t) brandIcon.textContent = t.emoji;

  // Intensity
  const intensityIdx = INTENSITIES.indexOf(settings.intensity ?? 'full');
  intensitySlider.value = intensityIdx >= 0 ? intensityIdx : 2;
  updateIntensityUI(intensityIdx >= 0 ? intensityIdx : 2);

  // Options
  btnParticles.classList.toggle('active', settings.particlesEnabled !== false);
  btnAnimations.classList.toggle('active', settings.animationsEnabled !== false);
}

// ─── Update Power UI ──────────────────────────────────────────────────────────
function updatePowerUI(on) {
  toggleStatus.textContent = on ? 'ON' : 'OFF';
  toggleStatus.className   = 'toggle-status' + (on ? ' on' : '');
  statusDot.className      = 'status-dot' + (on ? ' active' : '');
  statusText.textContent   = on ? 'ACTIVE' : 'OFF';
  powerDesc.textContent    = on
    ? 'Futuristic theme is active on all pages'
    : 'Enable to apply futuristic theme';
}

// ─── Update Intensity UI ──────────────────────────────────────────────────────
function updateIntensityUI(idx) {
  const labels  = ['LIGHT', 'MEDIUM', 'FULL'];
  const pcts    = ['0%', '50%', '100%'];
  intensityBadge.textContent = labels[idx] || 'FULL';
  intensitySlider.style.setProperty('--slider-pct', pcts[idx] || '100%');
}

// ─── Update Whitelist Button ──────────────────────────────────────────────────
function updateWhitelistButton(hostname) {
  if (!hostname || !settings) return;
  const isWL = settings.whitelist?.includes(hostname);
  wlBtn.textContent = isWL ? 'Re-enable' : 'Exclude';
  wlBtn.classList.toggle('whitelisted', isWL);
  wlSub.textContent = isWL
    ? '⛔ Theme is paused for this site'
    : 'Theme will apply to this site';
}

// ─── Attach Listeners ─────────────────────────────────────────────────────────
function attachListeners() {

  // Power toggle
  powerToggle.addEventListener('change', async () => {
    settings.enabled = powerToggle.checked;
    updatePowerUI(settings.enabled);
    await sendMessage({ type: 'TOGGLE_EXTENSION', enabled: settings.enabled });
    await saveSettings();
  });

  // Intensity slider
  intensitySlider.addEventListener('input', () => {
    const idx = parseInt(intensitySlider.value, 10);
    updateIntensityUI(idx);
    settings.intensity = INTENSITIES[idx] || 'full';
  });

  intensitySlider.addEventListener('change', async () => {
    await saveSettings();
  });

  // Particles toggle
  btnParticles.addEventListener('click', async () => {
    settings.particlesEnabled = !settings.particlesEnabled;
    btnParticles.classList.toggle('active', settings.particlesEnabled);
    await saveSettings();
  });

  // Animations toggle
  btnAnimations.addEventListener('click', async () => {
    settings.animationsEnabled = !settings.animationsEnabled;
    btnAnimations.classList.toggle('active', settings.animationsEnabled);
    await saveSettings();
  });

  // Reload current tab
  btnReload.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) await chrome.tabs.reload(tab.id);
    } catch (err) {
      console.error('[WTP Popup] Reload error:', err);
    }
  });

  // Whitelist toggle
  wlBtn.addEventListener('click', async () => {
    const hostname = safeHostname(currentUrl);
    if (!hostname) return;

    const isWL = settings.whitelist?.includes(hostname);
    if (isWL) {
      // Remove from whitelist
      settings.whitelist = settings.whitelist.filter(h => h !== hostname);
      await sendMessage({ type: 'REMOVE_FROM_WHITELIST', hostname });
    } else {
      // Add to whitelist
      settings.whitelist = [...(settings.whitelist || []), hostname];
      await sendMessage({ type: 'ADD_TO_WHITELIST', url: currentUrl });
    }

    updateWhitelistButton(hostname);
    await saveSettings();
  });
}

// ─── Intensity Helper (called from HTML onclick) ──────────────────────────────
function setIntensityValue(val) {
  intensitySlider.value = val;
  updateIntensityUI(val);
  settings.intensity = INTENSITIES[val] || 'full';
  saveSettings();
}

// Make globally accessible for the onclick attributes in HTML
window.setIntensityValue = setIntensityValue;

// ─── Save Settings ────────────────────────────────────────────────────────────
async function saveSettings() {
  if (!settings) return;
  try {
    await sendMessage({ type: 'SAVE_SETTINGS', settings });
  } catch (err) {
    console.error('[WTP Popup] Save settings error:', err);
  }
}

// ─── Ripple Effect ────────────────────────────────────────────────────────────
function createRipple(e, el) {
  const rect   = el.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height) * 1.5;
  const x      = e.clientX - rect.left - size / 2;
  const y      = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
  `;
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function sendMessage(msg) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(msg, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function getDefaultSettings() {
  return {
    enabled:           false,
    theme:             'cyberpunk',
    intensity:         'full',
    whitelist:         [],
    particlesEnabled:  true,
    animationsEnabled: true,
    version:           '1.0.0',
  };
}

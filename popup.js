/**
 * WebTransformer Pro — Popup Controller v5.1
 * Vibrant Ambient Edition — Fixed Messaging
 */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const masterToggle    = document.getElementById('master-toggle');
  const particlesToggle = document.getElementById('particles-toggle');
  const intensityRange  = document.getElementById('intensity');
  const themeBtns       = document.querySelectorAll('.theme-btn');
  const whitelistBtn    = document.getElementById('whitelist-btn');

  // ── Load Settings ──────────────────────────────────────────
  try {
    const res = await msg({ type: 'GET_SETTINGS' });
    if (res?.success) {
      const s = res.settings;
      masterToggle.checked    = s.enabled || false;
      particlesToggle.checked = s.particlesEnabled !== false;
      
      const iMap = { light: 1, medium: 2, full: 3 };
      intensityRange.value = iMap[s.intensity] || 3;

      themeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === s.theme);
      });

      await updateWhitelistButton(s.whitelist);
    }
  } catch (e) {
    console.error('Popup init error:', e);
  }

  // ── Listeners ──────────────────────────────────────────────
  masterToggle.onchange = save;
  particlesToggle.onchange = save;
  intensityRange.oninput = save;

  themeBtns.forEach(btn => {
    btn.onclick = () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      save();
    };
  });

  whitelistBtn.onclick = async () => {
    const tabs = await queryTabs({ active: true, currentWindow: true });
    if (tabs[0]?.url) {
      const url = new URL(tabs[0].url);
      const host = url.hostname;
      const res = await msg({ type: 'TOGGLE_WHITELIST', hostname: host });
      if (res?.success) {
        await updateWhitelistButton(res.whitelist);
        // No need to call save() separately, TOGGLE_WHITELIST handles broadcast
      }
    }
  };

  // ── Core Functions ─────────────────────────────────────────
  async function save() {
    const iMapRev = { '1': 'light', '2': 'medium', '3': 'full' };
    const activeTheme = document.querySelector('.theme-btn.active')?.dataset.theme || 'cyberpunk';
    
    const settings = {
      enabled:          masterToggle.checked,
      theme:            activeTheme,
      intensity:        iMapRev[intensityRange.value] || 'full',
      particlesEnabled: particlesToggle.checked
    };

    // Corrected message type: UPDATE_SETTINGS matches background.js
    await msg({ type: 'UPDATE_SETTINGS', settings });
  }

  async function updateWhitelistButton(currentWhitelist) {
    const tabs = await queryTabs({ active: true, currentWindow: true });
    if (!tabs[0]?.url) return;
    const host = new URL(tabs[0].url).hostname;
    const isWhitelisted = Array.isArray(currentWhitelist) && currentWhitelist.includes(host);
    
    whitelistBtn.textContent = isWhitelisted ? '▶ RESUME ON THIS SITE' : '🚫 WHITELIST THIS SITE';
    whitelistBtn.classList.toggle('whitelisted', isWhitelisted);
  }

  // ── Helpers ────────────────────────────────────────────────
  function msg(m) {
    return new Promise((res, rej) => {
      chrome.runtime.sendMessage(m, r => {
        if (chrome.runtime.lastError) rej(new Error(chrome.runtime.lastError.message));
        else res(r);
      });
    });
  }
  function queryTabs(q) {
    return new Promise(res => chrome.tabs.query(q, res));
  }
});

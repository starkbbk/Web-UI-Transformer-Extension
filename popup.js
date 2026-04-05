/**
 * WebTransformer Pro — Popup Controller v5.0
 * Vibrant Ambient Edition
 */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const masterToggle    = document.getElementById('master-toggle');
  const particlesToggle = document.getElementById('particles-toggle');
  const intensityRange  = document.getElementById('intensity');
  const themeBtns       = document.querySelectorAll('.theme-btn');
  const whitelistBtn    = document.getElementById('whitelist-btn');

  // Load current settings
  const res = await sendMessage({ type: 'GET_SETTINGS' });
  if (res?.success) {
    const s = res.settings;
    masterToggle.checked    = s.enabled;
    particlesToggle.checked = s.particlesEnabled;
    
    // Intensity mapping: light=1, medium=2, full=3
    const iMap = { light: 1, medium: 2, full: 3 };
    intensityRange.value = iMap[s.intensity] || 3;

    // Active theme UI
    themeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === s.theme);
    });

    // Whitelist button state
    await updateWhitelistButton();
  }

  // Listeners
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
    if (tabs[0]) {
      const url = new URL(tabs[0].url);
      await sendMessage({ type: 'TOGGLE_WHITELIST', hostname: url.hostname });
      await updateWhitelistButton();
      await save(); // Sync changes
    }
  };

  async function save() {
    const iMapRev = { '1': 'light', '2': 'medium', '3': 'full' };
    const activeTheme = document.querySelector('.theme-btn.active')?.dataset.theme || 'cyberpunk';
    
    const settings = {
      enabled: masterToggle.checked,
      theme: activeTheme,
      intensity: iMapRev[intensityRange.value] || 'full',
      particlesEnabled: particlesToggle.checked
    };

    await sendMessage({ type: 'UPDATE_SETTINGS', settings });
    // Feedback: UI pulse
    masterToggle.parentElement.classList.add('pulse');
    setTimeout(() => masterToggle.parentElement.classList.remove('pulse'), 400);
  }

  async function updateWhitelistButton() {
    const tabs = await queryTabs({ active: true, currentWindow: true });
    if (!tabs[0]) return;
    const url = new URL(tabs[0].url);
    const res = await sendMessage({ type: 'GET_SETTINGS' });
    const isWhitelisted = res.settings.whitelist.includes(url.hostname);
    
    whitelistBtn.textContent = isWhitelisted ? '▶ RESUME ON THIS SITE' : '🚫 WHITELIST THIS SITE';
    whitelistBtn.classList.toggle('whitelisted', isWhitelisted);
  }

  // Helpers
  function sendMessage(m) {
    return new Promise((res, rej) => {
      chrome.runtime.sendMessage(m, r => {
        chrome.runtime.lastError ? rej(new Error(chrome.runtime.lastError.message)) : res(r);
      });
    });
  }
  function queryTabs(q) {
    return new Promise(res => chrome.tabs.query(q, res));
  }
});

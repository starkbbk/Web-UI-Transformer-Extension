/**
 * WebTransformer Pro — Background Service Worker v5.1
 * Centralized settings management and cross-tab communication.
 */
'use strict';

const DEFAULT_SETTINGS = {
  enabled: true,         // Default to enabled for wow factor
  theme: 'cyberpunk',
  intensity: 'full',
  whitelist: [],
  particlesEnabled: true,
  version: '5.1'
};

// ── Install / Startup ──────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (d) => {
  if (d.reason === 'install') {
    await chrome.storage.local.set({ wtp_settings: DEFAULT_SETTINGS });
  } else {
    const s = await chrome.storage.local.get('wtp_settings');
    await chrome.storage.local.set({ wtp_settings: { ...DEFAULT_SETTINGS, ...s.wtp_settings } });
  }
});

// ── Message Dispatcher ─────────────────────────────────────
chrome.runtime.onMessage.addListener((m, s, res) => {
  handleMessage(m, s, res);
  return true; // async
});

async function handleMessage(m, s, res) {
  try {
    const data = await chrome.storage.local.get('wtp_settings');
    const settings = data.wtp_settings || DEFAULT_SETTINGS;

    switch (m.type) {
      case 'GET_SETTINGS':
        res({ success: true, settings });
        break;

      case 'UPDATE_SETTINGS':
        const updated = { ...settings, ...m.settings };
        await chrome.storage.local.set({ wtp_settings: updated });
        broadcast({ type: 'SETTINGS_UPDATED', settings: updated });
        res({ success: true });
        break;

      case 'TOGGLE_WHITELIST':
        if (settings.whitelist.includes(m.hostname)) {
          settings.whitelist = settings.whitelist.filter(h => h !== m.hostname);
        } else {
          settings.whitelist.push(m.hostname);
        }
        await chrome.storage.local.set({ wtp_settings: settings });
        broadcast({ type: 'SETTINGS_UPDATED', settings });
        res({ success: true, whitelist: settings.whitelist });
        break;

      default:
        res({ success: false, error: 'Unknown message' });
    }
  } catch (e) {
    res({ success: false, error: e.message });
  }
}

// ── Broadcast to All Tabs ──────────────────────────────────
async function broadcast(m) {
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    if (tab.url?.startsWith('http')) {
      chrome.tabs.sendMessage(tab.id, m).catch(() => {});
    }
  });
}

// ── Re-apply on Navigation ─────────────────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status === 'complete' && tab.url?.startsWith('http')) {
    const data = await chrome.storage.local.get('wtp_settings');
    const settings = data.wtp_settings || DEFAULT_SETTINGS;
    chrome.tabs.sendMessage(tabId, { type: 'SETTINGS_UPDATED', settings }).catch(() => {});
  }
});

/**
 * WebTransformer Pro - Background Service Worker
 * Handles cross-tab communication, settings persistence,
 * and tab-specific state management.
 */

// ─── Default Settings ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  enabled: false,
  theme: 'cyberpunk',
  intensity: 'full',
  whitelist: [],
  particlesEnabled: true,
  animationsEnabled: true,
  version: '1.0.0'
};

// ─── Install / Startup ────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set defaults on fresh install
    await chrome.storage.local.set({ wtp_settings: DEFAULT_SETTINGS });
    console.log('[WebTransformer Pro] Installed with default settings.');
  } else if (details.reason === 'update') {
    // Migrate existing settings, add any missing keys
    const existing = await chrome.storage.local.get('wtp_settings');
    const merged = { ...DEFAULT_SETTINGS, ...(existing.wtp_settings || {}) };
    await chrome.storage.local.set({ wtp_settings: merged });
    console.log('[WebTransformer Pro] Updated to', DEFAULT_SETTINGS.version);
  }
});

// ─── Message Handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  // Return true to indicate async response may follow
  return true;
});

/**
 * Central message dispatcher
 */
async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'GET_SETTINGS': {
        const data = await chrome.storage.local.get('wtp_settings');
        sendResponse({ success: true, settings: data.wtp_settings || DEFAULT_SETTINGS });
        break;
      }

      case 'SAVE_SETTINGS': {
        await chrome.storage.local.set({ wtp_settings: message.settings });
        // Broadcast to all matching tabs
        await broadcastToAllTabs({ type: 'SETTINGS_UPDATED', settings: message.settings });
        sendResponse({ success: true });
        break;
      }

      case 'TOGGLE_EXTENSION': {
        const data = await chrome.storage.local.get('wtp_settings');
        const settings = data.wtp_settings || DEFAULT_SETTINGS;
        settings.enabled = message.enabled;
        await chrome.storage.local.set({ wtp_settings: settings });
        await broadcastToAllTabs({ type: 'TOGGLE', enabled: message.enabled, settings });
        sendResponse({ success: true, enabled: settings.enabled });
        break;
      }

      case 'GET_TAB_URL': {
        // Return the URL of the active tab for whitelist checking
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        sendResponse({ success: true, url: tab?.url || '' });
        break;
      }

      case 'ADD_TO_WHITELIST': {
        const data = await chrome.storage.local.get('wtp_settings');
        const settings = data.wtp_settings || DEFAULT_SETTINGS;
        const hostname = new URL(message.url).hostname;
        if (!settings.whitelist.includes(hostname)) {
          settings.whitelist.push(hostname);
          await chrome.storage.local.set({ wtp_settings: settings });
        }
        sendResponse({ success: true, whitelist: settings.whitelist });
        break;
      }

      case 'REMOVE_FROM_WHITELIST': {
        const data = await chrome.storage.local.get('wtp_settings');
        const settings = data.wtp_settings || DEFAULT_SETTINGS;
        settings.whitelist = settings.whitelist.filter(h => h !== message.hostname);
        await chrome.storage.local.set({ wtp_settings: settings });
        sendResponse({ success: true, whitelist: settings.whitelist });
        break;
      }

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (err) {
    console.error('[WebTransformer Pro] Background error:', err);
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Broadcast a message to all active tabs
 */
async function broadcastToAllTabs(message) {
  try {
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    const promises = tabs.map(tab =>
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Tab may not have content script; silently ignore
      })
    );
    await Promise.allSettled(promises);
  } catch (err) {
    console.error('[WebTransformer Pro] Broadcast error:', err);
  }
}

// ─── Tab Updates ──────────────────────────────────────────────────────────────
// Re-apply theme when tab navigates (handles SPAs and full navigations)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    try {
      const data = await chrome.storage.local.get('wtp_settings');
      const settings = data.wtp_settings || DEFAULT_SETTINGS;
      if (settings.enabled) {
        await chrome.tabs.sendMessage(tabId, {
          type: 'SETTINGS_UPDATED',
          settings
        }).catch(() => {}); // content script may not be ready yet
      }
    } catch (err) {
      // Silently ignore errors for restricted tabs
    }
  }
});

console.log('[WebTransformer Pro] Service worker initialized.');

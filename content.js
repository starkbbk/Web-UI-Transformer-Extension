/**
 * WebTransformer Pro — Content Script v5.0
 * Vibrant Ambient Liquidmorphism: blobs, ripple, particles, and site-specific fixes
 */
'use strict';

const WTP = {
  settings: null,
  canvas: null,
  particles: [],
  animFrame: null,
  observer: null,
  toastTimer: null,
  active: false,
  blobs: [], // Array of blob element references
};

// ── Bootstrap ───────────────────────────────────────────────
(async function bootstrap() {
  try {
    const res = await sendMessage({ type: 'GET_SETTINGS' });
    if (res?.success) {
      WTP.settings = res.settings;
      applyState();
    }
  } catch (err) {}

  chrome.runtime.onMessage.addListener((m, sender, respond) => {
    if (m.type === 'TOGGLE' || m.type === 'SETTINGS_UPDATED') {
      WTP.settings = m.settings;
      applyState();
      respond({ ok: true });
    } else {
      respond({ ok: false });
    }
    return true;
  });
})();

// ── Core State Machine ──────────────────────────────────────
function applyState() {
  if (!WTP.settings) return;

  const { enabled, theme, intensity, whitelist, particlesEnabled } = WTP.settings;
  const host = location.hostname;
  const whitelisted = Array.isArray(whitelist) && whitelist.includes(host);

  if (enabled && !whitelisted) {
    activateTheme(theme, intensity, particlesEnabled);
  } else {
    deactivateTheme();
    if (whitelisted && enabled) {
      showToast('🚫', `${host} excluded – theme paused`);
    }
  }
}

// ── Activate Theme ──────────────────────────────────────────
function activateTheme(theme, intensity, particles) {
  const html = document.documentElement;
  const wasActive = html.getAttribute('data-wtp-active') === 'true';

  html.setAttribute('data-wtp-active', 'true');
  html.setAttribute('data-wtp-theme', theme || 'cyberpunk');
  html.setAttribute('data-wtp-intensity', intensity || 'full');

  injectFont();
  injectVibrantBlobs(); // Multi-blob injection for Ambient look
  
  if (particles) startParticles(); else stopParticles();
  
  startObserver();
  startLiquidRipple();
  
  // Site-specific transparency fixes (aggressive for LinkedIn/GitHub)
  runSiteFixes();

  if (!wasActive) {
    const labels = {
      cyberpunk: '🌌 Cyberpunk (Ambient)',
      matrix: '🔥 Matrix (Ambient)',
      ocean: '🌊 Ocean (Ambient)',
      sunset: '🌅 Sunset (Ambient)',
      neon: '⚡ Neon (Ambient)',
    };
    showToast('✨', `WebTransformer Pro — ${labels[theme] || 'Theme'} activated`);
  }
  WTP.active = true;
}

// ── Deactivate Theme ────────────────────────────────────────
function deactivateTheme() {
  const html = document.documentElement;
  html.removeAttribute('data-wtp-active');
  html.removeAttribute('data-wtp-theme');
  html.removeAttribute('data-wtp-intensity');

  stopParticles();
  stopObserver();
  removeVibrantBlobs();
  stopLiquidRipple();
  WTP.active = false;
}

// ── Vibrant Liquid Blobs Injection ──────────────────────────
function injectVibrantBlobs() {
  // Inject wtp-blob-3 and wtp-blob-4 (body::before/after are handled by CSS)
  ['wtp-blob-3', 'wtp-blob-4'].forEach(id => {
    if (document.getElementById(id)) return;
    const blob = document.createElement('div');
    blob.id = id;
    (document.body || document.documentElement).prepend(blob);
    WTP.blobs.push(blob);
  });
}

function removeVibrantBlobs() {
  WTP.blobs.forEach(b => b.remove());
  WTP.blobs = [];
}

// ── Site-Specific Fixes (Aggressive Transparency) ───────────
function runSiteFixes() {
  const host = location.hostname;
  
  const applyFix = () => {
    if (!WTP.active) return;
    
    let selectors = [];
    if (host.includes('linkedin.com')) {
      selectors = [
        '.application-outlet', '.authentication-outlet', '.scaffold-layout',
        '.scaffold-layout__inner', '.scaffold-layout__main', '.feed-outlet',
        '.core-rail', '#global-nav', '.global-nav__content', 
        '.scaffold-layout__row', '.scaffold-layout__content', '.scaffold-layout__sidebar',
        '.artdeco-card', '.feed-shared-update-v2', '.feed-shared-update-v2__control-menu',
        '.scaffold-layout-toolbar', '.scaffold-layout-container'
      ];
    } else if (host.includes('github.com')) {
      selectors = [
        '.application-main', '.Layout-main', '.Layout-sidebar', 
        '.Box-body', '.Header-old', '.AppHeader-globalBar-start',
        '.gh-header-shadow'
      ];
    } else if (host.includes('youtube.com')) {
      selectors = [
        'ytd-app', 'ytd-page-manager', 'ytd-rich-grid-renderer',
        'ytd-masthead', 'ytd-watch-flexy', '#contentContainer'
      ];
    }

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty('background-color', 'transparent', 'important');
        el.style.setProperty('background-image', 'none', 'important');
        el.style.setProperty('background', 'transparent', 'important');
      });
    });
    
    // Repeat for dynamic content
    if (WTP.active) setTimeout(applyFix, 3000);
  };

  applyFix();
}

// ── Google Font ─────────────────────────────────────────────
function injectFont() {
  if (document.getElementById('wtp-font')) return;
  const link = document.createElement('link');
  link.id = 'wtp-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
  (document.head || document.documentElement).appendChild(link);
}

// ── MutationObserver ────────────────────────────────────────
function startObserver() {
  if (WTP.observer) return;
  WTP.observer = new MutationObserver(() => {
    if (!WTP.settings?.enabled) return;
    const html = document.documentElement;
    if (html.getAttribute('data-wtp-active') !== 'true') {
      html.setAttribute('data-wtp-active', 'true');
      html.setAttribute('data-wtp-theme', WTP.settings.theme || 'cyberpunk');
      html.setAttribute('data-wtp-intensity', WTP.settings.intensity || 'full');
    }
  });
  WTP.observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-wtp-active', 'data-wtp-theme', 'data-wtp-intensity'],
  });
}

function stopObserver() {
  if (WTP.observer) {
    WTP.observer.disconnect();
    WTP.observer = null;
  }
}

// ── Liquid Interaction Ripple ──────────────────────────────
let rippleHandler = null;
function startLiquidRipple() {
  if (rippleHandler) return;
  rippleHandler = (e) => {
    if (!WTP.active) return;
    
    const target = e.target.closest('button, [role="button"], a, input, [class*="card"], [class*="btn"]');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 3;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'wtp-ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // Ensure relative positioning
    const pos = getComputedStyle(target).position;
    if (pos === 'static') target.style.position = 'relative';
    target.style.overflow = 'hidden';

    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  };
  document.addEventListener('mousedown', rippleHandler, true);
}

function stopLiquidRipple() {
  if (rippleHandler) {
    document.removeEventListener('mousedown', rippleHandler, true);
    rippleHandler = null;
  }
}

// ── Particle System ─────────────────────────────────────────
function startParticles() {
  if (WTP.canvas) return;
  const go = () => {
    if (!document.body) { requestAnimationFrame(go); return; }
    const c = document.createElement('canvas');
    c.id = 'wtp-particle-canvas';
    document.body.appendChild(c);
    WTP.canvas = c;
    resize(); spawn(); render();
    window.addEventListener('resize', onResize);
  };
  go();
}

function stopParticles() {
  if (WTP.animFrame) cancelAnimationFrame(WTP.animFrame);
  if (WTP.canvas) WTP.canvas.remove();
  WTP.canvas = null; WTP.particles = [];
  window.removeEventListener('resize', onResize);
}

function onResize() { resize(); spawn(); }
function resize() {
  if (!WTP.canvas) return;
  WTP.canvas.width = window.innerWidth;
  WTP.canvas.height = window.innerHeight;
}

function spawn() {
  const W = window.innerWidth, H = window.innerHeight;
  const n = Math.min(Math.floor((W * H) / 12000), 110);
  WTP.particles = Array.from({ length: n }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 1.6 + 0.4, o: Math.random() * 0.5 + 0.1,
    vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
    ph: Math.random() * Math.PI * 2,
  }));
}

function getColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--part').trim() || '#8b5cf6';
}

function render() {
  if (!WTP.canvas) return;
  const ctx = WTP.canvas.getContext('2d');
  const W = WTP.canvas.width, H = WTP.canvas.height;
  const color = getColor();
  ctx.clearRect(0, 0, W, H);
  
  WTP.particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.ph += 0.012;
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    const a = p.o * (0.5 + 0.5 * Math.sin(p.ph));
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = rgba(color, a); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = rgba(color, a * 0.1); ctx.fill();
  });

  const MD = 110;
  for (let i = 0; i < WTP.particles.length; i++) {
    const a = WTP.particles[i];
    for (let j = i + 1; j < WTP.particles.length; j++) {
      const b = WTP.particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      if (Math.abs(dx) > MD || Math.abs(dy) > MD) continue;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < MD) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = rgba(color, (1 - d / MD) * 0.07); ctx.lineWidth = 0.5; ctx.stroke();
      }
    }
  }
  WTP.animFrame = requestAnimationFrame(render);
}

// ── Toast System ────────────────────────────────────────────
function showToast(icon, text) {
  document.getElementById('wtp-toast')?.remove();
  const t = document.createElement('div');
  t.id = 'wtp-toast';
  t.innerHTML = `<span class="wtp-toast-icon">${icon}</span><span>${esc(text)}</span>`;
  (document.body || document.documentElement).appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('wtp-toast-visible')));
  clearTimeout(WTP.toastTimer);
  WTP.toastTimer = setTimeout(() => {
    t.classList.remove('wtp-toast-visible');
    setTimeout(() => t.remove(), 500);
  }, 3500);
}

// ── Utilities ────────────────────────────────────────────────
function sendMessage(m) {
  return new Promise((res, rej) => {
    try {
      chrome.runtime.sendMessage(m, r => {
        chrome.runtime.lastError ? rej(new Error(chrome.runtime.lastError.message)) : res(r);
      });
    } catch (e) { rej(e); }
  });
}

function rgba(hex, a) {
  const h = hex.replace('#', '');
  let r, g, b;
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6) {
    r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
  } else return `rgba(139, 92, 246, ${a.toFixed(3)})`;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(139, 92, 246, ${a.toFixed(3)})`;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

function esc(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

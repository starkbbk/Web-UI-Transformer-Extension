/**
 * WebTransformer Pro — Content Script v10.0
 * PURE WATER LIQUID: NO COLORS, NO GLOWS, HEAVY REFRACTION
 */
'use strict';

const WTP = {
  settings: null, canvas: null, particles: [], animFrame: null,
  observer: null, toastTimer: null, active: false,
  mouseH: null,
};

(async function bootstrap() {
  try {
    const res = await sendMessage({ type: 'GET_SETTINGS' });
    if (res?.success) { WTP.settings = res.settings; applyState(); }
  } catch (err) {}
  chrome.runtime.onMessage.addListener((m, s, res) => {
    if (m.type === 'SETTINGS_UPDATED') { WTP.settings = m.settings; applyState(); if(res) res({ ok: true }); }
    return true;
  });
})();

function applyState() {
  if (!WTP.settings) return;
  const whitelisted = Array.isArray(WTP.settings.whitelist) && WTP.settings.whitelist.includes(location.hostname);
  if (WTP.settings.enabled && !whitelisted) activate();
  else deactivate();
}

function activate() {
  const h = document.documentElement;
  const wasActive = h.getAttribute('data-wtp-active') === 'true';
  h.setAttribute('data-wtp-active', 'true');
  h.setAttribute('data-wtp-theme', WTP.settings.theme || 'cyberpunk');
  h.setAttribute('data-wtp-intensity', WTP.settings.intensity || 'full');

  injectV10Logic();
  startInteractiveLensing();
  if (WTP.settings.particlesEnabled) startParticles(); else stopParticles();
  
  startObserver();
  startLiquidRipple();
  
  // NUCLEAR UNIVERSAL GLASS v10.0 (The Pure Water Reveal)
  runPureWaterCleanup();

  if (!wasActive) showToast('💧', 'Pure Water Liquid v10.0 Active');
  WTP.active = true;
}

function deactivate() {
  const h = document.documentElement;
  h.removeAttribute('data-wtp-active');
  h.removeAttribute('data-wtp-theme');
  h.removeAttribute('data-wtp-intensity');
  stopParticles(); stopObserver(); removeLogic(); stopLiquidRipple();
  stopInteractiveLensing();
  WTP.active = false;
}

// ── Nuclear Pure Water Cleanup v10.0 ────────────────────────
function runPureWaterCleanup() {
  if (!WTP.active) return;
  
  // As requested: "make every div or component this transparent fully"
  // focusing on extreme layout clearing for LinkedIn, YouTube, and GitHub.
  const layouts = [
    'ytd-app', 'ytd-page-manager', 'ytd-browse', 'ytd-rich-grid-renderer', '#page-manager',
    'ytd-feed-nudge-renderer', '#content-wrapper.ytd-feed-nudge-renderer',
    '.scaffold-layout', '.scaffold-layout__inner', '.application-outlet', '.authentication-outlet',
    '.Layout-main', '.application-main', '#root', '#app', '#__next', 
    'body > div:not([id*="wtp"])', 'main', 'section:not([class*="card"])',
    'header:not([class*="card"])', 'footer:not([class*="card"])', 'nav:not([class*="card"])',
    'ytd-masthead', '#header', '#footer', '.global-nav', '.feed-shared-update-v2', '.mb-4',
    '.scaffold-layout__aside', '.scaffold-layout__main'
  ];

  document.documentElement.style.setProperty('background', '#000000', 'important');
  document.body.style.setProperty('background', 'transparent', 'important');

  layouts.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.style.backgroundColor !== 'transparent') {
        el.style.setProperty('background-color', 'transparent', 'important');
        el.style.setProperty('background-image', 'none', 'important');
        el.style.setProperty('border', 'none', 'important');
      }
    });
  });

  // Inject Library Outer-Rim if missing to define the glass shape
  document.querySelectorAll('[class~="card"], [class*="-card"], [class*="card-"], ytd-rich-grid-media, article').forEach(card => {
    if (!card.querySelector('.wtp-outer-rim')) {
      const rim = document.createElement('div');
      rim.className = 'wtp-outer-rim';
      card.prepend(rim);
    }
  });

  setTimeout(runPureWaterCleanup, 2000);
}

// ── Interactive Lensing (v10.0) ─────────────────────────────
function startInteractiveLensing() {
  if (WTP.mouseH) return;
  WTP.mouseH = (e) => {
    if (!WTP.active) return;
    const h = document.documentElement;
    h.style.setProperty('--wtp-mouse-x', `${e.clientX}px`);
    h.style.setProperty('--wtp-mouse-y', `${e.clientY}px`);
  };
  document.addEventListener('mousemove', WTP.mouseH, { passive: true });
}

function stopInteractiveLensing() {
  if (WTP.mouseH) { document.removeEventListener('mousemove', WTP.mouseH); WTP.mouseH = null; }
}

// ── Library-Perfect v10.0 Filters (CLEAR) ───────────────────
function injectV10Logic() {
  // 1. High-Fidelity Pure Refraction Filter (No Chromatic Aberration)
  if (!document.getElementById('wtp-filters-v10')) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = 'wtp-filters-v10';
    svg.style.cssText = 'position:absolute; width:0; height:0; visibility:hidden; pointer-events:none;';
    svg.innerHTML = `
      <defs>
        <filter id="wtp-liquid-filter-v10" filterUnits="objectBoundingBox" x="-20%" y="-20%" width="140%" height="140%">
          <!-- Phase 1: Stronger Pure Displacement (The Water Warp) -->
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="45" xChannelSelector="R" yChannelSelector="G" result="liquid" />
          
          <!-- Phase 2: Sharpening & Natural Compositing (NO RGB SHIFTS) -->
          <feGaussianBlur in="liquid" stdDeviation="0.4" result="blurred" />
          <feComposite in="blurred" in2="SourceGraphic" operator="over" />
        </filter>
      </defs>
    `;
    (document.body || document.documentElement).appendChild(svg);
  }
}

function removeLogic() {
  document.getElementById('wtp-filters-v10')?.remove();
  document.querySelectorAll('.wtp-outer-rim').forEach(r => r.remove());
  document.querySelectorAll('[id*="wtp-blob"]').forEach(b => b.remove());
}

function startObserver() {
  if (WTP.observer) return;
  WTP.observer = new MutationObserver(() => {
    if (!WTP.settings?.enabled) return;
    const h = document.documentElement;
    if (h.getAttribute('data-wtp-active') !== 'true') h.setAttribute('data-wtp-active', 'true');
  });
  WTP.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-wtp-active'] });
}

function stopObserver() { if (WTP.observer) { WTP.observer.disconnect(); WTP.observer = null; } }

function startLiquidRipple() {
  if (WTP.ripH) return;
  WTP.ripH = (e) => {
    const t = e.target.closest('button, a, [role="button"], .btn');
    if (!t) return;
    const r = t.getBoundingClientRect();
    const s = Math.max(r.width, r.height) * 3;
    const rip = document.createElement('span');
    rip.className = 'wtp-ripple';
    rip.style.width = rip.style.height = `${s}px`;
    rip.style.left = `${e.clientX - r.left - s/2}px`;
    rip.style.top = `${e.clientY - r.top - s/2}px`;
    if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
    t.style.overflow = 'hidden';
    t.appendChild(rip);
    rip.addEventListener('animationend', () => rip.remove());
  };
  document.addEventListener('mousedown', WTP.ripH, true);
}

function stopLiquidRipple() { if (WTP.ripH) { document.removeEventListener('mousedown', WTP.ripH, true); WTP.ripH = null; } }

function startParticles() {
  if (WTP.canvas) return;
  const init = () => {
    if (!document.body) { requestAnimationFrame(init); return; }
    const c = document.createElement('canvas');
    c.id = 'wtp-particle-canvas';
    document.body.appendChild(c);
    WTP.canvas = c;
    resize(); spawn(); render();
    window.addEventListener('resize', resize);
  };
  init();
}

function stopParticles() {
  if (WTP.animFrame) cancelAnimationFrame(WTP.animFrame);
  if (WTP.canvas) WTP.canvas.remove();
  WTP.canvas = null; WTP.particles = [];
}

function resize() { if (WTP.canvas) { WTP.canvas.width = window.innerWidth; WTP.canvas.height = window.innerHeight; spawn(); } }
function spawn() {
  const W=window.innerWidth, H=window.innerHeight;
  const n=Math.min(Math.floor((W*H)/22000), 25);
  WTP.particles = Array.from({length:n}, () => ({
    x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.5+0.5, o:Math.random()*0.3+0.05,
    vx:(Math.random()-0.5)*0.06, vy:(Math.random()-0.5)*0.06, ph:Math.random()*Math.PI*2
  }));
}
function render() {
  if (!WTP.canvas) return;
  const ctx = WTP.canvas.getContext('2d');
  const W = WTP.canvas.width, H = WTP.canvas.height;
  ctx.clearRect(0,0,W,H);
  WTP.particles.forEach(p => {
    p.x+=p.vx; p.y+=p.vy; p.ph+=0.005;
    if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
    const a = p.o * (0.5 + 0.5 * Math.sin(p.ph));
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`; ctx.fill();
  });
  WTP.animFrame = requestAnimationFrame(render);
}

function showToast(icon, text) {
  document.getElementById('wtp-toast')?.remove();
  const t = document.createElement('div'); t.id = 'wtp-toast';
  t.innerHTML = `<span class="wtp-toast-icon">${icon}</span><span>${text}</span>`;
  (document.body || document.documentElement).appendChild(t);
  setTimeout(() => t.classList.add('wtp-toast-visible'), 100);
  setTimeout(() => { t.classList.remove('wtp-toast-visible'); setTimeout(() => t.remove(), 500); }, 3500);
}

function sendMessage(m) { return new Promise((res, rej) => chrome.runtime.sendMessage(m, r => chrome.runtime.lastError ? rej() : res(r))); }

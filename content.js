/**
 * WebTransformer Pro — Content Script v9.0
 * PURE LIQUID GLASS (Library-Exact) — Universal Transparency
 */
'use strict';

const WTP = {
  settings: null, canvas: null, particles: [], animFrame: null,
  observer: null, toastTimer: null, active: false, blobs: [],
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

  injectV9Library();
  if (WTP.settings.particlesEnabled) startParticles(); else stopParticles();
  
  startObserver();
  startLiquidRipple();
  
  // NUCLEAR GLASS v9 (Universal Transparency)
  runUniversalGlassFix();

  if (!wasActive) showToast('🧊', 'Pure Liquid v9.0 Initialized');
  WTP.active = true;
}

function deactivate() {
  const h = document.documentElement;
  h.removeAttribute('data-wtp-active');
  h.removeAttribute('data-wtp-theme');
  h.removeAttribute('data-wtp-intensity');
  stopParticles(); stopObserver(); removeBlobs(); stopLiquidRipple();
  WTP.active = false;
}

// ── Nuclear Universal Glass v9 ──────────────────────────────
function runUniversalGlassFix() {
  if (!WTP.active) return;
  
  // Nuclear clear list – reveal the ambient glow at all costs
  const kills = [
    'ytd-app', 'ytd-page-manager', 'ytd-browse', 'ytd-rich-grid-renderer', '#page-manager',
    'ytd-feed-nudge-renderer', '#content-wrapper.ytd-feed-nudge-renderer',
    '.scaffold-layout', '.scaffold-layout__inner', '.application-outlet', '.authentication-outlet',
    '.Layout-main', '.application-main', '#root', '#app', '#__next', 
    'body > div:not([id*="wtp"])', 'main', 'section:not([class*="card"])',
    'header:not([class*="card"])', 'footer:not([class*="card"])', 'nav:not([class*="card"])'
  ];

  document.documentElement.style.setProperty('background', '#000000', 'important');
  document.body.style.setProperty('background', 'transparent', 'important');

  kills.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.style.backgroundColor !== 'transparent') {
        el.style.setProperty('background-color', 'transparent', 'important');
        el.style.setProperty('background-image', 'none', 'important');
      }
    });
  });

  // Force all 'cards' to pick up the 32px library rounding and optics
  document.querySelectorAll('[class~="card"], [class*="-card"], [class*="card-"], ytd-rich-grid-media, article').forEach(card => {
     if (getComputedStyle(card).backgroundColor !== 'transparent') {
        card.style.setProperty('background-color', 'rgba(255, 255, 255, 0.05)', 'important');
     }
  });

  setTimeout(runUniversalGlassFix, 2000);
}

function injectV9Library() {
  ['wtp-blob-3', 'wtp-blob-4'].forEach(id => {
    if (document.getElementById(id)) return;
    const b = document.createElement('div');
    b.id = id;
    (document.body || document.documentElement).prepend(b);
    WTP.blobs.push(b);
  });
}

function removeBlobs() { WTP.blobs.forEach(b => b.remove()); WTP.blobs = []; }

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
  const n=Math.min(Math.floor((W*H)/20000), 40);
  WTP.particles = Array.from({length:n}, () => ({
    x:Math.random()*W, y:Math.random()*H, r:Math.random()*2+1.5, o:Math.random()*0.4+0.15,
    vx:(Math.random()-0.5)*0.08, vy:(Math.random()-0.5)*0.08, ph:Math.random()*Math.PI*2
  }));
}
function render() {
  if (!WTP.canvas) return;
  const ctx = WTP.canvas.getContext('2d');
  const W = WTP.canvas.width, H = WTP.canvas.height;
  const col = getComputedStyle(document.documentElement).getPropertyValue('--a1').trim() || '#facc15';
  ctx.clearRect(0,0,W,H);
  WTP.particles.forEach(p => {
    p.x+=p.vx; p.y+=p.vy; p.ph+=0.006;
    if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
    const a = p.o * (0.5 + 0.5 * Math.sin(p.ph));
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = rgba(col, a); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r*7, 0, Math.PI*2);
    ctx.fillStyle = rgba(col, a*0.1); ctx.fill();
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
function rgba(h, a) {
  const c = h.replace('#','');
  let r=250, g=204, b=21;
  if(c.length===3){ r=parseInt(c[0]+c[0],16); g=parseInt(c[1]+c[1],16); b=parseInt(c[2]+c[2],16); }
  else if(c.length===6){ r=parseInt(c.slice(0,2),16); g=parseInt(c.slice(2,4),16); b=parseInt(c.slice(4,6),16); }
  return `rgba(${r},${g},${b},${a})`;
}

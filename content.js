/**
 * WebTransformer Pro — Content Script v4.0
 * Liquidmorphism: blob inject, touch ripple, particle field
 */
'use strict';

const WTP = {
  settings:null, canvas:null, particles:[], animFrame:null,
  observer:null, toastTimer:null, active:false, blobEl:null,
};

// ── Bootstrap ───────────────────────────────────────────────
(async function(){
  try {
    const r = await msg({type:'GET_SETTINGS'});
    if(r?.success){WTP.settings=r.settings; apply();}
  } catch(e){}
  chrome.runtime.onMessage.addListener((m,_,cb)=>{
    if(m.type==='TOGGLE'||m.type==='SETTINGS_UPDATED'){
      WTP.settings=m.settings; apply(); cb({ok:true});
    } else cb({ok:false});
    return true;
  });
})();

// ── Apply / Remove ──────────────────────────────────────────
function apply(){
  if(!WTP.settings)return;
  const{enabled,theme,intensity,whitelist,particlesEnabled}=WTP.settings;
  const host=location.hostname;
  const wl=Array.isArray(whitelist)&&whitelist.includes(host);
  if(enabled&&!wl){
    activate(theme,intensity,particlesEnabled);
  }else{
    deactivate();
    if(wl&&enabled) toast('🚫',`${host} excluded – theme paused`);
  }
}

function activate(theme,intensity,particles){
  const html=document.documentElement;
  const was=html.getAttribute('data-wtp-active')==='true';
  html.setAttribute('data-wtp-active','true');
  html.setAttribute('data-wtp-theme',theme||'cyberpunk');
  html.setAttribute('data-wtp-intensity',intensity||'full');
  injectFont();
  injectBlob();
  if(particles)startParticles(); else stopParticles();
  startObserver();
  startRipple();
  // LinkedIn deep fix
  fixLinkedIn();
  if(!was){
    const L={cyberpunk:'🌌 Cyberpunk',matrix:'🔥 Matrix',ocean:'🌊 Ocean',sunset:'🌅 Sunset',neon:'⚡ Neon'};
    toast('✨',`WebTransformer Pro — ${L[theme]||'Theme'} activated`);
  }
  WTP.active=true;
}

function deactivate(){
  const html=document.documentElement;
  html.removeAttribute('data-wtp-active');
  html.removeAttribute('data-wtp-theme');
  html.removeAttribute('data-wtp-intensity');
  stopParticles(); stopObserver(); removeBlob(); stopRipple();
  WTP.active=false;
}

// ── LinkedIn Deep Fix ───────────────────────────────────────
function fixLinkedIn(){
  if(!location.hostname.includes('linkedin.com'))return;
  // Force-clear backgrounds on deeply nested LinkedIn wrappers
  const kill=[
    '.scaffold-layout','.scaffold-layout__inner','.scaffold-layout__main',
    '.scaffold-layout__content','.scaffold-layout__sidebar','.scaffold-layout__row',
    '.scaffold-layout-container','.scaffold-finite-scroll',
    '.authentication-outlet','.application-outlet',
    '.feed-sort-header','.share-box-feed-entry__wrapper',
    '.scaffold-layout-toolbar','.artdeco-page',
    '.scaffold-layout__detail','.body--is-ready',
    '.feed-outlet','.core-rail',
    // Nested background layers
    'main.scaffold-layout__main','div.scaffold-layout__content--list',
  ];
  requestAnimationFrame(()=>{
    kill.forEach(sel=>{
      document.querySelectorAll(sel).forEach(el=>{
        el.style.setProperty('background-color','transparent','important');
        el.style.setProperty('background-image','none','important');
        el.style.setProperty('background','transparent','important');
      });
    });
  });
  // Re-run after LinkedIn SPA updates
  setTimeout(fixLinkedIn, 3000);
}

// ── Third Blob Element ──────────────────────────────────────
function injectBlob(){
  if(document.getElementById('wtp-blob-3'))return;
  const waitBody=()=>{
    if(!document.body){requestAnimationFrame(waitBody);return;}
    const b=document.createElement('div');
    b.id='wtp-blob-3';
    document.body.prepend(b);
    WTP.blobEl=b;
  };
  waitBody();
}
function removeBlob(){
  document.getElementById('wtp-blob-3')?.remove();
  WTP.blobEl=null;
}

// ── Google Font ─────────────────────────────────────────────
function injectFont(){
  if(document.getElementById('wtp-font'))return;
  const l=document.createElement('link');
  l.id='wtp-font'; l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
  (document.head||document.documentElement).appendChild(l);
}

// ── MutationObserver ────────────────────────────────────────
function startObserver(){
  if(WTP.observer)return;
  WTP.observer=new MutationObserver(()=>{
    if(!WTP.settings?.enabled)return;
    const h=document.documentElement;
    if(h.getAttribute('data-wtp-active')!=='true'){
      h.setAttribute('data-wtp-active','true');
      h.setAttribute('data-wtp-theme',WTP.settings.theme||'cyberpunk');
      h.setAttribute('data-wtp-intensity',WTP.settings.intensity||'full');
    }
  });
  WTP.observer.observe(document.documentElement,{
    attributes:true,
    attributeFilter:['data-wtp-active','data-wtp-theme','data-wtp-intensity'],
  });
}
function stopObserver(){
  if(WTP.observer){WTP.observer.disconnect();WTP.observer=null;}
}

// ── Touch / Click Ripple ────────────────────────────────────
let rippleHandler=null;
function startRipple(){
  if(rippleHandler)return;
  rippleHandler=function(e){
    const el=e.target.closest('button,[role="button"],a,[class~="btn"],[class~="card"],input[type="submit"]');
    if(!el)return;
    const rect=el.getBoundingClientRect();
    const size=Math.max(rect.width,rect.height)*2.5;
    const x=e.clientX-rect.left-size/2;
    const y=e.clientY-rect.top-size/2;
    const r=document.createElement('span');
    r.className='wtp-ripple';
    r.style.cssText=`width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    // Need relative positioning on parent
    const pos=getComputedStyle(el).position;
    if(pos==='static')el.style.position='relative';
    el.style.overflow='hidden';
    el.appendChild(r);
    r.addEventListener('animationend',()=>r.remove());
  };
  document.addEventListener('mousedown',rippleHandler,true);
}
function stopRipple(){
  if(rippleHandler){
    document.removeEventListener('mousedown',rippleHandler,true);
    rippleHandler=null;
  }
}

// ── Particle System ─────────────────────────────────────────
function startParticles(){
  if(WTP.canvas)return;
  const go=()=>{
    if(!document.body){requestAnimationFrame(go);return;}
    const c=document.createElement('canvas');
    c.id='wtp-particle-canvas';
    document.body.appendChild(c);
    WTP.canvas=c;
    resize(); spawn(); render();
    window.addEventListener('resize',onResize);
  };
  go();
}
function stopParticles(){
  if(WTP.animFrame){cancelAnimationFrame(WTP.animFrame);WTP.animFrame=null;}
  if(WTP.canvas){WTP.canvas.remove();WTP.canvas=null;}
  WTP.particles=[];
  window.removeEventListener('resize',onResize);
}
function onResize(){resize();spawn();}
function resize(){
  if(!WTP.canvas)return;
  WTP.canvas.width=window.innerWidth;
  WTP.canvas.height=window.innerHeight;
}
function spawn(){
  const W=window.innerWidth,H=window.innerHeight;
  const n=Math.min(Math.floor((W*H)/10000),100);
  WTP.particles=Array.from({length:n},()=>({
    x:Math.random()*W, y:Math.random()*H,
    r:Math.random()*1.5+0.3, o:Math.random()*0.5+0.1,
    vx:(Math.random()-0.5)*0.2, vy:(Math.random()-0.5)*0.2,
    ph:Math.random()*Math.PI*2,
  }));
}
function getColor(){
  return getComputedStyle(document.documentElement).getPropertyValue('--part').trim()||'#7c3aed';
}
function render(){
  if(!WTP.canvas)return;
  const ctx=WTP.canvas.getContext('2d');
  const W=WTP.canvas.width,H=WTP.canvas.height;
  const c=getColor();
  ctx.clearRect(0,0,W,H);
  WTP.particles.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;p.ph+=0.015;
    if(p.x<0)p.x=W;if(p.x>W)p.x=0;
    if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    const a=p.o*(0.5+0.5*Math.sin(p.ph));
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle=rgba(c,a);ctx.fill();
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*3,0,Math.PI*2);
    ctx.fillStyle=rgba(c,a*.12);ctx.fill();
  });
  // Constellation lines
  const MD=105;
  for(let i=0;i<WTP.particles.length;i++){
    const a=WTP.particles[i];
    for(let j=i+1;j<WTP.particles.length;j++){
      const b=WTP.particles[j];
      const dx=a.x-b.x,dy=a.y-b.y;
      if(Math.abs(dx)>MD||Math.abs(dy)>MD)continue;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<MD){
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=rgba(c,(1-d/MD)*.08);ctx.lineWidth=0.4;ctx.stroke();
      }
    }
  }
  WTP.animFrame=requestAnimationFrame(render);
}

// ── Toast ───────────────────────────────────────────────────
function toast(icon,text){
  document.getElementById('wtp-toast')?.remove();
  const t=document.createElement('div');
  t.id='wtp-toast';
  t.innerHTML=`<span class="wtp-toast-icon">${icon}</span><span>${esc(text)}</span>`;
  (document.body||document.documentElement).appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('wtp-toast-visible')));
  clearTimeout(WTP.toastTimer);
  WTP.toastTimer=setTimeout(()=>{
    t.classList.remove('wtp-toast-visible');
    setTimeout(()=>t.remove(),400);
  },3200);
}

// ── Utils ───────────────────────────────────────────────────
function msg(m){return new Promise((res,rej)=>{try{chrome.runtime.sendMessage(m,r=>{chrome.runtime.lastError?rej(new Error(chrome.runtime.lastError.message)):res(r)})}catch(e){rej(e)}})}
function rgba(hex,a){
  const h=hex.replace('#','');let r,g,b;
  if(h.length===3){r=parseInt(h[0]+h[0],16);g=parseInt(h[1]+h[1],16);b=parseInt(h[2]+h[2],16)}
  else if(h.length===6){r=parseInt(h.slice(0,2),16);g=parseInt(h.slice(2,4),16);b=parseInt(h.slice(4,6),16)}
  else return`rgba(124,58,237,${a.toFixed(3)})`;
  if(isNaN(r)||isNaN(g)||isNaN(b))return`rgba(124,58,237,${a.toFixed(3)})`;
  return`rgba(${r},${g},${b},${a.toFixed(3)})`;
}
function esc(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

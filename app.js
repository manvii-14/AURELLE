(() => {
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d', { alpha: false });
  const body = document.body;
  const panel = document.getElementById('controlPanel');
  const toastEl = document.getElementById('toast');
  const audio = document.getElementById('audio');
  const audioFile = document.getElementById('audioFile');
  const state = {
    element: 'water', shape: 'orb', theme: 'midnight', mood: 'dreamy',
    gravity: 42, viscosity: 35, density: 56, elasticity: 74, attraction: 62, turbulence: 38, interaction: 'repel',
    orb: { x: innerWidth * .63, y: innerHeight * .49, vx: 0, vy: 0, r: Math.min(innerWidth, innerHeight) * .17 }, wells: [],
    frozen: false, audioOn: true, audioLevel: 0, audioCtx: null, analyser: null,
    frequencyData: null, objectUrl: null, time: 0, lastFrame: 0, width: innerWidth, height: innerHeight,
    mouse: { x: innerWidth * .62, y: innerHeight * .48, px: innerWidth * .62, py: innerHeight * .48, active: false, down: false, draggingOrb: false, draggingParticle: null, suppressClick: false },
    ripples: [], particles: [], toastTimer: null
  };
  const palettes = {
    water: { a: '#4aabef', b: '#9be8ef', c: '#6857c8', d: '#b4fff1', bg: '#08111e', lightBg: '#e7e7e3' },
    fire: { a: '#ff5d3d', b: '#ffb35e', c: '#b53d74', d: '#ffe7a3', bg: '#180b12', lightBg: '#ece3dc' },
    earth: { a: '#4e9867', b: '#c6d68c', c: '#b78358', d: '#e8d6a2', bg: '#09130f', lightBg: '#e6e8df' },
    air: { a: '#9885ff', b: '#b1e8ff', c: '#e6b2d8', d: '#f1eaff', bg: '#0d0c1b', lightBg: '#ebe7ef' }
  };
  const elementCopy = {
    fire: ['02 — FIRE', 'Volatile / bright / explosive'],
    water: ['01 — WATER', 'Fluid / adaptive / reflective'],
    earth: ['03 — EARTH', 'Dense / grounded / mineral'],
    air: ['04 — AIR', 'Weightless / ethereal / free']
  };
  const shapes = { orb: 'ORBITAL FORM 001', ring: 'ORBITAL SYSTEM 002', surface: 'INFINITE SURFACE 003', fragments: 'FRAGMENT FIELD 004' };
  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = innerWidth; state.height = innerHeight;
    canvas.width = Math.floor(innerWidth * dpr); canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeParticles();
  }
  function makeParticles() {
    const n = Math.round((state.width * state.height / 13500) * (.35 + state.density / 100));
    state.particles = Array.from({ length: clamp(n, 45, 185) }, () => ({
      x: rand(0, state.width), y: rand(0, state.height), ox: 0, oy: 0,
      vx: rand(-1.1, 1.1), vy: rand(-1.1, 1.1), r: rand(.7, 2.5), phase: rand(0, Math.PI * 2),
      orbit: rand(.2, 1.6), hue: Math.random()
    }));
  }
  function notify(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  function setElement(name) {
    state.element = name; body.dataset.element = name;
    document.querySelectorAll('.element-card').forEach(b => b.classList.toggle('active', b.dataset.element === name));
    const copy = elementCopy[name]; document.getElementById('elementLabel').textContent = copy[0];
    document.getElementById('elementSub').textContent = copy[1];
    document.getElementById('sceneIndex').textContent = String(['water','fire','earth','air'].indexOf(name) + 1).padStart(2, '0') + ' / 04';
    makeParticles(); addRipple(state.width * .58, state.height * .48, 1.4);
  }
  function setShape(name) {
    state.shape = name; body.dataset.shape = name;
    document.querySelectorAll('.shape-option').forEach(b => b.classList.toggle('active', b.dataset.shape === name));
    document.getElementById('shapeLabel').textContent = shapes[name];
    addRipple(state.width * .58, state.height * .48, 1.5);
  }
  function setTheme(name) {
    state.theme = name; body.dataset.theme = name;
    document.getElementById('themeName').textContent = name.toUpperCase();
    document.getElementById('themeToggle').setAttribute('aria-label', `Switch to ${name === 'midnight' ? 'Pearl' : 'Midnight'} theme`);
  }
  function openTab(tab) {
    panel.classList.add('open');
    document.querySelectorAll('.panel-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('hidden', c.id !== 'tab-' + tab));
    document.querySelectorAll('.dock-item[data-open]').forEach(b => b.classList.toggle('active', b.dataset.open === tab));
  }
  function addRipple(x, y, power = 1) { state.ripples.push({ x, y, r: 2, power, life: 1 }); if (state.ripples.length > 28) state.ripples.shift(); }
  function burst(x = state.mouse.x, y = state.mouse.y, power = 1) {
    state.particles.forEach(pt => { const dx = pt.x-x, dy = pt.y-y, d = Math.hypot(dx,dy)||1; if (d < 360) { const kick = (1-d/360) * (4 + power*8); pt.vx += dx/d*kick; pt.vy += dy/d*kick; } });
    addRipple(x,y,2.8*power); notify('Impact pulse released');
  }
  function setInteraction(mode) {
    state.interaction = mode;
    document.querySelectorAll('.mode-button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    const hints = { repel:'Push matter away with your cursor. Click for an impact pulse.', attract:'Draw particles toward your cursor like a magnetic field.', vortex:'Bend nearby particles into a spinning current.', grab:'Drag the glowing core or pull particles directly.' };
    const hint = document.getElementById('modeHint'); if (hint) hint.textContent = hints[mode];
    canvas.style.cursor = mode === 'grab' ? 'grab' : mode === 'attract' ? 'crosshair' : 'none';
  }
  function background() {
    const p = palettes[state.element];
    const bg = state.theme === 'midnight' ? p.bg : p.lightBg;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, state.width, state.height);
    const cx = state.width * .61 + (state.mouse.x - state.width * .5) * .035;
    const cy = state.height * .49 + (state.mouse.y - state.height * .5) * .035;
    const rad = Math.max(state.width, state.height) * .63;
    let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    const alpha = state.theme === 'midnight' ? .2 : .17;
    grad.addColorStop(0, p.a + hexAlpha(alpha + state.audioLevel * .16));
    grad.addColorStop(.34, p.c + hexAlpha(alpha * .45)); grad.addColorStop(1, bg);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, state.width, state.height);
  }
  function hexAlpha(a) { return Math.round(clamp(a, 0, 1) * 255).toString(16).padStart(2, '0'); }
  function drawParticles(dt) {
    const p = palettes[state.element], dark = state.theme === 'midnight';
    const frame = Math.min(2.2, dt * 60), radius = 90 + state.attraction * 2.8;
    // Lightweight particle-particle collisions transfer momentum between nearby bodies.
    if (!state.frozen) {
      for (let i = 0; i < state.particles.length; i++) for (let j = i + 1; j < state.particles.length; j++) {
        const a=state.particles[i], b=state.particles[j], dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy)||.001, minD=(a.r+b.r)*1.8;
        if(d<minD){ const nx=dx/d, ny=dy/d, overlap=(minD-d)*.5; a.x-=nx*overlap; a.y-=ny*overlap; b.x+=nx*overlap; b.y+=ny*overlap; const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny; if(rel<0){const impulse=-(1+state.elasticity/100)*rel*.5; a.vx-=impulse*nx; a.vy-=impulse*ny; b.vx+=impulse*nx; b.vy+=impulse*ny;} }
      }
    }
    state.particles.forEach((pt, i) => {
      const dx = state.mouse.x, dy = state.mouse.y - pt.y, dist = Math.hypot(dx,dy) + .001;
      const near = state.mouse.active ? Math.max(0, 1 - dist / radius) : 0;
      const phase = state.time * (.25 + pt.orbit * .25) + pt.phase;
      if (!state.frozen) {
        // Subtle field drift, plus actual force-based interaction.
        pt.vx += Math.cos(phase + pt.y * .003) * (.003 + state.turbulence * .00011);
        pt.vy += Math.sin(phase + pt.x * .002) * (.003 + state.turbulence * .00011);
        pt.vy += (state.gravity - 50) * .00042;
        if (near > 0) {
          const strength = near * (.035 + state.attraction * .0016);
          if (state.interaction === 'repel') { pt.vx -= dx/dist*strength*frame; pt.vy -= dy/dist*strength*frame; }
          else if (state.interaction === 'attract' || state.interaction === 'grab') { pt.vx += dx/dist*strength*frame; pt.vy += dy/dist*strength*frame; }
          else if (state.interaction === 'vortex') { pt.vx += (-dy/dist)*strength*1.8*frame; pt.vy += (dx/dist)*strength*1.8*frame; }
          if (state.mouse.down && state.interaction !== 'grab') { pt.vx -= dx/dist*strength*1.8*frame; pt.vy -= dy/dist*strength*1.8*frame; }
        }
        // A dragged core acts like a moving attractor and can fling matter when released.
        const ox = state.orb.x - pt.x, oy = state.orb.y - pt.y, od = Math.hypot(ox,oy)+.001;
        const orbReach = state.orb.r * 2.2;
        if (od < orbReach) { const influence = (1-od/orbReach) * (.012 + state.attraction*.00035); pt.vx += ox/od*influence*frame; pt.vy += oy/od*influence*frame; if (od < state.orb.r*.72) { pt.vx -= ox/od*(.025+state.elasticity*.0007)*frame; pt.vy -= oy/od*(.025+state.elasticity*.0007)*frame; } }
        // Placed gravity wells pull the surrounding matter inward.
        state.wells.forEach(w => { const wx=w.x-pt.x, wy=w.y-pt.y, wd=Math.hypot(wx,wy)+.001; if(wd<300){const f=(1-wd/300)*w.power*.018;pt.vx+=wx/wd*f*frame;pt.vy+=wy/wd*f*frame;} });
        const drag = .996 - state.viscosity * .000072;
        pt.vx *= drag; pt.vy *= drag;
        const speed = Math.hypot(pt.vx,pt.vy); if(speed>8){pt.vx=pt.vx/speed*8;pt.vy=pt.vy/speed*8;}
        pt.x += pt.vx*frame; pt.y += pt.vy*frame;
        // Elastic wall collisions make the simulation feel tangible.
        const bounce = .35 + state.elasticity*.006;
        if(pt.x<2){pt.x=2;pt.vx=Math.abs(pt.vx)*bounce;} if(pt.x>state.width-2){pt.x=state.width-2;pt.vx=-Math.abs(pt.vx)*bounce;}
        if(pt.y<2){pt.y=2;pt.vy=Math.abs(pt.vy)*bounce;} if(pt.y>state.height-2){pt.y=state.height-2;pt.vy=-Math.abs(pt.vy)*bounce;}
      }
      const size = pt.r * (1 + near * 1.8 + state.audioLevel * 1.6);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
      ctx.fillStyle = pt.hue > .72 ? p.b : p.d; ctx.globalAlpha = (dark ? .28 : .38) + near * .48 + state.audioLevel * .22; ctx.fill(); ctx.globalAlpha = 1;
      if (i % 5 === 0 && near > .12) { ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(state.mouse.x, state.mouse.y); ctx.strokeStyle = p.b; ctx.globalAlpha = near * .2; ctx.lineWidth = .7; ctx.stroke(); ctx.globalAlpha = 1; }
      if (state.element === 'air' && i % 6 === 0) { ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.x - pt.vx * 5, pt.y - pt.vy * 5); ctx.strokeStyle = p.b; ctx.globalAlpha = dark ? .18 : .28; ctx.stroke(); ctx.globalAlpha = 1; }
    });
    // Visible gravity-well rings.
    state.wells.forEach(w => { w.life -= state.frozen ? 0 : dt*.025; ctx.beginPath(); ctx.arc(w.x,w.y,18+Math.sin(state.time*2+w.phase)*4,0,Math.PI*2); ctx.strokeStyle=p.b;ctx.globalAlpha=Math.max(0,w.life)*.6;ctx.lineWidth=1.2;ctx.stroke();ctx.beginPath();ctx.arc(w.x,w.y,30+Math.sin(state.time*1.2+w.phase)*7,0,Math.PI*2);ctx.stroke(); });
    state.wells = state.wells.filter(w=>w.life>0); ctx.globalAlpha=1;
  }
  function drawOrb() {
    const p = palettes[state.element];
    const base = state.orb.r * (.75 + state.gravity / 500);
    const r = base * (1 + Math.sin(state.time * 1.1) * .025 + state.audioLevel * .19);
    const x = state.orb.x;
    const y = state.orb.y;
    ctx.save(); ctx.globalCompositeOperation = state.theme === 'midnight' ? 'screen' : 'multiply';
    const glow = ctx.createRadialGradient(x, y, r * .15, x, y, r * 1.8);
    glow.addColorStop(0, p.a + '22'); glow.addColorStop(.55, p.c + '28'); glow.addColorStop(1, p.a + '00');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, Math.PI * 2); ctx.fill();
    const orb = ctx.createRadialGradient(x - r * .36, y - r * .45, r * .03, x + r * .15, y + r * .16, r * 1.25);
    orb.addColorStop(0, p.d); orb.addColorStop(.15, p.b); orb.addColorStop(.43, p.a); orb.addColorStop(.72, p.c); orb.addColorStop(1, state.theme === 'midnight' ? '#080b18' : '#c7c3d4');
    ctx.fillStyle = orb; ctx.beginPath();
    const wobble = state.element === 'water' ? .025 : state.element === 'fire' ? .055 : .018;
    for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; const wave = 1 + Math.sin(a * 5 + state.time * 1.3) * wobble + Math.sin(a * 9 - state.time * .6) * wobble * .4; const xx = x + Math.cos(a) * r * wave; const yy = y + Math.sin(a) * r * wave; if (!i) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = .32; ctx.strokeStyle = p.d; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x - r * .08, y - r * .12, r * .86, r * .35, -.72 + Math.sin(state.time * .3) * .06, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    // Thin orbiting satellite rings
    for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.ellipse(x, y, r * (1.28 + j * .18), r * (.37 + j * .04), -.56 + j * .31 + state.time * (.025 + j * .009), 0, Math.PI * 2); ctx.strokeStyle = j === 1 ? p.b : p.d; ctx.globalAlpha = (j === 1 ? .32 : .16) + state.audioLevel * .22; ctx.lineWidth = j === 1 ? 1.1 : .7; ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.restore();
    // Tiny glints on the edge
    for (let j = 0; j < 7; j++) { const a = state.time * .22 + j * Math.PI * 2 / 7; const xx = x + Math.cos(a) * r * 1.07, yy = y + Math.sin(a) * r * 1.07; ctx.fillStyle = p.d; ctx.globalAlpha = .35 + .25 * Math.sin(state.time + j); ctx.beginPath(); ctx.arc(xx, yy, 1.2 + state.audioLevel * 2, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
  }
  function drawRing() {
    const p = palettes[state.element], cx = state.width * .62, cy = state.height * .49;
    const r = Math.min(state.width, state.height) * .23;
    for (let j = 0; j < 5; j++) {
      const a = state.time * (.07 + j * .015) + j * 1.2;
      ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * 15, cy + Math.sin(a) * 11, r * (1 + j * .13), r * (.28 + j * .035), -.62 + j * .3, 0, Math.PI * 2);
      ctx.strokeStyle = j % 2 ? p.a : p.b; ctx.lineWidth = j === 2 ? 1.3 : .7; ctx.globalAlpha = .19 + state.audioLevel * .24; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    state.particles.forEach((pt, i) => { const a = state.time * (.12 + pt.orbit * .08) + pt.phase; const rx = r * (1 + (i % 5) * .13), ry = r * (.28 + (i % 7) * .025); const x = cx + Math.cos(a) * rx; const y = cy + Math.sin(a) * ry; ctx.beginPath(); ctx.arc(x, y, 1.2 + state.audioLevel * 2, 0, Math.PI * 2); ctx.fillStyle = i % 3 ? p.b : p.d; ctx.globalAlpha = .4; ctx.fill(); }); ctx.globalAlpha = 1;
  }
  function drawSurface() {
    const p = palettes[state.element], w = state.width, h = state.height;
    ctx.save(); ctx.globalCompositeOperation = state.theme === 'midnight' ? 'screen' : 'multiply';
    for (let layer = 0; layer < 10; layer++) {
      ctx.beginPath(); const baseY = h * (.36 + layer * .045); const amp = 15 + layer * 5 + state.audioLevel * 34;
      for (let x = -20; x <= w + 20; x += 8) { const influence = state.mouse.active ? Math.max(0, 1 - Math.abs(x - state.mouse.x) / 300) : 0; const y = baseY + Math.sin(x * (.003 + layer * .00028) + state.time * (.65 + layer * .04) + layer) * amp + Math.sin(x * .009 - state.time * .8 + layer) * amp * .25 - influence * 25; if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.strokeStyle = layer % 2 ? p.a : p.b; ctx.lineWidth = layer === 4 ? 1.4 : .7; ctx.globalAlpha = .12 + layer * .012 + state.audioLevel * .08; ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.restore();
    const gx = state.mouse.x, gy = state.mouse.y; const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 250); glow.addColorStop(0, p.b + '16'); glow.addColorStop(1, p.b + '00'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
  }
  function drawFragments() {
    const p = palettes[state.element], cx = state.width * .62, cy = state.height * .49, base = Math.min(state.width, state.height) * .24;
    state.particles.forEach((pt, i) => {
      const a = Math.atan2(pt.vy,pt.vx) + pt.phase * .12, x = pt.x, y = pt.y;
      const size = pt.r * (2 + (i % 4) * .8 + state.audioLevel * 4), angle = a + state.time * .12;
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = i % 3 ? p.a : p.b; ctx.globalAlpha = .3 + (i % 5) * .1;
      ctx.beginPath(); if (i % 3 === 0) { ctx.moveTo(0, -size * 1.5); ctx.lineTo(size, size); ctx.lineTo(-size, size); } else { ctx.moveTo(-size, -size * .7); ctx.lineTo(size * .8, -size); ctx.lineTo(size, size * .5); ctx.lineTo(-size * .4, size); } ctx.closePath(); ctx.fill(); ctx.restore();
    }); ctx.globalAlpha = 1;
  }
  function drawRipples(dt) {
    const p = palettes[state.element];
    state.ripples = state.ripples.filter(r => r.life > 0);
    state.ripples.forEach(r => { if (!state.frozen) { r.r += (1.5 + r.power * 1.2) * dt * 60; r.life -= .007 * dt * 60; } ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.strokeStyle = p.b; ctx.globalAlpha = Math.max(0, r.life * .28); ctx.lineWidth = 1 + r.power * .5; ctx.stroke(); }); ctx.globalAlpha = 1;
  }
  function updateAudio() {
    if (state.analyser && state.frequencyData && !audio.paused) {
      state.analyser.getByteFrequencyData(state.frequencyData);
      let sum = 0; for (let i = 2; i < Math.min(28, state.frequencyData.length); i++) sum += state.frequencyData[i];
      const target = (sum / Math.max(1, Math.min(28, state.frequencyData.length) - 2)) / 255;
      state.audioLevel += (target - state.audioLevel) * .2;
    } else {
      const target = state.audioOn ? .12 + .07 * Math.sin(state.time * 1.9) + .04 * Math.sin(state.time * .67) : 0;
      state.audioLevel += (target - state.audioLevel) * .06;
    }
  }
  function frame(ts) {
    const dt = Math.min(.04, (ts - (state.lastFrame || ts)) / 1000 || .016); state.lastFrame = ts;
    if (!state.frozen) { state.time += dt; if (!state.mouse.draggingOrb) { state.orb.x += state.orb.vx * dt * 60; state.orb.y += state.orb.vy * dt * 60; state.orb.vx *= .94; state.orb.vy *= .94; state.orb.x = clamp(state.orb.x, state.orb.r*.5, state.width-state.orb.r*.5); state.orb.y = clamp(state.orb.y, state.orb.r*.5, state.height-state.orb.r*.5); } }
    updateAudio(); background(); drawParticles(dt);
    if (state.shape === 'orb') drawOrb(); else if (state.shape === 'ring') drawRing(); else if (state.shape === 'surface') drawSurface(); else drawFragments();
    drawRipples(dt);
    requestAnimationFrame(frame);
  }
  // Element and shape controls
  document.querySelectorAll('.element-card').forEach(b => b.addEventListener('click', () => setElement(b.dataset.element)));
  document.querySelectorAll('.shape-option').forEach(b => b.addEventListener('click', () => setShape(b.dataset.shape)));
  document.querySelectorAll('.panel-tab').forEach(b => b.addEventListener('click', () => openTab(b.dataset.tab)));
  document.querySelectorAll('.dock-item[data-open]').forEach(b => b.addEventListener('click', () => { const tab = b.dataset.open; if (panel.classList.contains('open') && !document.getElementById('tab-' + tab).classList.contains('hidden')) panel.classList.remove('open'); else openTab(tab); }));
  document.getElementById('closePanel').addEventListener('click', () => panel.classList.remove('open'));
  document.getElementById('themeToggle').addEventListener('click', () => setTheme(state.theme === 'midnight' ? 'pearl' : 'midnight'));
  // Physics sliders update actual particle behavior in the canvas
  ['gravity','viscosity','density','elasticity','attraction','turbulence'].forEach(key => {
    const el = document.getElementById(key), out = document.getElementById(key + 'Out');
    const update = () => { state[key] = Number(el.value); out.textContent = el.value + '%'; el.style.setProperty('--fill', el.value + '%'); if (key === 'density') makeParticles(); };
    el.addEventListener('input', update); update();
  });
  document.querySelectorAll('.mode-button').forEach(b => b.addEventListener('click', () => setInteraction(b.dataset.mode)));
  document.getElementById('burstBtn').addEventListener('click', () => burst(state.mouse.x,state.mouse.y,1.35));
  document.getElementById('wellBtn').addEventListener('click', () => { state.wells.push({x:state.mouse.x,y:state.mouse.y,power:1,life:1,phase:rand(0,Math.PI*2)}); if(state.wells.length>5)state.wells.shift(); notify('Gravity well deployed — matter is drawn inward'); });
  document.getElementById('resetPhysics').addEventListener('click', () => { const values = { gravity:42, viscosity:35, density:56, elasticity:74, attraction:62, turbulence:38 }; Object.entries(values).forEach(([k,v]) => { document.getElementById(k).value = v; document.getElementById(k).dispatchEvent(new Event('input')); }); setInteraction('repel'); state.wells=[]; notify('Physics restored to baseline'); });
  document.querySelectorAll('[data-mood]').forEach(b => b.addEventListener('click', () => {
    state.mood = b.dataset.mood; document.querySelectorAll('[data-mood]').forEach(x => x.classList.toggle('active', x === b));
    const presets = { dreamy:{ element:'air',gravity:25,viscosity:72,density:38,elasticity:48,attraction:35,turbulence:18 }, euphoric:{element:'fire',gravity:35,viscosity:22,density:74,elasticity:92,attraction:83,turbulence:78}, melancholic:{element:'water',gravity:64,viscosity:86,density:44,elasticity:30,attraction:26,turbulence:12}, chaotic:{element:'fire',gravity:80,viscosity:10,density:90,elasticity:96,attraction:100,turbulence:100}, meditative:{element:'earth',gravity:53,viscosity:91,density:35,elasticity:22,attraction:20,turbulence:8} };
    const pr = presets[state.mood]; setElement(pr.element); Object.entries(pr).filter(([k])=>k!=='element').forEach(([k,v])=>{document.getElementById(k).value=v;document.getElementById(k).dispatchEvent(new Event('input'));}); notify(state.mood[0].toUpperCase()+state.mood.slice(1)+' atmosphere applied');
  }));
  function randomize() { const els = ['fire','water','earth','air'], sh = ['orb','ring','surface','fragments']; setElement(els[Math.floor(Math.random()*els.length)]); setShape(sh[Math.floor(Math.random()*sh.length)]); ['gravity','viscosity','density','elasticity','attraction','turbulence'].forEach(k=>{const el=document.getElementById(k);el.value=Math.round(rand(15,95));el.dispatchEvent(new Event('input'));}); if (Math.random()>.5) setTheme(state.theme==='midnight'?'pearl':'midnight'); notify('A new universe, generated'); }
  document.getElementById('randomBtn').addEventListener('click', randomize); document.getElementById('randomizeBtn').addEventListener('click', randomize);
  document.getElementById('exploreBtn').addEventListener('click', () => { openTab('elements'); panel.classList.add('open'); document.getElementById('exploreBtn').textContent = '✦  CANVAS UNLOCKED'; notify('Your matter lab is ready'); });
  // Mouse / touch creates physical disturbances
  function pointerMove(e) {
    const rect = canvas.getBoundingClientRect(); state.mouse.px = state.mouse.x; state.mouse.py = state.mouse.y;
    state.mouse.x = e.clientX - rect.left; state.mouse.y = e.clientY - rect.top; state.mouse.active = true;
    if (state.mouse.draggingOrb) { state.orb.vx=(state.mouse.x-state.orb.x)*.22; state.orb.vy=(state.mouse.y-state.orb.y)*.22; state.orb.x=state.mouse.x; state.orb.y=state.mouse.y; }
    if (state.mouse.draggingParticle && state.mouse.draggingParticle.pt) { const pt=state.mouse.draggingParticle.pt; pt.vx=(state.mouse.x-pt.x)*.25;pt.vy=(state.mouse.y-pt.y)*.25;pt.x=state.mouse.x;pt.y=state.mouse.y; }
  }
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerdown', e => {
    pointerMove(e); state.mouse.down = true; canvas.setPointerCapture?.(e.pointerId);
    const dOrb=Math.hypot(state.mouse.x-state.orb.x,state.mouse.y-state.orb.y);
    if (dOrb < state.orb.r*1.1 || state.interaction==='grab') {
      if(dOrb < state.orb.r*1.1) { state.mouse.draggingOrb=true; state.mouse.suppressClick=true; canvas.style.cursor='grabbing'; }
      else { let closest=null,dist=75; state.particles.forEach(pt=>{const d=Math.hypot(pt.x-state.mouse.x,pt.y-state.mouse.y);if(d<dist){closest=pt;dist=d;}}); if(closest){state.mouse.draggingParticle={pt:closest};state.mouse.suppressClick=true;} }
    }
    if (!state.mouse.draggingOrb && !state.mouse.draggingParticle) addRipple(state.mouse.x,state.mouse.y,2.2);
  });
  window.addEventListener('pointerup', () => { state.mouse.down = false; state.mouse.draggingOrb=false; state.mouse.draggingParticle=null; canvas.style.cursor=state.interaction==='grab'?'grab':'none'; });
  canvas.addEventListener('pointerleave', () => { if(!state.mouse.down) state.mouse.active = false; });
  canvas.addEventListener('click', e => { if(state.mouse.suppressClick){state.mouse.suppressClick=false;return;} if(state.mouse.draggingOrb || state.mouse.draggingParticle) return; const r = canvas.getBoundingClientRect(); if(state.interaction==='repel') burst(e.clientX-r.left,e.clientY-r.top,.7); else addRipple(e.clientX-r.left,e.clientY-r.top,1.6); });
  document.getElementById('hintBtn').addEventListener('click', () => { burst(state.mouse.x,state.mouse.y,.8); });
  // Local audio file: Web Audio analyser reacts to its frequency spectrum.
  document.getElementById('uploadBtn').addEventListener('click', () => audioFile.click());
  document.getElementById('audioPlay').addEventListener('click', async () => {
    if (audio.src && audio.src !== location.href) {
      if (audio.paused) { try { await audio.play(); state.audioOn = true; document.getElementById('soundStatus').textContent = 'ANALYSING'; document.getElementById('audioCard').classList.remove('paused'); } catch { notify('Tap again to allow audio playback'); } }
      else { audio.pause(); document.getElementById('audioCard').classList.add('paused'); document.getElementById('soundStatus').textContent = 'PAUSED'; }
    } else { state.audioOn = !state.audioOn; document.getElementById('audioCard').classList.toggle('paused', !state.audioOn); document.getElementById('soundStatus').textContent = state.audioOn ? 'DEMO MODE' : 'VISUALS PAUSED'; notify(state.audioOn ? 'Generative sound pulse enabled' : 'Generative pulse paused'); }
  });
  audioFile.addEventListener('change', async () => {
    const file = audioFile.files && audioFile.files[0]; if (!file) return;
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl); state.objectUrl = URL.createObjectURL(file); audio.src = state.objectUrl;
    document.getElementById('trackTitle').textContent = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g,' '); document.getElementById('trackArtist').textContent = 'Local audio · analysing live'; document.getElementById('soundStatus').textContent = 'READY TO PLAY';
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!state.audioCtx) { state.audioCtx = new AudioContext(); state.analyser = state.audioCtx.createAnalyser(); state.analyser.fftSize = 256; state.frequencyData = new Uint8Array(state.analyser.frequencyBinCount); const source = state.audioCtx.createMediaElementSource(audio); source.connect(state.analyser); state.analyser.connect(state.audioCtx.destination); }
      await state.audioCtx.resume(); await audio.play(); state.audioOn = true; document.getElementById('soundStatus').textContent = 'ANALYSING'; document.getElementById('audioCard').classList.remove('paused'); notify('Audio loaded — visuals now react to your track');
    } catch (err) { notify('Audio selected. Press play to start analysis.'); }
  });
  audio.addEventListener('ended', () => { document.getElementById('soundStatus').textContent = 'DEMO MODE'; document.getElementById('audioCard').classList.add('paused'); });
  document.getElementById('soundDock').addEventListener('click', () => { document.getElementById('audioCard').scrollIntoView({behavior:'smooth',block:'nearest'}); notify('Load a local audio file with the + button'); });
  // Capture exports the artwork canvas as PNG.
  document.getElementById('captureBtn').addEventListener('click', () => { try { const link = document.createElement('a'); link.download = `aurelle-${state.element}-${Date.now()}.png`; link.href = canvas.toDataURL('image/png'); link.click(); notify('Artwork captured as PNG'); } catch { notify('Capture is not available in this browser'); } });
  const moreMenu = document.getElementById('moreMenu'); document.getElementById('moreBtn').addEventListener('click', () => moreMenu.classList.toggle('hidden'));
  document.getElementById('freezeBtn').addEventListener('click', () => { state.frozen = !state.frozen; document.getElementById('freezeBtn').innerHTML = state.frozen ? '▶ &nbsp; Resume motion' : 'Ⅱ &nbsp; Freeze frame'; moreMenu.classList.add('hidden'); notify(state.frozen ? 'Frame frozen' : 'Motion resumed'); });
  document.getElementById('resetWorldBtn').addEventListener('click', () => { setElement('water'); setShape('orb'); setTheme('midnight'); document.getElementById('resetPhysics').click(); state.frozen = false; moreMenu.classList.add('hidden'); notify('World reset'); });
  function fullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(()=>notify('Fullscreen is unavailable')); else document.exitFullscreen?.(); }
  document.getElementById('fullscreenBtn').addEventListener('click', fullscreen); document.getElementById('fullscreenMenuBtn').addEventListener('click', () => { moreMenu.classList.add('hidden'); fullscreen(); });
  document.getElementById('aboutBtn').addEventListener('click', () => { moreMenu.classList.add('hidden'); notify('Aurelle — a sensory canvas for the physics of feeling'); });
  window.addEventListener('resize', resize); window.addEventListener('keydown', e => { if (e.key === 'Escape') { panel.classList.remove('open'); moreMenu.classList.add('hidden'); } if (e.key.toLowerCase() === 'p' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) setTheme(state.theme==='midnight'?'pearl':'midnight'); });
  resize(); requestAnimationFrame(frame);
})();

(() => {
  'use strict';

  const body = document.body;
  if (!body) return;

  const sceneId = body.dataset.bgScene || 'neon-pollen';
  const mode = body.dataset.bgMode || 'ambient'; // ambient | reading
  const veilOpacity = Number.parseFloat(body.dataset.bgVeil || '0.34');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile =
    window.matchMedia('(max-width: 900px)').matches ||
    /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  const SCENES = {
    lily: {
      bloom: { layers: 2, petalsPerLayer: 12, radiusFactor: 0.13, stemHeightFactor: 0.3, petalLength: 148, petalThickness: 32, spread: 1.08 },
      motion: { pulse: 0.018, sway: 0.04, filamentWiggle: 0.11 },
      palette: {
        body: ['#070912', '#0b0f1d', '#070a14'],
        vignette: ['rgba(52, 16, 22, 0.10)', 'rgba(16, 8, 14, 0.10)', 'rgba(0, 0, 0, 0.62)'],
        haze: ['rgba(133, 32, 54, ALPHA)', 'rgba(54, 20, 30, ALPHA2)', 'rgba(0, 0, 0, 0)'],
        stem: ['rgba(72, 130, 88, 0.45)', 'rgba(26, 58, 36, 0.72)'],
        petalStops: ['rgba(255, 152, 170, 0.55)', 'rgba(250, 86, 118, 0.50)', 'rgba(174, 38, 68, 0.48)', 'rgba(96, 20, 38, 0.52)'],
        petalStroke: 'rgba(255, 194, 206, 0.14)',
        glowStops: ['rgba(250, 92, 120, 0.18)', 'rgba(216, 58, 92, 0.09)', 'rgba(122, 22, 44, 0.05)'],
        coreStops: ['rgba(255, 208, 214, 0.58)', 'rgba(250, 114, 142, 0.52)', 'rgba(168, 40, 68, 0.36)'],
        filamentA: 'rgba(255, 152, 172, 0.34)',
        filamentB: 'rgba(245, 96, 128, 0.24)',
        tipStops: ['rgba(255, 224, 230, 0.58)', 'rgba(255, 180, 192, 0.45)', 'rgba(255, 118, 140, 0.16)']
      }
    },
    'acid-daisy': {
      bloom: { layers: 2, petalsPerLayer: 14, radiusFactor: 0.14, stemHeightFactor: 0.3, petalLength: 142, petalThickness: 36, spread: 1.35 },
      motion: { pulse: 0.021, sway: 0.05, filamentWiggle: 0.13 },
      palette: {
        body: ['#060912', '#0b1020', '#070b16'],
        vignette: ['rgba(30, 112, 54, 0.12)', 'rgba(40, 14, 68, 0.08)', 'rgba(0, 0, 0, 0.62)'],
        haze: ['rgba(118, 255, 132, ALPHA)', 'rgba(202, 80, 255, ALPHA2)', 'rgba(0, 0, 0, 0)'],
        stem: ['rgba(112, 186, 95, 0.46)', 'rgba(34, 72, 44, 0.72)'],
        petalStops: ['rgba(236, 255, 120, 0.62)', 'rgba(124, 255, 134, 0.56)', 'rgba(208, 86, 255, 0.52)', 'rgba(92, 34, 132, 0.54)'],
        petalStroke: 'rgba(234, 255, 198, 0.13)',
        glowStops: ['rgba(132, 255, 136, 0.17)', 'rgba(214, 106, 255, 0.09)', 'rgba(52, 22, 82, 0.04)'],
        coreStops: ['rgba(245, 255, 194, 0.58)', 'rgba(142, 255, 150, 0.50)', 'rgba(154, 62, 198, 0.33)'],
        filamentA: 'rgba(162, 255, 166, 0.31)',
        filamentB: 'rgba(236, 134, 255, 0.24)',
        tipStops: ['rgba(246, 255, 216, 0.58)', 'rgba(186, 255, 172, 0.44)', 'rgba(236, 130, 255, 0.15)']
      }
    },
    'neon-pollen': {
      bloom: { layers: 2, petalsPerLayer: 12, radiusFactor: 0.13, stemHeightFactor: 0.29, petalLength: 132, petalThickness: 30, spread: 0.86 },
      motion: { pulse: 0.019, sway: 0.042, filamentWiggle: 0.12 },
      palette: {
        body: ['#070912', '#09111f', '#060a14'],
        vignette: ['rgba(20, 84, 124, 0.12)', 'rgba(28, 16, 44, 0.10)', 'rgba(0, 0, 0, 0.62)'],
        haze: ['rgba(82, 194, 255, ALPHA)', 'rgba(176, 96, 255, ALPHA2)', 'rgba(0, 0, 0, 0)'],
        stem: ['rgba(70, 148, 186, 0.42)', 'rgba(32, 56, 84, 0.70)'],
        petalStops: ['rgba(180, 244, 255, 0.64)', 'rgba(104, 214, 255, 0.56)', 'rgba(126, 112, 255, 0.53)', 'rgba(55, 44, 122, 0.56)'],
        petalStroke: 'rgba(210, 239, 255, 0.16)',
        glowStops: ['rgba(130, 236, 255, 0.16)', 'rgba(98, 172, 255, 0.09)', 'rgba(132, 102, 255, 0.04)'],
        coreStops: ['rgba(214, 248, 255, 0.58)', 'rgba(120, 208, 255, 0.52)', 'rgba(96, 90, 212, 0.34)'],
        filamentA: 'rgba(178, 242, 255, 0.32)',
        filamentB: 'rgba(152, 132, 255, 0.24)',
        tipStops: ['rgba(230, 251, 255, 0.60)', 'rgba(170, 232, 255, 0.44)', 'rgba(152, 125, 255, 0.16)']
      }
    },
    'signal-bloom': {
      bloom: { layers: 2, petalsPerLayer: 10, radiusFactor: 0.128, stemHeightFactor: 0.28, petalLength: 120, petalThickness: 20, spread: 0.48 },
      motion: { pulse: 0.012, sway: 0.022, filamentWiggle: 0.08 },
      structure: { lanes: 7, laneGap: 0.34, asymmetry: 0.18, gateArc: 0.3, spokeBias: 0.24 },
      tuning: { particlesMul: 0.84 },
      palette: {
        body: ['#050913', '#081225', '#050910'],
        vignette: ['rgba(32, 88, 136, 0.10)', 'rgba(18, 44, 78, 0.10)', 'rgba(0, 0, 0, 0.64)'],
        haze: ['rgba(92, 170, 248, ALPHA)', 'rgba(66, 126, 222, ALPHA2)', 'rgba(0, 0, 0, 0)'],
        stem: ['rgba(94, 156, 204, 0.40)', 'rgba(34, 60, 98, 0.72)'],
        petalStops: ['rgba(198, 236, 255, 0.46)', 'rgba(118, 198, 250, 0.42)', 'rgba(88, 136, 230, 0.38)', 'rgba(38, 66, 130, 0.42)'],
        petalStroke: 'rgba(214, 238, 255, 0.12)',
        glowStops: ['rgba(132, 214, 255, 0.10)', 'rgba(104, 164, 255, 0.06)', 'rgba(72, 116, 204, 0.03)'],
        coreStops: ['rgba(206, 236, 255, 0.48)', 'rgba(124, 192, 248, 0.42)', 'rgba(78, 118, 206, 0.30)'],
        filamentA: 'rgba(178, 226, 255, 0.26)',
        filamentB: 'rgba(132, 176, 242, 0.20)',
        tipStops: ['rgba(224, 244, 255, 0.46)', 'rgba(164, 214, 255, 0.34)', 'rgba(110, 150, 232, 0.13)']
      }
    }
  };

  const scene = SCENES[sceneId] || SCENES['neon-pollen'];
  const isSignalBloom = sceneId === 'signal-bloom';

  const perf = {
    fpsTarget: isMobile ? 24 : 40,
    maxDpr: isMobile ? 1.35 : 1.9,
    renderScale: isMobile ? 0.78 : 0.94,
    minScale: isMobile ? 0.58 : 0.72,
    maxScale: 1,
    budgetMs: isMobile ? 10.5 : 9,
    qualitySteps: isMobile ? [1, 0.82, 0.7, 0.58] : [1, 0.9, 0.8, 0.7, 0.6],
    particlesBase: isMobile ? 38 : 62,
    particlesMin: isMobile ? 16 : 28,
    scaleCooldownMs: 5200
  };

  if (mode === 'reading') {
    perf.fpsTarget = Math.min(perf.fpsTarget, 30);
    perf.particlesBase = Math.round(perf.particlesBase * 0.72);
    perf.particlesMin = Math.max(10, Math.round(perf.particlesMin * 0.75));
  }

  if (scene.tuning?.particlesMul) {
    perf.particlesBase = Math.max(perf.particlesMin, Math.round(perf.particlesBase * scene.tuning.particlesMul));
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  body.prepend(canvas);

  let veil = body.querySelector('.bg-veil');
  if (!veil) {
    veil = document.createElement('div');
    veil.className = 'bg-veil';
    veil.setAttribute('aria-hidden', 'true');
    body.prepend(veil);
  }
  veil.style.setProperty('--bg-veil-opacity', String(Math.min(0.75, Math.max(0.16, veilOpacity))));

  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) return;

  const state = {
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    stemHeight: 0,
    bloomRadius: 0,
    pixelRatio: 1,
    paused: false,
    reducedMotion: prefersReducedMotion.matches,
    lastFrame: 0,
    fpsInterval: 1000 / perf.fpsTarget,
    overBudgetStreak: 0,
    underBudgetStreak: 0,
    qualityIdx: 0,
    lastScaleChangeAt: 0,
    sprites: null,
    backgroundLayer: null
  };

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function fillHazeStop(template, alpha, alpha2) {
    return template.replace('ALPHA2', alpha2.toFixed(3)).replace('ALPHA', alpha.toFixed(3));
  }

  function makeGlowSprite(size = 220) {
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');
    const r = size * 0.5;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, scene.palette.glowStops[0]);
    grad.addColorStop(0.38, scene.palette.glowStops[1]);
    grad.addColorStop(0.78, scene.palette.glowStops[2]);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  function makePetalSprite() {
    const w = scene.bloom.petalLength;
    const h = scene.bloom.petalThickness;
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');

    g.translate(8, h * 0.5);
    const path = new Path2D();
    path.moveTo(0, 0);

    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = t * (w - 12);
      const wave = Math.sin(t * Math.PI * scene.bloom.spread) * (h * 0.07);
      const y = -Math.pow(t, 0.78) * (h * 0.33) - wave;
      path.lineTo(x, y);
    }
    for (let i = 12; i >= 0; i--) {
      const t = i / 12;
      const x = t * (w - 12);
      const wave = Math.sin(t * Math.PI * (scene.bloom.spread + 0.12) + 0.5) * (h * 0.07);
      const y = Math.pow(t, 0.82) * (h * 0.32) + wave;
      path.lineTo(x, y);
    }

    path.closePath();

    const grad = g.createLinearGradient(0, -h * 0.45, w, h * 0.35);
    grad.addColorStop(0, scene.palette.petalStops[0]);
    grad.addColorStop(0.3, scene.palette.petalStops[1]);
    grad.addColorStop(0.72, scene.palette.petalStops[2]);
    grad.addColorStop(1, scene.palette.petalStops[3]);

    g.fillStyle = grad;
    g.fill(path);
    g.strokeStyle = scene.palette.petalStroke;
    g.lineWidth = 1;
    g.stroke(path);

    return c;
  }

  function makeCoreSprite(size = 104) {
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');
    const r = size * 0.5;
    const grad = g.createRadialGradient(r, r, 1, r, r, r);
    grad.addColorStop(0, scene.palette.coreStops[0]);
    grad.addColorStop(0.24, scene.palette.coreStops[1]);
    grad.addColorStop(0.62, scene.palette.coreStops[2]);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  function makeTipSprite(size = 14) {
    const c = makeCanvas(size, size);
    const g = c.getContext('2d');
    const r = size * 0.5;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, scene.palette.tipStops[0]);
    grad.addColorStop(0.24, scene.palette.tipStops[1]);
    grad.addColorStop(0.58, scene.palette.tipStops[2]);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  function compileSprites() {
    state.sprites = {
      glow: makeGlowSprite(220),
      petal: makePetalSprite(),
      core: makeCoreSprite(104),
      tip: makeTipSprite(14)
    };
  }

  function buildBackgroundLayer() {
    const bg = makeCanvas(
      Math.max(1, Math.floor(state.width * state.pixelRatio)),
      Math.max(1, Math.floor(state.height * state.pixelRatio))
    );
    const g = bg.getContext('2d');
    g.scale(state.pixelRatio, state.pixelRatio);

    const base = g.createLinearGradient(0, 0, 0, state.height);
    base.addColorStop(0, scene.palette.body[0]);
    base.addColorStop(0.46, scene.palette.body[1]);
    base.addColorStop(1, scene.palette.body[2]);
    g.fillStyle = base;
    g.fillRect(0, 0, state.width, state.height);

    const vignette = g.createRadialGradient(
      state.centerX,
      state.height * 0.34,
      state.height * 0.1,
      state.centerX,
      state.height * 0.34,
      state.height * 0.9
    );
    vignette.addColorStop(0, scene.palette.vignette[0]);
    vignette.addColorStop(0.44, scene.palette.vignette[1]);
    vignette.addColorStop(1, scene.palette.vignette[2]);
    g.fillStyle = vignette;
    g.fillRect(0, 0, state.width, state.height);

    state.backgroundLayer = bg;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, perf.maxDpr);
    state.pixelRatio = dpr * perf.renderScale;

    const w = Math.max(1, Math.floor(window.innerWidth * state.pixelRatio));
    const h = Math.max(1, Math.floor(window.innerHeight * state.pixelRatio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(state.pixelRatio, state.pixelRatio);

    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.centerX = state.width * 0.5;
    state.centerY = state.height * (mode === 'reading' ? 0.62 : 0.57);
    state.stemHeight = Math.min(state.height * scene.bloom.stemHeightFactor, mode === 'reading' ? 230 : 280);
    state.bloomRadius = Math.min(state.width, state.height) * scene.bloom.radiusFactor;

    buildBackgroundLayer();
  }

  function drawBackground(t) {
    const layer = state.backgroundLayer;
    ctx.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, state.width, state.height);

    const drift = Math.sin(t * 0.00018) * 0.5 + 0.5;
    const baseAlpha = mode === 'reading' ? 0.022 : 0.03;
    const hazeAlpha = baseAlpha + drift * (mode === 'reading' ? 0.015 : 0.024);
    const hazeY = state.height * (0.29 + drift * 0.08);
    const haze = ctx.createRadialGradient(state.centerX, hazeY, state.height * 0.08, state.centerX, hazeY, state.height * 0.56);
    haze.addColorStop(0, fillHazeStop(scene.palette.haze[0], hazeAlpha, hazeAlpha * 0.64));
    haze.addColorStop(0.5, fillHazeStop(scene.palette.haze[1], hazeAlpha * 0.7, hazeAlpha * 0.55));
    haze.addColorStop(1, scene.palette.haze[2]);
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawStem() {
    const x = state.centerX;
    const y0 = state.centerY + state.bloomRadius * 0.08;
    const y1 = y0 + state.stemHeight;
    const grad = ctx.createLinearGradient(x, y0, x, y1);
    grad.addColorStop(0, scene.palette.stem[0]);
    grad.addColorStop(1, scene.palette.stem[1]);

    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1.6, state.bloomRadius * (isSignalBloom ? 0.052 : 0.058));
    ctx.beginPath();
    ctx.moveTo(x, y0);
    if (isSignalBloom) {
      ctx.bezierCurveTo(
        x + state.bloomRadius * 0.08,
        y0 + state.stemHeight * 0.34,
        x - state.bloomRadius * 0.14,
        y0 + state.stemHeight * 0.68,
        x + state.bloomRadius * 0.02,
        y1
      );
    } else {
      ctx.quadraticCurveTo(x + state.bloomRadius * 0.04, (y0 + y1) * 0.5, x - state.bloomRadius * 0.02, y1);
    }
    ctx.stroke();
  }

  function drawPetals(t) {
    const pulse = 1 + Math.sin(t * 0.0011) * scene.motion.pulse;
    const r = state.bloomRadius;

    ctx.save();
    ctx.translate(state.centerX, state.centerY);
    ctx.globalCompositeOperation = 'lighter';

    if (isSignalBloom) {
      const lanes = scene.structure.lanes;
      const baseRot = Math.sin(t * 0.0003) * 0.1;
      for (let layer = 0; layer < scene.bloom.layers; layer++) {
        const layerScale = 1 - layer * 0.2;
        const alpha = layer === 0 ? 0.34 : 0.24;
        const laneOffset = layer * scene.structure.laneGap;

        for (let i = 0; i < lanes; i++) {
          const lanePhase = i / lanes;
          const a = lanePhase * Math.PI * 2 + laneOffset + baseRot;
          const asym = (i % 2 ? 1 : -1) * scene.structure.asymmetry;
          const sway = Math.sin(t * 0.0007 + i * 0.95 + layer * 1.2) * scene.motion.sway;
          const radial = r * layerScale * (0.78 + (i % 3) * 0.08);

          ctx.save();
          ctx.rotate(a + sway + asym);
          ctx.translate(radial * (0.16 + (i % 2) * 0.03), 0);
          const lengthScale = pulse * (0.9 + (i % 4) * 0.07);
          ctx.scale((r / 132) * lengthScale, (r / 154) * (1 + layer * 0.12));
          ctx.globalAlpha = alpha;
          ctx.drawImage(state.sprites.petal, 0, -state.sprites.petal.height * 0.5);
          ctx.restore();
        }
      }
    } else {
      for (let layer = 0; layer < scene.bloom.layers; layer++) {
        const layerScale = 1 - layer * 0.18;
        const layerRot = layer * (Math.PI / scene.bloom.petalsPerLayer);
        const alpha = layer === 0 ? 0.44 : 0.34;

        for (let i = 0; i < scene.bloom.petalsPerLayer; i++) {
          const a = (i / scene.bloom.petalsPerLayer) * Math.PI * 2 + layerRot;
          const sway = Math.sin(t * 0.0009 + i * 0.7 + layer * 1.4) * scene.motion.sway;
          const radial = r * layerScale * (1 + Math.sin(t * 0.0013 + i) * 0.03);

          ctx.save();
          ctx.rotate(a + sway);
          ctx.translate(radial * 0.24, 0);
          const lengthScale = pulse * (1 + Math.sin(i * 0.6 + t * 0.0008) * 0.03);
          ctx.scale((r / 116) * lengthScale, (r / 128) * (1 + layer * 0.08));
          ctx.globalAlpha = alpha;
          ctx.drawImage(state.sprites.petal, 0, -state.sprites.petal.height * 0.5);
          ctx.restore();
        }
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function drawFilaments(t) {
    const n = Math.max(perf.particlesMin, Math.round(perf.particlesBase * perf.qualitySteps[state.qualityIdx]));
    const r = state.bloomRadius;

    ctx.save();
    ctx.translate(state.centerX, state.centerY);
    ctx.lineCap = 'round';

    if (isSignalBloom) {
      const lanes = scene.structure.lanes;
      const perLane = Math.max(2, Math.round(n / lanes));
      for (let lane = 0; lane < lanes; lane++) {
        const laneBase = (lane / lanes) * Math.PI * 2;
        const laneSkew = (lane % 2 ? 1 : -1) * scene.structure.spokeBias;

        for (let j = 0; j < perLane; j++) {
          const idx = lane * perLane + j;
          const step = j / perLane;
          const gate = step * scene.structure.gateArc;
          const wiggle = Math.sin(t * 0.0012 + idx * 0.84) * scene.motion.filamentWiggle;
          const a = laneBase + gate + laneSkew + wiggle;
          const len = r * (0.48 + step * 0.46 + (lane % 3) * 0.03);
          const c1x = Math.cos(a - 0.18) * len * 0.38;
          const c1y = Math.sin(a - 0.18) * len * 0.38;
          const c2x = Math.cos(a + 0.08) * len * 0.74;
          const c2y = Math.sin(a + 0.08) * len * 0.74;
          const ex = Math.cos(a) * len;
          const ey = Math.sin(a) * len;

          ctx.strokeStyle = (lane + j) % 2 === 0 ? scene.palette.filamentA : scene.palette.filamentB;
          ctx.lineWidth = j % 2 ? 0.9 : 1.1;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
          ctx.stroke();

          if ((idx & 2) === 0) {
            const s = j % 4 === 0 ? 6.5 : 5.5;
            ctx.globalAlpha = 0.66;
            ctx.drawImage(state.sprites.tip, ex - s * 0.5, ey - s * 0.5, s, s);
          }
        }
      }
    } else {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const wiggle = Math.sin(t * 0.0015 + i * 1.28) * scene.motion.filamentWiggle;
        const len = r * (0.54 + (i % 7) * 0.034);
        const c1x = Math.cos(a + wiggle) * len * 0.4;
        const c1y = Math.sin(a + wiggle) * len * 0.4;
        const ex = Math.cos(a + wiggle * 1.45) * len;
        const ey = Math.sin(a + wiggle * 1.45) * len;

        ctx.strokeStyle = i % 3 === 0 ? scene.palette.filamentA : scene.palette.filamentB;
        ctx.lineWidth = i % 2 ? 0.95 : 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(c1x, c1y, ex, ey);
        ctx.stroke();

        if ((i & 3) === 0) {
          const s = i % 5 === 0 ? 7 : 6;
          ctx.globalAlpha = 0.78;
          ctx.drawImage(state.sprites.tip, ex - s * 0.5, ey - s * 0.5, s, s);
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawCore(t) {
    const s = state.bloomRadius * (1.14 + Math.sin(t * 0.0013) * 0.02);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = mode === 'reading' ? 0.44 : (isSignalBloom ? 0.38 : 0.52);
    ctx.drawImage(state.sprites.glow, state.centerX - s, state.centerY - s, s * 2, s * 2);
    ctx.globalAlpha = mode === 'reading' ? 0.64 : (isSignalBloom ? 0.58 : 0.72);
    const c = state.bloomRadius * (isSignalBloom ? 0.34 : 0.37);
    ctx.drawImage(state.sprites.core, state.centerX - c, state.centerY - c, c * 2, c * 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function maybeChangeScale(nextScale, now) {
    if (now - state.lastScaleChangeAt < perf.scaleCooldownMs) return false;
    if (Math.abs(nextScale - perf.renderScale) < 0.001) return false;
    perf.renderScale = nextScale;
    state.lastScaleChangeAt = now;
    resize();
    return true;
  }

  function adjustQuality(frameMs, now) {
    if (frameMs > perf.budgetMs) {
      state.overBudgetStreak += 1;
      state.underBudgetStreak = 0;
    } else if (frameMs < perf.budgetMs * 0.76) {
      state.underBudgetStreak += 1;
      state.overBudgetStreak = Math.max(0, state.overBudgetStreak - 1);
    } else {
      state.underBudgetStreak = Math.max(0, state.underBudgetStreak - 1);
      state.overBudgetStreak = Math.max(0, state.overBudgetStreak - 1);
    }

    if (state.overBudgetStreak > 7) {
      state.overBudgetStreak = 0;
      if (state.qualityIdx < perf.qualitySteps.length - 1) {
        state.qualityIdx += 1;
      } else {
        maybeChangeScale(Math.max(perf.minScale, perf.renderScale - 0.06), now);
      }
    }

    if (state.underBudgetStreak > 45) {
      state.underBudgetStreak = 0;
      if (state.qualityIdx > 0) {
        state.qualityIdx -= 1;
      } else {
        maybeChangeScale(Math.min(perf.maxScale, perf.renderScale + 0.03), now);
      }
    }
  }

  function drawFrame(now) {
    drawBackground(now);
    drawStem();
    drawPetals(now);
    drawFilaments(now);
    drawCore(now);
  }

  function render(now) {
    if (state.paused) {
      requestAnimationFrame(render);
      return;
    }

    if (state.reducedMotion) {
      drawFrame(now);
      return;
    }

    const delta = now - state.lastFrame;
    if (delta < state.fpsInterval) {
      requestAnimationFrame(render);
      return;
    }

    const t0 = performance.now();
    state.lastFrame = now - (delta % state.fpsInterval);

    drawFrame(now);

    const frameMs = performance.now() - t0;
    adjustQuality(frameMs, now);
    requestAnimationFrame(render);
  }

  function onVisibility() {
    state.paused = document.visibilityState !== 'visible';
    if (!state.paused) {
      state.lastFrame = performance.now();
      if (state.reducedMotion) drawFrame(state.lastFrame);
    }
  }

  function onReducedMotionChange(e) {
    state.reducedMotion = e.matches;
    state.lastFrame = performance.now();
    if (state.reducedMotion) {
      drawFrame(state.lastFrame);
    } else {
      requestAnimationFrame(render);
    }
  }

  function boot() {
    compileSprites();
    resize();
    state.lastFrame = performance.now();
    requestAnimationFrame(render);

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(resize, 120), { passive: true });
    document.addEventListener('visibilitychange', onVisibility, { passive: true });
    prefersReducedMotion.addEventListener('change', onReducedMotionChange);
  }

  boot();
})();

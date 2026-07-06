// Romantic heart particle scene with pink glow and soft floating motion.
// Everything runs in requestAnimationFrame and stays responsive.

const heartRoot = document.getElementById('heart');
const cursorLayer = document.getElementById('cursorLayer');
const dustLayer = document.querySelector('.dust-layer');

const particleCount = 1000;
const targetPoints = [];
const particles = [];
const trailParticles = [];
const cursorParticles = [];
let sceneWidth = 0;
let sceneHeight = 0;
let heartCenterX = 0;
let heartCenterY = 0;
let animationStart = null;
let previousTimestamp = null;
let lastCursorSpark = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function heartBurst(time) {
  const cycle = 2.8;
  const phase = (time % cycle) / cycle;
  const hit = 0.1;
  const expand = 0.08;
  const retract = 0.65;

  if (phase < hit) {
    return Math.sin((phase / hit) * Math.PI) * 1.0;
  }

  const fallPhase = phase - hit;
  if (fallPhase < retract) {
    const t = fallPhase / retract;
    return Math.cos(t * Math.PI * 0.5) * (1 - t * 0.25);
  }

  return 0;
}

function isInHeart(x, y) {
  return Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y <= 0;
}

function heartCurve(x, y) {
  return x * x + y * y - 1;
}

function updateSceneSize() {
  const rect = heartRoot.getBoundingClientRect();
  sceneWidth = rect.width;
  sceneHeight = rect.height;
  heartCenterX = sceneWidth * 0.5;
  heartCenterY = sceneHeight * 0.5;
}

function buildTargetPoints() {
  const columns = 120;
  const rows = 120;
  const margin = 1.28;
  const sample = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x = lerp(-margin, margin, col / (columns - 1));
      const y = lerp(1.48, -1.08, row / (rows - 1));
      if (!isInHeart(x, y)) continue;
      sample.push({ x, y });
    }
  }

  for (let i = sample.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [sample[i], sample[j]] = [sample[j], sample[i]];
  }

  targetPoints.length = 0;
  for (let i = 0; i < particleCount; i += 1) {
    targetPoints.push(sample[i % sample.length]);
  }
}

function createHeartParticle(index) {
  const el = document.createElement('div');
  el.className = 'heart-particle';
  heartRoot.appendChild(el);

  const target = targetPoints[index % targetPoints.length];
  const radius = sceneWidth * 0.68 + Math.random() * sceneWidth * 0.3;
  const angle = Math.random() * Math.PI * 2;
  const startX = Math.cos(angle) * radius + heartCenterX;
  const startY = Math.sin(angle) * radius + heartCenterY + sceneHeight * 0.12;

  return {
    el,
    target,
    startX,
    startY,
    phase: Math.random() * Math.PI * 2,
    floatSpeed: 0.88 + Math.random() * 0.72,
    floatAmount: 4 + Math.random() * 7,
    delay: Math.random() * 1.25,
    baseSize: 1.6 + Math.random() * 2.2,
    opacitySeed: Math.random() * Math.PI * 2,
  };
}

function createAllParticles() {
  for (let i = 0; i < particleCount; i += 1) {
    particles.push(createHeartParticle(i));
  }
}

function createDust() {
  const dustCount = 10;
  for (let i = 0; i < dustCount; i += 1) {
    const dot = document.createElement('div');
    dot.className = 'dust';
    const top = Math.random() * 92;
    const left = 10 + Math.random() * 80;
    const duration = 14 + Math.random() * 12;
    dot.style.top = `${top}%`;
    dot.style.left = `${left}%`;
    dot.style.width = `${2 + Math.random() * 4}px`;
    dot.style.height = `${2 + Math.random() * 4}px`;
    dot.style.opacity = `${0.08 + Math.random() * 0.18}`;
    dot.style.transform = `scale(${0.7 + Math.random() * 1})`;
    dot.style.animationDuration = `${duration}s`;
    dot.style.animationDelay = `${Math.random() * -duration}s`;
    dustLayer.appendChild(dot);
  }
}

function addTrailSpark(x, y, vx, vy) {
  const el = document.createElement('div');
  el.className = 'trail-spark';
  heartRoot.appendChild(el);
  trailParticles.push({
    el,
    x,
    y,
    vx,
    vy,
    alpha: 1,
    life: 0.82 + Math.random() * 0.42,
    size: 0.85 + Math.random() * 1.1,
  });
}

function addCursorSpark(clientX, clientY) {
  const el = document.createElement('div');
  el.className = 'cursor-spark';
  const speed = 0.8 + Math.random() * 0.9;
  const angle = Math.random() * Math.PI * 2;
  el.style.width = `${2 + Math.random() * 2}px`;
  el.style.height = `${2 + Math.random() * 2}px`;
  cursorLayer.appendChild(el);
  cursorParticles.push({
    el,
    x: clientX,
    y: clientY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    alpha: 1,
    life: 0.6 + Math.random() * 0.6,
  });
}

function startTypingText() {
  // Text removed for a pure pink heart scene.
}

window.addEventListener('resize', () => {
  updateSceneSize();
});

window.addEventListener('pointermove', (event) => {
  const now = performance.now();
  if (now - lastCursorSpark < 220) return;
  addCursorSpark(event.clientX, event.clientY);
  lastCursorSpark = now;
});

function updateParticles(elapsed, delta) {
  const time = elapsed * 0.001;
  const formation = clamp((elapsed - 200) / 2000, 0, 1);
  const easeFormation = easeOutCubic(formation);

  particles.forEach((particle) => {
    const targetX = particle.target.x * (sceneWidth * 0.38) + heartCenterX;
    const targetY = -particle.target.y * (sceneHeight * 0.38) + heartCenterY;
    const progress = clamp((elapsed - particle.delay * 520) / 1800, 0, 1);
    const eased = easeOutCubic(progress);
    const floatX = Math.sin(time * particle.floatSpeed + particle.phase) * particle.floatAmount;
    const floatY = Math.cos(time * particle.floatSpeed * 0.92 + particle.phase) * (particle.floatAmount * 0.72);
    const directionX = targetX - heartCenterX;
    const directionY = targetY - heartCenterY;
    const directionLen = Math.max(Math.sqrt(directionX * directionX + directionY * directionY), 1);
    const burst = heartBurst(time) * easeFormation;
    const pulse = burst * (80 + Math.sin(time * 5.2 + particle.phase) * 28);
    const pulseX = (directionX / directionLen) * pulse;
    const pulseY = (directionY / directionLen) * pulse;
    const x = lerp(particle.startX, targetX, eased) + floatX * eased * 0.4 + pulseX;
    const y = lerp(particle.startY, targetY, eased) + floatY * eased * 0.4 + pulseY;
    const size = clamp(particle.baseSize * 0.18 + eased * 0.18 + Math.sin(time * 2.9 + particle.phase) * 0.03, 0.46, 1.04);
    const alpha = clamp((0.1 + eased * 0.72 + Math.sin(time * 2.4 + particle.opacitySeed) * 0.08) * easeFormation, 0.18, 0.92);

    particle.el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${size})`;
    particle.el.style.opacity = `${alpha}`;

    if (progress > 0.94 && Math.random() < 0.003) {
      const direction = Math.atan2(targetY - particle.startY, targetX - particle.startX);
      const speed = 1.4 + Math.random() * 0.8;
      addTrailSpark(x, y, Math.cos(direction) * speed, Math.sin(direction) * speed);
    }
  });
}

function updateTrail(delta) {
  for (let i = trailParticles.length - 1; i >= 0; i -= 1) {
    const trail = trailParticles[i];
    trail.life -= delta;
    trail.alpha = clamp(trail.life / 1.1, 0, 1);
    trail.x += trail.vx * 18 * delta;
    trail.y += trail.vy * 18 * delta;
    trail.el.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) scale(${trail.size * (0.6 + 0.4 * trail.alpha)})`;
    trail.el.style.opacity = `${trail.alpha * 0.58}`;
    if (trail.life <= 0) {
      trail.el.remove();
      trailParticles.splice(i, 1);
    }
  }
}

function updateCursor(delta) {
  for (let i = cursorParticles.length - 1; i >= 0; i -= 1) {
    const particle = cursorParticles[i];
    particle.life -= delta;
    particle.alpha = clamp(particle.life / 0.9, 0, 1);
    particle.x += particle.vx * 28 * delta;
    particle.y += particle.vy * 28 * delta;
    particle.el.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0) scale(${0.9 + particle.alpha * 0.5})`;
    particle.el.style.opacity = `${particle.alpha * 0.92}`;
    if (particle.life <= 0) {
      particle.el.remove();
      cursorParticles.splice(i, 1);
    }
  }
}

function renderFrame(timestamp) {
  if (!animationStart) {
    animationStart = timestamp;
    previousTimestamp = timestamp;
  }

  const elapsed = timestamp - animationStart;
  const delta = clamp((timestamp - previousTimestamp) * 0.001, 0.008, 0.035);
  previousTimestamp = timestamp;

  updateParticles(elapsed, delta);
  updateTrail(delta);
  updateCursor(delta);

  requestAnimationFrame(renderFrame);
}

function initScene() {
  updateSceneSize();
  buildTargetPoints();
  createAllParticles();
  createDust();
  requestAnimationFrame(renderFrame);
}

initScene();

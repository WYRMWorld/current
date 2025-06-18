// Lightspeed Loader: 4s minimum, fade/scale transition, glow only around logo shape (no square/halo).

let loader, canvas, ctx, width, height, cx, cy, dpr;
let stars = [];
let running = false, animateId, lastTimestamp = 0;
let arcPath, arcTail, arcHot, arcRadius = 78, arcLength = Math.PI * 1.05, arcWidth = 168, arcCenter = { x: 84, y: 84 };
let arcSparkPulse = 1, arcPulseDir = 1;
let loaderStartTime = 0, loaderMinDuration = 4000;
let loaderShouldHide = false;
let loaderHideCallback = null;

function refreshDOMRefs() {
  loader = document.getElementById('lightspeed-loader');
  canvas = document.getElementById('lightspeed-canvas');
  arcPath = document.getElementById('spinner-arc');
  arcTail = document.getElementById('spinner-tail');
  arcHot = document.getElementById('spinner-hot');
  ctx = canvas ? canvas.getContext('2d') : null;
}

function resizeCanvas() {
  if (!canvas) return;
  dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
  cx = width / 2;
  cy = height / 2;
}
window.addEventListener('resize', resizeCanvas);

function randomColor() {
  const r = Math.random();
  if (r < 0.97) return "#e6f0ff";
  if (r < 0.985) return "#94bfff";
  return "#ff87e2";
}

function createStars(count = 200) {
  const arr = [];
  for (let i = 0; i < count; ++i) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 12 + 3;
    const speed = 2.2 + Math.random() * 2.7;
    const depth = 0.13 + Math.random() * 0.87;
    const width = 0.5 + Math.random() * 1.55 * (1 - depth);
    const color = randomColor();
    arr.push({
      angle,
      radius,
      speed,
      depth,
      baseAlpha: 0.38 + 0.31 * (1 - depth),
      stretch: 0.7 + Math.random() * 2.3 * (1 - depth),
      width,
      color,
      sparkle: Math.random() < 0.012,
      sparklePhase: Math.random() * Math.PI * 2
    });
  }
  return arr;
}

function drawStarfield(deltaTime = 16) {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let s of stars) {
    s.radius += s.speed * (2.1 + 6.7 * (1 - s.depth)) * (deltaTime / 16.6667);
    const x = cx + Math.cos(s.angle) * s.radius;
    const y = cy + Math.sin(s.angle) * s.radius;
    const stretchLen = s.stretch * s.radius * (0.09 + 0.23 * (1 - s.depth));
    const x2 = cx + Math.cos(s.angle) * (s.radius + stretchLen);
    const y2 = cy + Math.sin(s.angle) * (s.radius + stretchLen);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = s.color;

    let sparkleBoost = 1;
    if (s.sparkle) {
      sparkleBoost = 1.1 + Math.abs(Math.sin(performance.now() / 160 + s.sparklePhase)) * 1.1;
    }
    ctx.globalAlpha = Math.min(1, s.baseAlpha * sparkleBoost * 1.25);
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 12 + 34 * (1 - s.depth);
    ctx.lineWidth = s.width * 1.18;

    for (let blur = 0; blur < 2; ++blur) {
      ctx.globalAlpha *= 0.70;
      ctx.stroke();
    }
    ctx.restore();

    if (
      x < -100 || x > width + 100 ||
      y < -100 || y > height + 100
    ) {
      s.angle = Math.random() * Math.PI * 2;
      s.radius = Math.random() * 12 + 3;
      s.speed = 2.2 + Math.random() * 2.7;
      s.depth = 0.13 + Math.random() * 0.87;
      s.baseAlpha = 0.38 + 0.31 * (1 - s.depth);
      s.stretch = 0.7 + Math.random() * 2.3 * (1 - s.depth);
      s.width = 0.5 + Math.random() * 1.55 * (1 - s.depth);
      s.color = randomColor();
      s.sparkle = Math.random() < 0.012;
      s.sparklePhase = Math.random() * Math.PI * 2;
    }
  }
  ctx.restore();
}

function animateArcSpinner(now = 0) {
  if (!arcPath || !arcTail || !arcHot) return;
  const period = 2300;
  const rot = ((now % period) / period) * Math.PI * 2;
  const start = rot, end = start + arcLength;
  const x1 = arcCenter.x + arcRadius * Math.cos(start);
  const y1 = arcCenter.y + arcRadius * Math.sin(start);
  const x2 = arcCenter.x + arcRadius * Math.cos(end);
  const y2 = arcCenter.y + arcRadius * Math.sin(end);
  const largeArcFlag = arcLength > Math.PI ? 1 : 0;

  // Main arc
  const d = [
    "M", x1, y1,
    "A", arcRadius, arcRadius, 0, largeArcFlag, 1, x2, y2
  ].join(" ");
  arcPath.setAttribute("d", d);

  // Arc tail
  const tailArcLen = Math.PI * 0.12;
  const tailStart = end - tailArcLen;
  const tx1 = arcCenter.x + arcRadius * Math.cos(tailStart);
  const ty1 = arcCenter.y + arcRadius * Math.sin(tailStart);
  const tx2 = x2, ty2 = y2;
  const tail_d = [
    "M", tx1, ty1,
    "A", arcRadius, arcRadius, 0, 0, 1, tx2, ty2
  ].join(" ");
  arcTail.setAttribute("d", tail_d);

  // Arc tip spark flicker
  arcSparkPulse += arcPulseDir * 0.035;
  if (arcSparkPulse > 1.12) arcPulseDir = -1;
  if (arcSparkPulse < 0.84) arcPulseDir = 1;
  arcHot.setAttribute("cx", x2);
  arcHot.setAttribute("cy", y2);
  arcHot.setAttribute("r", 7.5 * arcSparkPulse);
  arcHot.setAttribute("opacity", 0.7 + 0.3 * arcSparkPulse);
}

function animateLoader(now) {
  if (!running) return;
  let deltaTime = 16;
  if (lastTimestamp) {
    deltaTime = Math.max(8, Math.min(40, now - lastTimestamp));
  }
  lastTimestamp = now;
  drawStarfield(deltaTime);
  animateArcSpinner(now);
  animateId = requestAnimationFrame(animateLoader);
}

// Show loader
function showLightspeedLoader() {
  refreshDOMRefs();
  if (!loader || !canvas) return;
  resizeCanvas();
  stars = createStars();
  loader.style.display = 'flex';
  loader.classList.remove('hide', 'loader-exit');
  running = true;
  lastTimestamp = 0;
  loaderStartTime = Date.now();
  loaderShouldHide = false;
  loaderHideCallback = null;
  animateLoader();
}

// Hide loader after min duration
function requestHideLightspeedLoader(afterHideCallback) {
  loaderHideCallback = afterHideCallback || null;
  const elapsed = Date.now() - loaderStartTime;
  if (elapsed >= loaderMinDuration) {
    actuallyHideLoader();
  } else {
    loaderShouldHide = true;
    setTimeout(() => {
      if (loaderShouldHide) actuallyHideLoader();
    }, loaderMinDuration - elapsed);
  }
}

function actuallyHideLoader() {
  loaderShouldHide = false;
  if (!loader) return;
  loader.classList.add('loader-exit');
  setTimeout(() => {
    loader.style.display = 'none';
    loader.classList.remove('loader-exit');
    loader.style.opacity = 1;
    running = false;
    cancelAnimationFrame(animateId);
    if (ctx) ctx.clearRect(0, 0, width, height);
    if (typeof loaderHideCallback === "function") loaderHideCallback();
    loaderHideCallback = null;
  }, 700); // Match CSS transition
}

// For compatibility with window.hideLightspeedLoader
function hideLightspeedLoader(afterHideCallback) {
  requestHideLightspeedLoader(afterHideCallback);
}

window.showLightspeedLoader = showLightspeedLoader;
window.hideLightspeedLoader = hideLightspeedLoader;
window.requestHideLightspeedLoader = requestHideLightspeedLoader;
window.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("neon-orbs-bg");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  let width = window.innerWidth, height = window.innerHeight, dpr = window.devicePixelRatio || 1;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
  window.addEventListener("resize", resize);
  resize();

  const LAYERS = [
    { amplitude: 90, speed: 0.14, colorStops: [["#00ff9e", 0], ["#ff1493", 1]] },
    { amplitude: 55, speed: 0.09, colorStops: [["#fff", 0], ["#ff1493", 1]] },
    { amplitude: 120, speed: 0.07, colorStops: [["#00ff9e", 0], ["#fff", 0.8], ["#ff149380", 1]] }
  ];
  const POINTS = 28;
  let mouseX = 0.5, mouseY = 0.5, targetX = 0.5, targetY = 0.5;

  // --- FIX: Use window for mouse events ---
  function updateMouse(e) {
    let x, y;
    if (e.touches && e.touches.length) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else {
      x = e.clientX;
      y = e.clientY;
    }
    targetX = x / width;
    targetY = y / height;
  }
  window.addEventListener("mousemove", updateMouse);
  window.addEventListener("touchmove", updateMouse, { passive: false });
  window.addEventListener("mouseleave", () => { targetX = 0.5; targetY = 0.5; });
  window.addEventListener("touchend", () => { targetX = 0.5; targetY = 0.5; });

  function updateInteraction() {
    mouseX += (targetX - mouseX) * 0.1;
    mouseY += (targetY - mouseY) * 0.1;
  }

  function drawAurora() {
    ctx.clearRect(0, 0, width, height);
    const time = performance.now() * 0.001;

    for (let l = 0; l < LAYERS.length; l++) {
      const { amplitude, speed, colorStops } = LAYERS[l];
      const grad = ctx.createLinearGradient(0, 0, width, height);
      for (const [color, stop] of colorStops) grad.addColorStop(stop, color);

      ctx.save();
      ctx.globalAlpha = 0.36 + l * 0.11;
      ctx.shadowColor = colorStops[1][0];
      ctx.shadowBlur = 30 + l * 14;
      ctx.beginPath();

      for (let i = 0; i <= POINTS; i++) {
        const pct = i / POINTS;
        const x = pct * width;
        const phase = time * speed + l * 2 + i * 0.36 + mouseX * 6;
        const localAmp = amplitude + 100 * (1 - mouseY) + Math.sin(mouseX * Math.PI * 2) * 12;
        const y =
          height * (0.32 + 0.17 * l + 0.15 * mouseY) +
          Math.sin(phase + Math.cos(time * 0.3 + i) * 0.8) * (localAmp) +
          Math.cos(phase * 0.8 + i) * (amplitude * 0.18);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.filter = "blur(2.5px)";
      ctx.fill();
      ctx.restore();
    }
  }

  function animate() {
    updateInteraction();
    drawAurora();
    requestAnimationFrame(animate);
  }
  animate();
});
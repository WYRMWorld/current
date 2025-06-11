document.addEventListener('DOMContentLoaded', () => {
  const wrapper   = document.querySelector('.carousel-wrapper');
  const container = document.querySelector('.track-scroll');
  const originals = Array.from(container.children);
  const n         = originals.length;

  // Clone originals before & after for seamless loop
  originals.forEach(slide => {
    container.appendChild(slide.cloneNode(true));
    container.insertBefore(slide.cloneNode(true), container.firstChild);
  });

  const w     = originals[0].offsetWidth;
  const total = w * n;

  // Start centered on the original slides
  let pos    = -total;
  let vel    = 0;
  let drag   = false;
  let startX = 0;

  container.style.transform = `translateX(${pos}px)`;

  // Drag anywhere
  wrapper.addEventListener('mousedown', e => {
    drag   = true;
    startX = e.clientX;
    wrapper.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!drag) return;
    const dx = e.clientX - startX;
    startX = e.clientX;
    pos   += dx;
    vel    = dx;
    // Instant wrap during drag
    if (pos > 0)       pos -= total;
    if (pos < -2*total) pos += total;
    container.style.transform = `translateX(${pos}px)`;
  });
  window.addEventListener('mouseup', () => {
    drag = false;
    wrapper.style.cursor = '';
  });

  // Arrow controls
  document.querySelector('.carousel-arrow.left').addEventListener('click', () => {
    pos += w;
    if (pos > 0)       pos -= total;
    if (pos < -2*total) pos += total;
    container.style.transform = `translateX(${pos}px)`;
  });
  document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    pos -= w;
    if (pos > 0)       pos -= total;
    if (pos < -2*total) pos += total;
    container.style.transform = `translateX(${pos}px)`;
  });

  // Inertia + continuous wrap
  (function loop() {
    if (!drag) {
      pos += vel;
      vel *= 0.9;
      if (pos > 0)       pos -= total;
      if (pos < -2*total) pos += total;
      container.style.transform = `translateX(${pos}px)`;
    }
    requestAnimationFrame(loop);
  })();
});

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.track-scroll');
  if (!container) return;

  // Grab original slides and clone them for infinite looping
  const originals = Array.from(container.children);
  originals.forEach(slide => container.appendChild(slide.cloneNode(true)));
  originals.slice().reverse().forEach(slide => container.insertBefore(slide.cloneNode(true), container.firstChild));

  // Calculate dimensions
  const slideWidth = originals[0].offsetWidth;
  const numOriginals = originals.length;
  const blockWidth = slideWidth * numOriginals;

  // Initial state
  let pos = -blockWidth;
  let vel = -1;            // initial scroll speed
  let dragging = false;
  let lastX = 0;

  // Apply initial transform
  container.style.transform = `translateX(${pos}px)`;
  container.style.display = 'flex';
  container.style.overflow = 'hidden';

  // Infinite loop
  function loop() {
    if (!dragging) {
      vel *= 0.95;       // friction when not dragging
      pos += vel;

      // wrap-around logic
      if (pos > -slideWidth) pos -= blockWidth;
      if (pos < -blockWidth * 2) pos += blockWidth;
    }
    container.style.transform = `translateX(${pos}px)`;
    requestAnimationFrame(loop);
  }
  loop();

  // Dragging handlers
  function startDrag(x) {
    dragging = true;
    lastX = x;
    vel = 0;
  }
  function doDrag(x) {
    if (!dragging) return;
    const dx = x - lastX;
    pos += dx;
    vel = dx;
    lastX = x;
  }
  function endDrag() {
    dragging = false;
  }

  // Mouse events
  container.addEventListener('mousedown', e => startDrag(e.clientX));
  window.addEventListener('mousemove', e => doDrag(e.clientX));
  window.addEventListener('mouseup', endDrag);

  // Touch events
  container.addEventListener('touchstart', e => startDrag(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchmove', e => doDrag(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchend', endDrag);
});

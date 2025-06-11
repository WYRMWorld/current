document.addEventListener('DOMContentLoaded', () => {
  const wrapper   = document.querySelector('.carousel-wrapper');
  const container = document.querySelector('.track-scroll');
  const slides    = Array.from(container.children);

  // clone for infinite loop
  slides.forEach(slide => {
    container.append(slide.cloneNode(true));
    container.prepend(slide.cloneNode(true));
  });

  let pos = 0, vel = 0, drag = false, startX = 0;
  const w = slides[0].offsetWidth;
  const total = w * slides.length;

  container.style.transform = `translateX(${pos}px)`;

  // Drag anywhere in wrapper
  wrapper.addEventListener('mousedown', e => {
    drag = true;
    startX = e.clientX;
    wrapper.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!drag) return;
    const dx = e.clientX - startX;
    startX = e.clientX;
    pos += dx;
    vel = dx;
    container.style.transform = `translateX(${pos}px)`;
  });

  window.addEventListener('mouseup', () => {
    drag = false;
    wrapper.style.cursor = '';
  });

  // Arrow controls
  document.querySelector('.carousel-arrow.left').addEventListener('click', () => {
    pos += w;
    if (pos > 0) pos -= total;
    container.style.transform = `translateX(${pos}px)`;
  });
  document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    pos -= w;
    if (pos < -total*2) pos += total;
    container.style.transform = `translateX(${pos}px)`;
  });

  // inertia & looping
  (function loop() {
    if (!drag) {
      pos += vel;
      vel *= 0.9;
      if (pos > 0)       pos -= total;
      if (pos < -total*2) pos += total;
      container.style.transform = `translateX(${pos}px)`;
    }
    requestAnimationFrame(loop);
  })();
});
